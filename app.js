require("dotenv").config();
const express = require("express");
const logger = require("morgan");

const session = require("express-session");
const { PrismaSessionStore } = require("@quixo3/prisma-session-store");
const { PrismaClient } = require("@prisma/client");

const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const passportConfig = require("./config/passportConfig");
passport.use(new LocalStrategy(passportConfig.strategy));
passport.serializeUser(passportConfig.serializeUser);
passport.deserializeUser(passportConfig.deserializeUser);

const cors = require("cors");

const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const commentRouter = require("./routes/comment");

const app = express();

app.use(logger("dev"));

app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
    },
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true,
    store: new PrismaSessionStore(new PrismaClient(), {
      checkPeriod: 2 * 60 * 1000, //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
    }),
  })
);
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(cors({ credentials: true, origin: process.env.ORIGIN }));

app.use("/", indexRouter);
app.use("/user", userRouter);
app.use("/post", postRouter);
app.use("/comment", commentRouter);

app.use((req, res, next) => {
  const err = new Error("Not found");
  err.status = 404;

  next(err);
});

// error handler
app.use((err, req, res, next) => {
  // Send error message
  res.status(err.status || 500);
  res.json({
    error:
      req.app.get("env") === "development"
        ? err.message
        : err.status < 500
        ? err.message
        : "server error",
  });
});

module.exports = app;
