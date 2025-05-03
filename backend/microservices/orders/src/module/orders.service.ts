import { PrismaClient } from "@prisma/client";
import { OrderStatus } from "./constants/order-status";
import { publishAndWaitForResponse } from "../common/message-broken/rabbitmq";
import { UpdateOrderDto } from "./dto/update-order.dto";

import * as dotenv from "dotenv";
import { PaginationDto } from "../common/dtos/pagination.dto";
import { emitOrderUpdated } from "../common/socket.io/socket.io";
dotenv.config();

const prisma = new PrismaClient();

export class OrdersService {
  //Create New Order
  async createNewOrder() {
    try {
      // Crear la orden en base de datos
      const orderCreated = await prisma.order.create({
        data: {
          status: OrderStatus.RECEIVED,
        },
      });

      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicar la orden en el exchange de cocina
      const kitchenResponse = await publishAndWaitForResponse(
        "kitchen_exchange",
        "kitchen.orders.newOrder",
        {
          orderId: orderCreated.id, // Enviamos el ID de la orden
        },
        correlationId
      );

      if (!kitchenResponse.success && kitchenResponse.errors) {
        return {
          success: false,
          status: 400,
          message: "Ocurrió un error al enviar la orden a cocina.",
          errors: kitchenResponse.errors,
        };
      }

      if (kitchenResponse.success) {
        return {
          success: true,
          status: 200,
          message: "Orden creada y enviada a cocina exitosamente.",
          data: {
            ...orderCreated,
            recipeId: kitchenResponse.data.recipeId,
            recipe: kitchenResponse.data.recipe,
            status:
              OrderStatus[
                kitchenResponse.data.status as keyof typeof OrderStatus
              ],
          },
        };
      } else {
        return {
          success: false,
          status: 400,
          message: "Ocurrió un error al enviar la orden a cocina.",
        };
      }
    } catch (error) {
      console.error("Error al crear la orden", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al crear la orden.",
      };
    }
  }

  //Get Orders
  async getOrders(paginationDto: PaginationDto) {
    try {
      const { limit, page } = paginationDto;

      const totalPages = await prisma.order.count();

      const currentPage = page;
      const perPage = limit;

      // Obtener todas las órdenes de la base de datos
      const orders = await prisma.order.findMany({
        skip: ((page ?? 1) - 1) * (limit ?? 10),
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      });

      const ordersData = [];
      for (const order of orders) {
        let recipeData = null;

        // Generar un `correlationId` único para identificar esta solicitud
        const correlationId = Date.now().toString();

        // Obtener la receta asociada a la orden
        const kitchenResponse = await publishAndWaitForResponse(
          "kitchen_exchange",
          "kitchen.get.recipeById",
          {
            id: order.recipeId, // Enviamos el ID de la receta
          },
          correlationId
        );

        if (kitchenResponse && kitchenResponse.success) {
          recipeData = kitchenResponse.data;
        } else {
          console.error(`Error al obtener la receta con ID ${order.recipeId}`);
        }

        ordersData.push({
          ...order,
          recipe: recipeData,
        });
      }

      return {
        success: true,
        status: 200,
        message: "Órdenes obtenidas exitosamente.",
        data: ordersData,
        meta: {
          total: totalPages,
          page: currentPage,
          perPage,
        },
      };
    } catch (error) {
      console.error("Error al obtener las órdenes:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al obtener las órdenes.",
      };
    }
  }

  //Get Order By Id
  async getOrderById(orderId: number) {
    try {
      // Obtener la orden por ID de la base de datos
      const order = await prisma.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        return {
          success: false,
          status: 404,
          message: "Orden no encontrada.",
        };
      }

      return {
        success: true,
        status: 200,
        message: "Orden obtenida exitosamente.",
        data: order,
      };
    } catch (error) {
      console.error("Error al obtener la orden:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al obtener la orden.",
      };
    }
  }

  //Update Order
  async updateOrder(updateOrderDto: UpdateOrderDto) {
    try {
      const { id, recipeId, status } = updateOrderDto;

      // Obtener la orden por ID de la base de datos
      const order = await prisma.order.findUnique({
        where: { id },
      });

      if (!order) {
        return {
          success: false,
          status: 404,
          message: "Orden no encontrada.",
        };
      }

      // Actualizar la orden en la base de datos
      const updatedOrder = await prisma.order.update({
        where: { id },
        data: {
          recipeId,
          status: OrderStatus[status as keyof typeof OrderStatus],
        },
      });

      // Emite un evento de actualización de orden
      emitOrderUpdated(updatedOrder);

      return {
        success: true,
        status: 200,
        message: "Orden actualizada exitosamente.",
        data: updatedOrder,
      };
    } catch (error) {
      console.error("Error al actualizar la orden:", error);
      return {
        success: false,
        status: 400,
        message: "Ocurrió un error al actualizar la orden.",
      };
    }
  }
}
