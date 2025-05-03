export enum OrderStatus {
  RECEIVED = "Recibida y enviada a cocina", // Cuando el gerente presiona el botón
  REQUESTING_INGREDIENTS = "Solicitando ingredientes a bodega", // Cocina pide ingredientes a bodega
  WAITING_FOR_INGREDIENTS = "Esperando ingredientes de bodega", // Si la bodega debe esperar por plaza de mercado
  DELIVERED_INGREDIENTS = "Ingredientes entregados a cocina", // Ingredientes entregados a cocina
  PREPARING = "Preparando plato", // Ingredientes recibidos, se prepara el plato
  COMPLETED = "Orden Entregada", // Plato entregado
}
