import { PrismaClient } from "@prisma/client";
import { WarehouseService } from "../src/module/warehouse.service";
import { MarketService } from "../src/module/market.service";
import * as dotenv from "dotenv";
import { publishToExchange } from "../src/common/message-broken/rabbitmq";
dotenv.config();

jest.mock("@prisma/client", () => {
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      ingredient: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
      stock: {
        updateMany: jest.fn(),
      },
    })),
  };
});

jest.mock("../src/module/market.service", () => {
  return {
    MarketService: jest.fn().mockImplementation(() => ({
      buyIngredientUntilAvailable: jest.fn(),
    })),
  };
});

jest.mock("../src/common/message-broken/rabbitmq", () => ({
  publishToExchange: jest.fn(),
}));

describe("WarehouseService", () => {
  let warehouseService: WarehouseService;
  let prismaMock: PrismaClient;
  let marketServiceMock: MarketService;

  beforeEach(() => {
    prismaMock = new PrismaClient();
    marketServiceMock = new MarketService();
    warehouseService = new WarehouseService(prismaMock, marketServiceMock);
    jest.clearAllMocks();
  });

  describe("getIngredients", () => {
    it("should return ingredients successfully", async () => {
      const ingredients = [
        {
          id: 1,
          name: "tomato",
          image: "https://i.ibb.co/wNSj9Zwn/tomato.png",
          stock: { id: 1, ingredientId: 1, quantity: 1 },
        },
        {
          id: 2,
          name: "lemon",
          image: "https://i.ibb.co/ks7RB2wj/limon.png",
          stock: { id: 2, ingredientId: 2, quantity: 1 },
        },
      ];

      (prismaMock.ingredient.findMany as jest.Mock).mockResolvedValue(
        ingredients
      );

      const result = await warehouseService.getIngredients();

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Ingredientes obtenidos exitosamente.");
      expect(result.data).toEqual(ingredients);
    });

    it("should handle errors when getting ingredients", async () => {
      (prismaMock.ingredient.findMany as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const result = await warehouseService.getIngredients();

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe(
        "Ocurrió un error al obtener los ingredientes."
      );
    });
  });

  describe("getIngredientById", () => {
    it("should return ingredient by id", async () => {
      const ingredient = {
        id: 1,
        name: "tomato",
        image: "https://i.ibb.co/wNSj9Zwn/tomato.png",
        stock: { id: 1, ingredientId: 1, quantity: 1 },
      };

      (prismaMock.ingredient.findUnique as jest.Mock).mockResolvedValue(
        ingredient
      );

      const result = await warehouseService.getIngredientById(1);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Ingrediente obtenido exitosamente.");
      expect(result.data).toEqual(ingredient);
    });

    it("should return error if ingredient not found", async () => {
      (prismaMock.ingredient.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await warehouseService.getIngredientById(999);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toBe("Ingrediente no encontrado.");
    });
  });

  describe("ingredientsRequest", () => {
    it("should process ingredients request successfully", async () => {
      const ingredientsRequestDto = {
        orderId: 1,
        recipeId: 101,
        ingredients: [
          { ingredientId: 1, quantity: 1 },
          { ingredientId: 2, quantity: 1 },
        ],
      };

      (prismaMock.ingredient.findUnique as jest.Mock).mockImplementation(
        ({ where }) => {
          if (where.id === 1)
            return { id: 1, stock: { quantity: 1 }, name: "tomato" };
          if (where.id === 2)
            return { id: 2, stock: { quantity: 1 }, name: "lemon" };
          return null;
        }
      );

      (
        marketServiceMock.buyIngredientUntilAvailable as jest.Mock
      ).mockResolvedValue(0);
      (prismaMock.stock.updateMany as jest.Mock).mockResolvedValue({});

      const result = await warehouseService.ingredientsRequest(
        ingredientsRequestDto
      );

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Solicitud de ingredientes procesada.");
      expect(result.data).toBe(true);
      expect(publishToExchange).toHaveBeenCalledWith(
        "orders_exchange",
        "orders.update.order",
        {
          id: 1,
          recipeId: 101,
          status: "DELIVERED_INGREDIENTS",
        }
      );
    });

    it("should handle ingredient not found error", async () => {
      const ingredientsRequestDto = {
        orderId: 1,
        recipeId: 101,
        ingredients: [{ ingredientId: 999, quantity: 5 }],
      };

      (prismaMock.ingredient.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await warehouseService.ingredientsRequest(
        ingredientsRequestDto
      );

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toBe("Ingrediente no encontrado.");
    });
  });
});
