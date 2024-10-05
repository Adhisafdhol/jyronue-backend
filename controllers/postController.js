const asyncHandler = require("express-async-handler");
const { check, body, validationResult } = require("express-validator");
const supabase = require("../config/supabaseConfig");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
crypto = require("node:crypto");
path = require("node:path");
const { decode } = require("base64-arraybuffer");
const db = require("../db/queries");
const { error } = require("node:console");

const convertFilesNames = (files) => {
  return files.map((file) => {
    const uuid = crypto.randomUUID();
    const ext = path.extname(file.originalname);
    const newName = "image-" + uuid + ext;
    return { ...file, originalname: newName };
  });
};

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

      req.files.every((file) => console.log(file.mimetype));
      console.log(isMimetypeValid);

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

    // Upload file using standard upload
    async function uploadFile(file) {
      const fileBase64 = decode(file.buffer.toString("base64"));
      const folder = req.user.id;

      const { data, error } = await supabase.storage
        .from("images")
        .upload(`${folder}/${file.originalname}`, fileBase64, {
          contentType: file.mimetype,
        });

      if (error) {
        // Handle error
        next(error);
      } else {
        // Handle success
        return data;
      }
    }

    // Get file url
    function getFileUrl(file) {
      const { data, error } = supabase.storage
        .from("images")
        .getPublicUrl(file.originalname);

      if (error) {
        // Handle error
        next(error);
      } else {
        // Handle success
        return data;
      }
    }

    const files = convertFilesNames(req.files);
    files.forEach(async (file) => {
      await uploadFile(file);
    });

    const urls = files.map((file) => {
      return getFileUrl(file);
    });

    console.log({ files, urls });

    const authorId = req.user.id;
    const content = urls.map((url) => {
      return {
        url: url.publicUrl,
      };
    });
    const caption = req.body.caption;

    console.log({
      authorId,
      content,
      caption,
    });

    const post = await db.createNewPost({ authorId, content, caption });

    res.json({
      message: "Successfully created a post",
      post,
    });
  }),
];
