import dotenv from "dotenv";
import { connect } from "amqplib";
import { AuthController } from "./module/auth.controller";

dotenv.config();

// Función para iniciar el microservicio de autenticación
async function startAuthMicroservice() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost";
  const connection = await connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  // Asegúrate de que el intercambio exista
  await channel.assertExchange("auth_exchange", "direct", { durable: true });

  // Instanciar el controlador y pasarle el canal
  const authController = new AuthController(channel);

  // Iniciar el controlador para escuchar los mensajes de los tópicos
  await authController.startListening();

  console.log("✅ Auth microservice listening for requests...");

  // Manejador de errores
  connection.on("error", (error) => {
    console.error("❌ RabbitMQ connection error:", error);
  });
}

// Iniciar el servicio de autenticación
startAuthMicroservice().catch((err) => {
  console.error("❌ Error starting auth microservice:", err);
});
