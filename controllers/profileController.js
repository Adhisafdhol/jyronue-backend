const asyncHandler = require("express-async-handler");
const db = require("../db/queries");

exports.profile_get = asyncHandler(async (req, res, next) => {
  const { username } = req.params;

  const profile = await db.getUserProfile({ username });

  if (profile === null) {
    return res.status(404).json({
      message: "User profile with that username doesn't exist",
    });
  }

  res.json({
    message: "Successfully retrieved user profile",
    profile,
  });
});
