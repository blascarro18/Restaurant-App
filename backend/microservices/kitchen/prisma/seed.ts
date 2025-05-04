import { PrismaClient } from "@prisma/client";
import { publishAndWaitForResponse } from "../src/common/message-broken/rabbitmq";

const prisma = new PrismaClient();

async function main() {
  // Generar un `correlationId` único para identificar esta solicitud
  const correlationId = Date.now().toString();

  // Publicamos el mensaje y esperamos la respuesta
  const response = await publishAndWaitForResponse(
    "warehouse_exchange",
    "warehouse.get.ingredients",
    {},
    correlationId
  );

  console.log("🔄 Esperando respuesta de la cola...");

  console.log("🔄 Respuesta de la cola:", response);

  if (!response.success) {
    console.error("❌ Error al obtener los ingredientes:", response.message);
    return;
  }

  const ingredients = response.data;

  if (!ingredients || ingredients.length === 0) {
    console.error("❌ No se encontraron ingredientes.");
    return;
  }

  // Recetas
  const recipesData = [
    {
      name: "Ensalada de Pollo",
      description: "Ensalada fresca de pollo con lechuga y tomate.",
      image: "https://i.ibb.co/sdM4HXJg/ensalada-pollo-limon.png",
      ingredients: ["chicken", "lettuce", "tomato", "lemon"],
    },
    {
      name: "Arroz con Queso",
      description: "Arroz cremoso con queso derretido y cebolla.",
      image: "https://i.ibb.co/1fLJjw05/Arroz-queso.png",
      ingredients: ["rice", "cheese", "onion"],
    },
    {
      name: "Pollo al Limón",
      description: "Pollo asado con una deliciosa salsa de limón y ketchup.",
      image: "https://i.ibb.co/ycHLbBt1/pollo-limon.png",
      ingredients: ["chicken", "lemon", "ketchup"],
    },
    {
      name: "Carne con Papas",
      description: "Clásico plato de carne asada con papas al horno.",
      image: "https://i.ibb.co/8DsG5dJX/carne-papas.png",
      ingredients: ["meat", "potato", "onion"],
    },
    {
      name: "Sopa de Tomate",
      description: "Sopa caliente de tomate con topping de queso.",
      image: "https://i.ibb.co/27tLLdqX/sopa-tomate.png",
      ingredients: ["tomato", "cheese", "rice"],
    },
    {
      name: "Hamburguesa de carne clásica",
      description:
        "Jugosa hamburguesa de carne con queso derretido, lechuga, tomate y ketchup.",
      image: "https://i.ibb.co/6chwtKNQ/hamburguesa-clasica-queso.png",
      ingredients: ["lettuce", "meat", "ketchup", "tomato", "cheese"],
    },
  ];

  for (const recipeData of recipesData) {
    let recipe = await prisma.recipe.findUnique({
      where: { name: recipeData.name },
    });

    if (!recipe) {
      recipe = await prisma.recipe.create({
        data: {
          name: recipeData.name,
          description: recipeData.description,
          image: recipeData.image,
        },
      });
    }

    for (const ingredientName of recipeData.ingredients) {
      const ingredient = ingredients.find(
        (i: any) => i.name === ingredientName
      );

      if (!ingredient) {
        console.error(
          `❌ Ingrediente ${ingredientName} no encontrado en la respuesta.`
        );
        continue;
      }

      if (ingredient) {
        const existingRelation = await prisma.recipeIngredient.findFirst({
          where: {
            recipeId: recipe.id,
            ingredientId: ingredient.id,
          },
        });

        if (!existingRelation) {
          await prisma.recipeIngredient.create({
            data: {
              recipeId: recipe.id,
              ingredientId: ingredient.id,
              quantity: Math.floor(Math.random() * 3) + 1,
            },
          });
        }
      }
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
