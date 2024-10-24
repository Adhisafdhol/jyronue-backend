const asyncHandler = require("express-async-handler");
const { body, query, validationResult } = require("express-validator");
const db = require("../db/queries");

const commentValidator = {
  content: body("content", "Comment cannot be empty")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 2048 })
    .withMessage("Comment cannot exceed 2048 characters")
    .escape(),
  limit: query("limit", "Limit must be an integer")
    .trim()
    .optional({
      values: "falsy",
    })
    .isInt(),
};

exports.comments_get = [
  commentValidator.limit,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to fetch comments",
        errors: errorsList,
      });
    }

    const defaultLimit = 100;
    const cursor = req.query.cursor;
    const createdAt = cursor ? cursor.split("_")[0] : null;
    const id = cursor ? cursor.split("_")[1] : null;
    const limit = req.query.limit ? Number(req.query.limit) : defaultLimit;

    const postId = req.params.postid;

    console.log({ cursor, limit });

    let comments;
    if (cursor) {
      comments = await db.getCommentsWithCursor({
        cursor: {
          createdAt,
          id,
        },
        limit,
        postId,
      });
    } else {
      comments = await db.getCommentsWithoutCursor({
        postId,
        limit,
      });
    }

    res.json({
      message: comments.length
        ? "Successfuly retrieved post comments"
        : "No more comments to fetch",
      nextCursor: comments.length
        ? `${comments[comments.length - 1].createdAt.toISOString()}_${
            comments[comments.length - 1].id
          }`
        : false,
      comments,
    });
  }),
];

exports.comment_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      message: "you can't create a comment when you're not logged in",
    });
  },
  commentValidator.content,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to create comment",
        errors: errorsList,
      });
    }

    const postId = req.params.postid;
    const authorId = req.user.id;
    const content = req.body.content;

    const comment = await db.createNewComment({
      postId,
      authorId,
      content,
    });

    res.json({
      message: "Successfully created a comment",
      comment: comment,
    });
  }),
];
