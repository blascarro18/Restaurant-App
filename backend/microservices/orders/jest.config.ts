import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest", // Usa el preset ts-jest para trabajar con TypeScript
  testEnvironment: "jest-environment-node", // Usa el entorno de prueba adecuado para Node.js

  // Configura el transformador para archivos .ts y .tsx
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },

  // Opciones para limpiar mocks automáticamente antes de cada prueba
  clearMocks: true,

  // Habilitar la recolección de cobertura de pruebas
  collectCoverage: true,
  coverageDirectory: "coverage", // Carpeta donde se almacenarán los archivos de cobertura

  // Especifica el proveedor para instrumentación de código para cobertura
  coverageProvider: "v8",

  // Activar la opción de "verbose" para obtener más detalles sobre cada prueba
  verbose: true,

  // Para asegurarse de que las rutas de los archivos de prueba sean correctas
  testMatch: ["**/?(*.)+(spec|test).[tj]s?(x)"],

  // Añadir las rutas de los módulos a transformar
  moduleDirectories: ["node_modules", "src"],

  // Asegura que Jest busque archivos de prueba en las rutas correctas
  roots: ["<rootDir>/tests"],

  // Para trabajar con importaciones de módulos
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },

  // Activa el reporte de cobertura en formato lcov, json y texto
  coverageReporters: ["json", "lcov", "text"],

  // Añadir configuraciones para los "watch" en Jest
  watchman: true,
};

export default config;
