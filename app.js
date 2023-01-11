/* eslint-disable no-undef */
const express = require("express");
const app = express();
const path = require("path");

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (request, response) => {
    response.send("hello world");
  });
  
  module.exports = app;