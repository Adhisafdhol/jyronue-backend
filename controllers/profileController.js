const asyncHandler = require("express-async-handler");
const { check, body, validationResult } = require("express-validator");
const db = require("../db/queries");
const multer = require("multer");
const { storage } = multer.memoryStorage();
const upload = multer({ storage });
const supabaseDb = require("../db/supabaseQueries");
const { convertFileName } = require("../utils/utils");
const sharp = require("sharp");
const { use } = require("passport");
const { handleValidationError } = require("../utils/errorHandler");

const imageMimetype = ["image/jpeg", "image/png", "image/x-png"];

const profileValidator = {
  avatar: check("avatar").custom((value, { req }) => {
    const avatar = req.files.avatar?.[0];

    if (avatar) {
      const isMimetypeValid = imageMimetype.includes(avatar.mimetype);

      if (!isMimetypeValid) {
        throw new Error("Please only submit jpeg or png file");
      }
    }

    return true;
  }),
  banner: check("banner").custom((value, { req }) => {
    const banner = req.files.banner?.[0];

    if (banner) {
      const isMimetypeValid = imageMimetype.includes(banner.mimetype);

      if (!isMimetypeValid) {
        throw new Error("Please only submit jpeg or png file");
      }
    }

    return true;
  }),
  display_name: body("displayname", "Display name is required")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 32 })
    .withMessage("Display name cannot exceed 32 characters")
    .escape(),
  bio: body("bio")
    .optional({ values: "falsy" })
    .isLength({ max: 255 })
    .escape(),
};

exports.profile_get = asyncHandler(async (req, res, next) => {
  const { username, id } = req.query;

  if (!username && !id) {
    return res.status(422).json({
      error: {
        message: "Please provide username or id",
      },
    });
  }

  const profile = await db.getUserProfile({ username, id });

  if (profile === null) {
    return res.status(404).json({
      error: {
        message: "User profile with that username or id doesn't exist",
      },
    });
  }

  // Check if the current user is following the profile user
  let isFollowing = false;

  if (req.user) {
    const follows = await db.getFollows({
      followedById: req.user.id,
      followingId: profile.id,
    });

    if (follows !== null) {
      isFollowing = true;
    }
  }

  res.json({
    message: "Successfully retrieved user profile",
    profile: { ...profile, isFollowing },
  });
});

exports.profile_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    res.status(401).json({
      error: {
        message: "Failed to update profile",
        error: "You are not logged in",
      },
    });
  },
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
  profileValidator.avatar,
  profileValidator.banner,
  profileValidator.display_name,
  profileValidator.bio,
  asyncHandler(async (req, res, next) => {
    // Handle validation error
    handleValidationError({
      req,
      res,
      message: "Failed to update your profile",
    });

    const errors = validationResult(req);

    // End the function if errors is not empty
    if (!errors.isEmpty()) {
      return;
    }

    const user = req.user;
    const avatar = req.files.avatar
      ? convertFileName(req.files.avatar[0])
      : null;
    const banner = req.files.banner
      ? convertFileName(req.files.banner[0])
      : null;
    const displayName = req.body.displayname;
    const bio = req.body.bio;
    let avatarUrl;
    let bannerUrl;
    const previousProfileImage = await db.getProfileImageWithUserId({
      userId: user.id,
    });

    if (avatar) {
      // Resize avatar image size
      const resizedBuffer = await sharp(avatar.buffer)
        .jpeg({ quality: 90 })
        .resize({
          width: 128,
          height: 128,
          fit: "cover",
        })
        .toBuffer();
      avatar.buffer = resizedBuffer;

      // Upload avatar to supabase
      await supabaseDb.uploadFile({ file: avatar, from: "profiles", user });
      avatarUrl = supabaseDb.getPublicUrl({
        user,
        file: avatar,
        from: "profiles",
      }).publicUrl;
    }

    if (banner) {
      // Resize banner size
      const resizedBuffer = await sharp(banner.buffer)
        .jpeg({ quality: 90 })
        .resize({
          width: 1200,
          height: 400,
          fit: "cover",
        })
        .toBuffer();
      banner.buffer = resizedBuffer;

      // upload banner to supabase
      await supabaseDb.uploadFile({ file: banner, from: "banners", user });
      bannerUrl = supabaseDb.getPublicUrl({
        user,
        file: banner,
        from: "banners",
      }).publicUrl;
    }

    const profile = await db.updateUserProfile({
      id: user.id,
      avatarUrl,
      bannerUrl,
      displayName,
      bio,
    });

    // Delete previous profile image url file from supabase
    if (previousProfileImage !== null) {
      if (avatar) {
        const url = previousProfileImage.pictureUrl;
        if (url !== null) {
          const urlSplit = url.split("/");
          const filename = urlSplit[urlSplit.length - 1];

          await supabaseDb.deleteFile({
            folder: user.id,
            from: "profiles",
            filename,
          });
        }
      }

      if (banner) {
        const url = previousProfileImage.bannerUrl;
        if (url !== null) {
          const urlSplit = url.split("/");
          const filename = urlSplit[urlSplit.length - 1];

          await supabaseDb.deleteFile({
            folder: user.id,
            from: "banners",
            filename,
          });
        }
      }
    }

    res.json({
      message: "Successfully updated your profile",
      profile,
    });
  }),
];
