import { connect } from "amqplib";

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
  const { connection, channel } = await connectRabbitMQ();

  await channel.assertExchange(exchange, "direct", { durable: true });
  channel.publish(exchange, routingKey, Buffer.from(JSON.stringify(message)));

  console.log(
    `📤 Sent message to exchange '${exchange}' with routingKey '${routingKey}'`
  );

  await channel.close();
  await connection.close();
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
    }, 50000); // Timeout para esperar la respuesta
  });
}
