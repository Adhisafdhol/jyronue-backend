const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");
const commentController = require("../controllers/commentController");

router.get("/:postid", postController.post_get);
router.post("/", postController.post_post);

router.post("/:postid/comment", commentController.comment_post);

module.exports = router;
