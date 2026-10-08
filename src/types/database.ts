/**
 * TypeScript Data Models mirroring the ColorLink Prisma schema:
 * - Rol
 * - Ciudad
 * - Usuario
 * - OtpVerificationCode
 * - EmpresaCliente
 * - Proyecto
 * - DiagnosticoIA
 * - EvidenciaFoto
 * - Producto
 * - InventarioProducto
 * - Cotizacion
 * - CotizacionItem
 * Plus ERP state extensions for real-time traceability and dispatch receipts.
 */

export type UserRole = 'Administrador' | 'Asesor Comercial' | 'Perito de Calidad' | 'Jefe de Despachos' | 'Cliente Contratista';

export interface Rol {
  rolId: number;
  rol: UserRole;
}

export interface Ciudad {
  ciudadId: number;
  ciudad: string;
}

export interface Usuario {
  usuarioId: string;
  rolId: number;
  rol: Rol;
  nombre: string;
  apellido: string;
  telefono?: string;
  email: string;
  avatarUrl?: string;
  passwordHash?: string;
  authProvider: 'credentials' | 'google' | 'microsoft' | 'otp';
  providerId?: string;
  activo?: boolean;
  company?: string;
  documentId?: string;
  address?: string;
  city?: string;
  createdAt: string;
}

export interface OtpVerificationCode {
  id: number;
  email: string;
  usuarioId?: string;
  code: string;
  expiresAt: string;
  isUsed: boolean;
  createdAt: string;
}

export interface EmpresaCliente {
  empresaId: string;
  ciudadId: number;
  ciudad?: Ciudad;
  nitCedula: string;
  razonSocial: string;
  direccionDespacho: string;
}

export type EstadoPipeline =
  | 'en_revision'
  | 'imagen_por_corregir'
  | 'en_peritaje'
  | 'cotizado'
  | 'aprobado_calidad'
  | 'rechazado'
  | 'despachado'
  | 'cancelado';

export interface DiagnosticoIA {
  diagnosticoId: string;
  proyectoId: string;
  patologiaDetectada?: string;
  severidad?: 'Baja' | 'Media' | 'Alta' | 'Crítica';
  sistemaRecomendado?: string;
  manoRecomendada?: string;
  rendimientoEstimado?: number; // m2/galón
  confianzaIaPct?: number;
  requiereVisitaHumana: boolean;
  humedadRelativa?: number; // %
  severidadFisuras?: 'Sin fisuras' | 'Fisuración capilar <0.2mm' | 'Fisura activa 0.5-1mm' | 'Grieta estructural >2mm';
  notasPerito?: string;
  aprobadoCalidad?: boolean;
  peritoNombre?: string;
  fechaVeredicto?: string;
}

export interface EvidenciaFoto {
  evidenciaId: string;
  proyectoId: string;
  urlAlmacenado?: string; // la imagen se pide aparte (GET /api/projects/:id/evidence)
  nombreArchivo: string;
  tamanoMb?: number;
  fechaRegistro: string;
}

export interface ColorDisponibilidad {
  nombre: string;
  hex: string;
  disponible: boolean;
}

export interface Producto {
  productoId: string;
  nombre: string;
  categoria?: string;
  presentacion?: string; // Cuñete 5 Gal, Galón 1 Gal, Caneca 55 Gal
  rendimientoM2?: number; // m2 por galón
  acabado?: 'Mate' | 'Satinado' | 'Semibrillante' | 'Brillante';
  precio?: number; // Precio COP por unidad
  codigoColorLink?: string;
  resistenciaUv?: boolean;
  lavabilidadCiclos?: number;
  disponible?: boolean; // Estado de disponibilidad del producto
  coloresDisponibles?: ColorDisponibilidad[]; // Colores y su disponibilidad
}

export interface InventarioProducto {
  inventarioId: string;
  productoId: string;
  producto?: Producto;
  ciudadId: number;
  ciudad?: Ciudad;
  nombreBodega: string; // ej: Bodega Central Guayabal, Bodega Industrial Itagüí, Bodega Norte Bello
  numeroLote?: string;
  cantidadDisponible: number; // en unidades (galones o cuñetes)
  fechaTinturado?: string;
  tiempoDespacho?: number; // en horas (ej: 2 horas, 4 horas, 24 horas)
}

export interface CotizacionItem {
  citemId: string;
  cotizacionId: string;
  productoId: string;
  producto?: Producto;
  cantidad: number;
  precioUnitario: number;
  total: number;
  unidadMedida?: 'cuñete_5g' | 'galon_1g' | 'tambor_55g';
}

export interface Cotizacion {
  cotizacionId: string;
  proyectoId: string;
  diagnosticoId?: string;
  galonesExactos?: number;
  cunetes5g?: number;
  galones1g?: number;
  subtotal?: number;
  descuentoAsesorPct?: number;
  iva?: number;
  total?: number;
  estado?: 'Borrador' | 'Enviada' | 'Aprobada' | 'Facturada' | 'En Alistamiento' | 'Despachada';
  createdAt: string;
  items: CotizacionItem[];
}

export interface MovimientoLogistico {
  id: string;
  proyectoId: string;
  fecha: string;
  estadoAnterior?: EstadoPipeline | null;
  estadoNuevo: EstadoPipeline;
  usuarioNombre: string;
  rolNombre: string;
  notas: string;
  bodegaOrigen?: string;
  numeroGuia?: string;
  placaVehiculo?: string;
}

export interface DespachoInfo {
  numeroGuia: string;
  transportador: string;
  placaVehiculo: string;
  conductorNombre: string;
  conductorTelefono: string;
  horaSalida?: string;
  tiempoEstimadoHoras: number;
  direccionEntrega: string;
  ciudadEntrega: string;
  bodegaOrigen?: string;
  estadoDespacho: 'En Ruta' | 'Entregado en Obra';
  recibidoPor?: string;
  documentoRecibe?: string;
  firmaDigital?: boolean;
  fechaEntrega?: string;
}

export type ModalidadEntrega = 'envio_domicilio' | 'recogida_sucursal';

export type EstadoPedido = 
  | 'comprado_confirmado' 
  | 'en_alistamiento' 
  | 'listo_sucursal' 
  | 'en_ruta_domicilio' 
  | 'entregado_recogido' 
  | 'cancelado';

export interface PedidoItem {
  itemId: string;
  productoId: string;
  nombre: string;
  presentacion: string;
  color?: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  imagenUrl?: string;
}

export interface PedidoTienda {
  pedidoId: string; // código visible, ej: CL-E66D63F1
  ordenId: string; // id real en la base de datos (para llamar a la API)
  clienteId: string;
  clienteNombre: string;
  clienteEmail: string;
  clienteTelefono: string;
  clienteDoc?: string;
  empresaNombre?: string;
  empresaNit?: string;
  modalidadEntrega: ModalidadEntrega;
  sucursalRetiro?: string; // ej: 'Sucursal Guayabal (Medellín)'
  codigoRetiro?: string; // ej: 'RET-8421'
  qrCodeData?: string;
  direccionEntrega?: string;
  ciudadEntrega?: string;
  barrioSector?: string;
  instruccionesEntrega?: string;
  metodoPago?: 'PSE / Transferencia' | 'Tarjeta Crédito / Débito' | 'Pago Contra Entrega' | 'Crédito ColorLink 30 Días';
  subtotal: number;
  iva: number;
  total: number;
  items: PedidoItem[];
  estadoPedido: EstadoPedido;
  canjeadoPor?: string;
  canjeadoEnSucursal?: string;
  fechaCanje?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  historialEstados: {
    fecha: string;
    estado: EstadoPedido;
    usuario: string;
    rol: string;
    notas: string;
  }[];
}

export interface AsesorHistorial {
  asesorId: string;
  asesorNombre: string;
  asesorEmail: string;
  fechaAsignacion: string;
  motivo?: string;
  asignadoPor: string;
}

export interface Proyecto {
  proyectoId: string;
  usuarioId: string;
  usuario?: Usuario;
  asesorAsignadoId?: string;
  asesorAsignado?: Usuario;
  peritoAsignadoId?: string;
  peritoAsignado?: Usuario;
  empresaId: string;
  empresa?: EmpresaCliente;
  nombreProyecto: string;
  area?: number; // en m2
  tipoSuperficie?: string; // Mampostería, Drywall, Concreto a la vista, Metal, Madera
  ambiente?: 'Interior' | 'Exterior' | 'Fachada' | 'Cubierta' | 'Epóxico Piso Industrial';
  acabado?: string;
  color?: string;
  colorHex?: string;
  canalOrigen?: string;
  estadoPipeline: EstadoPipeline;
  descuentoAsesorPct?: number;
  observacionesAsesor?: string;
  observacionImagen?: string | null; // motivo por el que se pidió cambiar la imagen
  createdAt: string;
  updatedAt: string;
  diagnostico?: DiagnosticoIA;
  evidencias?: EvidenciaFoto[];
  cotizaciones?: Cotizacion[];
  despacho?: DespachoInfo;
  historialMovimientos?: MovimientoLogistico[];
  historialAsesores?: AsesorHistorial[];
}
