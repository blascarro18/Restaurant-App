import { PrismaClient } from "@prisma/client";
import { UpdateOrderDto } from "../src/module/dto/update-order.dto";
import * as dotenv from "dotenv";
import { OrdersService } from "../src/module/orders.service";
import { publishAndWaitForResponse } from "../src/common/message-broken/rabbitmq";
import { emitOrderUpdated } from "../src/common/socket.io/socket.io";
import { OrderStatus } from "../src/module/constants/order-status";
dotenv.config();

jest.mock("@prisma/client", () => {
  const mockOrder = {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
  };

  const mockPrismaClient = {
    order: mockOrder,
  };

  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock("../src/common/message-broken/rabbitmq", () => ({
  publishAndWaitForResponse: jest.fn(),
}));

jest.mock("../src/common/socket.io/socket.io", () => ({
  emitOrderUpdated: jest.fn(),
}));

describe("OrdersService", () => {
  let ordersService: OrdersService;
  let prismaMock: PrismaClient;

  beforeEach(() => {
    ordersService = new OrdersService();
    prismaMock = new PrismaClient();
    jest.clearAllMocks();
  });

  describe("createNewOrder", () => {
    it("should successfully create a new order and send it to the kitchen", async () => {
      const createdOrder = {
        id: 1,
        recipeId: null,
        status: OrderStatus.RECEIVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const kitchenResponse = {
        success: true,
        data: { recipeId: 101, recipe: "RecipeName", status: "PREPARING" },
      };

      // Mocking the create function to return the created order
      (
        prismaMock.order.create as jest.MockedFunction<
          typeof prismaMock.order.create
        >
      ).mockResolvedValue(createdOrder);

      // Mocking the response from the kitchen (RabbitMQ)
      (publishAndWaitForResponse as jest.Mock).mockResolvedValue(
        kitchenResponse
      );

      const result = await ordersService.createNewOrder();

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe(
        "Orden creada y enviada a cocina exitosamente."
      );
      expect(publishAndWaitForResponse).toHaveBeenCalledTimes(1);
      expect(prismaMock.order.create).toHaveBeenCalledWith({
        data: { status: OrderStatus.RECEIVED },
      });
    });

    it("should return an error if there is an issue sending the order to the kitchen", async () => {
      const createdOrder = {
        id: 1,
        recipeId: null,
        status: OrderStatus.RECEIVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const kitchenResponse = { success: false, errors: ["Error in kitchen"] };

      (
        prismaMock.order.create as jest.MockedFunction<
          typeof prismaMock.order.create
        >
      ).mockResolvedValue(createdOrder);
      (publishAndWaitForResponse as jest.Mock).mockResolvedValue(
        kitchenResponse
      );

      const result = await ordersService.createNewOrder();

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe(
        "Ocurrió un error al enviar la orden a cocina."
      );
    });

    it("should handle internal errors and return a failure message", async () => {
      (prismaMock.order.create as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const result = await ordersService.createNewOrder();

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe("Ocurrió un error al crear la orden.");
    });
  });

  describe("getOrders", () => {
    it("should return orders successfully", async () => {
      const paginationDto = { limit: 10, page: 1 };
      const orders = [
        { id: 1, status: OrderStatus.RECEIVED },
        { id: 2, status: OrderStatus.PREPARING },
      ];

      (prismaMock.order.findMany as jest.Mock).mockResolvedValue(orders);
      (prismaMock.order.count as jest.Mock).mockResolvedValue(2);

      const result = await ordersService.getOrders(paginationDto);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Órdenes obtenidas exitosamente.");
      expect(result.data?.length).toBe(2);
    });

    it("should handle errors when getting orders", async () => {
      (prismaMock.order.findMany as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const result = await ordersService.getOrders({ limit: 10, page: 1 });

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe("Ocurrió un error al obtener las órdenes.");
    });
  });

  describe("getOrderById", () => {
    it("should return order by id successfully", async () => {
      const order = { id: 1, status: OrderStatus.RECEIVED };
      (prismaMock.order.findUnique as jest.Mock).mockResolvedValue(order);

      const result = await ordersService.getOrderById(1);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Orden obtenida exitosamente.");
      expect(result.data).toEqual(order);
    });

    it("should return error if order is not found", async () => {
      (prismaMock.order.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await ordersService.getOrderById(999);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toBe("Orden no encontrada.");
    });
  });

  describe("updateOrder", () => {
    it("should update the order successfully", async () => {
      const updateOrderDto: UpdateOrderDto = {
        id: 1,
        recipeId: 101,
        status: "PREPARING",
      };
      const updatedOrder = {
        id: 1,
        recipeId: 101,
        status: OrderStatus.PREPARING as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (
        prismaMock.order.findUnique as jest.MockedFunction<
          typeof prismaMock.order.findUnique
        >
      ).mockResolvedValue({
        id: 1,
        recipeId: null,
        status: OrderStatus.RECEIVED,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      (
        prismaMock.order.update as jest.MockedFunction<
          typeof prismaMock.order.update
        >
      ).mockResolvedValue(updatedOrder);

      const result = await ordersService.updateOrder(updateOrderDto);

      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.message).toBe("Orden actualizada exitosamente.");
      expect(emitOrderUpdated).toHaveBeenCalledWith(updatedOrder);
    });

    it("should return an error if order is not found", async () => {
      const updateOrderDto: UpdateOrderDto = {
        id: 1,
        recipeId: 101,
        status: "PREPARING",
      };

      (
        prismaMock.order.findUnique as jest.MockedFunction<
          typeof prismaMock.order.findUnique
        >
      ).mockResolvedValue(null);

      const result = await ordersService.updateOrder(updateOrderDto);

      expect(result.success).toBe(false);
      expect(result.status).toBe(404);
      expect(result.message).toBe("Orden no encontrada.");
    });

    it("should handle errors when updating order", async () => {
      const updateOrderDto: UpdateOrderDto = {
        id: 1,
        recipeId: 101,
        status: "PREPARING",
      };

      (prismaMock.order.findUnique as jest.Mock).mockRejectedValue(
        new Error("DB error")
      );

      const result = await ordersService.updateOrder(updateOrderDto);

      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.message).toBe("Ocurrió un error al actualizar la orden.");
    });
  });
});
