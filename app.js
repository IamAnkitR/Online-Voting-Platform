/* eslint-disable no-undef */
const express = require("express");
const app = express();
const path = require("path");
const { Admins, Elections, Question, Options, Voters } = require("./models");
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

app.get("/ballot", (req,res) => {
  res.render("ballot");
})

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
    const voters = await Voters.findAll({
      where: {electionID: req.params.id},
    });

    res.render("ballot", {
      election: elections,
      username: admin.name,
      questions: questions,
      voters: voters,
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

app.get(
  "/election/:id/question/:questiondID",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const adminID = req.user.id;
    const admin = await Admins.findByPk(adminID);
    const election = await Elections.findByPk(req.params.id);

    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "errir" });
    }

    const questions = await Question.findByPk(req.params.questiondID);

    const options = await Options.findAll({
      where: { questionID: req.params.questiondID },
    });

    res.render("quePage", {
      username: admin.name,
      questions: questions,
      election: election,
      options: options,
    });
  }
);

app.get(
  "/election/:id/preview",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const adminID = req.user.id;
    const election = await Elections.findByPk(req.params.id);

    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }

    const questions = await Question.findAll({
      where: { electionID: req.params.id },
    });

    const options = [];

    for (let i = 0; i < questions.length; i++) {
      const allOption = await Options.findAll({
        where: { questionID: questions[i].id },
      });
      options.push(allOption);
    }

    res.render("preview", {
      election: election,
      questions: questions,
      options: options,
    });
  }
);

const voter = require("./models/voters");

app.get("/election/:id/vote", async (req, res) => {
  const election = await Elections.findByPk(req.params.id);
  const questions = await Question.findAll({
    where: {
      electionID: req.params.id,
    },
  });
  const options = [];

  for (let i = 0; i < questions.length; i++) {
    const allOption = await Options.findAll({
      where: { questionID: questions[i].id },
    });
    options.push(allOption);
  }

  if(voter.status){
  res.render("votePage", {
    election: election,
    questions: questions,
    options: options,
    exist: true,
    submit: true,
  });
} else{
  res.render("votePage", {
    election: election,
    questions: questions,
    options: options,
    exist: false,
    submit: false,
  });
}
});

app.get(
  "/election/:id/result",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const adminID = req.user.id;
    const admin = await Admins.findByPk(adminID);
    const election = await Elections.findByPk(req.params.id);

    if (adminID !== election.adminID) {
      return res.send("Unable to access");
    }

    const questions = await Question.findAll({
      where: {
        electionID: req.params.id,
      },
    });

    const voters = await Voters.findAll({
      where: {
        electionID: req.params.id,
      },
    });

    const totalVoters = voters.length;

    let answer = [];

    for (let i = 0; i < questions.length; i++) {
      let array = [];

      const allOption = await Options.findAll({
        where: { questionID: questions[i].id },
      });

      allOption.forEach((option) => {
        let count = 0;

        voters.forEach((voter) => {
          if (voter.responses.includes(option.id)) {
            count++;
          }
        });

        array.push((count * 100) / totalVoters); 
      });

      answer.push(array);
    }

    const options = [];

    for (let i = 0; i < questions.length; i++) {
      const allOption = await Options.findAll({
        where: { questionID: questions[i].id },
      });
      options.push(allOption);
    }

    res.render("result", {
      username: admin.name,
      election: election,
      questions: questions,
      options: options,
      data: answer,
    });
  }
);



app.post(
  "/election/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      await Elections.update(
        { name: req.body.name },
        { where: { id: req.params.id } }
      );
      res.redirect("/index");
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
);

app.post(
  "/election/:id/voters/add",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const adminID = req.user.id;
    const election = await Elections.findByPk(req.params.id);

    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }

    const voter = await Voters.findOne({
      where: { electionID: req.params.id, voterID: req.body.voterID },
    });

    if (voter) {
      console.log("Voter already exists");
      return res.json({ error: "error" });
    }

    try {
      await Voters.add(
        req.body.voterID,
        req.body.password,
        req.params.id
      );
      res.redirect(`/election/${req.params.id}`);
    } catch (error) {
      return res.send(error);
    }
  }
);

app.post(
  "/election/:electionID/voter/:voterID/delete",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const adminID = req.user.id;
    const election = await Elections.findByPk(req.params.electionID);

    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }

    try {
      await Voters.delete(req.params.voterID);
      return res.json({ ok: true });
    } catch (error) {
      return res.send(error);
    }
  }
);



app.post("/election/:id/vote",
 async (req, res) => {
  const election = await Elections.findByPk(req.params.id);

  try {
    const voter = await Voters.findOne({
      where: {
        electionID: req.params.id,
        voterID: req.body.voterID,
        password: req.body.password,
      },
    });
     
    if(voter){
    const questions = await Question.findAll({
      where: {
        electionID: req.params.id,
      },
    });
    const options = [];

    for (let i = 0; i < questions.length; i++) {
      const allOption = await Options.findAll({
        where: { questionID: questions[i].id },
      });
      options.push(allOption);
    }
  
    if(voter.status){
    res.render("votePage", {
      election: election,
      questions: questions,
      options: options,
      voter: voter,
      exist:true,
      submit:true,
    });
  }  else {
    res.render("votePage", {
      election: election,
      questions: questions,
      options: options,
      voter: voter,
      exist: true,
      submit: false,
    });
  }
  } else{
    res.render("votePage", {
      election: election,
      questions: [],
      options: [],
      voter: null,
      exist: false,
      submit: false,
    });
  }
  } catch (error) {
    console.log(error);
    return res.send(error);
  }
});


app.post(
  "/election/:electionID/voter/:id/submit",
  async (req, res) => {
    const election = await Elections.findByPk(req.params.electionID);

    try {
      const voter = await Voters.findByPk(req.params.id);
      
      const questions = await Question.findAll({
        where: {
          electionID: req.params.electionID,
        },
      });

      let responses = [];

      for (let i = 0; i < questions.length; i++) {
        const responseID = Number(req.body[`question-${questions[i].id}`]);

        responses.push(responseID);
      }

      await Voters.addResponse(req.params.id, responses);
      await Voters.voted(req.params.id);

      res.render("votePage", {
        election: election,
        questions: [],
        options: [],
        voter: voter,
        exist: true,
        submit: true,
      });
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
);

app.put(
  "/election/:id/start",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log("Election started");
    const adminID = req.user.id;
    const election = await Elections.findByPk(req.params.id);
    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }
    const questions = await Question.findAll({
      where: { electionID: req.params.id },
    });
    if (questions.length === 0) {
      return res.json({ error: "error" });
    }
    for (let i = 0; i < questions.length; i++) {
      const options = await Options.findAll({
        where: { questionID: questions[i].id },
      });
      if (options.length < 1) {
        return res.json({ error: "error" });
      }
    }

    try {
      console.log("test passed");
      await Elections.start(req.params.id);
      return res.json({ ok: true });
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
);

app.put(
  "/election/:id/end",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const adminID = req.user.id;
    const election = await Elections.findByPk(req.params.id);
    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }

    if (election.ended === true || election.started === false) {
      console.log("Not started yet");
      return res.json({ error: "error" });
    }

    try {
      await Elections.end(req.params.id);
      return res.json({ ok: true });
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

app.delete(
  "/election/:id/questions/:questionID",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const adminID = req.user.id;
    const election = await Elections.findByPk(req.params.id);

    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }

    try {
      await Options.destroy({
        where: { questionID: req.params.questionID },
      })
      await Question.destroy({ where: { id: req.params.questionID } });
      return res.json({ ok: true });
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
);

app.delete(
  "/election/:electionID/questions/:questionID/options/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {

    const adminID = req.user.id;
    const election = await Elections.findByPk(req.params.electionID);

    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }

    const question = await Question.findByPk(req.params.questionID);

    if (!question) {
      console.log("Question not found");
      return res.json({ error: "error" });
    }

    try {
      await Options.destroy({ where: { id: req.params.id } });
      return res.json({ ok: true });
    } catch (error) {
      console.log(error);
      return res.send(error);
    }
  }
);

app.post(
  "/election",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    if (req.body.name === false) {
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
  "/election/:electionID/questions/:questionID/options/add",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const adminID = req.user.id;

    const election = await Elections.findByPk(req.params.electionID);

    if (election.adminID !== adminID) {
      console.log("Unable to access");
      return res.json({ error: "error" });
    }

    try {
      await Options.add(req.body.option, req.params.questionID);
      res.redirect(
        `/election/${req.params.electionID}/question/${req.params.questionID}`
      );
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