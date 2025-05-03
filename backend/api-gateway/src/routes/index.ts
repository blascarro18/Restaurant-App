import { IncomingMessage, ServerResponse } from "http";
import { authRoutes } from "../modules/auth/auth.routes";
import { ordersRoutes } from "../modules/orders/orders.routes";
import { kitchenRoutes } from "../modules/kitchen/kitchen.routes";
import { warehouseRoutes } from "../modules/warehouse/warehouse.routes";

export async function handleRoutes(req: IncomingMessage, res: ServerResponse) {
  // Ejecuta las rutas en orden. Si una responde, se detiene el flujo.
  const handled =
    authRoutes(req, res) ||
    (await ordersRoutes(req, res)) ||
    (await kitchenRoutes(req, res)) ||
    (await warehouseRoutes(req, res));

  if (!handled) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
}
