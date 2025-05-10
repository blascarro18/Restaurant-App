import { PrismaClient } from "@prisma/client";

import * as dotenv from "dotenv";
import { IngredientsRequestDto } from "./dto/ingredients-request.dto";
import { publishToExchange } from "../common/message-broken/rabbitmq";
import { MarketService } from "./market.service";
dotenv.config();

export class WarehouseService {
  constructor(
    private prisma = new PrismaClient(),
    private marketService = new MarketService()
  ) {}

  //Get Ingredients
  async getIngredients() {
    try {
      // Obtener todas los ingredientes de la base de datos
      const ingredients = await this.prisma.ingredient.findMany({
        include: {
          stock: true,
        },
      });

      return {
        success: true,
        status: 200,
        message: "Ingredientes obtenidos exitosamente.",
        data: ingredients,
      };
    } catch (error) {
      console.error("Error al obtener los ingredientes:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al obtener los ingredientes.",
      };
    }
  }

  //Get Ingredient by ID
  async getIngredientById(id: number) {
    try {
      // Obtener un ingrediente por ID de la base de datos
      const ingredient = await this.prisma.ingredient.findUnique({
        where: { id },
      });

      if (!ingredient) {
        return {
          success: false,
          status: 404,
          message: "Ingrediente no encontrado.",
        };
      }

      return {
        success: true,
        status: 200,
        message: "Ingrediente obtenido exitosamente.",
        data: ingredient,
      };
    } catch (error) {
      console.error("Error al obtener el ingrediente:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al obtener el ingrediente.",
      };
    }
  }

  //Ingredients Request
  async ingredientsRequest(ingredientsRequestDto: IngredientsRequestDto) {
    try {
      const { orderId, recipeId, ingredients } = ingredientsRequestDto;

      const resultSummary = [];

      for (const ingredient of ingredients) {
        const ingredientData = await this.prisma.ingredient.findUnique({
          where: { id: ingredient.ingredientId },
          include: {
            stock: true,
          },
        });

        if (!ingredientData) {
          return {
            success: false,
            status: 404,
            message: "Ingrediente no encontrado.",
          };
        }

        if (
          ingredientData &&
          ingredientData.stock?.quantity !== undefined &&
          ingredientData.stock.quantity >= ingredient.quantity
        ) {
          resultSummary.push({
            ingredientId: ingredient.ingredientId,
            quantity: ingredient.quantity,
            status: "AVAILABLE",
          });
        }

        if (
          ingredientData &&
          ingredientData.stock?.quantity !== undefined &&
          ingredientData.stock.quantity < ingredient.quantity
        ) {
          const bought = await this.marketService.buyIngredientUntilAvailable(
            ingredientData.id,
            ingredientData.name
          );

          if (bought > 0) {
            // Actualizar la cantidad de ingredientes en stock
            await this.prisma.stock.updateMany({
              where: {
                ingredientId: ingredient.ingredientId,
              },
              data: {
                quantity: {
                  increment: bought,
                },
              },
            });

            // Verificar si la nueva cantidad es suficiente para el ingrediente solicitado
            if (ingredientData.stock.quantity >= ingredient.quantity) {
              resultSummary.push({
                ingredientId: ingredient.ingredientId,
                quantity: ingredient.quantity,
                status: "AVAILABLE",
              });
            } else {
              resultSummary.push({
                ingredientId: ingredient.ingredientId,
                quantity: ingredient.quantity,
                status: "NOT_AVAILABLE",
              });
            }
          }
        }
      }

      const allAvailable = resultSummary.every(
        (item) => item.status === "AVAILABLE"
      );

      if (allAvailable) {
        // Actualizar la orden a estado de ingredientes entregados a cocina
        await publishToExchange("orders_exchange", "orders.update.order", {
          id: orderId,
          recipeId,
          status: "DELIVERED_INGREDIENTS",
        });

        // Descontar del stock de la bodega los ingredientes que fueron entregados a cocina
        for (const ingredient of ingredients) {
          await this.prisma.stock.updateMany({
            where: {
              ingredientId: ingredient.ingredientId,
            },
            data: {
              quantity: {
                decrement: ingredient.quantity,
              },
            },
          });
        }
      } else {
        // Actualizar la orden a estado de esperando ingredientes de la plaza de mercado
        await publishToExchange("orders_exchange", "orders.update.order", {
          id: orderId,
          recipeId,
          status: "WAITING_FOR_INGREDIENTS",
        });

        console.log(
          "⏳ Ingredientes no disponibles, se debe encolar para reintentos."
        );
      }

      return {
        success: true,
        status: 200,
        message: "Solicitud de ingredientes procesada.",
        data: allAvailable,
      };
    } catch (error) {
      console.error("Error en la solicitud de ingredientes:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error en la solicitud de ingredientes.",
      };
    }
  }
}
