/**
 * Textos centralizados de la interfaz (según CONTEXT.md).
 * Todos los labels de UI deben residir aquí para mantener consistencia.
 */

export const APP = {
  nombre: "Delicias",
  apellido: "Caseras",
  tagline: "Hecho con amor",
  descripcion: "Sistema de inventario y ventas para Delicias Caseras",
} as const;

export const NAV = {
  dashboard: "Dashboard",
  productos: "Productos",
  stock: "Stock",
  clientes: "Clientes",
  pedidos: "Pedidos",
  ventas: "Ventas",
  reportes: "Reportes",
} as const;

export const ESTADOS_PEDIDO = {
  pendiente: "Pendiente",
  por_cobrar: "Por cobrar",
  entregado: "Pagado",
  cancelado: "Cancelado",
} as const;

export type EstadoPedido = keyof typeof ESTADOS_PEDIDO;

export const TIPOS_MOVIMIENTO = {
  produccion: "Producción",
  venta: "Venta",
  ajuste: "Ajuste",
  merma: "Merma",
} as const;

export type TipoMovimiento = keyof typeof TIPOS_MOVIMIENTO;

export const LABELS = {
  // Acciones
  agregar: "Agregar",
  guardar: "Guardar",
  guardando: "Guardando...",
  cancelar: "Cancelar",
  editar: "Editar",
  eliminar: "Eliminar",
  registrarVenta: "Registrar venta",
  procesando: "Procesando...",
  agotado: "Agotado",
  verTodas: "Ver todas",

  // Campos
  nombre: "Nombre",
  precio: "Precio",
  costo: "Costo",
  stock: "Stock",
  stockInicial: "Stock inicial",
  margen: "Margen",
  cantidad: "Cantidad",
  total: "Total",
  fecha: "Fecha",
  fechaEntrega: "Fecha de entrega",
  cliente: "Cliente",
  telefono: "Teléfono",
  email: "Correo electrónico",
  direccion: "Dirección",
  notas: "Notas",

  // Estados vacíos / mensajes
  sinProductos: "No hay productos en el inventario",
  sinVentas: "No hay ventas registradas",
  errorGuardar: "Hubo un error al guardar.",
} as const;

export const STOCK_BAJO_UMBRAL = 10;

export const LOCALE = "es-CL";
export const MONEDA = "$";

/** Formatea un número como moneda local. */
export function formatMoneda(valor: number): string {
  return `${MONEDA}${valor.toLocaleString(LOCALE)}`;
}
