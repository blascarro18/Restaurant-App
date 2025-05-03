import dotenv from "dotenv";
import { connect } from "amqplib";
import { KitchenController } from "./module/kitchen.controller";

dotenv.config();

// Función para iniciar el microservicio de cocina
async function startAuthMicroservice() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost";
  const connection = await connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  // Asegúrate de que el intercambio exista
  await channel.assertExchange("kitchen_exchange", "direct", { durable: true });

  // Instanciar el controlador y pasarle el canal
  const kitchenController = new KitchenController(channel);

  // Iniciar el controlador para escuchar los mensajes de los tópicos
  await kitchenController.startListening();

  console.log("✅ Kitchen microservice listening for requests...");

  // Manejador de errores
  connection.on("error", (error) => {
    console.error("❌ RabbitMQ connection error:", error);
  });
}

// Iniciar el servicio de cocina
startAuthMicroservice().catch((err) => {
  console.error("❌ Error starting kitchen microservice:", err);
});
