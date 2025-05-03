import { Channel, Message } from "amqplib";
import { KitchenService } from "./kitchen.service";
import { sendResponse } from "../common/message-broken/responses";
import { publishToExchange } from "../common/message-broken/rabbitmq";

export class KitchenController {
  private channel: Channel;
  private kitchenService: KitchenService;
  private handlers: {
    [key: string]: (msg: Message, payload: any) => Promise<void>;
  };

  constructor(channel: Channel) {
    this.channel = channel;
    this.kitchenService = new KitchenService();
    this.handlers = this.initializeHandlers();
  }

  // Método para inicializar los handlers
  private initializeHandlers() {
    return {
      "kitchen.orders.newOrder": this.handleNewOrder.bind(this),
      "kitchen.get.recipes": this.handleGetRecipes.bind(this),
      "kitchen.get.recipeById": this.handleGetRecipeById.bind(this),
      "kitchen.retry.verificationOrderStatus":
        this.handleVerificationOrderStatus.bind(this),
    };
  }

  // Método para iniciar la escucha de los tópicos
  async startListening() {
    await this.setupQueuesAndBindings();
    this.consumeMessages("kitchen_queue");
  }

  // Configuración de colas y enlaces
  private async setupQueuesAndBindings() {
    await this.channel.assertQueue("kitchen_queue", { durable: true });
    await this.bindQueueToExchange("kitchen_queue", "kitchen_exchange", [
      "kitchen.orders.newOrder",
      "kitchen.get.recipes",
      "kitchen.get.recipeById",
      "kitchen.retry.verificationOrderStatus",
    ]);

    await this.setupRetryQueue();
  }

  // Método para enlazar una cola a un exchange con múltiples routing keys
  private async bindQueueToExchange(
    queue: string,
    exchange: string,
    routingKeys: string[]
  ) {
    for (const routingKey of routingKeys) {
      await this.channel.bindQueue(queue, exchange, routingKey);
    }
  }

  // Configuración de la cola de reintentos
  private async setupRetryQueue() {
    await this.channel.assertExchange("kitchen_retry_exchange", "direct", {
      durable: true,
    });
    await this.channel.assertQueue("kitchen_retry_queue", {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "kitchen_exchange",
        "x-dead-letter-routing-key": "kitchen.retry.verificationOrderStatus",
        "x-message-ttl": 10000, // 10 segundos
      },
    });
    await this.channel.bindQueue(
      "kitchen_retry_queue",
      "kitchen_retry_exchange",
      "kitchen.retry.verificationOrderStatus"
    );
  }

  // Método para consumir los mensajes de una cola
  private async consumeMessages(queue: string) {
    this.channel.consume(queue, async (msg) => {
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

  // Handler para kitchen.orders.newOrder
  private async handleNewOrder(msg: Message, payload: { orderId: number }) {
    if (!payload?.orderId) {
      console.error("❌ Missing orderId in payload:", payload);
      return;
    }

    const response = await this.kitchenService.newOrder(payload);
    sendResponse(this.channel, msg, response);
  }

  // Handler para kitchen.get.recipes
  private async handleGetRecipes(msg: Message) {
    const response = await this.kitchenService.getRecipes();
    sendResponse(this.channel, msg, response);
  }

  // Handler para kitchen.get.recipeById
  private async handleGetRecipeById(msg: Message, payload: { id: number }) {
    if (!payload?.id) {
      console.error("❌ Missing recipe ID in payload:", payload);
      return;
    }

    const response = await this.kitchenService.getRecipeById(payload.id);
    sendResponse(this.channel, msg, response);
  }

  // Handler para kitchen.retry.verificationOrderStatus
  private async handleVerificationOrderStatus(
    msg: Message,
    payload: { orderId: number }
  ) {
    console.log(
      `⏱️ Retry handler triggered at ${new Date().toISOString()} for order ${
        payload.orderId
      }`
    );

    if (!payload?.orderId) {
      console.error("❌ Missing order ID in payload:", payload);
      return;
    }

    const response = await this.kitchenService.checkAndAdvanceOrderStatus(
      payload.orderId
    );

    if (response.success && response.data?.status !== "COMPLETED") {
      // Re-publicar el mensaje en la cola de reintentos
      await publishToExchange(
        "kitchen_retry_exchange",
        "kitchen.retry.verificationOrderStatus",
        { orderId: payload.orderId }
      );
    }

    sendResponse(this.channel, msg, response);
  }
}
