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
  password: body("password", "Password is required")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must contains at least 8 characters")
    .escape(),
};

exports.user_signup_post = [
  userValidator.username_signup,
  userValidator.password,
  asyncHandler((req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(req.body.username.length);
      return res.json({
        errors: errors.array(),
      });
    }

    bcrypt.hash(
      req.body.password,
      10,
      asyncHandler(async (err, hashedPassword) => {
        if (err) {
          next(err);
        }

        await db.createUser({
          username: req.body.username,
          password: hashedPassword,
        });

        res.json({
          message: `successfully created an account with username ${req.body.username}`,
        });
      })
    );
  }),
];
