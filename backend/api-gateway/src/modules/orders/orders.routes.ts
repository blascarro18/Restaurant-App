// routes/orders.routes.ts
import { IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import { OrdersController } from "./orders.controller";
import { verifyToken } from "../../common/guards/auth.guard";

export async function ordersRoutes(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const parsedUrl = parse(req.url || "", true); // 'true' para incluir query params
  const pathname = parsedUrl.pathname || "";
  const query = parsedUrl.query || {};

  // Verificamos el token antes de continuar
  const tokenValid = await verifyToken(req, res);
  if (!tokenValid) {
    return true; // Si la verificación falla, ya se ha respondido y no se procesa la ruta
  }

  // POST /api/orders/createNewOrder
  if (pathname === "/api/orders/createNewOrder" && req.method === "POST") {
    OrdersController.createNewOrder(req, res);
    return true;
  }

  // GET /api/orders
  if (pathname === "/api/orders" && req.method === "GET") {
    OrdersController.getOrders(req, res, query);
    return true;
  }

  // GET /api/orders/byId/:id
  if (pathname.startsWith("/api/orders/byId/") && req.method === "GET") {
    const parts = pathname.split("/");
    const id = parseInt(parts[4]);

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Order ID is required" }));
      return true;
    }

    OrdersController.getOrderById(req, res, id);
    return true;
  }

  // PATCH /api/orders/updateOrder/:id
  if (
    pathname.startsWith("/api/orders/updateOrder/") &&
    req.method === "PATCH"
  ) {
    const parts = pathname.split("/");
    const id = parseInt(parts[4]);

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Order ID is required for update" }));
      return true;
    }

    OrdersController.updateOrder(req, res, id);
    return true;
  }

  return false;
}
