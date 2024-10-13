const express = require("express");
const router = express.Router();

const replyController = require("../controllers/replyController");

router.get("/:commentid/replies", replyController.reply_get);

module.exports = router;
