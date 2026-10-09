/**
 * Convierte lo que responde el backend (Prisma) a los tipos que usa la interfaz del ERP.
 * Todo el vocabulario de roles y estados vive aquí, en un solo lugar.
 */
import {
  Usuario,
  UserRole,
  Rol,
  Proyecto,
  DiagnosticoIA,
  Cotizacion,
  CotizacionItem,
  DespachoInfo,
  MovimientoLogistico,
  EstadoPipeline,
  EstadoPedido,
  PedidoTienda,
  Producto,
  InventarioProducto,
  EvidenciaFoto,
} from './types/database';

// ---------------------------------------------------------------- Roles

export const ROLE_LABEL: Record<string, UserRole> = {
  administrador: 'Administrador',
  asesor: 'Asesor Comercial',
  calidad: 'Perito de Calidad',
  despachos: 'Jefe de Despachos',
  cliente: 'Cliente Contratista',
};

export const ROLE_TO_API: Record<UserRole, string> = {
  'Administrador': 'administrador',
  'Asesor Comercial': 'asesor',
  'Perito de Calidad': 'calidad',
  'Jefe de Despachos': 'despachos',
  'Cliente Contratista': 'cliente',
};

const ROLE_ID: Record<string, number> = { administrador: 1, asesor: 2, calidad: 3, despachos: 4, cliente: 5 };

/** Roles que pueden entrar al ERP (el cliente usa la tienda, no el ERP). */
export const STAFF_ROLES_API = ['administrador', 'asesor', 'calidad', 'despachos'];

export const STAFF_ROLE_LABELS: UserRole[] = ['Administrador', 'Asesor Comercial', 'Perito de Calidad', 'Jefe de Despachos'];

export function rolFromApi(role: string | undefined): Rol {
  const key = role || 'cliente';
  return { rolId: ROLE_ID[key] ?? 5, rol: ROLE_LABEL[key] ?? 'Cliente Contratista' };
}

// ---------------------------------------------------------------- Usuarios

/** Usuario devuelto por /api/auth/profile (safeUser del backend). */
export function mapSessionUser(raw: any): Usuario {
  return {
    usuarioId: raw.id,
    rolId: rolFromApi(raw.role).rolId,
    rol: rolFromApi(raw.role),
    nombre: raw.firstName || String(raw.name || '').split(' ')[0] || '',
    apellido: raw.lastName || '',
    telefono: raw.phone || undefined,
    email: raw.email,
    avatarUrl: raw.avatar || undefined,
    authProvider: 'credentials',
    company: raw.company || undefined,
    documentId: raw.documentId || undefined,
    address: raw.address || undefined,
    city: raw.city || undefined,
    createdAt: '',
  };
}

/** Empleado o usuario devuelto por /api/admin/employees, /api/users o embebido en proyectos. */
export function mapUsuario(raw: any): Usuario {
  const roleKey = raw.rol?.rol ?? raw.role;
  return {
    usuarioId: raw.usuarioId,
    rolId: rolFromApi(roleKey).rolId,
    rol: rolFromApi(roleKey),
    nombre: raw.nombre || '',
    apellido: raw.apellido || '',
    telefono: raw.telefono || undefined,
    email: raw.email || '',
    avatarUrl: raw.avatarUrl || undefined,
    authProvider: 'credentials',
    activo: raw.activo,
    company: raw.company || undefined,
    documentId: raw.documentId || undefined,
    city: raw.city || undefined,
    createdAt: raw.createdAt || '',
  };
}

// ---------------------------------------------------------------- Proyectos

const ESTADOS_PROYECTO: EstadoPipeline[] = [
  'en_revision', 'imagen_por_corregir', 'en_peritaje', 'cotizado',
  'aprobado_calidad', 'rechazado', 'despachado', 'cancelado',
];

export function normalizeEstadoProyecto(e: string | null | undefined): EstadoPipeline {
  return ESTADOS_PROYECTO.includes(e as EstadoPipeline) ? (e as EstadoPipeline) : 'en_revision';
}

const ACABADOS: Record<string, Producto['acabado']> = {
  mate: 'Mate', satinado: 'Satinado', semibrillante: 'Semibrillante', brillante: 'Brillante',
};

const PRESENTACION_LABEL: Record<string, string> = {
  cunete_5gal: 'Cuñete 5 Gal',
  galon_1gal: 'Galón 1 Gal',
};

export function mapProducto(raw: any): Producto {
  return {
    productoId: raw.productoId,
    nombre: raw.nombre,
    categoria: raw.categoria || undefined,
    presentacion: PRESENTACION_LABEL[raw.presentacion] || raw.presentacion || undefined,
    rendimientoM2: raw.rendimientoM2 ?? undefined,
    acabado: raw.acabado ? ACABADOS[String(raw.acabado).toLowerCase()] : undefined,
    precio: raw.precio ?? undefined,
  };
}

function mapDiagnostico(raw: any): DiagnosticoIA {
  // sistemaRecomendado se guarda como JSON (lista de pasos) cuando lo genera la IA del cliente
  let sistema: string | undefined = raw.sistemaRecomendado || undefined;
  if (sistema) {
    try {
      const parsed = JSON.parse(sistema);
      if (Array.isArray(parsed)) {
        sistema = parsed
          .map((p: any) => (typeof p === 'string' ? p : p?.producto || p?.nombre || p?.paso || JSON.stringify(p)))
          .join(' + ');
      } else if (typeof parsed === 'string') {
        sistema = parsed;
      }
    } catch {
      /* ya era texto plano */
    }
  }
  return {
    diagnosticoId: raw.diagnosticoId,
    proyectoId: raw.proyectoId,
    patologiaDetectada: raw.patologiaDetectada || undefined,
    severidad: raw.severidad || undefined,
    sistemaRecomendado: sistema,
    manoRecomendada: raw.manoRecomendada || undefined,
    rendimientoEstimado: raw.rendimientoEstimado ?? undefined,
    confianzaIaPct: raw.confianzaIaPct ?? undefined,
    requiereVisitaHumana: !!raw.requiereVisitaHumana,
    humedadRelativa: raw.humedadRelativa ?? undefined,
    severidadFisuras: raw.severidadFisuras || undefined,
    notasPerito: raw.notasPerito || undefined,
    aprobadoCalidad: raw.aprobadoCalidad ?? undefined,
    peritoNombre: raw.peritoNombre || undefined,
    fechaVeredicto: raw.fechaVeredicto || undefined,
  };
}

function mapCotizacion(raw: any): Cotizacion {
  const items: CotizacionItem[] = (raw.items || []).map((it: any) => ({
    citemId: it.citemId,
    cotizacionId: it.cotizacionId,
    productoId: it.productoId,
    producto: it.producto ? mapProducto(it.producto) : undefined,
    cantidad: it.cantidad ?? 0,
    precioUnitario: it.precioUnitario ?? 0,
    total: it.total ?? 0,
    unidadMedida: it.producto?.presentacion === 'cunete_5gal' ? 'cuñete_5g' : 'galon_1g',
  }));
  return {
    cotizacionId: raw.cotizacionId,
    proyectoId: raw.proyectoId,
    diagnosticoId: raw.diagnosticoId || undefined,
    galonesExactos: raw.galonesExactos ?? undefined,
    cunetes5g: raw.cunetes5g ?? undefined,
    galones1g: raw.galones1g ?? undefined,
    subtotal: raw.subtotal ?? undefined,
    iva: raw.iva ?? undefined,
    total: raw.total ?? undefined,
    estado: raw.estado || undefined,
    createdAt: raw.createdAt,
    items,
  };
}

function mapDespacho(raw: any): DespachoInfo {
  return {
    numeroGuia: raw.numeroGuia,
    transportador: raw.transportador || '',
    placaVehiculo: raw.placaVehiculo || '',
    conductorNombre: raw.conductorNombre || '',
    conductorTelefono: raw.conductorTelefono || '',
    bodegaOrigen: raw.bodegaOrigen || undefined,
    horaSalida: raw.horaSalida || undefined,
    tiempoEstimadoHoras: raw.tiempoEstimadoHoras ?? 0,
    direccionEntrega: raw.direccionEntrega || '',
    ciudadEntrega: raw.ciudadEntrega || '',
    estadoDespacho: raw.fechaEntrega ? 'Entregado en Obra' : 'En Ruta',
    recibidoPor: raw.recibidoPor || undefined,
    documentoRecibe: raw.documentoRecibe || undefined,
    fechaEntrega: raw.fechaEntrega || undefined,
  };
}

function mapMovimiento(raw: any): MovimientoLogistico {
  return {
    id: raw.id,
    proyectoId: raw.proyectoId,
    fecha: raw.fecha,
    estadoAnterior: raw.estadoAnterior ? normalizeEstadoProyecto(raw.estadoAnterior) : null,
    estadoNuevo: normalizeEstadoProyecto(raw.estadoNuevo),
    usuarioNombre: raw.usuarioNombre || 'Sistema ColorLink',
    rolNombre: raw.rolNombre ? ROLE_LABEL[raw.rolNombre] ?? raw.rolNombre : 'Sistema',
    notas: raw.comentario || '',
  };
}

export function mapProyecto(raw: any): Proyecto {
  const evidencias: EvidenciaFoto[] = (raw.evidencias || []).map((e: any) => ({
    evidenciaId: e.evidenciaId,
    proyectoId: raw.proyectoId,
    nombreArchivo: e.nombreArchivo,
    fechaRegistro: e.fechaRegistro,
  }));

  return {
    proyectoId: raw.proyectoId,
    usuarioId: raw.usuarioId,
    usuario: raw.usuario
      ? mapUsuario({ ...raw.usuario, usuarioId: raw.usuario.usuarioId || raw.usuarioId, rol: { rol: 'cliente' } })
      : undefined,
    asesorAsignadoId: raw.asesorAsignadoId || undefined,
    asesorAsignado: raw.asesorAsignado ? mapUsuario({ ...raw.asesorAsignado, rol: { rol: 'asesor' } }) : undefined,
    peritoAsignadoId: raw.peritoAsignadoId || undefined,
    peritoAsignado: raw.peritoAsignado ? mapUsuario({ ...raw.peritoAsignado, rol: { rol: 'calidad' } }) : undefined,
    empresaId: raw.empresaId,
    empresa: raw.empresa
      ? {
          empresaId: raw.empresa.empresaId,
          ciudadId: raw.empresa.ciudadId,
          ciudad: raw.empresa.ciudad ? { ciudadId: raw.empresa.ciudad.ciudadId, ciudad: raw.empresa.ciudad.ciudad } : undefined,
          nitCedula: raw.empresa.nitCedula,
          razonSocial: raw.empresa.razonSocial,
          direccionDespacho: raw.empresa.direccionDespacho,
        }
      : undefined,
    nombreProyecto: raw.nombreProyecto,
    area: raw.area ?? undefined,
    tipoSuperficie: raw.tipoSuperficie || undefined,
    ambiente: raw.ambiente || undefined,
    acabado: raw.acabado || undefined,
    color: raw.color || undefined,
    colorHex: raw.colorHex || undefined,
    canalOrigen: raw.canalOrigen || undefined,
    estadoPipeline: normalizeEstadoProyecto(raw.estadoPipeline),
    descuentoAsesorPct: raw.descuentoAsesorPct ?? undefined,
    observacionesAsesor: raw.observacionesAsesor || undefined,
    observacionImagen: raw.observacionImagen ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    diagnostico: raw.diagnostico ? mapDiagnostico(raw.diagnostico) : undefined,
    evidencias,
    cotizaciones: (raw.cotizaciones || []).map(mapCotizacion),
    despacho: raw.despacho ? mapDespacho(raw.despacho) : undefined,
    historialMovimientos: (raw.historial || []).map(mapMovimiento),
    // Los escalamientos quedan en el historial como "Escalado a asesor <Nombre>. Motivo: …"
    historialAsesores: (raw.historial || [])
      .filter((h: any) => typeof h.comentario === 'string' && h.comentario.startsWith('Escalado a asesor'))
      .map((h: any) => {
        const m = /^Escalado a asesor (.+?)\.(?: Motivo: (.*))?$/s.exec(h.comentario) || [];
        return {
          asesorId: '',
          asesorNombre: m[1] || 'Asesor',
          asesorEmail: '',
          fechaAsignacion: h.fecha,
          motivo: m[2] || undefined,
          asignadoPor: h.usuarioNombre || '',
        };
      }),
  };
}

// ---------------------------------------------------------------- Pedidos

const ESTADO_PEDIDO_FROM_API: Record<string, EstadoPedido> = {
  creado: 'comprado_confirmado',
  confirmado: 'comprado_confirmado',
  en_alistamiento: 'en_alistamiento',
  listo_recoger: 'listo_sucursal',
  en_camino: 'en_ruta_domicilio',
  entregado: 'entregado_recogido',
  cancelado: 'cancelado',
};

const ESTADO_PEDIDO_TO_API: Record<EstadoPedido, string> = {
  comprado_confirmado: 'confirmado',
  en_alistamiento: 'en_alistamiento',
  listo_sucursal: 'listo_recoger',
  en_ruta_domicilio: 'en_camino',
  entregado_recogido: 'entregado',
  cancelado: 'cancelado',
};

export const estadoPedidoFromApi = (e: string): EstadoPedido => ESTADO_PEDIDO_FROM_API[e] ?? 'comprado_confirmado';
export const estadoPedidoToApi = (e: EstadoPedido): string => ESTADO_PEDIDO_TO_API[e];

/** Código visible del pedido: el mismo que ve el cliente en su cuenta. */
export const codigoPedido = (ordenId: string) => `CL-${ordenId.slice(0, 8).toUpperCase()}`;

export function mapPedido(raw: any): PedidoTienda {
  const pickup = raw.metodoEntrega === 'recoger_tienda';
  const u = raw.usuario || {};
  const historial = (raw.historial || []).map((h: any) => ({
    fecha: h.fecha,
    estado: estadoPedidoFromApi(h.estado),
    usuario: h.actor?.nombre || 'Sistema ColorLink',
    rol: h.actor ? ROLE_LABEL[h.actor.rol] ?? h.actor.rol : 'Sistema',
    notas: h.comentario || '',
  }));
  // La interfaz muestra primero lo más reciente
  historial.reverse();

  const entrega = (raw.historial || []).filter((h: any) => h.estado === 'entregado').pop();

  return {
    pedidoId: codigoPedido(raw.ordenId),
    ordenId: raw.ordenId,
    clienteId: raw.usuarioId,
    clienteNombre: `${u.nombre || ''} ${u.apellido || ''}`.trim() || 'Cliente',
    clienteEmail: u.email || '',
    clienteTelefono: u.telefono || '',
    clienteDoc: u.documentId || undefined,
    empresaNombre: u.company || undefined,
    modalidadEntrega: pickup ? 'recogida_sucursal' : 'envio_domicilio',
    sucursalRetiro: pickup ? raw.direccionEntrega || undefined : undefined,
    codigoRetiro: pickup ? String(raw.qrToken || '').slice(0, 8).toUpperCase() : undefined,
    qrCodeData: pickup ? raw.qrToken : undefined,
    direccionEntrega: pickup ? undefined : raw.direccionEntrega || undefined,
    subtotal: raw.total,
    iva: 0,
    total: raw.total,
    items: (raw.items || []).map((it: any) => ({
      itemId: it.ordenItemId,
      productoId: it.productoId || it.codigoProductoExterno || '',
      nombre: it.nombreProducto,
      presentacion: it.producto?.presentacion ? PRESENTACION_LABEL[it.producto.presentacion] || it.producto.presentacion : '',
      cantidad: it.cantidad,
      precioUnitario: it.precioUnitario,
      total: it.subtotal,
    })),
    estadoPedido: estadoPedidoFromApi(raw.estado),
    canjeadoPor: pickup && entrega?.actor?.nombre ? entrega.actor.nombre : undefined,
    fechaCanje: pickup && entrega ? entrega.fecha : undefined,
    fechaCreacion: raw.createdAt,
    fechaActualizacion: raw.updatedAt,
    historialEstados: historial,
  };
}

// ---------------------------------------------------------------- Inventario

export function mapInventario(raw: any): InventarioProducto {
  return {
    inventarioId: raw.inventarioId,
    productoId: raw.productoId,
    producto: raw.producto ? mapProducto(raw.producto) : undefined,
    ciudadId: raw.ciudadId,
    ciudad: raw.ciudad ? { ciudadId: raw.ciudad.ciudadId, ciudad: raw.ciudad.ciudad } : undefined,
    nombreBodega: raw.nombreBodega || 'Sin bodega asignada',
    numeroLote: raw.numeroLote || undefined,
    cantidadDisponible: raw.cantidadDisponible ?? 0,
    fechaTinturado: raw.fechaTinturado || undefined,
    tiempoDespacho: raw.tiempoDespacho ?? undefined,
  };
}
