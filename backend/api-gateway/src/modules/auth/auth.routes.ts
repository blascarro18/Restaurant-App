// routes/auth.routes.ts
import { IncomingMessage, ServerResponse } from "http";
import { AuthController } from "./auth.controller";

export function authRoutes(req: IncomingMessage, res: ServerResponse): boolean {
  // POST /api/login
  if (req.url === "/api/login" && req.method === "POST") {
    AuthController.login(req, res);
    return true;
  }

  // GET /api/verifyToken
  if (req.url === "/api/verifyToken" && req.method === "GET") {
    AuthController.verifyToken(req, res);
    return true;
  }

  return false;
}
