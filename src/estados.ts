import { EstadoPipeline, EstadoPedido } from './types/database';

/** Estados de un proyecto: nombres que ve el equipo (los mismos que usa el backend y le avisa al cliente). */
export const ESTADO_PROYECTO_LABEL: Record<EstadoPipeline, string> = {
  en_revision: 'En revisión',
  imagen_por_corregir: 'Imagen por corregir',
  en_peritaje: 'En peritaje técnico',
  cotizado: 'Cotizado',
  aprobado_calidad: 'Aprobado por calidad',
  rechazado: 'Rechazado por calidad',
  despachado: 'Despachado',
  cancelado: 'Cancelado',
};

/** Qué ve el cliente en su cuenta para cada estado. */
export const ESTADO_PROYECTO_CLIENTE: Record<EstadoPipeline, string> = {
  en_revision: 'En revisión por nuestro equipo',
  imagen_por_corregir: 'Necesitamos que cambies la imagen',
  en_peritaje: 'En peritaje técnico',
  cotizado: 'Cotización lista',
  aprobado_calidad: 'Aprobado, en preparación de despacho',
  rechazado: 'Requiere ajustes técnicos',
  despachado: 'Material despachado',
  cancelado: 'Cancelado',
};

/** Recorrido normal de un proyecto (los estados `rechazado`, `imagen_por_corregir` y `cancelado` son desvíos). */
export const RUTA_PROYECTO: EstadoPipeline[] = [
  'en_revision',
  'cotizado',
  'en_peritaje',
  'aprobado_calidad',
  'despachado',
];

export const ESTADO_PROYECTO_BADGE: Record<EstadoPipeline, string> = {
  en_revision: 'bg-amber-500/15 text-amber-400 border-amber-500/40',
  imagen_por_corregir: 'bg-rose-500/15 text-rose-400 border-rose-500/40',
  en_peritaje: 'bg-sky-500/15 text-sky-400 border-sky-500/40',
  cotizado: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/40',
  aprobado_calidad: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40',
  rechazado: 'bg-red-500/15 text-red-400 border-red-500/40',
  despachado: 'bg-teal-500/15 text-teal-300 border-teal-500/40',
  cancelado: 'bg-slate-500/15 text-slate-400 border-slate-500/40',
};

export const ESTADOS_PROYECTO_CERRADOS: EstadoPipeline[] = ['despachado', 'cancelado'];

/** Estados de un pedido de la tienda. */
export const ESTADO_PEDIDO_LABEL: Record<EstadoPedido, string> = {
  comprado_confirmado: 'Pago confirmado',
  en_alistamiento: 'En alistamiento',
  listo_sucursal: 'Listo para recoger',
  en_ruta_domicilio: 'En camino',
  entregado_recogido: 'Entregado',
  cancelado: 'Cancelado',
};
