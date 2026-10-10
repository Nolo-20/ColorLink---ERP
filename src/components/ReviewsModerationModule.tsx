import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp, canRole } from '../context/AppContext';
import { api } from '../api';
import { ModalBackdrop, descargarCsv, hoyArchivo } from './ui';
import {
  MessageSquareText,
  Star,
  Search,
  Filter,
  Download,
  RefreshCw,
  EyeOff,
  Eye,
  Image as ImageIcon,
  ImageOff,
  X,
  AlertCircle,
  Store,
  Package,
  CalendarDays,
  Receipt,
  User,
  ShieldAlert,
} from 'lucide-react';

// ---------------------------------------------------------------- Tipos (forma de GET /api/admin/reviews)

interface ResenaAdmin {
  resenaId: string;
  productoKey: string;
  nombreProducto: string;
  calificacion: number;
  comentario: string | null;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  ordenId: string;
  tieneFoto: boolean;
  presentacion: string | null;
  color: string | null;
  cliente: string;
  clienteEmail: string;
  pedido: string;
}

interface EvaluacionAdmin {
  evaluacionId: string;
  ordenId: string;
  calificacion: number;
  comentario: string | null;
  createdAt: string;
  cliente: string;
  clienteEmail: string;
  pedido: string;
}

type Vista = 'productos' | 'vendedor';
type FiltroEstado = 'todas' | 'visibles' | 'ocultas';

const BUSQUEDA_MAX = 80;

// ---------------------------------------------------------------- Utilidades

const sinTildes = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const estrellasValidas = (n: unknown) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(5, Math.max(1, v)) : 1;
};

const fmtFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
const fecha = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : fmtFecha.format(d);
};
const tiempo = (iso: string) => {
  const t = new Date(iso).getTime();
  return Number.isNaN(t) ? 0 : t;
};

const promedio = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const fmtPromedio = (v: number | null) =>
  v == null ? '—' : v.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Evita que Excel interprete como fórmula un texto escrito por un cliente (=, +, -, @). */
const textoSeguroCsv = (s: string | null | undefined) => {
  const v = (s ?? '').replace(/\r\n?/g, '\n');
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
};

const normalizarResena = (r: any): ResenaAdmin => ({
  resenaId: String(r.resenaId),
  productoKey: String(r.productoKey ?? ''),
  nombreProducto: String(r.nombreProducto ?? 'Producto'),
  calificacion: estrellasValidas(r.calificacion),
  comentario: r.comentario ? String(r.comentario) : null,
  visible: r.visible !== false,
  createdAt: String(r.createdAt ?? ''),
  updatedAt: String(r.updatedAt ?? ''),
  ordenId: String(r.ordenId ?? ''),
  tieneFoto: !!r.tieneFoto,
  presentacion: r.presentacion ? String(r.presentacion) : null,
  color: r.color ? String(r.color) : null,
  cliente: String(r.cliente ?? ''),
  clienteEmail: String(r.clienteEmail ?? ''),
  pedido: String(r.pedido ?? ''),
});

const normalizarEvaluacion = (e: any): EvaluacionAdmin => ({
  evaluacionId: String(e.evaluacionId),
  ordenId: String(e.ordenId ?? ''),
  calificacion: estrellasValidas(e.calificacion),
  comentario: e.comentario ? String(e.comentario) : null,
  createdAt: String(e.createdAt ?? ''),
  cliente: String(e.cliente ?? ''),
  clienteEmail: String(e.clienteEmail ?? ''),
  pedido: String(e.pedido ?? ''),
});

// ---------------------------------------------------------------- Piezas

const Estrellas: React.FC<{ n: number; size?: string }> = ({ n, size = 'w-3.5 h-3.5' }) => (
  <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${n} de 5 estrellas`} title={`${n} de 5`}>
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        aria-hidden="true"
        className={`${size} ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-slate-400/50'}`}
      />
    ))}
  </span>
);

/** Miniatura de la foto (la sirve el backend con la cookie de sesión del administrador). */
const Miniatura: React.FC<{ r: ResenaAdmin; isLight: boolean; onOpen: () => void }> = ({ r, isLight, onOpen }) => {
  const [fallo, setFallo] = useState(false);
  if (fallo) {
    return (
      <div
        className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] text-center px-1 flex-shrink-0 ${
          isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-800/60 border-slate-700 text-slate-400'
        }`}
      >
        <ImageOff className="w-4 h-4" />
        Foto no disponible
      </div>
    );
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border flex-shrink-0 cursor-zoom-in focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-800 border-slate-700'
      }`}
      aria-label={`Ver foto de la opinión sobre ${r.nombreProducto}`}
      data-testid="review-thumb"
    >
      <img
        src={api.reviewPhotoUrl(r.resenaId)}
        alt={`Foto enviada por ${r.cliente || 'el cliente'}`}
        loading="lazy"
        decoding="async"
        onError={() => setFallo(true)}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
    </button>
  );
};

// ---------------------------------------------------------------- Módulo

export const ReviewsModerationModule: React.FC = () => {
  const { theme, currentUser, showToast, handleApiError } = useApp();
  const isLight = theme === 'light';
  const puedeModerar = canRole.moderarOpiniones(currentUser?.rol.rol);

  const [resenas, setResenas] = useState<ResenaAdmin[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionAdmin[]>([]);
  const [cargado, setCargado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [vista, setVista] = useState<Vista>('productos');

  // Filtros de opiniones de productos
  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<FiltroEstado>('todas');
  const [estrellas, setEstrellas] = useState<number>(0);
  const [soloConFoto, setSoloConFoto] = useState(false);

  // Filtros de evaluaciones del vendedor
  const [busquedaV, setBusquedaV] = useState('');
  const [estrellasV, setEstrellasV] = useState<number>(0);

  // Moderación
  const [ocupados, setOcupados] = useState<Set<string>>(() => new Set());
  const ocupadosRef = useRef<Set<string>>(new Set());
  const [confirmarId, setConfirmarId] = useState<string | null>(null);
  const [fotoAbierta, setFotoAbierta] = useState<ResenaAdmin | null>(null);

  const montado = useRef(true);
  const peticion = useRef(0);
  useEffect(() => {
    montado.current = true; // StrictMode monta, desmonta y vuelve a montar
    return () => { montado.current = false; };
  }, []);

  const cargar = useCallback(async () => {
    const id = ++peticion.current;
    setCargando(true);
    setErrorCarga(null);
    try {
      const r = await api.getAdminReviews();
      if (!montado.current || id !== peticion.current) return;
      setResenas(Array.isArray(r?.resenas) ? r.resenas.map(normalizarResena) : []);
      setEvaluaciones(Array.isArray(r?.evaluaciones) ? r.evaluaciones.map(normalizarEvaluacion) : []);
      setCargado(true);
    } catch (err) {
      if (!montado.current || id !== peticion.current) return;
      setErrorCarga(handleApiError(err, 'No se pudieron cargar las opiniones.'));
    } finally {
      if (montado.current && id === peticion.current) setCargando(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    if (puedeModerar) void cargar();
  }, [puedeModerar, cargar]);

  // ---------------------------------------------------------------- KPIs
  const kpis = useMemo(() => {
    const visibles = resenas.filter(r => r.visible);
    return {
      promProductos: promedio(visibles.map(r => r.calificacion)),
      visibles: visibles.length,
      total: resenas.length,
      ocultas: resenas.length - visibles.length,
      promVendedor: promedio(evaluaciones.map(e => e.calificacion)),
      totalEval: evaluaciones.length,
      conFoto: resenas.filter(r => r.tieneFoto).length,
    };
  }, [resenas, evaluaciones]);

  const distribucion = useMemo(() => {
    const c = [0, 0, 0, 0, 0, 0];
    evaluaciones.forEach(e => { c[e.calificacion] += 1; });
    return [5, 4, 3, 2, 1].map(n => ({ n, count: c[n], pct: evaluaciones.length ? (c[n] / evaluaciones.length) * 100 : 0 }));
  }, [evaluaciones]);

  // ---------------------------------------------------------------- Listas filtradas (más recientes primero)
  const resenasFiltradas = useMemo(() => {
    const t = sinTildes(busqueda.trim());
    return resenas
      .filter(r => {
        if (estado === 'visibles' && !r.visible) return false;
        if (estado === 'ocultas' && r.visible) return false;
        if (estrellas && r.calificacion !== estrellas) return false;
        if (soloConFoto && !r.tieneFoto) return false;
        if (!t) return true;
        return sinTildes(
          [r.nombreProducto, r.presentacion, r.color, r.cliente, r.clienteEmail, r.comentario, r.pedido].filter(Boolean).join(' '),
        ).includes(t);
      })
      .sort((a, b) => tiempo(b.createdAt) - tiempo(a.createdAt));
  }, [resenas, busqueda, estado, estrellas, soloConFoto]);

  const evaluacionesFiltradas = useMemo(() => {
    const t = sinTildes(busquedaV.trim());
    return evaluaciones
      .filter(e => {
        if (estrellasV && e.calificacion !== estrellasV) return false;
        if (!t) return true;
        return sinTildes([e.cliente, e.clienteEmail, e.comentario, e.pedido].filter(Boolean).join(' ')).includes(t);
      })
      .sort((a, b) => tiempo(b.createdAt) - tiempo(a.createdAt));
  }, [evaluaciones, busquedaV, estrellasV]);

  const hayFiltrosProductos = !!busqueda.trim() || estado !== 'todas' || estrellas !== 0 || soloConFoto;
  const hayFiltrosVendedor = !!busquedaV.trim() || estrellasV !== 0;
  const limpiarFiltrosProductos = () => { setBusqueda(''); setEstado('todas'); setEstrellas(0); setSoloConFoto(false); };
  const limpiarFiltrosVendedor = () => { setBusquedaV(''); setEstrellasV(0); };

  // ---------------------------------------------------------------- Ocultar / volver a publicar
  const marcarOcupado = (id: string, on: boolean) => {
    if (on) ocupadosRef.current.add(id); else ocupadosRef.current.delete(id);
    setOcupados(new Set(ocupadosRef.current));
  };

  const cambiarVisibilidad = async (r: ResenaAdmin, visible: boolean) => {
    if (ocupadosRef.current.has(r.resenaId)) return; // sin dobles clics
    setConfirmarId(null);
    marcarOcupado(r.resenaId, true);
    const anterior = r.visible;
    // Actualización optimista: si el servidor falla, se revierte
    setResenas(prev => prev.map(x => (x.resenaId === r.resenaId ? { ...x, visible } : x)));
    try {
      const res = await api.setReviewVisibility(r.resenaId, visible);
      const final = typeof res?.review?.visible === 'boolean' ? res.review.visible : visible;
      if (!montado.current) return;
      setResenas(prev => prev.map(x => (x.resenaId === r.resenaId ? { ...x, visible: final } : x)));
      showToast(final ? 'La opinión volvió a publicarse en la tienda.' : 'La opinión quedó oculta en la tienda.', 'ok');
    } catch (err) {
      if (!montado.current) return;
      setResenas(prev => prev.map(x => (x.resenaId === r.resenaId ? { ...x, visible: anterior } : x)));
      showToast(
        handleApiError(err, visible ? 'No se pudo volver a publicar la opinión.' : 'No se pudo ocultar la opinión.'),
        'error',
      );
    } finally {
      if (montado.current) marcarOcupado(r.resenaId, false);
    }
  };

  // ---------------------------------------------------------------- CSV
  const exportarProductos = () => {
    descargarCsv(
      `opiniones-productos-colorlink-${hoyArchivo()}.csv`,
      ['Fecha', 'Pedido', 'Producto', 'Presentación', 'Color', 'Cliente', 'Correo', 'Calificación', 'Comentario', 'Estado', 'Con foto'],
      resenasFiltradas.map(r => [
        fecha(r.createdAt), r.pedido, textoSeguroCsv(r.nombreProducto), textoSeguroCsv(r.presentacion), textoSeguroCsv(r.color),
        textoSeguroCsv(r.cliente), textoSeguroCsv(r.clienteEmail), r.calificacion, textoSeguroCsv(r.comentario),
        r.visible ? 'Visible' : 'Oculta', r.tieneFoto ? 'Sí' : 'No',
      ]),
    );
  };

  const exportarVendedor = () => {
    descargarCsv(
      `evaluaciones-vendedor-colorlink-${hoyArchivo()}.csv`,
      ['Fecha', 'Pedido', 'Cliente', 'Correo', 'Calificación', 'Comentario'],
      evaluacionesFiltradas.map(e => [
        fecha(e.createdAt), e.pedido, textoSeguroCsv(e.cliente), textoSeguroCsv(e.clienteEmail), e.calificacion, textoSeguroCsv(e.comentario),
      ]),
    );
  };

  // ---------------------------------------------------------------- Estilos compartidos
  const panelCls = `border rounded-3xl transition-all ${
    isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
  }`;
  const mutedCls = isLight ? 'text-slate-500' : 'text-slate-400';
  const strongCls = isLight ? 'text-slate-900' : 'text-white';
  const campoCls = `rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 border cursor-pointer ${
    isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
  }`;
  const botonSecCls = `inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
    isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
  }`;
  const itemCls = `border rounded-2xl p-4 sm:p-5 transition-all min-w-0 ${
    isLight ? 'bg-slate-50/70 border-slate-200' : 'bg-slate-900/90 border-slate-800'
  }`;
  const comentarioCls = `text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words [overflow-wrap:anywhere] ${
    isLight ? 'text-slate-700' : 'text-slate-200'
  }`;

  if (!puedeModerar) {
    return (
      <div className={`${panelCls} p-8 text-center text-sm ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
        Solo el Administrador puede moderar las opiniones de los clientes.
      </div>
    );
  }

  const estadoVacio = (titulo: string, detalle: string, accion?: React.ReactNode) => (
    <div
      className={`border border-dashed rounded-2xl p-8 text-center ${isLight ? 'border-slate-300 bg-slate-50/60' : 'border-slate-700 bg-slate-900/40'}`}
      data-testid="reviews-empty"
    >
      <MessageSquareText className={`w-8 h-8 mx-auto mb-2 ${mutedCls}`} />
      <p className={`text-sm font-bold ${strongCls}`}>{titulo}</p>
      <p className={`text-xs mt-1 ${mutedCls}`}>{detalle}</p>
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  );

  // ---------------------------------------------------------------- Render
  return (
    <div className="space-y-6 animate-fadeIn" data-testid="reviews-module">
      {/* Encabezado + KPIs */}
      <div className={`${panelCls} p-5 md:p-8`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldAlert className="w-4 h-4" />
              Moderación de la Tienda
            </div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${strongCls}`}>Opiniones de Clientes</h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Opiniones de productos y evaluaciones del vendedor que dejan los clientes al recibir su pedido.
              Las opiniones ocultas dejan de mostrarse en la página pública del producto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void cargar()}
            disabled={cargando}
            className={`${botonSecCls} self-start md:self-auto`}
            data-testid="reviews-refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
            <span>{cargando ? 'Actualizando…' : 'Actualizar'}</span>
          </button>
        </div>

        <div
          className={`grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}
          data-testid="reviews-kpis"
        >
          {[
            {
              id: 'kpi-prom-productos',
              label: 'Promedio productos',
              value: fmtPromedio(kpis.promProductos),
              star: kpis.promProductos != null,
              hint: `${kpis.visibles} visibles de ${kpis.total} ${kpis.total === 1 ? 'opinión' : 'opiniones'}`,
              cls: isLight ? 'text-amber-600' : 'text-amber-400',
            },
            {
              id: 'kpi-ocultas',
              label: 'Opiniones ocultas',
              value: String(kpis.ocultas),
              hint: 'No se muestran en la tienda',
              cls: kpis.ocultas > 0 ? (isLight ? 'text-rose-600' : 'text-rose-400') : strongCls,
            },
            {
              id: 'kpi-prom-vendedor',
              label: 'Promedio del vendedor',
              value: fmtPromedio(kpis.promVendedor),
              star: kpis.promVendedor != null,
              hint: `${kpis.totalEval} ${kpis.totalEval === 1 ? 'evaluación' : 'evaluaciones'}`,
              cls: isLight ? 'text-emerald-700' : 'text-emerald-400',
            },
            {
              id: 'kpi-con-foto',
              label: 'Opiniones con foto',
              value: String(kpis.conFoto),
              hint: 'Fotos enviadas por clientes',
              cls: isLight ? 'text-sky-700' : 'text-sky-400',
            },
          ].map(k => (
            <div
              key={k.id}
              data-testid={k.id}
              className={`p-3 rounded-2xl border min-w-0 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}
            >
              <span className={`text-[10px] uppercase font-bold block leading-tight ${mutedCls}`}>{k.label}</span>
              <span className={`text-xl font-black font-mono inline-flex items-center gap-1 ${k.cls}`}>
                {!cargado && cargando ? '…' : k.value}
                {k.star && <Star className="w-4 h-4 fill-amber-400 text-amber-400" aria-hidden="true" />}
              </span>
              <span className={`text-[10px] block leading-tight ${mutedCls}`}>{cargado ? k.hint : ' '}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pestañas */}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Tipo de opinión">
        {([
          { id: 'productos' as Vista, label: 'Opiniones de productos', corto: 'Productos', icon: Package, count: resenas.length },
          { id: 'vendedor' as Vista, label: 'Evaluaciones del vendedor', corto: 'Vendedor', icon: Store, count: evaluaciones.length },
        ]).map(t => {
          const activo = vista === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activo}
              aria-label={`${t.label} (${cargado ? t.count : 'cargando'})`}
              onClick={() => { setVista(t.id); setConfirmarId(null); }}
              className={`flex-1 sm:flex-none min-w-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                activo
                  ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40'
                  : isLight
                    ? 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                    : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border-slate-800'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate hidden sm:inline">{t.label}</span>
              <span className="truncate sm:hidden">{t.corto}</span>
              <span className={`px-1.5 rounded-full text-[10px] font-mono ${isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'}`}>
                {cargado ? t.count : '–'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contenido */}
      <div className={`${panelCls} p-4 sm:p-5 md:p-8 space-y-5`} role="tabpanel">
        {errorCarga && (
          <div role="alert" className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex flex-col sm:flex-row sm:items-center gap-3" data-testid="reviews-error">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">
                {errorCarga}
                {cargado && ' Se muestran los últimos datos cargados.'}
              </span>
            </div>
            <button type="button" onClick={() => void cargar()} disabled={cargando} className={botonSecCls}>
              <RefreshCw className={`w-3.5 h-3.5 ${cargando ? 'animate-spin' : ''}`} />
              Reintentar
            </button>
          </div>
        )}

        {!cargado && cargando && (
          <div className="space-y-3" aria-busy="true" aria-label="Cargando opiniones">
            {[0, 1, 2].map(i => (
              <div key={i} className={`h-28 rounded-2xl animate-pulse ${isLight ? 'bg-slate-100' : 'bg-slate-800/60'}`} />
            ))}
          </div>
        )}

        {cargado && vista === 'productos' && (
          <>
            {/* Filtros */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
              <div className="relative w-full lg:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  maxLength={BUSQUEDA_MAX}
                  aria-label="Buscar opiniones"
                  placeholder="Producto, cliente, comentario o pedido…"
                  value={busqueda}
                  onChange={e => setBusqueda(e.target.value.slice(0, BUSQUEDA_MAX))}
                  className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                  data-testid="reviews-search"
                />
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 flex-1">
                <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 hidden sm:block" />
                <select aria-label="Filtrar por estado" value={estado} onChange={e => setEstado(e.target.value as FiltroEstado)} className={campoCls} data-testid="reviews-filter-estado">
                  <option value="todas">Todas</option>
                  <option value="visibles">Visibles</option>
                  <option value="ocultas">Ocultas</option>
                </select>
                <select aria-label="Filtrar por estrellas" value={estrellas} onChange={e => setEstrellas(Number(e.target.value))} className={campoCls} data-testid="reviews-filter-estrellas">
                  <option value={0}>Todas las estrellas</option>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} {n === 1 ? 'estrella' : 'estrellas'}</option>)}
                </select>
                <label className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold cursor-pointer select-none ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                }`}>
                  <input type="checkbox" checked={soloConFoto} onChange={e => setSoloConFoto(e.target.checked)} className="accent-emerald-500" data-testid="reviews-filter-foto" />
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  Con foto
                </label>
                <button type="button" onClick={exportarProductos} disabled={resenasFiltradas.length === 0} title="Descargar la lista filtrada en CSV (Excel)" className={botonSecCls} data-testid="reviews-csv">
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <p className={`text-[11px] font-semibold ${mutedCls}`} aria-live="polite" data-testid="reviews-count">
              {resenasFiltradas.length === resenas.length
                ? `${resenas.length} ${resenas.length === 1 ? 'opinión' : 'opiniones'} · más recientes primero`
                : `${resenasFiltradas.length} de ${resenas.length} opiniones · más recientes primero`}
            </p>

            {resenas.length === 0 ? (
              estadoVacio("Aún no hay opiniones de productos", "Cuando un cliente califique un producto de un pedido entregado aparecerá aquí.")
            ) : resenasFiltradas.length === 0 ? (
              estadoVacio("Ninguna opinión coincide con los filtros", "Prueba con otra búsqueda o quita algunos filtros.", hayFiltrosProductos && <button type="button" onClick={limpiarFiltrosProductos} className={botonSecCls}>Limpiar filtros</button>)
            ) : (
              <ul className="space-y-3" data-testid="reviews-list">
                {resenasFiltradas.map(r => {
                  const ocupado = ocupados.has(r.resenaId);
                  const confirmando = confirmarId === r.resenaId;
                  const variante = [r.presentacion, r.color].filter(Boolean).join(' · ');
                  return (
                    <li
                      key={r.resenaId}
                      className={`${itemCls} ${!r.visible ? (isLight ? 'border-rose-200 bg-rose-50/40' : 'border-rose-900/50') : ''}`}
                      data-testid="review-item"
                      data-review-id={r.resenaId}
                    >
                      <div className="flex gap-3 sm:gap-4 min-w-0">
                        {r.tieneFoto && <Miniatura r={r} isLight={isLight} onOpen={() => setFotoAbierta(r)} />}
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                            <Estrellas n={r.calificacion} />
                            <span
                              data-testid="review-badge"
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                r.visible
                                  ? isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : isLight ? 'bg-rose-50 text-rose-700 border-rose-300' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {r.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                              {r.visible ? 'Visible' : 'Oculta'}
                            </span>
                          </div>
                          <p className={`mt-1.5 text-sm font-bold break-words [overflow-wrap:anywhere] ${strongCls}`}>
                            {r.nombreProducto}
                            {variante && <span className={`font-medium text-xs ${mutedCls}`}> — {variante}</span>}
                          </p>
                          <div className={`mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] ${mutedCls}`}>
                            <span className="inline-flex items-center gap-1 min-w-0 max-w-full">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{r.cliente || 'Cliente'}</span>
                            </span>
                            <span className="min-w-0 max-w-full break-all">{r.clienteEmail}</span>
                            <span className="inline-flex items-center gap-1 font-mono"><Receipt className="w-3 h-3" />{r.pedido}</span>
                            <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fecha(r.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        {r.comentario
                          ? <p className={comentarioCls} data-testid="review-comment">{r.comentario}</p>
                          : <p className={`text-xs italic ${mutedCls}`}>Sin comentario (solo calificación).</p>}
                      </div>

                      <div className={`mt-4 pt-3 border-t flex flex-col sm:flex-row sm:items-center gap-2 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                        {confirmando ? (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full" role="group" aria-label="Confirmar ocultar opinión" data-testid="review-confirm">
                            <p className={`text-xs font-semibold flex-1 ${isLight ? 'text-rose-700' : 'text-rose-300'}`}>
                              ¿Ocultar esta opinión? La página pública del producto dejará de mostrarla.
                            </p>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setConfirmarId(null)} className={`${botonSecCls} flex-1 sm:flex-none`}>
                                Cancelar
                              </button>
                              <button
                                type="button"
                                autoFocus
                                onClick={() => void cambiarVisibilidad(r, false)}
                                disabled={ocupado}
                                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                data-testid="review-confirm-hide"
                              >
                                <EyeOff className="w-3.5 h-3.5" />
                                Sí, ocultar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <span className={`text-[10px] flex-1 ${mutedCls}`}>
                              {r.visible ? 'Se muestra en la página del producto.' : 'No se muestra en la tienda.'}
                            </span>
                            <button
                              type="button"
                              disabled={ocupado}
                              aria-busy={ocupado}
                              onClick={() => (r.visible ? setConfirmarId(r.resenaId) : void cambiarVisibilidad(r, true))}
                              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-wait ${
                                r.visible
                                  ? isLight
                                    ? 'bg-white hover:bg-rose-50 text-rose-600 border-rose-200'
                                    : 'bg-slate-800 hover:bg-rose-500/10 text-rose-400 border-slate-700 hover:border-rose-500/40'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-500'
                              }`}
                              data-testid="review-toggle"
                            >
                              {ocupado
                                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                : r.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              {ocupado ? 'Guardando…' : r.visible ? 'Ocultar' : 'Volver a publicar'}
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {cargado && vista === 'vendedor' && (
          <>
            {/* Resumen: promedio + distribución */}
            <div className={`grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 sm:gap-6 p-4 rounded-2xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
            }`} data-testid="seller-summary">
              <div className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-1 sm:px-4">
                <span className={`text-4xl font-black font-mono ${strongCls}`}>{fmtPromedio(kpis.promVendedor)}</span>
                <div className="flex flex-col sm:items-center gap-0.5">
                  <Estrellas n={kpis.promVendedor == null ? 0 : Math.round(kpis.promVendedor)} size="w-4 h-4" />
                  <span className={`text-[11px] ${mutedCls}`}>{kpis.totalEval} {kpis.totalEval === 1 ? 'evaluación' : 'evaluaciones'}</span>
                </div>
              </div>
              <div className="space-y-1.5 min-w-0" aria-label="Distribución de calificaciones">
                {distribucion.map(d => (
                  <button
                    key={d.n}
                    type="button"
                    onClick={() => setEstrellasV(v => (v === d.n ? 0 : d.n))}
                    aria-pressed={estrellasV === d.n}
                    title={`Filtrar por ${d.n} ${d.n === 1 ? 'estrella' : 'estrellas'}`}
                    className={`w-full grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 text-[11px] rounded-lg px-1 py-0.5 cursor-pointer ${
                      estrellasV === d.n ? 'bg-emerald-500/10' : isLight ? 'hover:bg-slate-100' : 'hover:bg-slate-800/60'
                    }`}
                    data-testid="seller-dist-row"
                  >
                    <span className={`inline-flex items-center gap-0.5 font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {d.n}<Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    </span>
                    <span className={`h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}>
                      <span className="block h-full rounded-full bg-amber-400" style={{ width: `${d.pct}%` }} />
                    </span>
                    <span className={`text-right font-mono ${mutedCls}`}>{d.count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Filtros */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  maxLength={BUSQUEDA_MAX}
                  aria-label="Buscar evaluaciones"
                  placeholder="Cliente, comentario o pedido…"
                  value={busquedaV}
                  onChange={e => setBusquedaV(e.target.value.slice(0, BUSQUEDA_MAX))}
                  className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <select aria-label="Filtrar evaluaciones por estrellas" value={estrellasV} onChange={e => setEstrellasV(Number(e.target.value))} className={`${campoCls} flex-1 sm:flex-none`}>
                  <option value={0}>Todas las estrellas</option>
                  {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} {n === 1 ? 'estrella' : 'estrellas'}</option>)}
                </select>
                <button type="button" onClick={exportarVendedor} disabled={evaluacionesFiltradas.length === 0} title="Descargar la lista filtrada en CSV (Excel)" className={botonSecCls} data-testid="seller-csv">
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <p className={`text-[11px] font-semibold ${mutedCls}`} aria-live="polite">
              {evaluacionesFiltradas.length === evaluaciones.length
                ? `${evaluaciones.length} ${evaluaciones.length === 1 ? 'evaluación' : 'evaluaciones'} · más recientes primero`
                : `${evaluacionesFiltradas.length} de ${evaluaciones.length} evaluaciones · más recientes primero`}
            </p>

            {evaluaciones.length === 0 ? (
              estadoVacio("Aún no hay evaluaciones del vendedor", "Los clientes pueden evaluar el servicio de ColorLink cuando su pedido se entrega.")
            ) : evaluacionesFiltradas.length === 0 ? (
              estadoVacio("Ninguna evaluación coincide con los filtros", "Prueba con otra búsqueda o quita el filtro de estrellas.", hayFiltrosVendedor && <button type="button" onClick={limpiarFiltrosVendedor} className={botonSecCls}>Limpiar filtros</button>)
            ) : (
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="seller-list">
                {evaluacionesFiltradas.map(e => (
                  <li key={e.evaluacionId} className={itemCls} data-testid="seller-item">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Estrellas n={e.calificacion} />
                      <span className={`inline-flex items-center gap-1 text-[11px] font-mono ${mutedCls}`}><Receipt className="w-3 h-3" />{e.pedido}</span>
                    </div>
                    <div className={`mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] ${mutedCls}`}>
                      <span className={`font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{e.cliente || 'Cliente'}</span>
                      <span className="min-w-0 max-w-full break-all">{e.clienteEmail}</span>
                      <span className="inline-flex items-center gap-1"><CalendarDays className="w-3 h-3" />{fecha(e.createdAt)}</span>
                    </div>
                    <div className="mt-2">
                      {e.comentario
                        ? <p className={comentarioCls}>{e.comentario}</p>
                        : <p className={`text-xs italic ${mutedCls}`}>Sin comentario (solo calificación).</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Visor de foto */}
      {fotoAbierta && (
        <ModalBackdrop onClose={() => setFotoAbierta(null)} label="Foto de la opinión">
          <div className="relative max-w-3xl w-full" data-testid="review-lightbox">
            <button
              type="button"
              onClick={() => setFotoAbierta(null)}
              aria-label="Cerrar foto"
              className="absolute -top-1 right-0 sm:-right-1 -translate-y-full p-2 rounded-full bg-slate-900/90 text-white border border-slate-700 hover:bg-slate-800 cursor-pointer"
              data-testid="review-lightbox-close"
            >
              <X className="w-4 h-4" />
            </button>
            <img
              src={api.reviewPhotoUrl(fotoAbierta.resenaId)}
              alt={`Foto enviada por ${fotoAbierta.cliente || 'el cliente'} sobre ${fotoAbierta.nombreProducto}`}
              className="w-full max-h-[78vh] object-contain rounded-2xl bg-black/40"
            />
            <p className="mt-2 text-xs text-slate-300 text-center break-words">
              {fotoAbierta.nombreProducto} · {fotoAbierta.cliente} · {fotoAbierta.pedido}
            </p>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
};
