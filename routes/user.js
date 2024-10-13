const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

router.post("/signup", userController.user_signup_post);

router.get("/login", userController.user_login_get);
router.post("/login", userController.user_login_post);

router.get("/logout", userController.user_logout_get);

router.post("/profile-image", userController.user_profile_post);

module.exports = router;
