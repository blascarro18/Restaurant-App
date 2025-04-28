import { PrismaClient } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import * as bcryptjs from "bcryptjs";

const prisma = new PrismaClient().$extends(withAccelerate());

async function main() {
  const email = "admin@example.com";
  const username = "admin";

  // Verificar si el usuario ya existe
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return;
  }

  // Si el usuario no existe, lo creamos
  const user = await prisma.user.create({
    data: {
      username,
      email,
      password: bcryptjs.hashSync("Abc12345$", 10),
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
