import { connect } from "amqplib";

const RETRY_EXCHANGE = "retry_exchange";
const RETRY_QUEUE = "retry_queue";
const RETRY_DELAY_MS = 5000; // Tiempo de espera entre reintentos (5 segundos)

// Conexión a RabbitMQ
async function connectRabbitMQ() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost";

  const connection = await connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  return { connection, channel };
}

// Publicar mensaje a un exchange
export async function publishToExchange(
  exchange: string,
  routingKey: string,
  message: any
) {
  const { channel } = await connectRabbitMQ();

  await channel.assertExchange(exchange, "direct", { durable: true });
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));

  console.log(
    `📤 Sent message to exchange '${exchange}' with routingKey '${routingKey}'`
  );
}

// Configuración de la cola de reintentos
export async function setupQueueWithRetry(
  queue: string,
  exchange: string,
  routingKey: string
) {
  const { channel } = await connectRabbitMQ();

  // Asegurarse de que el exchange existe
  await channel.assertExchange(exchange, "direct", { durable: true });

  // Crear la cola y vincularla al exchange con la routingKey
  await channel.assertQueue(queue, { durable: true });
  await channel.bindQueue(queue, exchange, routingKey);

  // Configurar el exchange de reintentos y la cola de reintentos
  await channel.assertExchange(RETRY_EXCHANGE, "direct", { durable: true });
  await channel.assertQueue(RETRY_QUEUE, {
    durable: true,
    arguments: {
      "x-dead-letter-exchange": exchange, // Cuando termine el delay, reintenta en el exchange original
      "x-message-ttl": RETRY_DELAY_MS, // Tiempo de vida del mensaje en la cola de reintento
    },
  });
  await channel.bindQueue(RETRY_QUEUE, RETRY_EXCHANGE, routingKey);

  console.log(`✅ Queue '${queue}' and retry setup complete.`);
}

// Consumir mensajes con reintentos
export async function consumeWithRetry(
  queue: string,
  handler: (data: any) => Promise<void>
) {
  const { channel } = await connectRabbitMQ();

  await channel.consume(queue, async (msg) => {
    if (!msg) return;

    const content = JSON.parse(msg.content.toString());

    try {
      // Intentar procesar el mensaje
      await handler(content);

      // Confirmar que el mensaje fue procesado correctamente
      channel.ack(msg);
    } catch (error) {
      console.error(
        "❌ Error processing message, sending to retry queue: ",
        (error as Error).message
      );

      // Reenviar a la cola de reintento en caso de fallo
      channel.publish(RETRY_EXCHANGE, msg.fields.routingKey, msg.content);

      // Confirmar que el mensaje ha sido procesado (enviar a la cola de reintento)
      channel.ack(msg);
    }
  });
}

// Función para publicar el mensaje y esperar la respuesta
export async function publishAndWaitForResponse(
  exchange: string,
  routingKey: string,
  message: any,
  correlationId: string
) {
  const { channel } = await connectRabbitMQ();

  // Creamos una cola temporal para recibir la respuesta
  const { queue } = await channel.assertQueue("", { exclusive: true });

  // Respondemos a la cola temporal
  await channel.assertExchange(exchange, "direct", { durable: true });
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)), {
    replyTo: queue, // La cola a la que se enviará la respuesta
    correlationId, // Asociamos un ID para correlacionar la solicitud con la respuesta
  });

  return new Promise<any>((resolve, reject) => {
    channel.consume(
      queue,
      (msg) => {
        if (msg && msg.properties.correlationId === correlationId) {
          resolve(JSON.parse(msg.content.toString()));
          channel.close(); // Cerramos la conexión
        }
      },
      { noAck: true }
    );

    setTimeout(() => {
      reject(new Error("RPC timeout"));
    }, 10000); // Timeout para esperar la respuesta
  });
}
