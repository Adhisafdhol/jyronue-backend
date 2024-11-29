const asyncHandler = require("express-async-handler");
const { check, body, query, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const passport = require("passport");
const db = require("../db/queries");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const supabaseDb = require("../db/supabaseQueries");
const { convertFileName } = require("../utils/utils");
const sharp = require("sharp");
const { handleValidationError } = require("../utils/errorHandler");

const imageMimetype = ["image/jpeg", "image/png", "image/x-png"];

// Create a user
// Leading and trailing white-space-characters will be trimmed
const userValidator = {
  username_signup: body("username", "Username is required")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 32 })
    .withMessage("Username cannot exceed 32 characters")
    .custom(async (value) => {
      const regex = new RegExp("^[a-zA-Z0-9_]+$");
      const match = regex.test(value);
      if (!match) {
        throw new Error(
          "Username must only contain letters, numbers, and underscores"
        );
      }
    })
    .escape()
    .custom(async (value) => {
      const user = await db.getUserByUsername({ username: value });

      if (user !== null) {
        throw new Error("Username is already taken");
      }
    }),
  username_login: body("username", "Username is required")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 32 })
    .withMessage("Username cannot exceed 32 characters")
    .custom(async (value) => {
      const regex = new RegExp("^[a-zA-Z0-9_]+$");
      const match = regex.test(value);
      if (!match) {
        throw new Error(
          "Username must only contain letters, numbers, and underscores"
        );
      }
    })
    .escape(),
  password: body("password", "Password is required")
    .trim()
    .isLength({ min: 8 })
    .withMessage("Password must contain at least 8 characters")
    .escape(),
  profileImage: check("image")
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Please attach an image to update profile");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    })
    .bail()
    .custom((value, { req }) => {
      const isMimetypeValid = imageMimetype.includes(req.file.mimetype);

      if (!isMimetypeValid) {
        throw new Error("Please only submit jpeg or png file");
      }

      return true;
    }),
  profileImage: check("image")
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error("Please attach an image to update profile");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    })
    .bail()
    .custom((value, { req }) => {
      const isMimetypeValid = imageMimetype.includes(req.file.mimetype);

      if (!isMimetypeValid) {
        throw new Error("Please only submit jpeg or png file");
      }

      return true;
    }),
  profileImageType: query("type")
    .trim()
    .custom((value, { req }) => {
      const regex = new RegExp(/^(banner|profile)$/, "i");
      if (!regex.test(value)) {
        throw new Error("type should be either banner or profile");
      }
      return value;
    })
    .escape(),
};

exports.user_signup_post = [
  userValidator.username_signup,
  userValidator.password,
  asyncHandler((req, res) => {
    // Handle validation error
    handleValidationError({
      req,
      res,
      message: "Failed to create user account",
    });

    const errors = validationResult(req);

    // End the function if errors is not empty
    if (!errors.isEmpty()) {
      return;
    }

    // Hash password
    bcrypt.hash(
      req.body.password,
      10,
      asyncHandler(async (err, hashedPassword) => {
        if (err) {
          return next(err);
        }

        const username = req.body.username;

        await db.createUser({
          // Convert username into lowercase
          username: username.toLowerCase(),
          displayName: username,
          password: hashedPassword,
        });

        res.json({
          message: `Successfully created an account with username ${req.body.username}`,
        });
      })
    );
  }),
];

exports.user_login_get = (req, res, next) => {
  const messages = req.session.messages;

  if (messages) {
    delete req.session.messages;

    // Handle field validation error message
    return res.status(401).json({
      error: {
        message: "Failed to log in",
        error: {
          field: messages[0].includes("username") ? "username" : "password",
          msg: messages[0],
        },
      },
    });
  }

  if (req.user) {
    return res.json({
      message: `Successfully logged in as ${req.user.username}`,
      user: {
        id: req.user.id,
      },
    });
  }

  res.json({
    error: {
      message: "Failed to log in",
      error: "You are not logged in",
    },
  });
};

exports.user_login_post = [
  (req, res, next) => {
    // Redirect to login get if the user already logged in
    if (req.user) {
      return res.redirect("/user/login");
    }

    next();
  },
  userValidator.username_login,
  userValidator.password,
  (req, res, next) => {
    // Handle validation error
    handleValidationError({
      req,
      res,
      message: "Failed to log in",
    });

    const errors = validationResult(req);

    // End the function if errors is not empty
    if (!errors.isEmpty()) {
      return;
    }

    next();
  },
  passport.authenticate("local", {
    successRedirect: "/user/login",
    failureRedirect: "/user/login",
    failureMessage: true,
  }),
];

exports.user_logout_get = [
  (req, res, next) => {
    const user = req.user;

    // If user tries to log out when the user hasn't logged in send error response
    if (!user) {
      return res.status(422).json({
        error: {
          message: "Failed to log out",
          error: "You cannot log out when you haven't logged in",
        },
      });
    }

    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.json({
        message: `Successfully logged out as ${user.username}`,
      });
    });
  },
];

exports.user_profile_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      error: {
        message: "You can't update profile picture when you're not logged in",
      },
    });
  },
  upload.single("image"),
  userValidator.profileImageType,
  userValidator.profileImage,
  asyncHandler(async (req, res, next) => {
    // Handler validation error
    handleValidationError({
      req,
      res,
      message: "Failed to update profile picture",
    });

    const errors = validationResult(req);

    // End the function if errors is not empty
    if (!errors.isEmpty()) {
      return;
    }

    const user = req.user;
    const type = req.query.type;
    const from = type.toLowerCase() === "profile" ? "profiles" : "banners";

    const previousProfileImage = await db.getProfileImageWithUserId({
      userId: user.id,
    });

    // Delete previous profile image url file from supabase
    if (previousProfileImage !== null) {
      const url =
        type.toLowerCase() === "profile"
          ? previousProfileImage.pictureUrl
          : previousProfileImage.bannerUrl;

      if (url !== null) {
        const urlSplit = url.split("/");
        const filename = urlSplit[urlSplit.length - 1];

        await supabaseDb.deleteFile({
          folder: user.id,
          from,
          filename,
        });
      }
    }

    const file = convertFileName(req.file);
    if (type.toLowerCase() === "profile") {
      const resizedBuffer = await sharp(file.buffer)
        .resize({
          width: 128,
          height: 128,
          fit: "cover",
        })
        .toBuffer();
      file.buffer = resizedBuffer;
    }

    await supabaseDb.uploadFile({ file, from: "profiles", user });
    const url = supabaseDb.getPublicUrl({ user, file, from }).publicUrl;

    let profileImage;
    if (type === "profile") {
      profileImage = await db.updateProfilePicture({
        userId: user.id,
        url,
      });
    } else {
      profileImage = await db.updateProfileBanner({
        userId: user.id,
        url,
      });
    }

    res.json({
      message: `${type} picture successfully updated`,
      profileImage,
    });
  }),
];
