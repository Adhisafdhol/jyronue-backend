const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");

router.get("/:postid", postController.post_get);
router.post("/", postController.post_post);

module.exports = router;
