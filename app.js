/* eslint-disable no-undef */
const express = require("express");
const app = express();
const path = require("path");
const { Admins, Elections, Question } = require("./models");
const bcrypt = require("bcrypt");
const localStrategy = require("passport-local");
const passport = require("passport");
var cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");

const flash = require("connect-flash");

const saltRounds = 10;

app.use(flash());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("ssh! some secret string!"));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "this is a secret",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    }
  })
);

app.use(function (req, res, next) {
  res.locals.messages = req.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new localStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Admins.findOne({ where: { email: username } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Entered password is wrong" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, {
            message: "Please register first",
          });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Admins.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", (req, res) => {
  res.render("index");
});


app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/signin", (req, res) => {
  res.render("signin");
});

app.get("/signout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    } else {
      res.redirect("/");
    }
  });
});

app.get(
  "/index",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const loggedInAdminID = req.user.id;

    const admin = await Admins.findByPk(loggedInAdminID);
    const elections = await Elections.findAll({
      where: { adminID: req.user.id },
    }
    );
    res.render("home", {
      username: admin.name,
      elections: elections,
    });
  }
);

app.get(
  "/election",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const loggedInAdminID = req.user.id;
    const elections = await Elections.findAll({
      where: { adminID: loggedInAdminID },
    });
    return res.json({ elections });
  }
);

app.get(
  "/election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const loggedInAdminID = req.user.id;
    const admin = await Admins.findByPk(loggedInAdminID);
    const elections = await Elections.findByPk(req.params.id);
    const questions = await Question.findAll({
      where: { electionID: req.params.id },
    });

    res.render("ballot", {
      election: elections,
      username: admin.name,
      questions: questions,
    });
  }
);

app.get(
  "/elections/create",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const loggedInAdminID = req.user.id;
    const admin = await Admins.findByPk(loggedInAdminID);
    res.render("createElection", { username: admin.name });
  }
);



app.put(
  "/election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      await Elections.update(
        { name: req.body.name },
        { where: { id: req.params.id } }
      );
      response.redirect("/index");
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
);

app.delete(
  "/election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      await Elections.destroy({ where: { id: req.params.id } });
      return res.json({ ok: true });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
);

app.post(
  "/election",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.body.name===false) {
      return res.flash("Enter election name!");
    }

    const loggedInAdminID = req.user.id;
    try {
      await Elections.add(loggedInAdminID, req.body.name);
      res.redirect("/index");
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
);

app.post("/users", async (req, res) => {
  const hashpwd = await bcrypt.hash(req.body.password, saltRounds);
  try {
    const user = await Admins.create({
      name: req.body.name,
      email: req.body.email,
      password: hashpwd,
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
        res.redirect("/");
      } else {
        req.flash("success", "Sign up successful");
        res.redirect("/index");
      }
    });
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/signup");
  }
});

app.post(
  "/election/:id/questions/add",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const loggedInAdminID = req.user.id;

    const election = await Elections.findByPk(req.params.id);

    if (election.adminID !== loggedInAdminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }

    try {
      await Question.add(
        req.body.title,
        req.body.description,
        req.params.id
      );
      res.redirect(`/election/${req.params.id}`);
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
);

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/signin",
    failureFlash: true,
  }),
  function (req, res) {
    console.log(req.user);
    res.redirect("/index");
  }
);


module.exports = app;