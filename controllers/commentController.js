const asyncHandler = require("express-async-handler");
const { body, query, validationResult } = require("express-validator");
const db = require("../db/queries");
const { handleValidationError } = require("../utils/errorHandler");

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
    // Handle validation error
    handleValidationError({ req, res, message: "Failed to fetch comments" });

    const defaultLimit = 100;
    const cursor = req.query.cursor;
    const createdAt = cursor ? cursor.split("_")[0] : null;
    const id = cursor ? cursor.split("_")[1] : null;
    const limit = req.query.limit ? Number(req.query.limit) : defaultLimit;

    const postId = req.params.postid;

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

    if (req.user) {
      comments = await Promise.all(
        comments.map(async (comment) => {
          const like = await db.findUserLikeOnLikesBox({
            likesBoxId: comment.likesBox.id,
            authorId: req.user.id,
          });

          return { ...comment, userLikeStatus: like ? true : false };
        })
      );
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

    // Return an error when user tries to post without being logged in
    return res.status(401).json({
      error: {
        message: "you can't create a comment when you're not logged in",
      },
    });
  },
  commentValidator.content,
  asyncHandler(async (req, res) => {
    // Handle validation error
    handleValidationError({ req, res, message: "Failed to create comment" });

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
      comment: { ...comment, userLikeStatus: false },
    });
  }),
];
