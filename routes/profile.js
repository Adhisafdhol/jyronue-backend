const express = require("express");
const router = express.Router({ mergeParams: true });

const profileController = require("../controllers/profileController");

router.get("", profileController.profile_get);

router.post("", profileController.profile_post);

module.exports = router;
