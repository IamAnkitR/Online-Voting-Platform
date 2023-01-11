/* eslint-disable no-undef */
const express = require("express");
const app = express();
const path = require("path");
const { Admin, Election } = require("./models");
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
      Admin.findOne({ where: { email: username } })
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
  Admin.findByPk(id)
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

app.get(
  "/index",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const loggedInAdminID = req.user.id;

    const admin = await Admin.findByPk(loggedInAdminID);
    const elections = await Election.findAll({
      where: { adminID: req.user.id },
    }
    );
    res.render("home", {
      username: admin.name,
      elections: elections,
    });
  }
);

app.delete(
  "/election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      await Election.destroy({ where: { id: req.params.id } });
      return res.json({ ok: true });
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
);

app.get(
  "/election",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const loggedInAdminID = req.user.id;
    const elections = await Election.findAll({
      where: { adminID: loggedInAdminID },
    });

    return res.json({ elections });
  }
);

app.post(
  "/election",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.body.name===false) {
      return res.flash("Election name can't be empty");
    }

    const loggedInAdminID = req.user.id;
    try {
      await Election.add(loggedInAdminID, req.body.name);
      res.redirect("/index");
    } catch (error) {
      console.log(error);
      res.send(error);
    }
  }
);

app.get(
  "/election/create",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInAdminID = request.user.id;
    const admin = await Admin.findByPk(loggedInAdminID);
    response.render("createElection", { username: admin.name });
  }
);

app.post("/users", async (req, res) => {
  const hashpwd = await bcrypt.hash(req.body.password, saltRounds);
  try {
    const user = await Admin.create({
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

// signout admin
app.get("/signout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    } else {
      res.redirect("/");
    }
  });
});

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