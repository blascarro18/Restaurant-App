import { IncomingMessage, ServerResponse } from "http";
import { authRoutes } from "../modules/auth/auth.routes";

export function handleRoutes(req: IncomingMessage, res: ServerResponse) {
  // Ejecuta las rutas en orden. Si una responde, se detiene el flujo.
  const handled = authRoutes(req, res);

  if (!handled) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Route not found" }));
  }
}
