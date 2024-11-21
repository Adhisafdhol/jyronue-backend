const { PrismaClient } = require("@prisma/client");
const { use } = require("bcrypt/promises");
const prisma = new PrismaClient();

exports.createUser = async ({ displayName, username, password }) => {
  const user = await prisma.user.create({
    data: {
      displayName: displayName,
      username: username,
      password: password,
      profileImage: {
        create: {},
      },
    },
  });

  return user;
};

exports.getUserByUsername = async ({ username }) => {
  const user = await prisma.user.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });

  return user;
};

exports.getUserById = async ({ id }) => {
  const user = await prisma.user.findFirst({
    where: { id: id },
  });

  return user;
};

exports.deleteUserByUsername = async ({ username }) => {
  const user = await prisma.user.delete({
    where: {
      username: username,
    },
  });

  return user;
};

exports.createNewPost = async ({
  authorId,
  thumbnailUrl,
  content,
  caption,
}) => {
  const createPost = await prisma.post.create({
    data: {
      author: {
        connect: { id: authorId },
      },
      thumbnail: thumbnailUrl,
      likesBox: {
        create: {
          type: "POST",
        },
      },
      content: {
        create: content,
      },
      caption: caption,
    },
  });

  return createPost;
};

exports.getPostWithId = async ({ postId }) => {
  const post = await prisma.post.findFirst({
    where: {
      id: postId,
    },
    include: {
      content: true,
      author: {
        select: {
          displayName: true,
          username: true,
          profileImage: {
            select: {
              pictureUrl: true,
            },
          },
        },
      },
      likesBox: {
        select: {
          id: true,
          type: true,
          _count: {
            select: { likes: true },
          },
        },
      },
      _count: {
        select: {
          comments: true,
          replies: true,
        },
      },
    },
  });

  return post;
};

exports.getUserPostsWithCursor = async ({ username, limit, cursor }) => {
  const createdAt = cursor ? cursor.createdAt : null;
  const id = cursor ? cursor.id : null;

  const userPosts = await prisma.post.findMany({
    where: {
      author: {
        username: username,
      },
      ...(cursor
        ? {
            OR: [
              {
                AND: [
                  {
                    id: {
                      gt: id,
                    },
                  },
                  { createdAt: createdAt },
                ],
              },
              {
                createdAt: {
                  lt: createdAt,
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [
      { createdAt: "desc" },
      {
        id: "asc",
      },
    ],
    ...(limit ? { take: limit } : {}),
  });

  return userPosts;
};

exports.createNewComment = async ({ authorId, content, postId }) => {
  const comment = await prisma.comment.create({
    data: {
      author: {
        connect: { id: authorId },
      },
      post: {
        connect: { id: postId },
      },
      likesBox: {
        create: {
          type: "COMMENT",
        },
      },
      content: content,
    },
    include: {
      author: {
        select: {
          displayName: true,
          username: true,
          profileImage: {
            select: {
              pictureUrl: true,
            },
          },
        },
      },
      likesBox: {
        select: {
          id: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
  });

  return comment;
};

exports.getCommentsWithoutCursor = async ({ postId, limit }) => {
  const topComment = await prisma.comment.findMany({
    where: {
      postId: postId,
    },
    include: {
      author: {
        select: {
          displayName: true,
          username: true,
          profileImage: {
            select: {
              pictureUrl: true,
            },
          },
        },
      },
      likesBox: {
        select: {
          id: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
    take: limit,
  });

  return topComment;
};

exports.getCommentsWithCursor = async ({ postId, cursor, limit }) => {
  const { createdAt, id } = cursor;

  const comments = await prisma.comment.findMany({
    where: {
      postId: postId,
      OR: [
        {
          AND: [
            {
              id: {
                gt: id,
              },
            },
            { createdAt: createdAt },
          ],
        },
        {
          createdAt: {
            lt: createdAt,
          },
        },
      ],
    },
    include: {
      author: {
        select: {
          displayName: true,
          username: true,
          profileImage: {
            select: {
              pictureUrl: true,
            },
          },
        },
      },
      likesBox: {
        select: {
          id: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      },
      _count: {
        select: {
          replies: true,
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
      { id: "asc" },
    ],
    take: limit,
  });

  return comments;
};

exports.getProfileImageWithUserId = async ({ userId }) => {
  const profileImage = await prisma.profileImage.findFirst({
    where: { userId: userId },
  });

  return profileImage;
};

exports.updateProfileBanner = async ({ userId, url }) => {
  const profileImage = await prisma.profileImage.update({
    where: { userId: userId },
    data: {
      bannerUrl: url,
    },
  });

  return profileImage;
};

exports.updateProfilePicture = async ({ userId, url }) => {
  const profileImage = await prisma.profileImage.update({
    where: { userId: userId },
    data: {
      pictureUrl: url,
    },
  });

  return profileImage;
};

exports.createNewReplyWithNoParent = async ({
  authorId,
  postId,
  commentId,
  replyToId,
  content,
}) => {
  const reply = await prisma.reply.create({
    data: {
      author: {
        connect: { id: authorId },
      },
      replyTo: {
        connect: { id: replyToId },
      },
      comment: {
        connect: {
          id: commentId,
        },
      },
      post: {
        connect: { id: postId },
      },
      likesBox: {
        create: {
          type: "REPLY",
        },
      },
      content: content,
    },
    include: {
      author: {
        select: {
          displayName: true,
          username: true,
          profileImage: {
            select: {
              pictureUrl: true,
            },
          },
        },
      },
      replyTo: {
        select: {
          username: true,
        },
      },
      likesBox: {
        select: {
          id: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      },
    },
  });

  return reply;
};

exports.createNewReplyWithParent = async ({
  authorId,
  postId,
  commentId,
  replyToId,
  parentId,
  content,
}) => {
  const reply = await prisma.reply.create({
    data: {
      author: {
        connect: { id: authorId },
      },
      parent: {
        connect: { id: parentId },
      },
      replyTo: {
        connect: { id: replyToId },
      },
      comment: {
        connect: {
          id: commentId,
        },
      },
      post: {
        connect: { id: postId },
      },
      likesBox: {
        create: {
          type: "REPLY",
        },
      },
      content: content,
    },
    include: {
      author: {
        select: {
          displayName: true,
          username: true,
          profileImage: {
            select: {
              pictureUrl: true,
            },
          },
        },
      },
      replyTo: {
        select: {
          username: true,
        },
      },
      likesBox: {
        select: {
          id: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      },
    },
  });

  return reply;
};

exports.getCommentReplies = async ({ commentId }) => {
  const replies = await prisma.reply.findMany({
    where: {
      commentId: commentId,
    },
    include: {
      author: {
        select: {
          displayName: true,
          username: true,
          profileImage: {
            select: {
              pictureUrl: true,
            },
          },
        },
      },
      replyTo: {
        select: {
          username: true,
        },
      },
      likesBox: {
        select: {
          id: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      },
    },
    orderBy: [
      {
        createdAt: "desc",
      },
    ],
  });

  return replies;
};

exports.findUserLikeOnLikesBox = async ({ likesBoxId, authorId }) => {
  const like = await prisma.like.findFirst({
    where: {
      AND: [{ likesBoxId: likesBoxId }, { authorId: authorId }],
    },
  });

  return like;
};

exports.createUserLikeOnLikesBox = async ({ likesBoxId, authorId }) => {
  const like = await prisma.like.create({
    data: {
      author: {
        connect: { id: authorId },
      },
      likesBox: {
        connect: { id: likesBoxId },
      },
    },
  });

  return like;
};

exports.deleteLike = async ({ id }) => {
  const like = await prisma.like.delete({
    where: {
      id: id,
    },
  });

  return like;
};

exports.getLikesBoxWithId = async ({ id }) => {
  const likesBox = await prisma.likesBox.findFirst({
    where: {
      id: id,
    },
    select: {
      id: true,
      type: true,
      _count: {
        select: { likes: true },
      },
    },
  });

  return likesBox;
};

exports.getUserProfile = async ({ username, id }) => {
  const profile = await prisma.user.findFirst({
    where: {
      ...(username ? { username: username } : {}),
      ...(id ? { id: id } : {}),
    },
    select: {
      id: true,
      displayName: true,
      username: true,
      bio: true,
      createdAt: true,
      profileImage: true,
      _count: {
        select: {
          followedBy: true,
          following: true,
        },
      },
    },
  });

  return profile;
};

exports.updateUserProfile = async ({
  id,
  avatarUrl,
  bannerUrl,
  displayName,
  bio,
}) => {
  const profile = await prisma.user.update({
    where: {
      id: id,
    },
    data: {
      ...(displayName ? { displayName: displayName } : {}),
      ...(bio ? { bio: bio } : { bio: null }),
      ...(avatarUrl || bannerUrl
        ? {
            profileImage: {
              update: {
                data: {
                  ...(avatarUrl ? { pictureUrl: avatarUrl } : {}),
                  ...(bannerUrl ? { bannerUrl: bannerUrl } : {}),
                },
              },
            },
          }
        : {}),
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      bio: true,
      createdAt: true,
      profileImage: true,
    },
  });

  return profile;
};

exports.getFollows = async ({ followedById, followingId }) => {
  follows = await prisma.follows.findFirst({
    where: {
      followedById: followedById,
      followingId: followingId,
    },
  });

  return follows;
};

exports.createFollows = async ({ followedById, followingId }) => {
  follows = await prisma.follows.create({
    data: {
      followedById: followedById,
      followingId: followingId,
    },
  });

  return follows;
};

exports.deleteFollows = async ({ followedById, followingId }) => {
  follows = await prisma.follows.delete({
    where: {
      followingId_followedById: {
        followedById: followedById,
        followingId: followingId,
      },
    },
  });

  return follows;
};

exports.getPostsWithCursor = async ({ limit, cursor, userId }) => {
  const createdAt = cursor ? cursor.createdAt : null;
  const id = cursor ? cursor.id : null;

  const posts = await prisma.post.findMany({
    where: {
      ...(userId
        ? {
            NOT: [
              {
                authorId: userId,
              },
            ],
          }
        : {}),
      ...(cursor
        ? {
            OR: [
              {
                AND: [
                  {
                    id: {
                      gt: id,
                    },
                  },
                  { createdAt: createdAt },
                ],
              },
              {
                createdAt: {
                  lt: createdAt,
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [
      { createdAt: "desc" },
      {
        id: "asc",
      },
    ],
    ...(limit ? { take: limit } : {}),
  });

  return posts;
};

exports.getFollowingPostsWithCursor = async ({
  followedById,
  limit,
  cursor,
}) => {
  const createdAt = cursor ? cursor.createdAt : null;
  const id = cursor ? cursor.id : null;

  const posts = await prisma.post.findMany({
    where: {
      author: {
        followedBy: {
          some: {
            followedById: followedById,
          },
        },
      },
      ...(cursor
        ? {
            OR: [
              {
                AND: [
                  {
                    id: {
                      gt: id,
                    },
                  },
                  { createdAt: createdAt },
                ],
              },
              {
                createdAt: {
                  lt: createdAt,
                },
              },
            ],
          }
        : {}),
    },
    orderBy: [
      { createdAt: "desc" },
      {
        id: "asc",
      },
    ],
    ...(limit ? { take: limit } : {}),
    include: {
      content: true,
      author: {
        select: {
          displayName: true,
          username: true,
          profileImage: {
            select: {
              pictureUrl: true,
            },
          },
        },
      },
      likesBox: {
        select: {
          id: true,
          _count: {
            select: {
              likes: true,
            },
          },
        },
      },
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });

  return posts;
};
