const express = require("express");
const router = express.Router();

const followController = require("../controllers/followController");

router.post("/follow", followController.follow_user_post);

router.post("/unfollow", followController.unfollow_user_post);

module.exports = router;
