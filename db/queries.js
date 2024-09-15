const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.getUserByUsername = async ({ username }) => {
  const user = await prisma.user.findUnique({
    where: { username: username },
  });

  return user;
};

exports.getUserById = async ({ id }) => {
  const user = await prisma.user.findFirst({
    where: { id: id },
  });

  return user;
};
