// routes/warehouse.routes.ts
import { IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import { verifyToken } from "../../common/guards/auth.guard";
import { WarehouseController } from "./warehouse.controller";

export async function warehouseRoutes(
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

  // GET /api/warehouse/ingredients
  if (pathname === "/api/warehouse/ingredients" && req.method === "GET") {
    WarehouseController.getIngredients(req, res, query);
    return true;
  }

  // GET /api/warehouse/market-history
  if (pathname === "/api/warehouse/market-history" && req.method === "GET") {
    WarehouseController.getMarketHistory(req, res, query);
    return true;
  }

  return false;
}
