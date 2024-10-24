const express = require("express");
const router = express.Router();

const likeRouter = require("./like");

router.use("/:replyid", likeRouter);

module.exports = router;
