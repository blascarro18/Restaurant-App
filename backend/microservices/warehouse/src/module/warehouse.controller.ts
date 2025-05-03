import { Channel, Message } from "amqplib";
import { sendResponse } from "../common/message-broken/responses";
import { WarehouseService } from "./warehouse.service";
import { validateDto } from "../common/middlewares/validate-dto";
import { IngredientsRequestDto } from "./dto/ingredients-request.dto";
import { publishToExchange } from "../common/message-broken/rabbitmq";
import { PaginationDto } from "../common/dtos/pagination.dto";
import { MarketService } from "./market.service";

export class WarehouseController {
  private channel: Channel;
  private warehouseService: WarehouseService;
  private marketService: MarketService;

  private handlers: {
    [key: string]: (msg: Message, payload: any) => Promise<void>;
  };

  constructor(channel: Channel) {
    this.channel = channel;
    this.warehouseService = new WarehouseService();
    this.marketService = new MarketService();
    this.handlers = this.initializeHandlers();
  }

  // Método para inicializar los handlers
  private initializeHandlers() {
    return {
      "warehouse.get.ingredients": this.handleGetIngredients.bind(this),
      "warehouse.get.ingredient.byId": this.handleGetIngredientById.bind(this),
      "warehouse.ingredients.request": this.handleIngredientsRequest.bind(this),
      "warehouse.retry.ingredients": this.handleIngredientsRequest.bind(this),
      "warehouse.get.market-history": this.handleGetMarketHistory.bind(this),
    };
  }

  // Método para iniciar la escucha de los tópicos
  async startListening() {
    await this.setupQueuesAndBindings();
    this.consumeMessages("warehouse_queue");
  }

  // Configuración de colas y enlaces
  private async setupQueuesAndBindings() {
    await this.channel.assertQueue("warehouse_queue", { durable: true });
    await this.bindQueueToExchange("warehouse_queue", "warehouse_exchange", [
      "warehouse.get.ingredients",
      "warehouse.get.ingredient.byId",
      "warehouse.ingredients.request",
      "warehouse.retry.ingredients",
      "warehouse.get.market-history",
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
    await this.channel.assertExchange("warehouse_retry_exchange", "direct", {
      durable: true,
    });
    await this.channel.assertQueue("warehouse_retry_queue", {
      durable: true,
      arguments: {
        "x-dead-letter-exchange": "warehouse_exchange",
        "x-dead-letter-routing-key": "warehouse.retry.ingredients",
        "x-message-ttl": 10000, // 10 segundos
      },
    });
    await this.channel.bindQueue(
      "warehouse_retry_queue",
      "warehouse_retry_exchange",
      "warehouse.retry.ingredients"
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

  // Handler para warehouse.get.ingredients
  private async handleGetIngredients(msg: Message) {
    const response = await this.warehouseService.getIngredients();
    sendResponse(this.channel, msg, response);
  }

  // Handler para warehouse.get.ingredient.byId
  private async handleGetIngredientById(msg: Message, payload: { id: number }) {
    if (!payload) return;

    const { id } = payload;

    if (!id) {
      console.error("❌ Missing ingredient ID in payload:", payload);
      this.channel.ack(msg);
      return;
    }

    const response = await this.warehouseService.getIngredientById(id);
    sendResponse(this.channel, msg, response);
  }

  // Handler para warehouse.ingredients.request
  private async handleIngredientsRequest(
    msg: Message,
    payload: IngredientsRequestDto
  ) {
    const { data, errors } = await validateDto(payload, IngredientsRequestDto);

    if (errors.length > 0) {
      console.error("❌ Validation failed:", errors);
      sendResponse(this.channel, msg, { success: false, errors });
      return;
    }

    if (!data) {
      console.error("❌ Validation failed: data is null.");
      sendResponse(this.channel, msg, {
        success: false,
        errors: ["Invalid data"],
      });
      return;
    }

    const response = await this.warehouseService.ingredientsRequest(data);

    if (response && response.success) {
      if (!response.data) {
        // 🔁 Reinsertamos en la cola de reintentos (porque aún no está completado)
        await publishToExchange(
          "warehouse_retry_exchange",
          "warehouse.retry.ingredients",
          {
            orderId: data.orderId,
            recipeId: data.recipeId,
            ingredients: data.ingredients,
          }
        );
      }
    }

    sendResponse(this.channel, msg, response);
    return;
  }

  // Handler para warehouse.get.market-history
  private async handleGetMarketHistory(msg: Message, payload: PaginationDto) {
    const { data, errors } = await validateDto(payload, PaginationDto);

    if (errors.length > 0) {
      console.error("❌ Validation failed:", errors);
      sendResponse(this.channel, msg, { success: false, errors });
      return;
    }

    if (!data) {
      console.error("❌ Validation failed: data is null.");
      sendResponse(this.channel, msg, {
        success: false,
        errors: ["Invalid data"],
      });
      return;
    }

    const response = await this.marketService.getMarketHistory(data);
    sendResponse(this.channel, msg, response);
  }
}
