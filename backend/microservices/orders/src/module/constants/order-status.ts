export enum OrderStatus {
  RECEIVED = "Recibida y enviada a cocina", // Cuando el gerente presiona el botón
  SELECTING_RECIPE = "Seleccionando receta", // Cocina elige receta aleatoriamente
  REQUESTING_INGREDIENTS = "Solicitando ingredientes a bodega", // Cocina pide ingredientes a bodega
  WAITING_FOR_INGREDIENTS = "Esperando ingredientes", // Si la bodega debe esperar por plaza de mercado
  PREPARING = "Preparando plato", // Ingredientes recibidos, se prepara el plato
  READY_FOR_DELIVERY = "Listo para entrega", // Plato terminado, listo para entregar
  COMPLETED = "Orden completada", // Plato entregado
}
