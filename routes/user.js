const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const postController = require("../controllers/postController");

const profileRouter = require("./profile");
const followRouter = require("./follow");

router.post("/signup", userController.user_signup_post);

router.get("/login", userController.user_login_get);
router.post("/login", userController.user_login_post);

router.get("/logout", userController.user_logout_get);

router.post("/profile-image", userController.user_profile_post);

router.use("/profile", profileRouter);

router.get("/:username/posts", postController.user_posts_get);

router.use("/follow", followRouter);

module.exports = router;
