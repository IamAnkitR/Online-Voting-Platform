const express = require("express");
const app = express();
const path = require("path");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (request, response) => {
    //   console.log("working");
    response.send("hello world");
    //   return response.render("home");
  });
  
  module.exports = app;