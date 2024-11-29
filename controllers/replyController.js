const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");
const db = require("../db/queries");
const { isUUID } = require("../utils/utils");
const { handleValidationError } = require("../utils/errorHandler");

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

exports.replies_get = asyncHandler(async (req, res, next) => {
  // Handle validation error
  handleValidationError({
    req,
    res,
    message: "Failed to fetch replies",
  });

  const errors = validationResult(req);

  // End the function if errors is not empty
  if (!errors.isEmpty()) {
    return;
  }

  const commentId = req.params.commentid;

  let replies = await db.getCommentReplies({
    commentId,
  });

  // If user is authenticated check the user like status on each reply
  if (req.user) {
    replies = await Promise.all(
      replies.map(async (reply) => {
        const like = await db.findUserLikeOnLikesBox({
          likesBoxId: reply.likesBox.id,
          authorId: req.user.id,
        });

        return { ...reply, userLikeStatus: like ? true : false };
      })
    );
  }

  res.json({
    message: "Successfuly retrieved comment replies",
    replies,
  });
});

exports.reply_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      error: {
        message: "You cannot create a reply when you're not logged in",
      },
    });
  },
  replyValidator.content,
  replyValidator.replyToId,
  replyValidator.parentId,
  asyncHandler(async (req, res, next) => {
    // Handle validation error
    handleValidationError({ req, res, message: "Failed to create reply" });

    const errors = validationResult(req);

    // End the function if errors is not empty
    if (!errors.isEmpty()) {
      return;
    }

    const postId = req.params.postid;
    const commentId = req.params.commentid;
    const authorId = req.user.id;
    const replyToId = req.body.replytoid;
    const parentId = req.body.parentid;
    const content = req.body.content;

    let reply;

    if (parentId) {
      // parentId means the reply is replying to another reply instead of a comment
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
