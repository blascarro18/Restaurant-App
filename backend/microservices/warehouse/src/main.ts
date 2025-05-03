import "reflect-metadata";
import dotenv from "dotenv";
import { connect } from "amqplib";
import { WarehouseController } from "./module/warehouse.controller";

dotenv.config();

// Función para iniciar el microservicio de boddega
async function startAuthMicroservice() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost";
  const connection = await connect(rabbitmqUrl);
  const channel = await connection.createChannel();

  // Asegúrate de que el intercambio exista
  await channel.assertExchange("warehouse_exchange", "direct", {
    durable: true,
  });

  // Instanciar el controlador y pasarle el canal
  const warehouseController = new WarehouseController(channel);

  // Iniciar el controlador para escuchar los mensajes de los tópicos
  await warehouseController.startListening();

  console.log("✅ Warehouse microservice listening for requests...");

  // Manejador de errores
  connection.on("error", (error) => {
    console.error("❌ RabbitMQ connection error:", error);
  });
}

// Iniciar el servicio de bodega
startAuthMicroservice().catch((err) => {
  console.error("❌ Error starting warehouse microservice:", err);
});
