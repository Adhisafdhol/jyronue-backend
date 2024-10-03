const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const passport = require("passport");
const db = require("../db/queries");

// Create a user
// Leading and trailing white-space-characters will be trimmed
const userValidator = {
  username_signup: body("username", "Username is required")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 32 })
    .withMessage("Username cannot exceed 32 characters")
    .custom(async (value) => {
      const regex = new RegExp("^[a-zA-Z0-9_]+$");
      const match = regex.test(value);
      if (!match) {
        throw new Error(
          "Username must only contain letters, numbers, and underscores"
        );
      }
    })
    .escape()
    .custom(async (value) => {
      const user = await db.getUserByUsername({ username: value });

      if (user !== null) {
        throw new Error("Username is already taken");
      }
    }),
  username_login: body("username", "Username is required")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 32 })
    .withMessage("Username cannot exceed 32 characters")
    .custom(async (value) => {
      const regex = new RegExp("^[a-zA-Z0-9_]+$");
      const match = regex.test(value);
      if (!match) {
        throw new Error(
          "Username must only contain letters, numbers, and underscores"
        );
      }
    })
    .escape(),
  password: body("password", "Password is required")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters")
    .escape(),
};

exports.user_signup_post = [
  userValidator.username_signup,
  userValidator.password,
  asyncHandler((req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to create user account",
        errors: errorsList,
      });
    }

    bcrypt.hash(
      req.body.password,
      10,
      asyncHandler(async (err, hashedPassword) => {
        if (err) {
          next(err);
        }

        const username = req.body.username;

        await db.createUser({
          // Convert username into lowercase
          username: username.toLowerCase(),
          displayName: username,
          password: hashedPassword,
        });

        res.json({
          message: `Successfully created an account with username ${req.body.username}`,
        });
      })
    );
  }),
];

exports.user_login_get = (req, res, next) => {
  const messages = req.session.messages;

  if (messages) {
    delete req.session.messages;

    return res.status(401).json({
      message: "Failed to log in",
      error: {
        field: messages[0].includes("username") ? "username" : "password",
        msg: messages[0],
      },
    });
  }

  if (req.user) {
    return res.json({
      message: `Successfully logged in as ${req.user.username}`,
    });
  }

  res.json({
    message: "Cannot access this page directly",
  });
};

exports.user_login_post = [
  userValidator.username_login,
  userValidator.password,
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to log in",
        errors: errorsList,
      });
    }

    next();
  },
  passport.authenticate("local", {
    successRedirect: "/user/login",
    failureRedirect: "/user/login",
    failureMessage: true,
  }),
];
