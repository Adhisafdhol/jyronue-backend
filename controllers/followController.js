const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const db = require("../db/queries");
const { handleValidationError } = require("../utils/errorHandler");

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
      error: {
        message: "you can't follow anyone when you are not logged in",
      },
    });
  },
  followValidation.username,
  asyncHandler(async (req, res, next) => {
    // Handle validation error
    handleValidationError({
      req,
      res,
      message: `Failed to follow ${req.body.username ? req.body.username : ""}`,
    });

    const following = await db.getUserByUsername({
      username: req.body.username,
    });

    // Error message for trying to follow null user
    if (following === null) {
      return res.status(404).json({
        error: {
          message: `Failed to follow ${req.body.username}`,
          error: "User with that username does't exist",
        },
      });
    }

    const previousFollows = await db.getFollows({
      followedById: req.user.id,
      followingId: following.id,
    });

    // Error message for trying to follow the same user more than once
    if (previousFollows) {
      return res.json({
        error: {
          message: "Failed to follow ${req.body.username}",
          error:
            "You have already followed this user, you can't follow the same user more than once",
        },
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
      error: {
        message: "You can't unfollow anyone when you are not logged in",
      },
    });
  },
  followValidation.username,
  asyncHandler(async (req, res, next) => {
    // Handler validation error
    handleValidationError({
      req,
      res,
      message: `Failed to unfollow ${
        req.body.username ? req.body.username : ""
      }`,
    });

    const following = await db.getUserByUsername({
      username: req.body.username,
    });

    // Error message when trying to unfollow a user that doesn't exist
    if (following === null) {
      return res.status(404).json({
        error: {
          message: `Failed to unfollow ${req.body.username}`,
          error: "User with that username does't exist",
        },
      });
    }

    const previousFollows = await db.getFollows({
      followedById: req.user.id,
      followingId: following.id,
    });

    // Error message when trying to unfollow a user when the user aren't currently following that user.
    if (!previousFollows) {
      return res.json({
        error: {
          message: "You haven't followed this user",
          error: "You can't unfollow a user you aren't currently following",
        },
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
