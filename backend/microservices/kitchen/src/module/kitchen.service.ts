import { PrismaClient } from "@prisma/client";

import * as dotenv from "dotenv";
import { OrderStatus } from "./constants/order-status";
import {
  publishAndWaitForResponse,
  publishToExchange,
} from "../common/message-broken/rabbitmq";
dotenv.config();

const prisma = new PrismaClient();

async function getRandomRecipe() {
  const recipesCount = await prisma.recipe.count();

  if (recipesCount === 0) {
    throw new Error("No hay recetas en la base de datos.");
  }

  const randomIndex = Math.floor(Math.random() * recipesCount);

  const randomRecipe = await prisma.recipe.findFirst({
    skip: randomIndex,
    include: {
      recipeIngredient: {
        select: {
          ingredientId: true,
          quantity: true,
        },
      },
    },
  });

  return randomRecipe;
}

export class KitchenService {
  async newOrder(orderData: { orderId: number }) {
    try {
      const { orderId } = orderData;

      // Obtener una receta aleatoria de la base de datos
      const recipe = await getRandomRecipe();

      if (!recipe) {
        return {
          success: false,
          status: 404,
          message: "No se encontró una receta aleatoria.",
        };
      }

      // Obtener los ingredientes de la receta (Receta completa)
      const recipeData = await this.getRecipeById(recipe.id);

      // Actualizar la orden, enviando la receta aleatoria al exchange de orders
      await publishToExchange("orders_exchange", "orders.update.order", {
        id: orderId,
        recipeId: recipe.id,
        status: "REQUESTING_INGREDIENTS",
      });

      // Se envia la orden con la receta e ingredientes a solicitar, a bodega
      await publishToExchange(
        "warehouse_exchange",
        "warehouse.ingredients.request",
        {
          orderId,
          recipeId: recipe.id,
          ingredients: recipe.recipeIngredient.map((ingredient) => ({
            ingredientId: ingredient.ingredientId,
            quantity: ingredient.quantity,
          })),
        }
      );

      // Enviar la orden a la cola de reintentos para verificar el estado de la orden más tarde
      await publishToExchange(
        "kitchen_retry_exchange",
        "kitchen.retry.verificationOrderStatus",
        {
          orderId,
        }
      );

      return {
        success: true,
        status: 200,
        message: "Receta aleatoria asignada y orden actualizada.",
        data: {
          orderId,
          recipeId: recipe.id,
          recipe: recipeData.data,
          status: "REQUESTING_INGREDIENTS",
        },
      };
    } catch (error) {
      console.error("Error durante el login:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al crear la orden.",
      };
    }
  }

  //Get Recipes
  async getRecipes() {
    try {
      // Obtener todas las recetas de la base de datos
      const recipes = await prisma.recipe.findMany();

      const recipesData = [];
      for (const recipe of recipes) {
        const ingredientsData = [];

        // Obtener los ingredientes de cada receta
        const ingredients = await prisma.recipeIngredient.findMany({
          where: { recipeId: recipe.id },
          select: {
            ingredientId: true,
            quantity: true,
          },
        });

        //Obtener el nombre de cada ingrediente
        for (const ingredient of ingredients) {
          // Generar un `correlationId` único para identificar esta solicitud
          const correlationId = Date.now().toString();

          // Publicamos el mensaje y esperamos la respuesta
          const warehouseResponse = await publishAndWaitForResponse(
            "warehouse_exchange",
            "warehouse.get.ingredient.byId",
            { id: ingredient.ingredientId },
            correlationId
          );

          if (warehouseResponse && warehouseResponse.success) {
            ingredientsData.push({
              id: ingredient.ingredientId,
              image: warehouseResponse.data.image,
              name: warehouseResponse.data.name,
              quantity: ingredient.quantity,
            });
          } else {
            console.error(
              `Error al obtener el ingrediente con ID ${ingredient.ingredientId}`
            );
          }
        }

        recipesData.push({
          id: recipe.id,
          name: recipe.name,
          description: recipe.description,
          image: recipe.image,
          ingredients: ingredientsData,
        });
      }

      return {
        success: true,
        status: 200,
        message: "Recetas obtenidas exitosamente.",
        data: recipesData,
      };
    } catch (error) {
      console.error("Error al obtener las recetas:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al obtener las recetas.",
      };
    }
  }

  //Get Recipe by ID
  async getRecipeById(id: number) {
    try {
      // Obtener una receta por ID de la base de datos
      const recipe = await prisma.recipe.findUnique({
        where: { id },
      });

      if (!recipe) {
        return {
          success: false,
          status: 404,
          message: "Receta no encontrada.",
        };
      }

      const ingredientsData = [];
      // Obtener los ingredientes de la receta
      const ingredients = await prisma.recipeIngredient.findMany({
        where: { recipeId: recipe.id },
        select: {
          ingredientId: true,
          quantity: true,
        },
      });

      // Obtener el nombre de cada ingrediente
      for (const ingredient of ingredients) {
        // Generar un `correlationId` único para identificar esta solicitud
        const correlationId = Date.now().toString();

        // Publicamos el mensaje y esperamos la respuesta
        const warehouseResponse = await publishAndWaitForResponse(
          "warehouse_exchange",
          "warehouse.get.ingredient.byId",
          { id: ingredient.ingredientId },
          correlationId
        );

        if (warehouseResponse && warehouseResponse.success) {
          ingredientsData.push({
            id: ingredient.ingredientId,
            image: warehouseResponse.data.image,
            name: warehouseResponse.data.name,
            quantity: ingredient.quantity,
          });
        } else {
          console.error(
            `Error al obtener el ingrediente con ID ${ingredient.ingredientId}`
          );
        }
      }

      // Devolver la receta con los ingredientes
      return {
        success: true,
        status: 200,
        message: "Receta obtenida exitosamente.",
        data: { ...recipe, ingredients: ingredientsData },
      };
    } catch (error) {
      console.error("Error al obtener la receta:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al obtener la receta.",
      };
    }
  }

  async checkAndAdvanceOrderStatus(orderId: number) {
    try {
      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "orders_exchange",
        "orders.get.orderById",
        { id: orderId },
        correlationId
      );

      if (!response) {
        return {
          success: false,
          status: 404,
          message: "No se encontró la orden.",
        };
      }

      const orderData = response.data;

      switch (orderData.status) {
        case OrderStatus.DELIVERED_INGREDIENTS: {
          // Actualizar la orden a estado en preparación
          await publishToExchange("orders_exchange", "orders.update.order", {
            id: orderData.id,
            recipeId: orderData.recipeId,
            status: "PREPARING",
          });

          // Enviar respuesta de verificacion como "Debe continuar en cola de reintentos"
          return {
            success: true,
            status: 200,
            message: "Orden en preparación.",
            data: {
              orderId: orderData.id,
              recipeId: orderData.recipeId,
              status: "PREPARING",
            },
          };
          break;
        }

        case OrderStatus.PREPARING: {
          // Actualizar la orden a estado en preparación
          await publishToExchange("orders_exchange", "orders.update.order", {
            id: orderData.id,
            recipeId: orderData.recipeId,
            status: "COMPLETED",
          });

          return {
            success: true,
            status: 200,
            message: "Orden Completada.",
            data: {
              orderId: orderData.id,
              recipeId: orderData.recipeId,
              status: "COMPLETED",
            },
          };
          break;
        }

        default:
          // Si la orden no está en estado "DELIVERED_INGREDIENTS" o "PREPARING", no hacemos nada
          return {
            success: true,
            status: 200,
            message: "Orden en estado diferente, Sigue en la cola.",
            data: {
              orderId: orderData.id,
              recipeId: orderData.recipeId,
              status: orderData.status,
            },
          };
      }
    } catch (error) {
      console.error("Error al verificar el estado de la orden:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al verificar el estado de la orden.",
      };
    }
  }
}
