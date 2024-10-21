const express = require("express");
const router = express.Router();

const likeController = require("../controllers/likeController");

router.post("/like", likeController.like_post);

module.exports = router;
