const express = require("express");
const router = express.Router();

const likeController = require("../controllers/likeController");

router.post("/like", likeController.like_post);

router.post("/unlike", likeController.unlike_post);

router.get("/likesbox/:likesboxid", likeController.likebox_get);

router.get(
  "/likesbox/:likesboxid/status",
  likeController.likebox_user_like_status_get
);

module.exports = router;
