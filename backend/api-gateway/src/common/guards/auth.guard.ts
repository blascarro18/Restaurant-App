import { IncomingMessage, ServerResponse } from "http";
import { publishAndWaitForResponse } from "../message-broken/rabbitmq";

// Función para verificar el token
export async function verifyToken(
  req: IncomingMessage,
  res: ServerResponse
): Promise<boolean> {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Authorization token is required" }));
    return false;
  }

  const token = authHeader.split(" ")[1]; // Obtenemos el token del header Authorization

  if (!token) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Token is required" }));
    return false;
  }

  try {
    // Llamamos al microservicio de auth-ms para verificar el token
    const correlationId = `verifyToken-${Date.now()}`;
    const response = await publishAndWaitForResponse(
      "auth_exchange",
      "auth.verifyToken",
      { token },
      correlationId
    );

    if (response.success) {
      return true; // Token válido
    } else {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Invalid or expired token" }));
      return false; // Token inválido
    }
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        message: "Internal server error during token verification",
      })
    );
    return false; // Error en la verificación del token
  }
}
