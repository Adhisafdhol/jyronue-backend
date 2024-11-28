const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { isUUID } = require("../utils/utils");
const db = require("../db/queries");
const { handleValidationError } = require("../utils/errorHandler");

const likeValidator = {
  type: body("type", "Please include the type")
    .trim()
    .isLength({ min: 1 })
    .custom((value, { req }) => {
      const type = ["POST", "REPLY", "COMMENT"];

      if (!type.includes(value.toUpperCase())) {
        throw new Error("Type can only be POST, REPLY, or COMMENT");
      }

      return true;
    }),
  likesBoxId: body("likesboxid", "Please include likesbox id")
    .trim()
    .isLength({ min: 1 })
    .custom((value, { req }) => {
      if (!isUUID(value)) {
        throw new Error("Likesbox id is not a valid UUID");
      }

      return true;
    }),
};

exports.like_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      error: {
        message: "You can't like anything when you are not logged in",
      },
    });
  },
  likeValidator.type,
  likeValidator.likesBoxId,
  asyncHandler(async (req, res, next) => {
    // Handle validation error
    handleValidationError({
      req,
      res,
      message: `Failed to like ${req.body.type.toLowerCase() || "something"}`,
    });

    const user = req.user;
    const likesBoxId = req.body.likesboxid;
    const type = req.body.type.toLowerCase();

    const previousLike = await db.findUserLikeOnLikesBox({
      authorId: user.id,
      likesBoxId,
    });

    // Error message when user tries to like something the user have previously liked
    if (previousLike) {
      return res.status(422).json({
        error: {
          message: `Cannot like this ${type}`,
          error: `Cannot like something you have previously liked`,
        },
      });
    }

    const like = await db.createUserLikeOnLikesBox({
      authorId: user.id,
      likesBoxId,
    });

    res.json({
      message: `Successfully liked the ${type}`,
      like,
    });
  }),
];

exports.unlike_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      error: {
        message: "You can't unlike anything when you are not logged in",
      },
    });
  },
  likeValidator.type,
  likeValidator.likesBoxId,
  asyncHandler(async (req, res, next) => {
    // Handle validation error
    handleValidationError({
      req,
      res,
      message: `Failed to unlike ${
        req.body.type?.toLowerCase() || "something"
      }`,
    });

    const user = req.user;
    const likesBoxId = req.body.likesboxid;
    const type = req.body.type.toLowerCase();

    const previousLike = await db.findUserLikeOnLikesBox({
      authorId: user.id,
      likesBoxId,
    });

    // Error message when user tries to unlike something the user haven't previously liked
    if (!previousLike) {
      return res.status(422).json({
        error: {
          message: `Failed to unlike ${
            req.body.type?.toLowerCase() || "something"
          }`,
          error: `Cannot unlike something you haven't previously liked`,
        },
      });
    }

    const like = await db.deleteLike({ id: previousLike.id });

    res.json({
      message: `Successfully unliked the ${type}`,
      like,
    });
  }),
];

exports.likebox_get = asyncHandler(async (req, res, next) => {
  const id = req.params.likesboxid;

  const likesBox = await db.getLikesBoxWithId({ id });

  if (likesBox === null) {
    return res.status(404).json({
      error: {
        message: "Cannot find likes box with that id",
      },
    });
  }

  res.json({
    message: "Successfully retrieved likes box",
    likesBox,
  });
});

exports.likebox_user_like_status_get = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      error: {
        message: "You need to be logged in to check your like status",
      },
    });
  },
  asyncHandler(async (req, res, next) => {
    const authorId = req.user.id;
    const likesBoxId = req.params.likesboxid;
    const type = req.query.type ? req.query.type : "thing";

    const like = await db.findUserLikeOnLikesBox({ likesBoxId, authorId });

    if (like === null) {
      return {
        message: `You Haven't like this ${type} yet`,
        userLikeStatus: false,
      };
    }

    res.json({
      message: `You have liked this ${type}`,
      userLikeStatus: true,
    });
  }),
];
