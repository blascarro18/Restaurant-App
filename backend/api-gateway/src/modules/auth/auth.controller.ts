import { IncomingMessage, ServerResponse } from "http";
import { validateDto } from "../../common/middlewares/validate-dto";
import { publishAndWaitForResponse } from "../../common/message-broken/rabbitmq";
import { LoginUserDto } from "./dto/login-user.dto";

export class AuthController {
  static async login(req: IncomingMessage, res: ServerResponse) {
    try {
      const { data, errors } = await validateDto(req, LoginUserDto);

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
        "auth_exchange",
        "auth.login",
        data,
        correlationId
      );

      if (!response.success && response.errors) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: "Validation failed",
            errors: response.errors,
          })
        );
      }

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Login successful",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in login controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }

  static async verifyToken(req: IncomingMessage, res: ServerResponse) {
    try {
      const token = req.headers["authorization"]?.split(" ")[1];

      if (!token) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ message: "Token not provided" }));
      }

      // Generar un `correlationId` único para identificar esta solicitud
      const correlationId = Date.now().toString();

      // Publicamos el mensaje y esperamos la respuesta
      const response = await publishAndWaitForResponse(
        "auth_exchange",
        "auth.verifyToken",
        { token },
        correlationId
      );

      // Devolvemos la respuesta al cliente según la validación
      if (!response.success && response.errors) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            message: "Validation failed",
            errors: response.errors,
          })
        );
      }

      if (response.success) {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        return res.end(
          JSON.stringify({
            data: response.data,
            message: response.message || "Valid token",
          })
        );
      } else {
        res.writeHead(response.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: response.message }));
      }
    } catch (error) {
      console.error("❌ Error in verifyToken controller:", error);
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Internal server error" }));
    }
  }
}
