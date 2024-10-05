const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createUser = async ({ displayName, username, password }) => {
  const user = await prisma.user.create({
    data: {
      displayName: displayName,
      username: username,
      password: password,
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

exports.createNewPost = async ({ authorId, content, caption }) => {
  const createPost = await prisma.post.create({
    data: {
      author: {
        connect: { id: authorId },
      },
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
      comments: {
        select: {
          _count: {
            select: {
              replies: true,
            },
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
