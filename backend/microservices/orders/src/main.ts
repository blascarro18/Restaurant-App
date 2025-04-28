import dotenv from "dotenv";
import { connect } from "amqplib";
import { OrdersController } from "./module/orders.controller";

dotenv.config();

// Función para iniciar el microservicio de ordenes
async function startAuthMicroservice() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost";
  const connection = await connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  // Asegúrate de que el intercambio exista
  await channel.assertExchange("orders_exchange", "direct", { durable: true });

  // Instanciar el controlador y pasarle el canal
  const ordersController = new OrdersController(channel);

  // Iniciar el controlador para escuchar los mensajes de los tópicos
  await ordersController.startListening();

  console.log("✅ Orders microservice listening for requests...");

  // Manejador de errores
  connection.on("error", (error) => {
    console.error("❌ RabbitMQ connection error:", error);
  });
}

// Iniciar el servicio de ordenes
startAuthMicroservice().catch((err) => {
  console.error("❌ Error starting Orders microservice:", err);
});
