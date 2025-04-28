import { PrismaClient } from "@prisma/client";
import { OrderStatus } from "./constants/order-status";

import * as dotenv from "dotenv";
import { publishAndWaitForResponse } from "../common/message-broken/rabbitmq";
import { UpdateOrderDto } from "./dto/update-order.dto";
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

      // Envía la orden a la cocina usando RabbitMQ
      const correlationId = Date.now().toString(); // Generar un `correlationId` único para identificar esta solicitud

      const responseFromKitchen = await publishAndWaitForResponse(
        "kitchen_exchange",
        "kitchen.orders.newOrder",
        {
          orderId: orderCreated.id, // Enviamos el ID de la orden
          status: orderCreated.status,
        },
        correlationId
      );

      console.log("✅ Response from kitchen:", responseFromKitchen);

      return {
        success: true,
        status: 200,
        message: "Orden creada y enviada a cocina exitosamente.",
        data: {
          order: orderCreated,
          kitchenResponse: responseFromKitchen, // opcional: podrías incluirlo o no
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

  //Get Orders
  async getOrders() {
    try {
      // Obtener todas las órdenes de la base de datos
      const orders = await prisma.order.findMany();

      return {
        success: true,
        status: 200,
        message: "Órdenes obtenidas exitosamente.",
        data: orders,
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
