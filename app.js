require("dotenv").config();
const express = require("express");
const logger = require("morgan");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportConfig = require("./config/passportConfig");
passport.use(new LocalStrategy(passportConfig.strategy));
passport.serializeUser(passportConfig.serializeUser);
passport.deserializeUser(passportConfig.deserializeUser);

const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");

const app = express();

app.use(logger("dev"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/user", userRouter);

module.exports = app;
