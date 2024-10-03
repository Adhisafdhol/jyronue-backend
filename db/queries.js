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
