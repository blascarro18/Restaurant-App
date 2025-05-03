import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Ingredientes disponibles
  const ingredientsData = [
    { name: "tomato", image: "https://i.ibb.co/wNSj9Zwn/tomato.png" },
    { name: "lemon", image: "https://i.ibb.co/ks7RB2wj/limon.png" },
    { name: "potato", image: "https://i.ibb.co/zTXz09Kk/potato.png" },
    { name: "rice", image: "https://i.ibb.co/v6DCWFbD/rice.png" },
    { name: "ketchup", image: "https://i.ibb.co/jPjKhm5g/ketchup.png" },
    { name: "lettuce", image: "https://i.ibb.co/7djFzxP9/lettuce.png" },
    { name: "onion", image: "https://i.ibb.co/v46LzFHJ/onion.png" },
    { name: "cheese", image: "https://i.ibb.co/8nxpkxNM/chesee.png" },
    { name: "meat", image: "https://i.ibb.co/5Xn4s5m9/meat.png" },
    { name: "chicken", image: "https://i.ibb.co/fzPcnxDT/chicken.png" },
  ];

  for (const ingredientData of ingredientsData) {
    let ingredient = await prisma.ingredient.findUnique({
      where: { name: ingredientData.name },
    });

    if (!ingredient) {
      ingredient = await prisma.ingredient.create({
        data: {
          name: ingredientData.name,
          image: ingredientData.image,
        },
      });
    }

    // Crear o actualizar stock con 5 unidades
    const existingStock = await prisma.stock.findUnique({
      where: { ingredientId: ingredient.id },
    });

    if (!existingStock) {
      await prisma.stock.create({
        data: {
          ingredientId: ingredient.id,
          quantity: 5,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
