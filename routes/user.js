const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.post("/signup", userController.user_signup_post);

module.exports = router;
