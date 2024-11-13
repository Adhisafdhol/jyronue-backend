const asyncHandler = require("express-async-handler");
const { check, query, body, validationResult } = require("express-validator");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const db = require("../db/queries");
const supabaseDb = require("../db/supabaseQueries");
const { convertFileName, isIsoString, isUUID } = require("../utils/utils");
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
  cursor: query("cursor")
    .trim()
    .optional({
      values: "falsy",
    })
    .bail()
    .custom((value, { req }) => {
      const cursor = value;
      const createdAt = cursor ? cursor.split("_")[0] : null;
      const id = cursor ? cursor.split("_")[1] : null;

      if (!isIsoString(createdAt)) {
        throw new Error("Your cursor date is not valid ISO string");
      }

      if (!isUUID(id)) {
        throw new Error("Your cursor id is not a valid UUID");
      }

      return true;
    }),
  limit: query("limit", "Limit must be an integer")
    .trim()
    .optional({
      values: "falsy",
    })
    .isInt({
      min: 1,
      max: 100,
    })
    .withMessage("Limit must be between 0 and 100"),
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

  let userLikeStatus = false;

  if (req.user) {
    const user = req.user;

    const userLike = await db.findUserLikeOnLikesBox({
      authorId: user.id,
      likesBoxId: post.likesBox.id,
    });

    if (userLike !== null) {
      userLikeStatus = true;
    }
  }

  res.json({
    message: "Successfully retrieved post",
    post: {
      ...post,
      userLikeStatus,
    },
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

exports.user_posts_get = [
  postValidator.limit,
  postValidator.cursor,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to fetch user posts",
        errors: errorsList,
      });
    }

    const username = req.params.username;
    const limit = req.query.limit ? Number(req.query.limit) : null;
    const cursor = req.query.cursor
      ? {
          id: req.query.cursor.split("_")[1],
          createdAt: req.query.cursor.split("_")[0],
        }
      : null;

    const userPosts = await db.getUserPostsWithCursor({
      username,
      limit,
      cursor,
    });

    const nextCursor = userPosts.length
      ? `${userPosts[userPosts.length - 1].createdAt.toISOString()}_${
          userPosts[userPosts.length - 1].id
        }`
      : false;

    res.json({
      message: userPosts.length
        ? "Successfully fetched user posts"
        : "No more posts to fetch from this user",
      nextCursor: limit ? nextCursor : false,
      userPosts,
    });
  }),
];

exports.posts_get = [
  postValidator.limit,
  postValidator.cursor,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to fetch posts",
        errors: errorsList,
      });
    }

    const limit = req.query.limit ? Number(req.query.limit) : null;
    const cursor = req.query.cursor
      ? {
          id: req.query.cursor.split("_")[1],
          createdAt: req.query.cursor.split("_")[0],
        }
      : null;

    const userId = req.user ? req.user.id : null;

    const posts = await db.getPostsWithCursor({ limit, cursor, userId });

    const nextCursor = posts.length
      ? `${posts[posts.length - 1].createdAt.toISOString()}_${
          posts[posts.length - 1].id
        }`
      : false;

    res.json({
      message: posts.length
        ? "Successfully fetched posts"
        : "No more posts to fetch",
      nextCursor: limit ? nextCursor : false,
      posts,
    });
  }),
];

exports.user_followings_posts_get = [
  (req, res, next) => {
    if (req.user) {
      return next();
    }

    return res.status(401).json({
      message:
        "you can't fetch your followed users posts when you're not logged in",
    });
  },
  postValidator.limit,
  postValidator.cursor,
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const errorsList = errors.array().map((err) => {
        return { field: err.path, value: err.value, msg: err.msg };
      });

      return res.status(422).json({
        message: "Failed to fetch your followed users posts",
        errors: errorsList,
      });
    }

    const limit = req.query.limit ? Number(req.query.limit) : null;
    const cursor = req.query.cursor
      ? {
          id: req.query.cursor.split("_")[1],
          createdAt: req.query.cursor.split("_")[0],
        }
      : null;

    const posts = await db.getFollowingPostsWithCursor({
      followedById: req.user.id,
      limit,
      cursor,
    });

    const nextCursor = posts.length
      ? `${posts[posts.length - 1].createdAt.toISOString()}_${
          posts[posts.length - 1].id
        }`
      : false;

    const user = req.user;

    const mappedPosts = await Promise.all(
      posts.map(async (post) => {
        let userLikeStatus = false;
        const userLike = await db.findUserLikeOnLikesBox({
          authorId: user.id,
          likesBoxId: post.likesBox.id,
        });

        if (userLike !== null) {
          userLikeStatus = true;
        }

        return { ...post, userLikeStatus };
      })
    );

    res.json({
      message: posts.length
        ? "Successfully fetched your followed users posts"
        : "No more posts to fetch",
      nextCursor: limit ? nextCursor : false,
      posts: mappedPosts,
    });
  }),
];
