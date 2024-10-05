const express = require("express");
const router = express.Router();

const postController = require("../controllers/postController");

router.post("/", postController.post_post);

module.exports = router;
