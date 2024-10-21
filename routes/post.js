const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");
const replyController = require("../controllers/replyController");

const likeRouter = require("./like");

router.use("/:postid", likeRouter);
router.get("/:postid", postController.post_get);
router.post("/", postController.post_post);

router.post("/:postid/comment", commentController.comment_post);

router.get("/:postid/comments", commentController.comments_get);

router.post("/:postid/comment/:commentid/reply", replyController.reply_post);

module.exports = router;
