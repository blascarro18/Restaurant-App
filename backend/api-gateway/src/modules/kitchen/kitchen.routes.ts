// routes/kitchen.routes.ts
import { IncomingMessage, ServerResponse } from "http";
import { parse } from "url";
import { verifyToken } from "../../common/guards/auth.guard";
import { KitchenController } from "./kitchen.controller";

export async function kitchenRoutes(
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

  // GET /api/kitchen/recipes
  if (pathname === "/api/kitchen/recipes" && req.method === "GET") {
    KitchenController.getRecipes(req, res, query);
    return true;
  }

  // GET /api/kitchen/recipes/byId/:recipeId
  if (
    pathname.startsWith("/api/kitchen/recipes/byId/") &&
    req.method === "GET"
  ) {
    const parts = pathname.split("/");
    const id = parseInt(parts[5]);

    if (!id) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Recipe ID is required" }));
      return true;
    }

    KitchenController.getRecipeById(req, res, id);
    return true;
  }

  return false;
}
