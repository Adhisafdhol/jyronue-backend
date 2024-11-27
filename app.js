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
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000,
  max: 70,
});

const indexRouter = require("./routes/index");
const userRouter = require("./routes/user");
const postRouter = require("./routes/post");
const commentRouter = require("./routes/comment");
const replyRouter = require("./routes/reply");

const app = express();
app.use(logger("dev"));

app.use(helmet());

if (process.env.NODE_ENV === "production") {
  app.use(limiter);
}

app.set("trust proxy", 1);
app.use(
  session({
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // ms
      ...(process.env.NODE_ENV === "production"
        ? { sameSite: "none", secure: true }
        : {}),
      partitioned: true,
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

app.use(
  cors({
    credentials: true,
    origin: process.env.ORIGIN,
    preflightContinue: true,
  })
);
app.options("*", cors());
const postController = require("./controllers/postController");

// Set up No-Cache to prevent caching
app.use((req, res, next) => {
  res.setHeader("Surrogate-Control", "no-store");
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Expires", "0");

  next();
});

app.use("/", indexRouter);
app.use("/user", userRouter);
app.get("/posts", postController.posts_get);
app.get("/posts/following", postController.user_followings_posts_get);
app.use("/post", postRouter);
app.use("/comment", commentRouter);
app.use("/reply", replyRouter);

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
