import React from 'react';
import { ClipboardCheck, Sparkles, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Proyecto } from '../types/database';

const TIPO: Record<string, string> = {
  residencial: 'Vivienda / residencial', comercial: 'Comercial', industrial: 'Industrial', institucional: 'Institucional', otro: 'Otro',
};
const CONDICION: Record<string, string> = {
  humedad: 'Humedad', fisuras: 'Fisuras', descascaramiento: 'Descascarada', hongos_moho: 'Hongos / moho', caleo: 'Caleo', buen_estado: 'Buen estado',
};
const CANAL: Record<string, string> = {
  web_portal: 'Portal web', whatsapp: 'WhatsApp', asesor_comercial: 'Asesor comercial', correo: 'Correo', linea_directa: 'Línea directa',
};
const CATEGORIA: Record<string, string> = {
  arquitectonico_interior: 'Arquitectónico interior', arquitectonico_exterior: 'Arquitectónico exterior', impermeabilizacion: 'Impermeabilización',
  pisos_industriales: 'Pisos industriales', metal_anticorrosivo: 'Metal / anticorrosivo', madera: 'Madera', otro: 'Otro',
};

const fechaLarga = (iso?: string) => {
  if (!iso) return '—';
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  const f = new Date(a, m - 1, d);
  return isNaN(f.getTime()) ? '—' : f.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
};
const diasRestantes = (iso?: string) => {
  if (!iso) return null;
  const [a, m, d] = iso.slice(0, 10).split('-').map(Number);
  const hoy = new Date();
  return Math.round((new Date(a, m - 1, d).getTime() - new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()) / 86400000);
};

/** Datos de la captura inteligente, la validación automática y la clasificación con IA de un proyecto. */
export const CapturaResumen: React.FC<{ proyecto: Proyecto; isLight: boolean }> = ({ proyecto: p, isLight }) => {
  const caja = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/70 border-slate-800';
  const etiqueta = isLight ? 'text-slate-500' : 'text-slate-400';
  const valor = isLight ? 'text-slate-900' : 'text-white';
  const v = p.validacionCaptura;
  const ia = p.diagnostico;
  const dias = diasRestantes(p.fechaRequerida);
  const fila = (k: string, val: React.ReactNode) => (
    <div className="flex justify-between gap-3 text-xs">
      <span className={etiqueta}>{k}</span>
      <span className={`font-semibold text-right min-w-0 break-words ${valor}`}>{val}</span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4" data-testid="captura-resumen">
      {/* Captura */}
      <div className={`rounded-xl border p-3.5 space-y-1.5 ${caja}`}>
        <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${etiqueta}`}>
          <ClipboardCheck className="w-3.5 h-3.5 text-sky-500" /> Captura del cliente
        </p>
        {fila('Tipo de proyecto', p.tipoProyecto ? TIPO[p.tipoProyecto] || p.tipoProyecto : '—')}
        {fila('Ciudad de la obra', p.ciudadObra || '—')}
        {fila('Material para', <>{fechaLarga(p.fechaRequerida)}{dias != null && <span className={dias < 7 ? 'text-rose-500' : etiqueta}> ({dias >= 0 ? `en ${dias} días` : `hace ${-dias} días`})</span>}</>)}
        {fila('Canal', p.canalOrigen ? CANAL[p.canalOrigen] || p.canalOrigen : '—')}
        {fila('Autorización de datos', p.consentimientoDatos ? `Sí${p.consentimientoFecha ? ` · ${new Date(p.consentimientoFecha).toLocaleDateString('es-CO')}` : ''}` : 'No registrada')}
        {p.condiciones.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {p.condiciones.map(c => (
              <span key={c} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c === 'buen_estado' ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/40' : 'bg-amber-500/15 text-amber-500 border-amber-500/40'}`}>
                {CONDICION[c] || c}
              </span>
            ))}
          </div>
        )}
        {p.descripcion && <p className={`text-[11px] pt-1 whitespace-pre-wrap break-words ${valor}`}>“{p.descripcion}”</p>}
      </div>

      <div className="space-y-3">
        {/* Validación automática */}
        <div className={`rounded-xl border p-3.5 space-y-1.5 ${caja}`}>
          <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${etiqueta}`}>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Validación automática
          </p>
          {v ? (
            <>
              {fila('Datos completos', `${v.completitudPct}%`)}
              {v.advertencias.length === 0 && (v.duplicados?.length || 0) === 0 && <p className="text-[11px] text-emerald-500 font-semibold">Sin inconsistencias ni duplicados.</p>}
              {v.advertencias.map((a, i) => (
                <p key={i} className="text-[11px] text-amber-500 flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />{a}</p>
              ))}
            </>
          ) : (
            <p className={`text-[11px] ${etiqueta}`}>Proyecto creado antes de la validación automática.</p>
          )}
        </div>

        {/* Clasificación con IA */}
        <div className={`rounded-xl border p-3.5 space-y-1.5 ${caja}`}>
          <p className={`text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${etiqueta}`}>
            <Sparkles className="w-3.5 h-3.5 text-violet-500" /> Clasificación con IA
          </p>
          {ia && (ia.categoria || ia.patologiaDetectada) ? (
            <>
              {fila('Categoría', ia.categoria ? CATEGORIA[ia.categoria] || ia.categoria : '—')}
              {fila('Severidad / complejidad', `${ia.severidad || '—'} / ${ia.complejidad || '—'}`)}
              {fila('Confianza', ia.confianzaIaPct != null ? `${Math.round(ia.confianzaIaPct)}%` : 'Sin IA (reglas)')}
              {ia.modeloIa && fila('Motor', ia.modeloIa === 'colorlink-expert-engine' ? 'Reglas (IA no disponible)' : ia.modeloIa)}
              {ia.imagenCoherente === false && (
                <p className="text-[11px] text-rose-500 flex gap-1.5"><AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-px" />Foto no coherente: {ia.imagenObservacion || 'no coincide con lo descrito.'}</p>
              )}
              {ia.textoExtraido && (
                <div className="pt-1">
                  <span className={`text-[10px] font-bold uppercase ${etiqueta}`}>Texto leído en las fotos</span>
                  <p className={`text-[11px] font-mono whitespace-pre-wrap break-words ${valor}`}>{ia.textoExtraido}</p>
                </div>
              )}
            </>
          ) : (
            <p className={`text-[11px] ${etiqueta}`}>El cliente creó el proyecto sin el diagnóstico con IA.</p>
          )}
        </div>
      </div>
    </div>
  );
};
