/**
 * Reglas de validación de los formularios del ERP. Reflejan lo que acepta el backend (server.ts)
 * y las reglas de negocio de ColorLink. Todos los mensajes van en español (Colombia).
 */

// ---------------------------------------------------------------- Texto

const LETRA = 'A-Za-zÁÉÍÓÚÜáéíóúüÑñ';
/** Solo letras con un espacio entre palabras (misma regla del registro en el backend). */
export const LETRAS_RE = new RegExp(`^[${LETRA}]+( [${LETRA}]+)*$`);

/** Quita todo lo que no sea letra o espacio, colapsa espacios y corta en `max`. */
export const limpiarLetras = (v: string, max: number) =>
  v.replace(new RegExp(`[^${LETRA} ]`, 'g'), '').replace(/ {2,}/g, ' ').replace(/^ /, '').slice(0, max);

/** Solo dígitos, máximo `max`. */
export const soloDigitos = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

/** Texto libre: colapsa espacios repetidos al validar. */
export const normalizarTexto = (v: string) => v.trim().replace(/\s+/g, ' ');

export function errorNombrePersona(v: string, etiqueta: string, min = 2, max = 40): string {
  const t = normalizarTexto(v);
  if (!t) return `${etiqueta} es obligatorio.`;
  if (!LETRAS_RE.test(t)) return `${etiqueta} solo puede tener letras y espacios.`;
  if (t.length < min || t.length > max) return `${etiqueta} debe tener entre ${min} y ${max} letras.`;
  return '';
}

export function errorTexto(
  v: string,
  etiqueta: string,
  { min = 0, max, requerido = false, femenino = /^(La|Las) /.test(etiqueta) }: { min?: number; max: number; requerido?: boolean; femenino?: boolean },
): string {
  const t = v.trim();
  if (!t) return requerido ? `${etiqueta} es ${femenino ? 'obligatoria' : 'obligatorio'}.` : '';
  if (t.length < min) return `${etiqueta} debe tener al menos ${min} caracteres.`;
  if (t.length > max) return `${etiqueta} puede tener máximo ${max} caracteres.`;
  return '';
}

// ---------------------------------------------------------------- Contacto

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const EMAIL_MAX = 100;

export function errorEmail(v: string): string {
  const t = v.trim();
  if (!t) return 'El correo electrónico es obligatorio.';
  if (t.length > EMAIL_MAX || !EMAIL_RE.test(t)) return 'Escribe un correo válido (ej. nombre@empresa.co).';
  return '';
}

/** Celular colombiano: 10 dígitos que empiezan por 3. */
export const CELULAR_RE = /^3\d{9}$/;

export function errorCelular(v: string, etiqueta = 'El celular', requerido = false): string {
  if (!v) return requerido ? `${etiqueta} es obligatorio.` : '';
  if (!CELULAR_RE.test(v)) return `${etiqueta} debe tener 10 números y empezar por 3 (ej. 3001234567).`;
  return '';
}

// ---------------------------------------------------------------- Números

/**
 * Deja solo dígitos y un separador decimal (coma o punto) con hasta `decimales` cifras.
 * Así nunca llega "NaN", "1e5" ni "-3" al servidor.
 */
export function limpiarDecimal(v: string, decimales: number, maxEnteros = 7): string {
  let s = v.replace(',', '.').replace(/[^\d.]/g, '');
  const i = s.indexOf('.');
  if (i >= 0) s = s.slice(0, i + 1) + s.slice(i + 1).replace(/\./g, '');
  const [ent, dec] = s.split('.');
  const entero = (ent || '').slice(0, maxEnteros);
  if (decimales === 0 || dec === undefined) return entero;
  return `${entero}.${dec.slice(0, decimales)}`;
}

/** Convierte el texto ya limpio en número; '' o '.' devuelven null. */
export function aNumero(v: string): number | null {
  const t = v.trim().replace(',', '.');
  if (!t || t === '.') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export function errorRango(
  v: string,
  etiqueta: string,
  { min, max, entero = false, requerido = true, unidad = '', femenino = /^(La|Las) /.test(etiqueta) }: { min: number; max: number; entero?: boolean; requerido?: boolean; unidad?: string; femenino?: boolean },
): string {
  const n = aNumero(v);
  if (n == null) return requerido ? `${etiqueta} es ${femenino ? 'obligatoria' : 'obligatorio'}.` : '';
  if (entero && !Number.isInteger(n)) return `${etiqueta} debe ser un número entero.`;
  const u = unidad ? ` ${unidad}` : '';
  if (n < min || n > max) return `${etiqueta} debe estar entre ${min.toLocaleString('es-CO')} y ${max.toLocaleString('es-CO')}${u}.`;
  return '';
}

// ---------------------------------------------------------------- Proyectos (cotización)

export const AREA_MAX_M2 = 100_000;
export const MANOS_MIN = 1;
export const MANOS_MAX = 5;
/** Descuento máximo que puede dar un asesor (el backend hoy acepta hasta 100; ver informe). */
export const DESCUENTO_MAX_PCT = 15;

// ---------------------------------------------------------------- Despachos

/** Placa colombiana: carro ABC123 o moto ABC12D. */
export const PLACA_RE = /^[A-Z]{3}(\d{3}|\d{2}[A-Z])$/;
export const limpiarPlaca = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);

/** Guía de transporte: letras, números y guiones (4 a 30). Vacía = la genera el servidor. */
export const GUIA_RE = /^[A-Z0-9][A-Z0-9-]{2,28}[A-Z0-9]$/;
export const limpiarGuia = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30);

// ---------------------------------------------------------------- Inventario

export const CANTIDAD_MAX = 1_000_000;
/** Número de lote: letras, números y guiones (3 a 30), ej. LT-2026-00123. Vacío = automático. */
export const LOTE_RE = /^[A-Z0-9][A-Z0-9-]{1,28}[A-Z0-9]$/;
export const limpiarLote = (v: string) => v.toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 30);
export const BODEGA_MIN = 3;
export const BODEGA_MAX = 60;

// ---------------------------------------------------------------- Retiro en sucursal

/**
 * Normaliza lo que escribe o escanea el colaborador: quita espacios, acepta el número de pedido
 * (CL-XXXXXXXX), el código corto de 8 caracteres hexadecimales o el token completo del QR (UUID).
 * Devuelve el código listo para buscar, o null si no tiene un formato válido.
 */
export function normalizarCodigoRetiro(raw: string): string | null {
  const s = raw.replace(/\s+/g, '').toUpperCase();
  if (!s) return null;
  const pedido = /^CL-?([0-9A-F]{8})$/.exec(s);
  if (pedido) return pedido[1];
  if (/^[0-9A-F]{8}$/.test(s)) return s;
  if (/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/.test(s)) return s;
  return null;
}
