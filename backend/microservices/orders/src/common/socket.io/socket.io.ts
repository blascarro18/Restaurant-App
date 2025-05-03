// src/common/socket.io/socket.io.ts
import { Server } from "socket.io";
import { createServer } from "http";

let io: Server;

export function initSocketServer(): Server {
  const httpServer = createServer(); // No maneja peticiones HTTP

  io = new Server(httpServer, {
    cors: { origin: "*" },
  });

  io.on("connection", (socket) => {
    console.log(
      `🔌 Cliente conectado al microservicio de órdenes: ${socket.id}`
    );
  });

  const PORT = process.env.SOCKET_PORT || 8080;
  httpServer.listen(PORT, () => {
    console.log(`📡 WebSocket de órdenes escuchando en puerto ${PORT}`);
  });

  return io;
}

export function emitOrderUpdated(order: any): void {
  if (!io) {
    console.warn("⚠️ WebSocket no inicializado");
    return;
  }

  io.emit("order:updated", order);
}
