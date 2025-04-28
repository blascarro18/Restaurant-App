import { IncomingMessage, ServerResponse } from "http";
import { validateDto } from "../../common/middlewares/validate-dto";
import { publishAndWaitForResponse } from "../../common/message-broken/rabbitmq";
import { UpdateOrderDto } from "./dto/update-order.dto";

export class OrdersController {
  static async createNewOrder(req: IncomingMessage, res: ServerResponse) {
    try {
      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "orders_exchange",
        "orders.create.newOrder",
        {},
        correlationId
      );

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Order created successfully",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in orders controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }

  static async getOrders(
    req: IncomingMessage,
    res: ServerResponse,
    query: any
  ) {
    try {
      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "orders_exchange",
        "orders.get.orders",
        query,
        correlationId
      );

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Orders retrieved successfully",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in orders controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }

  static async getOrderById(
    req: IncomingMessage,
    res: ServerResponse,
    id: number
  ) {
    try {
      // Validar el ID de la orden
      if (!id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Order ID is required" }));
      }

      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "orders_exchange",
        "orders.get.orderById",
        { id },
        correlationId
      );

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Order retrieved successfully",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in orders controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }

  static async updateOrder(
    req: IncomingMessage,
    res: ServerResponse,
    id: number
  ) {
    try {
      // Validar el ID de la orden
      if (!id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Order ID is required" }));
      }

      const { data, errors } = await validateDto(req, UpdateOrderDto);

      if (errors.length > 0) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({ message: "Validation failed", errors })
        );
      }

      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "orders_exchange",
        "orders.update.order",
        { id, ...data },
        correlationId
      );

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Order updated successfully",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in orders controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }
}
