import { Channel, Message } from "amqplib";
import { AuthService } from "./auth.service";
import { validateDto } from "../common/middlewares/validate-dto";
import { LoginUserDto } from "./dto/login-user.dto";

export class AuthController {
  private channel: Channel;
  private authService: AuthService;
  private handlers: {
    [key: string]: (msg: Message, payload: any) => Promise<void>;
  };

  constructor(channel: Channel) {
    this.channel = channel;
    this.authService = new AuthService();

    // Inicializamos los handlers de cada tópico
    this.handlers = {
      "auth.login": this.handleLogin.bind(this),
      "auth.verifyToken": this.handleVerifyToken.bind(this),
    };
  }

  // Método para iniciar la escucha de los tópicos
  async startListening() {
    await this.channel.assertQueue("auth_queue", { durable: true });

    await this.channel.bindQueue("auth_queue", "auth_exchange", "auth.login");
    await this.channel.bindQueue(
      "auth_queue",
      "auth_exchange",
      "auth.verifyToken"
    );

    this.channel.consume("auth_queue", async (msg) => {
      if (!msg) return;

      const routingKey = msg.fields.routingKey;
      const payload = JSON.parse(msg.content.toString());

      console.log(`📩 Received message with routingKey: ${routingKey}`);

      const handler = this.handlers[routingKey];

      if (handler) {
        await handler(msg, payload);
      } else {
        console.warn(`⚠️ No handler found for routingKey: ${routingKey}`);
      }

      this.channel.ack(msg); // Confirmar que el mensaje fue procesado
    });
  }

  // Handler para auth.login
  private async handleLogin(msg: Message, payload: LoginUserDto) {
    const { data, errors } = await validateDto(payload, LoginUserDto);

    if (errors.length > 0) {
      console.error("❌ Validation failed:", errors);
      this.sendResponse(msg, { success: false, errors });
      return;
    }

    if (!data) {
      console.error("❌ Validation failed: data is null.");
      this.sendResponse(msg, { success: false, errors: ["Invalid data"] });
      return;
    }

    const response = await this.authService.login(data);
    this.sendResponse(msg, response);
  }

  // Handler para auth.verifyToken
  private async handleVerifyToken(msg: Message, payload: { token: string }) {
    const { token } = payload;

    if (!token) {
      console.error("❌ Token not provided.");
      this.sendResponse(msg, {
        success: false,
        errors: ["Token not provided"],
      });
      return;
    }

    const response = await this.authService.verifyToken(token);
    this.sendResponse(msg, response);
  }

  // Método para enviar respuesta
  private sendResponse(msg: Message, response: any) {
    const { replyTo, correlationId } = msg.properties;

    if (!replyTo) {
      console.warn("❌ No replyTo specified, cannot send response.");
      return;
    }

    this.channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
      correlationId,
    });

    console.log("📤 Sent response to:", replyTo);
  }
}
