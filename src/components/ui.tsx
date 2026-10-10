import React, { useEffect, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * Cierra un modal con la tecla Escape. `bloqueado` evita cerrarlo mientras se guarda.
 * Solo el modal abierto más reciente reacciona (los listeners se apilan y el último gana).
 */
const pilaEscape: Array<() => void> = [];
export function useEscapeToClose(abierto: boolean, onClose: () => void, bloqueado = false) {
  const ref = useRef(onClose);
  ref.current = onClose;
  const bloqRef = useRef(bloqueado);
  bloqRef.current = bloqueado;
  useEffect(() => {
    if (!abierto) return;
    const handler = () => { if (!bloqRef.current) ref.current(); };
    pilaEscape.push(handler);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && pilaEscape[pilaEscape.length - 1] === handler) {
        e.stopPropagation();
        handler();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      const i = pilaEscape.indexOf(handler);
      if (i >= 0) pilaEscape.splice(i, 1);
    };
  }, [abierto]);
}

/**
 * Fondo oscuro de un modal: cierra con clic en el fondo (no en el contenido) y con Escape.
 */
export const ModalBackdrop: React.FC<{
  onClose: () => void;
  bloqueado?: boolean;
  className?: string;
  label?: string;
  children: React.ReactNode;
}> = ({ onClose, bloqueado = false, className = '', label, children }) => {
  useEscapeToClose(true, onClose, bloqueado);
  const downEnFondo = useRef(false);
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-modal-backdrop
      className={`fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto ${className}`}
      onMouseDown={(e) => { downEnFondo.current = e.target === e.currentTarget; }}
      onMouseUp={(e) => {
        // Solo si el clic empezó y terminó en el fondo (no al soltar tras seleccionar texto dentro)
        if (downEnFondo.current && e.target === e.currentTarget && !bloqueado) onClose();
        downEnFondo.current = false;
      }}
    >
      {children}
    </div>
  );
};

/** Error de un campo, junto al campo. */
export const FieldError: React.FC<{ msg?: string | null; id?: string }> = ({ msg, id }) =>
  msg ? (
    <p id={id} role="alert" data-field-error className="text-[11px] text-rose-500 mt-1 flex items-start gap-1 font-medium">
      <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
      <span>{msg}</span>
    </p>
  ) : null;

/** Clase de borde para un campo según tenga error. */
export const bordeCampo = (error: string | undefined | null, isLight: boolean) =>
  error
    ? 'border-rose-500 focus:border-rose-500'
    : isLight ? 'border-slate-300 focus:border-emerald-500' : 'border-slate-700 focus:border-emerald-500';

/**
 * Descarga un CSV (separado por punto y coma, con BOM para que Excel en español lo abra bien).
 */
export function descargarCsv(nombreArchivo: string, encabezados: string[], filas: Array<Array<string | number | null | undefined>>) {
  const celda = (v: string | number | null | undefined) => {
    const s = v == null ? '' : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const contenido = [encabezados, ...filas].map(f => f.map(celda).join(';')).join('\r\n');
  const blob = new Blob(['﻿' + contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombreArchivo;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Fecha de hoy para nombres de archivo: 2026-10-09. */
export const hoyArchivo = () => {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
