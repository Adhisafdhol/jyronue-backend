const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const db = require("../db/queries");

const commentValidator = {
  content: body("content", "Comment cannot be empty")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 2048 })
    .withMessage("Caption cannot exceed 2048 characters")
    .escape(),
};

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
        message: "Failed to create post",
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
