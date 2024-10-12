const asyncHandler = require("express-async-handler");
const { check, body, validationResult } = require("express-validator");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const db = require("../db/queries");
const supabaseDb = require("../db/supabaseQueries");
const { convertFileName } = require("../utils/utils");
const sharp = require("sharp");

const imageMimetype = ["image/jpeg", "image/png", "image/x-png"];

const postValidator = {
  caption: body("caption", "Caption cannot be empty")
    .trim()
    .isLength({ min: 1 })
    .bail()
    .isLength({ max: 2048 })
    .withMessage("Caption cannot exceed 2048 characters")
    .escape(),
  images: check("images")
    .custom((value, { req }) => {
      if (!req.files || req.files?.length < 1) {
        throw new Error("Please attach atleast one image on your post");
      }

      // Indicates the success of this synchronous custom validator
      return true;
    })
    .bail()
    .custom((value, { req }) => {
      const isMimetypeValid = req.files.every((file) =>
        imageMimetype.includes(file.mimetype)
      );

      if (!isMimetypeValid) {
        throw new Error("Please only submit jpeg or png file");
      }

      return true;
    }),
};

exports.post_get = asyncHandler(async (req, res, next) => {
  const postid = req.params.postid;

  const post = await db.getPostWithId({ postid });

  if (post === null) {
    return res.json({
      message: "Failed to retrieve post",
      error: "Cannot find a post with that id",
    });
  }

  res.json({
    message: "Successfully retrieved post",
    post,
  });
});

exports.post_post = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      message: "you can't create a post when you're not logged in",
    });
  },
  upload.array("images"),
  postValidator.caption,
  postValidator.images,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to create post",
        errors: errorsList,
      });
    }

    const user = req.user;
    const files = req.files.map((file) => convertFileName(file));
    files.forEach(async (file) => {
      await supabaseDb.uploadFile({ user, from: "images", file });
    });

    const urls = files.map((file) => {
      return supabaseDb.getPublicUrl({ user, file, from: "images" });
    });

    const thumbnail = files[0];
    const resizedThumbnail = await sharp(thumbnail.buffer)
      .resize({
        width: 320,
        height: 320,
        fit: "cover",
      })
      .toBuffer();
    thumbnail.buffer = resizedThumbnail;
    await supabaseDb.uploadFile({
      user,
      from: "thumbnails",
      file: thumbnail,
    });

    const thumbnailUrl = supabaseDb.getPublicUrl({
      user,
      file: thumbnail,
      from: "thumbnails",
    });

    const authorId = req.user.id;
    const content = urls.map((url) => {
      return {
        url: url.publicUrl,
      };
    });
    const caption = req.body.caption;

    const post = await db.createNewPost({
      authorId,
      thumbnailUrl: thumbnailUrl.publicUrl,
      content,
      caption,
    });

    res.json({
      message: "Successfully created a post",
      post,
    });
  }),
];
