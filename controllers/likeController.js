const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const { isUUID } = require("../utils/utils");
const db = require("../db/queries");

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
      message: "you can't like anything when you are not logged in",
    });
  },
  likeValidator.type,
  likeValidator.likesBoxId,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: `Failed to like ${req.body.type.toLowerCase() || "something"}`,
        errors: errorsList,
      });
    }

    const user = req.user;
    const likesBoxId = req.body.likesboxid;
    const type = req.body.type.toLowerCase();

    const previousLike = await db.findUserLikeOnLikesBox({
      authorId: user.id,
      likesBoxId,
    });

    if (previousLike) {
      return res.status(208).json({
        message: `You already liked this ${type}`,
        like: previousLike,
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
      message: "you can't unlike anything when you are not logged in",
    });
  },
  likeValidator.type,
  likeValidator.likesBoxId,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: `Failed to unlike ${
          req.body.type.toLowerCase() || "something"
        }`,
        errors: errorsList,
      });
    }

    const user = req.user;
    const likesBoxId = req.body.likesboxid;
    const type = req.body.type.toLowerCase();

    const previousLike = await db.findUserLikeOnLikesBox({
      authorId: user.id,
      likesBoxId,
    });

    if (!previousLike) {
      return res.status(208).json({
        message: `You haven't liked this ${type}`,
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
      message: "Cannot find likes box with thar id",
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
      message: "you need to log to check your like status",
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
