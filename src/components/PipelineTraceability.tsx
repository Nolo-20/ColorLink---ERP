import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Proyecto, EstadoPipeline } from '../types/database';
import { ESTADO_PROYECTO_LABEL, ESTADO_PROYECTO_BADGE, ESTADOS_PROYECTO_CERRADOS } from '../estados';
import { 
  CheckCircle2, 
  Clock, 
  Truck, 
  ShieldCheck, 
  FileText, 
  History, 
  Droplets, 
  ArrowRight, 
  AlertCircle, 
  Eye, 
  X,
  Send,
  Building2,
  Calendar,
  Layers,
  UserPlus,
  UserCheck
} from 'lucide-react';

interface StageConfig {
  key: EstadoPipeline;
  label: string;
  badgeColor: string;
  icon: React.ElementType;
  description: string;
}

const STAGE_ICON: Record<EstadoPipeline, React.ElementType> = {
  en_revision: Clock,
  imagen_por_corregir: AlertCircle,
  en_peritaje: ShieldCheck,
  cotizado: FileText,
  aprobado_calidad: CheckCircle2,
  rechazado: AlertCircle,
  despachado: Truck,
  cancelado: X,
};

const STAGE_DESCRIPTION: Record<EstadoPipeline, string> = {
  en_revision: 'El equipo comercial revisa la solicitud del cliente',
  imagen_por_corregir: 'Se pidió al cliente subir otra imagen',
  en_peritaje: 'El perito verifica humedad, fisuras y adherencia',
  cotizado: 'Cotización técnica enviada al cliente',
  aprobado_calidad: 'Aprobado por calidad, listo para despachar',
  rechazado: 'Calidad pidió ajustes técnicos',
  despachado: 'Material enviado a la obra',
  cancelado: 'Proyecto cerrado sin despacho',
};

const STAGES: StageConfig[] = (Object.keys(ESTADO_PROYECTO_LABEL) as EstadoPipeline[]).map(key => ({
  key,
  label: ESTADO_PROYECTO_LABEL[key],
  badgeColor: ESTADO_PROYECTO_BADGE[key],
  icon: STAGE_ICON[key],
  description: STAGE_DESCRIPTION[key],
}));

/** Estados que puede fijar a mano el equipo comercial (el resto los define Calidad, Despachos o el flujo de imagen). */
const ESTADOS_MANUALES: EstadoPipeline[] = ['en_revision', 'en_peritaje', 'cotizado', 'cancelado'];

export const PipelineTraceability: React.FC = () => {
  const { 
    proyectos, 
    currentUser, 
    cambiarEstadoProyecto, 
    setSelectedProyecto, 
    setActiveTab, 
    setPickupModalOpen,
    setEscalateModalOpen,
    setProjectToEscalate,
    theme
  } = useApp();

  const isLight = theme === 'light';

  const [activeStageFilter, setActiveStageFilter] = useState<string>('all');

  const [modalHistoryProject, setModalHistoryProject] = useState<Proyecto | null>(null);
  const [modalChangeStatusProject, setModalChangeStatusProject] = useState<Proyecto | null>(null);
  const [targetStatus, setTargetStatus] = useState<EstadoPipeline>('en_peritaje');
  const [statusNote, setStatusNote] = useState<string>('');

  const filteredProyectos = activeStageFilter === 'all' 
    ? proyectos 
    : proyectos.filter(p => p.estadoPipeline === activeStageFilter);

  const puedeCambiarEstado = (p: Proyecto) =>
    (currentUser?.rol.rol === 'Administrador' || currentUser?.rol.rol === 'Asesor Comercial') &&
    !ESTADOS_PROYECTO_CERRADOS.includes(p.estadoPipeline);

  const handleOpenStatusModal = (p: Proyecto) => {
    setModalChangeStatusProject(p);
    const sugerido = ESTADOS_MANUALES.find(e => e !== p.estadoPipeline && e !== 'cancelado') || 'en_peritaje';
    setTargetStatus(p.estadoPipeline === 'en_revision' ? 'cotizado' : sugerido);
    setStatusNote('');
  };

  const handleConfirmStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalChangeStatusProject) return;
    const ok = await cambiarEstadoProyecto(modalChangeStatusProject.proyectoId, targetStatus, statusNote);
    if (ok) setModalChangeStatusProject(null);
  };

  const handleInspectProject = (p: Proyecto) => {
    setSelectedProyecto(p);
    setActiveTab('proyectos');
  };

  const handleInspectQuality = (p: Proyecto) => {
    setSelectedProyecto(p);
    setActiveTab('calidad');
  };

  const handleInspectDispatch = (p: Proyecto) => {
    setSelectedProyecto(p);
    setActiveTab('despachos');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`border rounded-2xl p-6 shadow-sm relative overflow-hidden transition-all ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900' 
          : 'bg-[#091526] border-slate-800 text-white'
      }`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Control Logístico y Operacional en Tiempo Real
            </div>
            <h2 className={`text-2xl md:text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Pipeline de Proyectos & Trazabilidad
            </h2>
            <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Flujo unificado entre Asesores Comerciales, Peritos de Calidad y Jefes de Despacho. Cada movimiento queda registrado en la bitácora técnica de obra.
            </p>
          </div>

          <div className={`flex items-center gap-2 self-start md:self-auto p-2 rounded-xl text-xs border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-700/80'
          }`}>
            <span className={isLight ? 'text-slate-500 font-medium' : 'text-slate-400 font-medium'}>Proyectos Activos:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold">
              {proyectos.length}
            </span>
          </div>
        </div>

        {/* Pipeline Stage Pills Filter */}
        <div className={`flex items-center gap-2 overflow-x-auto pt-5 mt-4 border-t no-scrollbar ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <button
            onClick={() => setActiveStageFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeStageFilter === 'all'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : isLight
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Todos ({proyectos.length})
          </button>
          {STAGES.map((s) => {
            const count = proyectos.filter(p => p.estadoPipeline === s.key).length;
            const Icon = s.icon;
            return (
              <button
                key={s.key}
                onClick={() => setActiveStageFilter(s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer ${
                  activeStageFilter === s.key
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : isLight
                      ? 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{s.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeStageFilter === s.key 
                    ? 'bg-slate-950 text-emerald-300' 
                    : isLight 
                      ? 'bg-slate-200 text-slate-700' 
                      : 'bg-slate-800 text-slate-300'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Projects Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProyectos.map((proy) => {
          const currentStage = STAGES.find(s => s.key === proy.estadoPipeline) || STAGES[0];
          const StageIcon = currentStage.icon;
          const latestQuote = proy.cotizaciones && proy.cotizaciones[0];
          const diag = proy.diagnostico;

          return (
            <div 
              key={proy.proyectoId}
              className={`border rounded-2xl p-5 shadow-sm flex flex-col justify-between transition-all group ${
                isLight 
                  ? 'bg-white border-slate-200 hover:border-emerald-500/50 hover:shadow-md' 
                  : 'bg-[#091526] border-slate-800 hover:border-slate-700/80 shadow-lg'
              }`}
            >
              <div>
                {/* Card Top: Stage Badge & Date */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${currentStage.badgeColor}`}>
                    <StageIcon className="w-3.5 h-3.5" />
                    {currentStage.label}
                  </span>
                  <span className={`text-[11px] font-mono flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {new Date(proy.updatedAt).toLocaleDateString('es-CO')}
                  </span>
                </div>

                {/* Project Title */}
                <h3 className={`text-base font-bold transition-colors leading-snug mb-1 ${
                  isLight ? 'text-slate-900 group-hover:text-emerald-600' : 'text-white group-hover:text-emerald-400'
                }`}>
                  {proy.nombreProyecto}
                </h3>

                {/* Company & City */}
                <div className={`flex items-center gap-1.5 text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <Building2 className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
                  <span className="truncate">{proy.empresa?.razonSocial || 'Cliente General'}</span>
                  <span>•</span>
                  <span className="text-emerald-500 font-medium">{proy.empresa?.ciudad?.ciudad || 'Medellín'}</span>
                </div>

                {/* Technical Specs: Color Swatch + Area + Superficie */}
                <div className={`rounded-xl p-3 border mb-3 space-y-2 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800/80'
                }`}>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Color seleccionado:</span>
                    <div className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-white/20 shadow-sm inline-block"
                        style={{ backgroundColor: proy.colorHex || '#CBD5E1' }}
                      />
                      <span>{proy.color || 'Blanco Estándar'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Área a recubrir:</span>
                    <span className={`font-semibold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{proy.area?.toLocaleString()} m²</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Ambiente / Sustrato:</span>
                    <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{proy.ambiente}</span>
                  </div>
                </div>

                {/* Volumetric Breakdown: Cuñetes 5G & Galones 1G */}
                {latestQuote && (
                  <div className={`border rounded-xl p-3 mb-3 ${
                    isLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/30 border-emerald-500/30'
                  }`}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider text-[10px]">
                        Volumen Cotizado
                      </span>
                      <span className="text-emerald-700 dark:text-emerald-300 font-mono font-bold">
                        ${latestQuote.total?.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-center mt-2">
                      <div className={`p-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                      }`}>
                        <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Cuñetes (5 Gal)</span>
                        <span className={`text-base font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{latestQuote.cunetes5g ?? 0}</span>
                      </div>
                      <div className={`p-1.5 rounded-lg border ${
                        isLight ? 'bg-white border-slate-200' : 'bg-slate-900/80 border-slate-800'
                      }`}>
                        <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Galones (1 Gal)</span>
                        <span className={`text-base font-extrabold font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{latestQuote.galones1g ?? 0}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quality & Despacho Indicators */}
                <div className="space-y-1.5 text-xs mb-4">
                  {diag && (
                    <div className={`flex items-center justify-between p-2 rounded-lg border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                    }`}>
                      <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                        Calidad Peritaje:
                      </span>
                      <span className={`font-semibold ${diag.aprobadoCalidad ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                        {diag.aprobadoCalidad ? `Aprobado (${diag.humedadRelativa}% Hum.)` : 'En Evaluación'}
                      </span>
                    </div>
                  )}

                  {proy.despacho && (
                    <div className={`flex items-center justify-between p-2 rounded-lg border ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'
                    }`}>
                      <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                        Guía Despacho:
                      </span>
                      <span className="font-mono font-bold text-sky-600 dark:text-sky-400">
                        {proy.despacho.numeroGuia}
                      </span>
                    </div>
                  )}

                  {/* Assigned Advisor & Quick Escalate Action */}
                  <div className={`flex items-center justify-between p-2 rounded-lg border text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
                  }`}>
                    <div className="flex items-center gap-1.5 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Asesor:</span>
                      <span className={`font-bold text-[11px] truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                        {proy.asesorAsignado ? `${proy.asesorAsignado.nombre} ${proy.asesorAsignado.apellido}` : 'Sin asignar'}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setProjectToEscalate(proy);
                        setEscalateModalOpen(true);
                      }}
                      className="text-[10px] text-amber-500 hover:text-amber-600 font-bold flex items-center gap-1 ml-2 flex-shrink-0 cursor-pointer bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30"
                      title="Escalar o transferir proyecto a otro asesor comercial"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Escalar</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Action Bar */}
              <div className={`pt-3 border-t space-y-2 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                <div className="grid grid-cols-2 gap-2">
                  {puedeCambiarEstado(proy) ? (
                  <button
                    onClick={() => handleOpenStatusModal(proy)}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Cambiar Estado</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  ) : (
                    <div className={`w-full py-2 text-center text-[11px] rounded-lg border ${isLight ? 'border-slate-200 text-slate-400' : 'border-slate-800 text-slate-500'}`}>
                      Sin cambios disponibles
                    </div>
                  )}

                  <button
                    onClick={() => setModalHistoryProject(proy)}
                    className={`w-full py-2 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer border ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <History className="w-3.5 h-3.5 text-slate-400" />
                    <span>Trazabilidad</span>
                  </button>
                </div>

                <div className={`flex items-center justify-between text-xs px-1 pt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  <button
                    onClick={() => handleInspectProject(proy)}
                    className="hover:text-emerald-500 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Ver Detalles</span>
                  </button>

                  {proy.estadoPipeline === 'en_peritaje' && (
                    <button
                      onClick={() => handleInspectQuality(proy)}
                      className="text-amber-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Dictaminar</span>
                    </button>
                  )}

                  {(proy.estadoPipeline === 'aprobado_calidad' || proy.estadoPipeline === 'despachado') && (
                    <button
                      onClick={() => handleInspectDispatch(proy)}
                      className="text-sky-500 hover:underline flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Hoja de Ruta</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL: CAMBIO DE ESTADO CON CONTROL LOGÍSTICO */}
      {modalChangeStatusProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
          }`}>
            <button 
              onClick={() => setModalChangeStatusProject(null)}
              className={`absolute top-5 right-5 cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 text-emerald-500 mb-1">
              <ArrowRight className="w-5 h-5" />
              <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Actualizar Estado del Proyecto</h3>
            </div>
            <p className={`text-xs mb-5 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Proyecto: <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{modalChangeStatusProject.nombreProyecto}</span>
            </p>

            <form onSubmit={handleConfirmStatusChange} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Nuevo Estado en el Pipeline
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as EstadoPipeline)}
                  className={`w-full rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  {STAGES.filter(s => ESTADOS_MANUALES.includes(s.key) && s.key !== modalChangeStatusProject.estadoPipeline).map(s => (
                    <option key={s.key} value={s.key}>
                      {s.label} ({s.description})
                    </option>
                  ))}
                </select>

                <p className={`mt-2 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Los estados de calidad (aprobado / rechazado), imagen por corregir y despachado se registran desde sus módulos.
                </p>
              </div>


              <div>
                <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Notas de Control / Justificación del Movimiento
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  placeholder="Detalla las observaciones técnicas o logísticas para la trazabilidad..."
                  className={`w-full rounded-lg p-3 text-sm focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-900/70 border-slate-800 text-slate-400'
              }`}>
                <span>Responsable de la acción:</span>
                <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {currentUser?.nombre} ({currentUser?.rol.rol})
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalChangeStatusProject(null)}
                  className={`flex-1 py-2.5 font-semibold text-xs rounded-lg transition-colors cursor-pointer border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  Confirmar Cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL COMPLETO DE MOVIMIENTOS LOGÍSTICOS */}
      {modalHistoryProject && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
          }`}>
            <button 
              onClick={() => setModalHistoryProject(null)}
              className={`absolute top-5 right-5 cursor-pointer ${isLight ? 'text-slate-400 hover:text-slate-700' : 'text-slate-400 hover:text-white'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Historial Completo de Movimientos</h3>
                <p className={`text-xs font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {modalHistoryProject.nombreProyecto}
                </p>
              </div>
            </div>

            <p className={`text-xs my-4 leading-relaxed border-b pb-3 ${
              isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-400'
            }`}>
              Trazabilidad auditable en tiempo real. Cada hito registra fecha, hora, rol de usuario, observaciones y parámetros de despacho.
            </p>

            {/* Timeline content */}
            <div className="overflow-y-auto space-y-4 pr-1 flex-1">
              {(!modalHistoryProject.historialMovimientos || modalHistoryProject.historialMovimientos.length === 0) ? (
                <div className={`p-8 text-center text-sm ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Sin movimientos adicionales registrados.
                </div>
              ) : (
                modalHistoryProject.historialMovimientos.map((mov, idx) => (
                  <div key={mov.id || idx} className={`relative pl-6 pb-2 border-l-2 last:border-l-0 ${
                    isLight ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center" />
                    
                    <div className={`border rounded-xl p-3.5 ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{mov.usuarioNombre}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold ${
                            isLight ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {mov.rolNombre}
                          </span>
                        </div>
                        <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {new Date(mov.fecha).toLocaleString('es-CO')}
                        </span>
                      </div>

                      <div className="text-xs text-emerald-600 dark:text-emerald-300 font-medium mb-1 flex items-center gap-1.5">
                        <span>Estado:</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-bold">
                          {ESTADO_PROYECTO_LABEL[mov.estadoNuevo] || mov.estadoNuevo}
                        </span>
                      </div>

                      <p className={`text-xs leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                        {mov.notas}
                      </p>

                      {(mov.bodegaOrigen || mov.numeroGuia || mov.placaVehiculo) && (
                        <div className={`mt-2 pt-2 border-t flex flex-wrap gap-3 text-[11px] ${
                          isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-400'
                        }`}>
                          {mov.bodegaOrigen && <span>📍 {mov.bodegaOrigen}</span>}
                          {mov.numeroGuia && <span>🏷️ Guía: <strong className="text-sky-600 dark:text-sky-400 font-mono">{mov.numeroGuia}</strong></span>}
                          {mov.placaVehiculo && <span>🚛 Placa: <strong className="text-amber-600 dark:text-amber-400">{mov.placaVehiculo}</strong></span>}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className={`pt-4 border-t mt-4 text-right ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <button
                type="button"
                onClick={() => setModalHistoryProject(null)}
                className={`px-5 py-2 font-semibold text-xs rounded-lg transition-colors cursor-pointer border ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                Cerrar Bitácora
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
