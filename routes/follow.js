const express = require("express");
const router = express.Router();

const followController = require("../controllers/followController");

router.post("", followController.follow_user_post);

module.exports = router;
