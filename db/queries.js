const { PrismaClient } = require("@prisma/client");
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

  return username;
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

exports.getPostWithId = async ({ postid }) => {
  const post = await prisma.post.findFirst({
    where: {
      id: postid,
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

  console.log(cursor);

  const comments = await prisma.comment.findMany({
    where: {
      postId: postId,
      OR: [
        {
          AND: {
            id: {
              gt: id,
            },
            createdAt: createdAt,
          },
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
