const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    const posts = await tx.post.findMany();
    for (const post of posts) {
      const thumbnail = await tx.image.findFirst({
        where: {
          postId: post.id,
        },
      });

      await tx.post.update({
        where: { id: post.id },
        data: {
          thumbnail: thumbnail ? thumbnail.url : "unknown",
        },
      });
    }
  });
}

main()
  .catch(async (e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
