import { Channel, Message } from "amqplib";
import { OrdersService } from "./orders.service";
import { validateDto } from "../common/middlewares/validate-dto";
import { sendResponse } from "../common/message-broken/responses";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { PaginationDto } from "../common/dtos/pagination.dto";

export class OrdersController {
  private channel: Channel;
  private ordersService: OrdersService;
  private handlers: {
    [key: string]: (msg: Message, payload: any) => Promise<void>;
  };

  constructor(channel: Channel) {
    this.channel = channel;
    this.ordersService = new OrdersService();
    this.handlers = this.initializeHandlers();
  }

  // Método para inicializar los handlers
  private initializeHandlers() {
    return {
      "orders.create.newOrder": this.handleCreateNewOrder.bind(this),
      "orders.update.order": this.handleUpdateOrder.bind(this),
      "orders.get.orders": this.handleGetOrders.bind(this),
      "orders.get.orderById": this.handleGetOrderById.bind(this),
    };
  }

  // Método para iniciar la escucha de los tópicos
  async startListening() {
    await this.setupQueuesAndBindings();
    this.consumeMessages("orders_queue");
  }

  // Configuración de colas y enlaces
  private async setupQueuesAndBindings() {
    await this.channel.assertQueue("orders_queue", { durable: true });
    await this.bindQueueToExchange("orders_queue", "orders_exchange", [
      "orders.create.newOrder",
      "orders.update.order",
      "orders.get.orders",
      "orders.get.orderById",
    ]);
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

  // Handler para orders.create.newOrder
  private async handleCreateNewOrder(msg: Message) {
    const response = await this.ordersService.createNewOrder();
    sendResponse(this.channel, msg, response);
  }

  // Handler para orders.update.order
  private async handleUpdateOrder(msg: Message, payload: UpdateOrderDto) {
    const { data, errors } = await validateDto(payload, UpdateOrderDto);

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

    const response = await this.ordersService.updateOrder(data);
    sendResponse(this.channel, msg, response);
  }

  // Handler para orders.get.orders
  private async handleGetOrders(msg: Message, payload: PaginationDto) {
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

    const response = await this.ordersService.getOrders(data);
    sendResponse(this.channel, msg, response);
  }

  // Handler para orders.get.orderById
  private async handleGetOrderById(msg: Message, payload: { id: number }) {
    if (!payload.id) {
      console.error("❌ Validation failed: id is required.");
      sendResponse(this.channel, msg, {
        success: false,
        errors: ["Invalid id"],
      });
      return;
    }

    const response = await this.ordersService.getOrderById(payload.id);
    sendResponse(this.channel, msg, response);
  }
}
