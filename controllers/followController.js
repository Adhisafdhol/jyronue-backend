const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const db = require("../db/queries");

const followValidation = {
  username: body("username", "Please provide username of the user to follow")
    .trim()
    .isLength({ min: 0 })
    .bail()
    .isLength({ max: 32 })
    .withMessage("Username must be less than 32 characters long")
    .bail()
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
};

exports.follow_user_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      message: "you can't follow anyone when you are not logged in",
    });
  },
  followValidation.username,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: `Failed to follow ${
          req.body.username ? req.body.username : ""
        }`,
        errors: errorsList,
      });
    }

    const following = await db.getUserByUsername({
      username: req.body.username,
    });

    if (following === null) {
      return res.status(404).json({
        message: `Failed to follow ${req.body.username}`,
        error: "User with that username does't exist",
      });
    }

    const previousFollows = await db.getFollows({
      followedById: req.user.id,
      followingId: following.id,
    });

    if (previousFollows) {
      return res.json({
        message: "You have followed this user",
      });
    }

    const follows = await db.createFollows({
      followedById: req.user.id,
      followingId: following.id,
    });

    res.json({
      message: `Successfully followed ${following.username}`,
      follows,
    });
  }),
];

exports.unfollow_user_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      message: "you can't unfollow anyone when you are not logged in",
    });
  },
  followValidation.username,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: `Failed to unfollow ${
          req.body.username ? req.body.username : ""
        }`,
        errors: errorsList,
      });
    }

    const following = await db.getUserByUsername({
      username: req.body.username,
    });

    if (following === null) {
      return res.status(404).json({
        message: `Failed to unfollow ${req.body.username}`,
        error: "User with that username does't exist",
      });
    }

    const previousFollows = await db.getFollows({
      followedById: req.user.id,
      followingId: following.id,
    });

    if (!previousFollows) {
      return res.json({
        message: "You haven't followed this user",
      });
    }

    const follows = await db.deleteFollows({
      followedById: req.user.id,
      followingId: following.id,
    });

    res.json({
      message: `Successfully unfollowed ${following.username}`,
      follows,
    });
  }),
];
