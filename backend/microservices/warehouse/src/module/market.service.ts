import { PrismaClient } from "@prisma/client";
import axios from "axios";
import { PaginationDto } from "../common/dtos/pagination.dto";

const prisma = new PrismaClient();

export class MarketService {
  // Compra ingredientes hasta cumplir la cantidad requerida
  async buyIngredientUntilAvailable(id: number, name: string): Promise<number> {
    let totalBought = 0;
    const ingredientName = name.toLowerCase();

    console.log(`⏳ Intentando comprar el ingrediente "${ingredientName}"...`);

    try {
      const response = await axios.get(
        "https://recruitment.alegra.com/api/farmers-market/buy",
        {
          params: { ingredient: ingredientName },
        }
      );

      const quantitySold =
        (response.data as { quantitySold?: number }).quantitySold ?? 0;

      if (quantitySold > 0) {
        totalBought += quantitySold;
        console.log(`✅ Comprados ${quantitySold} de ${ingredientName}.`);

        // Crear Registro de compra en la base de datos
        await prisma.marketHistory.create({
          data: {
            ingredientId: id,
            quantity: quantitySold,
          },
        });
      }
    } catch (error) {
      console.error(
        `❌ Error al comprar ${ingredientName}:`,
        (error as any).message
      );
      await new Promise((res) => setTimeout(res, 3000));
    }

    return totalBought;
  }

  // Obtener el historial de compras
  async getMarketHistory(paginationDto: PaginationDto) {
    try {
      const { limit, page } = paginationDto;

      const totalPages = await prisma.marketHistory.count();

      const currentPage = page;
      const perPage = limit;

      // Obtener el historial de compras de la base de datos
      const marketHistory = await prisma.marketHistory.findMany({
        skip: ((page ?? 1) - 1) * (limit ?? 10),
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      });

      const marketHistoryData = [];
      for (const purchase of marketHistory) {
        let ingredientData = null;

        // Buscar la información del ingrediente asociado a la compra
        const ingredient = await prisma.ingredient.findUnique({
          where: { id: purchase.ingredientId },
        });

        if (!ingredient) {
          console.error(
            `❌ Error: No se encontró el ingrediente con ID ${purchase.ingredientId}`
          );
          continue;
        }

        ingredientData = {
          id: ingredient.id,
          name: ingredient.name,
          image: ingredient.image,
        };

        marketHistoryData.push({
          id: purchase.id,
          ingredient: ingredientData,
          quantity: purchase.quantity,
        });
      }

      return {
        success: true,
        status: 200,
        message: "Órdenes obtenidas exitosamente.",
        data: marketHistoryData,
        meta: {
          total: totalPages,
          page: currentPage,
          perPage,
        },
      };
    } catch (error) {
      console.error("Error al obtener el historial de compras:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al obtener el historial de compras.",
      };
    }
  }
}
