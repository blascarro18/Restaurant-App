import { Message } from "amqplib";

// Función global para enviar respuestas a la cola de RabbitMQ
export const sendResponse = (channel: any, msg: Message, response: any) => {
  const { replyTo, correlationId } = msg.properties;

  if (!replyTo) {
    console.warn("❌ No replyTo specified, cannot send response.");
    return;
  }

  channel.sendToQueue(replyTo, Buffer.from(JSON.stringify(response)), {
    correlationId,
  });

  console.log("📤 Sent response to:", replyTo);
};
