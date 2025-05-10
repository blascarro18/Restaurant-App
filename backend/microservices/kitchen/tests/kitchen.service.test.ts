// Mocks deben ir antes de las importaciones
jest.mock("@prisma/client", () => {
  const recipe = {
    count: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
  };
  const recipeIngredient = {
    findMany: jest.fn(),
  };

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      recipe,
      recipeIngredient,
    })),
    __mock__: {
      recipe,
      recipeIngredient,
    },
  };
});

jest.mock("../src/common/message-broken/rabbitmq", () => ({
  publishToExchange: jest.fn(),
  publishAndWaitForResponse: jest.fn(),
}));

// Importaciones reales
import { KitchenService } from "../src/module/kitchen.service";
import { OrderStatus } from "../src/module/constants/order-status";
import {
  publishToExchange,
  publishAndWaitForResponse,
} from "../src/common/message-broken/rabbitmq";
import { PrismaClient } from "@prisma/client";

// Instancia del mock de Prisma
const prismaMock = jest.requireMock("@prisma/client").__mock__;
const prisma = new PrismaClient();
const kitchenService = new KitchenService(prisma); // Prisma inyectado

describe("KitchenService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("newOrder", () => {
    it("should return failure if no recipe is found", async () => {
      const orderData = { orderId: 1 };
      prismaMock.recipe.count.mockResolvedValue(0);

      const result = await kitchenService.newOrder(orderData);

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
    });

    it("should handle errors and return failure message", async () => {
      const orderData = { orderId: 1 };
      prismaMock.recipe.findFirst.mockRejectedValue(new Error("DB error"));

      const result = await kitchenService.newOrder(orderData);

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe("Ocurrió un error al crear la orden.");
    });
  });

  describe("getRecipes", () => {
    it("should return recipes successfully", async () => {
      prismaMock.recipe.findMany.mockResolvedValue([
        {
          id: 1,
          name: "Recipe 1",
          description: "Description",
          image: "image_url",
        },
      ]);
      prismaMock.recipeIngredient.findMany.mockResolvedValue([]);

      const result = await kitchenService.getRecipes();

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Recetas obtenidas exitosamente.");
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data?.length).toBe(1);
    });

    it("should handle errors when retrieving recipes", async () => {
      prismaMock.recipe.findMany.mockRejectedValue(new Error("DB error"));

      const result = await kitchenService.getRecipes();

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe("Ocurrió un error al obtener las recetas.");
    });
  });

  describe("getRecipeById", () => {
    it("should return a recipe by ID", async () => {
      const recipeId = 1;

      prismaMock.recipe.findUnique.mockResolvedValue({
        id: recipeId,
        name: "Recipe 1",
        description: "Description",
        image: "image_url",
      });
      prismaMock.recipeIngredient.findMany.mockResolvedValue([]);

      const result = await kitchenService.getRecipeById(recipeId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Receta obtenida exitosamente.");
      expect(result.data?.id).toBe(recipeId);
    });

    it("should return failure if the recipe is not found", async () => {
      const recipeId = 1;
      prismaMock.recipe.findUnique.mockResolvedValue(null);

      const result = await kitchenService.getRecipeById(recipeId);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toBe("Receta no encontrada.");
    });

    it("should handle errors while getting a recipe", async () => {
      const recipeId = 1;
      prismaMock.recipe.findUnique.mockRejectedValue(new Error("DB error"));

      const result = await kitchenService.getRecipeById(recipeId);

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe("Ocurrió un error al obtener la receta.");
    });
  });

  describe("checkAndAdvanceOrderStatus", () => {
    it("should update order to preparing when ingredients are delivered", async () => {
      const orderId = 1;
      (publishAndWaitForResponse as jest.Mock).mockResolvedValue({
        data: { id: orderId, status: OrderStatus.DELIVERED_INGREDIENTS },
      });
      (publishToExchange as jest.Mock).mockResolvedValue({ success: true });

      const result = await kitchenService.checkAndAdvanceOrderStatus(orderId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Orden en preparación.");
    });

    it("should complete the order when in preparation", async () => {
      const orderId = 1;
      (publishAndWaitForResponse as jest.Mock).mockResolvedValue({
        data: { id: orderId, status: OrderStatus.PREPARING },
      });
      (publishToExchange as jest.Mock).mockResolvedValue({ success: true });

      const result = await kitchenService.checkAndAdvanceOrderStatus(orderId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Orden Completada.");
    });

    it("should return message if the order is in a different state", async () => {
      const orderId = 1;
      (publishAndWaitForResponse as jest.Mock).mockResolvedValue({
        data: { id: orderId, status: "OTHER_STATUS" },
      });

      const result = await kitchenService.checkAndAdvanceOrderStatus(orderId);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe(
        "Orden en estado diferente, Sigue en la cola."
      );
    });

    it("should return failure if no order is found", async () => {
      const orderId = 1;
      (publishAndWaitForResponse as jest.Mock).mockResolvedValue(null);

      const result = await kitchenService.checkAndAdvanceOrderStatus(orderId);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toBe("No se encontró la orden.");
    });
  });
});
