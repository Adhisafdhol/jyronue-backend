const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const db = require("../db/queries");
const { isUUID } = require("../utils/utils");

const replyValidator = {
  content: body("content", "Reply cannot be empty")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 2048 })
    .withMessage("Reply cannot exceed 2048 characters")
    .escape(),
  replyToId: body("replytoid", "Reply to id is required")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .custom((value, { req }) => {
      if (!isUUID(value)) {
        throw new Error("Reply to id is not a valid UUID");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    }),
  parentId: body("parentid")
    .optional({
      values: "falsy",
    })
    .custom((value, { req }) => {
      if (!isUUID(value)) {
        throw new Error("Parent id is not a valid UUID");
      }

      return true;
    }),
};

exports.reply_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      message: "you can't create a reply when you're not logged in",
    });
  },
  replyValidator.content,
  replyValidator.replyToId,
  replyValidator.parentId,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to create reply",
        errors: errorsList,
      });
    }

    const postId = req.params.postid;
    const commentId = req.params.commentid;
    const authorId = req.user.id;
    const replyToId = req.body.replytoid;
    const parentId = req.body.parentid;
    const content = req.body.content;

    let reply;

    if (parentId) {
      reply = await db.createNewReplyWithParent({
        authorId,
        postId,
        commentId,
        replyToId,
        parentId,
        content,
      });
    } else {
      reply = await db.createNewReplyWithNoParent({
        authorId,
        postId,
        commentId,
        replyToId,
        content,
      });
    }

    res.json({
      message: "Successfully created a reply",
      reply,
    });
  }),
];
