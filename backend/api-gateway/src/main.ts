import http from "http";
import cors from "cors";
import dotenv from "dotenv";

// Cargar las variables de entorno desde el archivo .env
dotenv.config();

// Importar las rutas del API Gateway
import { handleRoutes } from "./routes";

// Se crea un servidor HTTP y se configura CORS
const server = http.createServer((req, res) => {
  // Habilitar CORS con la librería
  cors()(req, res, () => {
    handleRoutes(req, res); // Manejo de rutas
  });
});

// Puerto donde escuchará el API Gateway
const PORT = process.env.PORT || 5000;

// Iniciar el servidor en el puerto especificado
server.listen(PORT, () => {
  console.log(`🚀 API Gateway running on http://localhost:${PORT}`);
});
