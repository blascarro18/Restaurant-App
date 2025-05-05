# Restaurant-App

## 🍽 Jornada de almuerzo ¡Gratis!

Un reconocido restaurante ha decidido tener una jornada de donación de comida a los residentes de la región con la única condición de que el plato que obtendrán los comensales será aleatorio. El administrador del restaurante requiere con urgencia un sistema que permita pedir platos a la cocina.

## 🧱 Tecnologías utilizadas

- **Backend**: Node.js puro con arquitectura de microservicios
- **Frontend**: Angular
- **Mensajería entre servicios**: RabbitMQ
- **Base de datos**: PostgreSQL (con Prisma ORM)
- **Contenedores**: Docker + Docker Compose
- **CI/CD**: GitHub Actions

---

## 🚀 Cómo ejecutar el proyecto

### ✅ Requisitos previos

- Docker y Docker Compose instalados
- Node.js y npm (solo si deseas correr servicios localmente sin Docker)
- Acceso al repositorio (privado)

---

### 🔧 Pasos para correr la app con Docker

1. Clona el repositorio:

```bash
git clone https://github.com/blascarro18/Restaurant-App.git
```

2. Copia y ajusta las variables de entorno:

```bash
cp .env.example .env
# Ajusta las variables necesarias en `.env`
# Nota: Cada microservicio tiene sus propias variables, se deben configurar de igual forma.
```

3. Levanta todos los servicios:

```bash
docker-compose up --build
```

Esto iniciará:

- Api Gateway
- Microservicios de autenticación, cocina, ordenes, bodega y otros.
- RabbitMQ
- Base de datos PostgreSQL (Ejecutará migraciones y seeders)
- Frontend en Angular

4. Visita la app en tu navegador:

```
http://localhost:4200
```

---

### 📁 Estructura del proyecto

```
/frontend               → Aplicación Angular
/backend                → Api gateway + microservicios
    /api-gateway        → Puerta de enlace a los microservicios
    /microservices
        /auth           → Microservicio de autenticación
        /kitchen        → Microservicio de cocina
        /orders         → Microservicio de ordenes
        /warehouse      → Microservicio de bodega
.env                    → Variables de entorno
docker-compose.yml      → Orquestador de contenedores

```

---

## 🧪 Funcionalidades

- Autenticación básica.
- Botón para pedir platos aleatorios (Generar una orden)
- Visualización del estado de órdenes (en preparación, finalizadas, etc...)
- Visualización de pedidos realizados a cocina.
- Visualización de las 6 recetas disponibles.
- Visualización del inventario de la bodega.
- Historial de compras a la plaza de mercado.

---

## 📤 Despliegue

El proyecto está desplegado en:  
🔗 [https://dk6cf4juaq2rh.cloudfront.net](https://dk6cf4juaq2rh.cloudfront.net/)

---

## 👤 Autor

- Nombre: Breyner Lascarro A.
- Correo: blascarro18@gmail.com
