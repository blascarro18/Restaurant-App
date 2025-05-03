import { IncomingMessage, ServerResponse } from "http";
import { publishAndWaitForResponse } from "../../common/message-broken/rabbitmq";

export class WarehouseController {
  static async getIngredients(
    req: IncomingMessage,
    res: ServerResponse,
    query: any
  ) {
    try {
      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "warehouse_exchange",
        "warehouse.get.ingredients",
        query,
        correlationId
      );

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Ingredients retrieved successfully",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in warehouse controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }

  static async getMarketHistory(
    req: IncomingMessage,
    res: ServerResponse,
    query: any
  ) {
    try {
      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "warehouse_exchange",
        "warehouse.get.market-history",
        query,
        correlationId
      );

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            meta: response.meta,
            message:
              response.message || "Market history retrieved successfully",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in warehouse controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }
}
