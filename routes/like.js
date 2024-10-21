const express = require("express");
const router = express.Router();

const likeController = require("../controllers/likeController");

router.post("/like", likeController.like_post);

router.post("/unlike", likeController.unlike_post);

module.exports = router;
