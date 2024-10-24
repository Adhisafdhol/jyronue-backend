const express = require("express");
const router = express.Router();

const replyController = require("../controllers/replyController");
const likeRouter = require("./like");

router.use("/:commentid", likeRouter);
router.get("/:commentid/replies", replyController.reply_get);

module.exports = router;
