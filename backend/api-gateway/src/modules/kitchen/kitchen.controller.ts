import { IncomingMessage, ServerResponse } from "http";
import { publishAndWaitForResponse } from "../../common/message-broken/rabbitmq";

export class KitchenController {
  static async getRecipes(
    req: IncomingMessage,
    res: ServerResponse,
    query: any
  ) {
    try {
      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "kitchen_exchange",
        "kitchen.get.recipes",
        query,
        correlationId
      );

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Recipes retrieved successfully",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in kitchen controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }

  static async getRecipeById(
    req: IncomingMessage,
    res: ServerResponse,
    id: number
  ) {
    try {
      // Validar el ID de la receta
      if (!id) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Recipe ID is required" }));
      }

      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "kitchen_exchange",
        "kitchen.get.recipeById",
        { id },
        correlationId
      );

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Recipe retrieved successfully",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in kitchen controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }
}
