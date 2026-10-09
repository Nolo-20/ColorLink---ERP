import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CheckCheck, Loader2, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { api, ApiError } from '../api';
import { useApp } from '../context/AppContext';
import { Proyecto } from '../types/database';

/** Mensaje tal como lo devuelve GET /api/projects/:id/messages. */
export interface MensajeProyecto {
  mensajeId: string;
  autorId: string;
  autorNombre: string;
  autorRol: 'cliente' | 'asesor' | 'calidad' | 'despachos' | 'administrador' | string;
  texto: string;
  createdAt: string;
  leidoCliente: boolean;
  leidoEquipo: boolean;
}

interface ProjectChatPanelProps {
  proyecto: Proyecto;
  isLight: boolean;
  /** Versión reducida (menos alto) para módulos donde la conversación es secundaria. */
  compact?: boolean;
}

const POLL_MS = 10_000;
const MAX_CHARS = 1000;

const ROL_LABEL: Record<string, string> = {
  cliente: 'Cliente',
  asesor: 'Asesor Comercial',
  calidad: 'Perito de Calidad',
  despachos: 'Jefe de Despachos',
  administrador: 'Administrador',
};

const ROL_COLOR: Record<string, { light: string; dark: string }> = {
  asesor: { light: 'text-emerald-700', dark: 'text-emerald-300' },
  calidad: { light: 'text-amber-700', dark: 'text-amber-300' },
  despachos: { light: 'text-orange-700', dark: 'text-orange-300' },
  administrador: { light: 'text-indigo-700', dark: 'text-indigo-300' },
};

const horaCorta = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' });

const fechaCompleta = (iso: string) =>
  new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/** "Hoy", "Ayer" o la fecha larga, para separar los mensajes por día. */
const etiquetaDia = (iso: string) => {
  const d = new Date(iso);
  const hoy = new Date();
  const ayer = new Date();
  ayer.setDate(hoy.getDate() - 1);
  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
    ...(d.getFullYear() !== hoy.getFullYear() ? { year: 'numeric' } : {}),
  });
};

export const ProjectChatPanel: React.FC<ProjectChatPanelProps> = ({ proyecto, isLight, compact = false }) => {
  const { marcarConversacionLeida, showToast } = useApp();
  const proyectoId = proyecto.proyectoId;

  const [mensajes, setMensajes] = useState<MensajeProyecto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const proyectoActual = useRef(proyectoId);
  const consultando = useRef(false);
  const forzarScroll = useRef(true);

  const nombreCliente = useMemo(() => {
    const u = proyecto.usuario;
    const n = u ? `${u.nombre || ''} ${u.apellido || ''}`.trim() : '';
    return n || proyecto.empresa?.razonSocial || 'Cliente';
  }, [proyecto.usuario, proyecto.empresa]);

  const cargar = useCallback(async (silencioso: boolean) => {
    if (consultando.current) return;
    consultando.current = true;
    const id = proyectoId;
    try {
      const r = await api.getProjectMessages(id);
      if (proyectoActual.current !== id) return;
      const lista: MensajeProyecto[] = Array.isArray(r.messages) ? r.messages : [];
      setMensajes(prev => {
        // Evita re-render (y saltos de scroll) si no cambió nada
        if (
          prev.length === lista.length &&
          prev.every((m, i) => m.mensajeId === lista[i].mensajeId && m.leidoCliente === lista[i].leidoCliente)
        ) return prev;
        return lista;
      });
      setErrorCarga(null);
      // Al abrir la conversación el backend deja leídos los mensajes del cliente
      marcarConversacionLeida(id);
    } catch (err) {
      if (proyectoActual.current !== id) return;
      if (err instanceof ApiError && err.status === 401) {
        showToast('Tu sesión terminó. Vuelve a ingresar.', 'error');
      }
      if (!silencioso) {
        setErrorCarga(err instanceof ApiError ? err.message : 'No se pudieron cargar los mensajes.');
      }
    } finally {
      consultando.current = false;
      if (proyectoActual.current === id) setCargando(false);
    }
  }, [proyectoId, marcarConversacionLeida, showToast]);

  // Carga inicial al montar o al cambiar de proyecto, y sondeo cada 10 s mientras la pestaña esté visible
  useEffect(() => {
    proyectoActual.current = proyectoId;
    consultando.current = false;
    forzarScroll.current = true;
    setMensajes([]);
    setTexto('');
    setErrorEnvio(null);
    setErrorCarga(null);
    setCargando(true);
    cargar(false);
    const intervalo = setInterval(() => {
      if (document.visibilityState === 'visible') cargar(true);
    }, POLL_MS);
    const alVolver = () => { if (document.visibilityState === 'visible') cargar(true); };
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      clearInterval(intervalo);
      document.removeEventListener('visibilitychange', alVolver);
    };
  }, [proyectoId, cargar]);

  // Baja al último mensaje cuando llegan mensajes nuevos (sin mover la página completa)
  const ultimoId = mensajes[mensajes.length - 1]?.mensajeId;
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const cercaDelFinal = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (forzarScroll.current || cercaDelFinal) {
      el.scrollTop = el.scrollHeight;
      if (mensajes.length > 0) forzarScroll.current = false;
    }
  }, [ultimoId, cargando]);

  const enviar = async () => {
    const limpio = texto.trim();
    if (!limpio || enviando) return;
    if (limpio.length > MAX_CHARS) {
      setErrorEnvio(`El mensaje puede tener máximo ${MAX_CHARS} caracteres.`);
      return;
    }
    const id = proyectoId;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const r = await api.sendProjectMessage(id, limpio);
      if (proyectoActual.current !== id) return;
      const nuevo: MensajeProyecto | undefined = r.message;
      if (nuevo) {
        forzarScroll.current = true;
        setMensajes(prev => (prev.some(m => m.mensajeId === nuevo.mensajeId) ? prev : [...prev, nuevo]));
      }
      setTexto('');
    } catch (err) {
      if (proyectoActual.current !== id) return;
      if (err instanceof ApiError && err.status === 429) {
        setErrorEnvio(err.message || 'Estás enviando mensajes muy rápido. Espera un momento.');
      } else if (err instanceof ApiError && err.status === 401) {
        showToast('Tu sesión terminó. Vuelve a ingresar.', 'error');
        setErrorEnvio('Tu sesión terminó. Vuelve a ingresar.');
      } else {
        setErrorEnvio(err instanceof ApiError ? err.message : 'No se pudo enviar el mensaje.');
      }
    } finally {
      if (proyectoActual.current === id) setEnviando(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      enviar();
    }
  };

  // Índice del último mensaje del equipo, para mostrar "Visto" debajo si el cliente ya lo leyó
  const idxUltimoEquipo = useMemo(() => {
    for (let i = mensajes.length - 1; i >= 0; i--) if (mensajes[i].autorRol !== 'cliente') return i;
    return -1;
  }, [mensajes]);

  const largo = texto.trim().length;
  const excedido = texto.length > MAX_CHARS;
  const altoLista = compact ? 'h-64' : 'h-[26rem]';

  const muted = isLight ? 'text-slate-500' : 'text-slate-400';

  return (
    <div className="flex flex-col gap-3" data-testid="project-chat">
      {/* Lista de mensajes */}
      <div
        ref={scrollRef}
        className={`${altoLista} overflow-y-auto rounded-xl border p-3 sm:p-4 space-y-3 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800'
        }`}
        aria-live="polite"
      >
        {cargando && mensajes.length === 0 ? (
          <div className={`h-full flex items-center justify-center gap-2 text-xs ${muted}`}>
            <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            Cargando conversación…
          </div>
        ) : errorCarga && mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
            <AlertCircle className="w-5 h-5 text-rose-400" />
            <p className="text-xs text-rose-400">{errorCarga}</p>
            <button
              type="button"
              onClick={() => { setCargando(true); cargar(false); }}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg border cursor-pointer ${
                isLight ? 'border-slate-300 text-slate-700 hover:bg-white' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Reintentar
            </button>
          </div>
        ) : mensajes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-center px-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className={`text-xs max-w-xs ${muted}`}>
              Aún no hay mensajes. Escribe al cliente para coordinar la obra.
            </p>
          </div>
        ) : (
          mensajes.map((m, i) => {
            const esCliente = m.autorRol === 'cliente';
            const nuevoDia = i === 0 || new Date(mensajes[i - 1].createdAt).toDateString() !== new Date(m.createdAt).toDateString();
            const rolColor = ROL_COLOR[m.autorRol] || ROL_COLOR.asesor;
            return (
              <React.Fragment key={m.mensajeId}>
                {nuevoDia && (
                  <div className="flex items-center gap-3 py-1" role="separator">
                    <span className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
                    <span className={`text-[10px] font-bold uppercase tracking-wider first-letter:uppercase ${muted}`}>
                      {etiquetaDia(m.createdAt)}
                    </span>
                    <span className={`flex-1 h-px ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`} />
                  </div>
                )}
                <div className={`flex ${esCliente ? 'justify-start' : 'justify-end'}`} data-testid="chat-message">
                  <div className={`max-w-[85%] sm:max-w-[75%] flex flex-col ${esCliente ? 'items-start' : 'items-end'}`}>
                    <div className={`flex items-center gap-1.5 mb-1 text-[10px] ${esCliente ? '' : 'flex-row-reverse'}`}>
                      <span className={`font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {m.autorNombre || (esCliente ? nombreCliente : 'Equipo ColorLink')}
                      </span>
                      <span
                        className={`px-1.5 py-px rounded-full font-bold border ${
                          esCliente
                            ? isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            : `${isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-700'} ${isLight ? rolColor.light : rolColor.dark}`
                        }`}
                      >
                        {ROL_LABEL[m.autorRol] || 'Equipo ColorLink'}
                      </span>
                    </div>
                    <div
                      className={`px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words shadow-sm ${
                        esCliente
                          ? `rounded-2xl rounded-tl-md border ${isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-800 border-slate-700 text-slate-100'}`
                          : `rounded-2xl rounded-tr-md ${isLight ? 'bg-emerald-600 text-white' : 'bg-emerald-500/90 text-slate-950'}`
                      }`}
                    >
                      {m.texto}
                    </div>
                    <span className={`mt-1 text-[10px] font-mono ${muted}`} title={fechaCompleta(m.createdAt)}>
                      {horaCorta(m.createdAt)}
                    </span>
                    {i === idxUltimoEquipo && m.leidoCliente && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-500" data-testid="chat-visto">
                        <CheckCheck className="w-3 h-3" /> Visto
                      </span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
      </div>

      {/* Redactar */}
      <form
        onSubmit={(e) => { e.preventDefault(); enviar(); }}
        className={`rounded-xl border p-2.5 transition-colors ${
          isLight ? 'bg-white border-slate-300 focus-within:border-emerald-500' : 'bg-slate-900 border-slate-700 focus-within:border-emerald-500'
        }`}
      >
        <textarea
          value={texto}
          onChange={(e) => { setTexto(e.target.value); if (errorEnvio) setErrorEnvio(null); }}
          onKeyDown={onKeyDown}
          rows={compact ? 2 : 3}
          maxLength={MAX_CHARS + 200}
          readOnly={enviando}
          aria-busy={enviando}
          placeholder={`Escribe a ${nombreCliente}…`}
          aria-label="Mensaje para el cliente"
          className={`w-full resize-none bg-transparent text-sm focus:outline-none read-only:opacity-60 ${
            isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
          }`}
        />
        <div className="flex items-center justify-between gap-3 mt-1.5">
          <span className={`text-[10px] ${muted} hidden sm:inline`}>
            Enter para enviar · Shift + Enter para nueva línea
          </span>
          <div className="flex items-center gap-3 ml-auto">
            <span className={`text-[10px] font-mono ${excedido ? 'text-rose-400 font-bold' : muted}`}>
              {texto.length}/{MAX_CHARS}
            </span>
            <button
              type="submit"
              disabled={enviando || largo === 0 || excedido}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {enviando ? 'Enviando…' : 'Enviar'}
            </button>
          </div>
        </div>
        {errorEnvio && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-400" role="alert">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {errorEnvio}
          </p>
        )}
      </form>
    </div>
  );
};
