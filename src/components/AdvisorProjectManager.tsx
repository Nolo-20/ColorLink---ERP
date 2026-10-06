import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Proyecto } from '../types/database';
import { 
  PlusCircle, 
  Calculator, 
  CheckCircle2, 
  Building2, 
  Paintbrush, 
  FileText, 
  Tag, 
  ArrowRight, 
  Calendar,
  Layers,
  UserCheck,
  UserPlus,
  RefreshCw,
  Sparkles,
  User
} from 'lucide-react';

export const AdvisorProjectManager: React.FC = () => {
  const { 
    proyectos, 
    productos, 
    empresas, 
    selectedProyecto, 
    setSelectedProyecto, 
    calcularYGuardarCotizacion, 
    cambiarEstadoProyecto, 
    crearProyecto, 
    currentUser,
    setActiveTab,
    showToast,
    setEscalateModalOpen,
    setProjectToEscalate,
    theme
  } = useApp();

  const isLight = theme === 'light';

  const [activeProject, setActiveProject] = useState<Proyecto>(

    selectedProyecto || proyectos[0]
  );

  // Form states for technical quotation calculator
  const [calcArea, setCalcArea] = useState<number>(activeProject?.area || 1200);
  const [calcManos, setCalcManos] = useState<number>(2);
  const [calcProductoId, setCalcProductoId] = useState<string>(productos[0].productoId);
  const [calcDescuento, setCalcDescuento] = useState<number>(activeProject?.descuentoAsesorPct || 5);
  const [newProjectModal, setNewProjectModal] = useState(false);

  // New project form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newCompanyId, setNewCompanyId] = useState(empresas[0]?.empresaId || '');
  const [newArea, setNewArea] = useState(800);
  const [newAmbiente, setNewAmbiente] = useState<'Interior' | 'Exterior' | 'Fachada' | 'Cubierta' | 'Epóxico Piso Industrial'>('Fachada');
  const [newColor, setNewColor] = useState('Gris Concreto Claro');
  const [newColorHex, setNewColorHex] = useState('#D1D5DB');

  const handleSelectProject = (p: Proyecto) => {
    setActiveProject(p);
    setSelectedProyecto(p);
    setCalcArea(p.area || 1000);
    setCalcDescuento(p.descuentoAsesorPct || 0);
  };

  const handleCalculateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProject) return;
    const nuevaCot = calcularYGuardarCotizacion(
      activeProject.proyectoId,
      Number(calcArea),
      Number(calcManos),
      calcProductoId,
      Number(calcDescuento)
    );
    // Refresh local active project
    const updated = proyectos.find(p => p.proyectoId === activeProject.proyectoId);
    if (updated) {
      setActiveProject({
        ...updated,
        cotizaciones: [nuevaCot, ...(updated.cotizaciones || [])],
      });
    }
  };

  const handleSendToQuality = () => {
    if (!activeProject) return;
    cambiarEstadoProyecto(
      activeProject.proyectoId,
      'revision_calidad',
      'El asesor comercial ha enviado el proyecto y cotización para la verificación técnica del Perito de Calidad (humedad, fisuras y adherencia).'
    );
    showToast('Proyecto enviado a cola de inspección del Perito de Calidad.');
  };

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const created = crearProyecto({
      nombreProyecto: newProjectName,
      empresaId: newCompanyId,
      area: Number(newArea),
      ambiente: newAmbiente,
      color: newColor,
      colorHex: newColorHex,
      descuentoAsesorPct: 5,
      observacionesAsesor: 'Proyecto registrado por el asesor comercial para estructuración de cuñetes.',
    });

    setNewProjectModal(false);
    setActiveProject(created);
    setSelectedProyecto(created);
  };

  const selectedProduct = productos.find(p => p.productoId === calcProductoId) || productos[0];
  const latestQuote = activeProject?.cotizaciones && activeProject.cotizaciones[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900' 
          : 'bg-[#091526] border-slate-800 text-white shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Calculator className="w-4 h-4" />
            Módulo Asesor Comercial & Motor de Cotizaciones
          </div>
          <h2 className={`text-2xl md:text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Gestión de Obras & Cotización Técnica
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Cálculo volumétrico automatizado en Cuñetes de 5 Galones y Galones individuales, con desglose de rendimiento por m², IVA y descuentos para constructoras.
          </p>
        </div>

        <button
          onClick={() => setNewProjectModal(true)}
          className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 self-start md:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Registrar Nuevo Proyecto</span>
        </button>
      </div>

      {/* Main Grid: Projects List on Left, Active Project Details & Calculator on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Project Selector (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Proyectos Asignados ({proyectos.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const isSelected = activeProject?.proyectoId === p.proyectoId;
              return (
                <div
                  key={p.proyectoId}
                  onClick={() => handleSelectProject(p)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-emerald-50/70 border-emerald-500 shadow-sm'
                        : 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-500/10'
                      : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        : 'bg-[#091526] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {p.estadoPipeline.replace(/_/g, ' ')}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-500 font-bold">
                      {p.area} m²
                    </span>
                  </div>

                  <h4 className={`text-sm font-bold leading-snug line-clamp-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {p.nombreProyecto}
                  </h4>

                  <div className={`flex items-center gap-1.5 text-xs mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{p.empresa?.razonSocial}</span>
                  </div>

                  <div className={`flex items-center gap-1.5 text-[11px] mt-1 ${isLight ? 'text-emerald-700 font-medium' : 'text-emerald-300'}`}>
                    <UserCheck className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    <span className="truncate">Asesor: {p.asesorAsignado?.nombre || 'Valentina Gómez'}</span>
                  </div>

                  <div className={`flex items-center justify-between text-xs mt-3 pt-2.5 border-t ${
                    isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-400'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300 dark:border-white/20"
                        style={{ backgroundColor: p.colorHex || '#CBD5E1' }}
                      />
                      <span className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{p.color}</span>
                    </div>

                    <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(p.updatedAt).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Project Workspace & Calculator (8 cols) */}
        {activeProject ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Project Header Banner */}
            <div className={`border rounded-2xl p-6 shadow-sm transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#091526] border-slate-800 text-white shadow-xl'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs text-emerald-500 font-semibold tracking-wider uppercase block">
                    Ficha Técnica de Proyecto
                  </span>
                  <h3 className={`text-xl md:text-2xl font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeProject.nombreProyecto}
                  </h3>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => {
                      setProjectToEscalate(activeProject);
                      setEscalateModalOpen(true);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isLight 
                        ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200' 
                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 text-indigo-500" />
                    <span>Escalar a otro Asesor</span>
                  </button>

                  <button
                    onClick={handleSendToQuality}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isLight 
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span>Enviar a Revisión Calidad</span>
                  </button>
                </div>
              </div>

              {/* Assigned Advisor Banner Card */}
              <div className={`mb-4 p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                isLight 
                  ? 'bg-slate-50 border-slate-200 text-slate-800' 
                  : 'bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/30 border-emerald-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl border overflow-hidden flex-shrink-0 flex items-center justify-center ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-emerald-500/50'
                  }`}>
                    {activeProject.asesorAsignado?.avatarUrl ? (
                      <img src={activeProject.asesorAsignado.avatarUrl} alt="Asesor" className="w-full h-full object-cover" />
                    ) : (
                      <UserCheck className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">
                        Asesor Comercial Asignado
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        isLight 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {activeProject.historialAsesores && activeProject.historialAsesores.length > 1
                          ? `Escalado (${activeProject.historialAsesores.length - 1} traspasos)`
                          : 'Asignación Automática al Registrar'}
                      </span>
                    </div>
                    <span className={`font-extrabold text-sm block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {activeProject.asesorAsignado ? `${activeProject.asesorAsignado.nombre} ${activeProject.asesorAsignado.apellido}` : 'Valentina Gómez'}
                    </span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {activeProject.asesorAsignado?.email || 'asesor1@colorlink.co'} • {activeProject.asesorAsignado?.telefono || '+57 300 219 4432'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setProjectToEscalate(activeProject);
                    setEscalateModalOpen(true);
                  }}
                  className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all border ${
                    isLight 
                      ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' 
                      : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-amber-500/50'
                  }`}
                >
                  <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                  <span>Transferir / Reasignar Asesor</span>
                </button>
              </div>

              {/* Key Specs Bar */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl p-4 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800/90'
              }`}>
                <div>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Constructora / Cliente</span>
                  <span className={`text-xs font-bold truncate block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeProject.empresa?.razonSocial}
                  </span>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    NIT: {activeProject.empresa?.nitCedula}
                  </span>
                </div>

                <div>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Dirección de Despacho</span>
                  <span className={`text-xs font-medium block truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {activeProject.empresa?.direccionDespacho}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {activeProject.empresa?.ciudad?.ciudad || 'Medellín'}
                  </span>
                </div>

                <div>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Color de Formulación</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span 
                      className="w-4 h-4 rounded-full border border-slate-300 dark:border-white/30 shadow-inner flex-shrink-0"
                      style={{ backgroundColor: activeProject.colorHex || '#CBD5E1' }}
                    />
                    <span className={`text-xs font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {activeProject.color}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    HEX: {activeProject.colorHex}
                  </span>
                </div>

                <div>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Superficie & Ambiente</span>
                  <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeProject.ambiente}
                  </span>
                  <span className={`text-[10px] truncate block ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {activeProject.tipoSuperficie}
                  </span>
                </div>
              </div>

              {/* Photos & Evidence Strip */}
              {activeProject.evidencias && activeProject.evidencias.length > 0 && (
                <div className={`mt-4 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  <span className={`text-xs font-bold block mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Evidencias Fotográficas de la Obra ({activeProject.evidencias.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {activeProject.evidencias.map((evi) => (
                      <div key={evi.evidenciaId} className={`relative rounded-lg overflow-hidden border group aspect-video ${
                        isLight ? 'border-slate-200 bg-slate-100' : 'border-slate-700 bg-slate-800'
                      }`}>
                        <img 
                          src={evi.urlAlmacenado} 
                          alt={evi.nombreArchivo} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                          <span className="text-[10px] text-slate-300 truncate font-mono">
                            {evi.nombreArchivo}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Technical Quotation Engine (Calculadora de Cuñetes) */}
            <div className={`border rounded-2xl p-6 shadow-sm space-y-6 transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#091526] border-slate-800 text-white shadow-xl'
            }`}>
              <div className={`flex items-center justify-between border-b pb-4 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      Motor de Cotización de Pintura & Despiece de Cuñetes
                    </h4>
                    <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      Calcula la cantidad óptima de cuñetes (5 galones) y galones (1 galón) para minimizar desperdicios.
                    </p>
                  </div>
                </div>

                <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded border ${
                  isLight 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                    : 'text-emerald-400 bg-emerald-950/60 border-emerald-500/30'
                }`}>
                  Fórmula NTC
                </span>
              </div>

              <form onSubmit={handleCalculateQuote} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Área Total a Pintar (m²)
                  </label>
                  <input
                    type="number"
                    value={calcArea}
                    onChange={(e) => setCalcArea(Number(e.target.value))}
                    min={10}
                    step={10}
                    required
                    className={`w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Número de Manos
                  </label>
                  <select
                    value={calcManos}
                    onChange={(e) => setCalcManos(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value={1}>1 Mano (Mantenimiento)</option>
                    <option value={2}>2 Manos (Estándar recomendado)</option>
                    <option value={3}>3 Manos (Sustrato poroso o cambio drástico)</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Producto ColorLink
                  </label>
                  <select
                    value={calcProductoId}
                    onChange={(e) => setCalcProductoId(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    {productos.filter(p => p.presentacion?.includes('Cuñete')).map(p => (
                      <option key={p.productoId} value={p.productoId}>
                        {p.nombre} ({p.rendimientoM2} m²/gal)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Descuento Asesor (%)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={calcDescuento}
                      onChange={(e) => setCalcDescuento(Number(e.target.value))}
                      min={0}
                      max={15}
                      step={1}
                      className={`w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500 border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                    <button
                      type="submit"
                      className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex-shrink-0 cursor-pointer shadow-sm"
                    >
                      Calcular
                    </button>
                  </div>
                </div>
              </form>

              {/* Quotation Summary Card */}
              {latestQuote && (
                <div className={`border rounded-xl p-5 space-y-4 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-emerald-500/40'
                }`}>
                  <div className={`flex flex-wrap items-center justify-between gap-3 border-b pb-3 ${
                    isLight ? 'border-slate-200' : 'border-slate-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-500" />
                      <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Resultado de la Cotización #{latestQuote.cotizacionId.slice(-6)}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border uppercase ${
                        isLight 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                          : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {latestQuote.estado}
                      </span>
                    </div>

                    <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {new Date(latestQuote.createdAt).toLocaleString('es-CO')}
                    </span>
                  </div>

                  {/* Volume Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-lg border text-center ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
                    }`}>
                      <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Galones Teóricos Totales</span>
                      <span className={`text-2xl font-black font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {latestQuote.galonesExactos} <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>gal</span>
                      </span>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Incluye 6% desperdicio de obra</span>
                    </div>

                    <div className={`p-3 rounded-lg border text-center ${
                      isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-950/40 border-emerald-500/40'
                    }`}>
                      <span className={`text-[11px] font-semibold block ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>Cuñetes a Despachar (5 Gal)</span>
                      <span className="text-2xl font-black text-emerald-500 font-mono mt-0.5 block">
                        {latestQuote.cunetes5g} <span className="text-xs font-normal opacity-80">cuñetes</span>
                      </span>
                      <span className={`text-[10px] ${isLight ? 'text-emerald-700' : 'text-emerald-300/70'}`}>{(latestQuote.cunetes5g || 0) * 5} galones en envases grandes</span>
                    </div>

                    <div className={`p-3 rounded-lg border text-center ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
                    }`}>
                      <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Galones Sueltos de Ajuste (1 Gal)</span>
                      <span className="text-2xl font-black text-sky-500 font-mono mt-0.5 block">
                        {latestQuote.galones1g} <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>galones</span>
                      </span>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Para retoques y recortes</span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className={`p-4 rounded-lg border space-y-2 text-xs ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      <span>Subtotal bruto ({latestQuote.cunetes5g} Cuñetes + {latestQuote.galones1g} Galones):</span>
                      <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>
                        ${((latestQuote.subtotal || 0) / (1 - (latestQuote.descuentoAsesorPct || 0)/100)).toLocaleString('es-CO', { maximumFractionDigits: 0 })} COP
                      </span>
                    </div>

                    {(latestQuote.descuentoAsesorPct || 0) > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Descuento Comercial de Asesor ({latestQuote.descuentoAsesorPct}%):</span>
                        <span className="font-mono">
                          - ${Math.round(((latestQuote.subtotal || 0) / (1 - (latestQuote.descuentoAsesorPct || 0)/100)) * ((latestQuote.descuentoAsesorPct || 0)/100)).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    )}

                    <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      <span>Subtotal gravable:</span>
                      <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>${latestQuote.subtotal?.toLocaleString('es-CO')} COP</span>
                    </div>

                    <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      <span>IVA (19% régimen común):</span>
                      <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>${latestQuote.iva?.toLocaleString('es-CO')} COP</span>
                    </div>

                    <div className={`flex justify-between text-sm font-bold pt-2 border-t ${
                      isLight ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white'
                    }`}>
                      <span className="text-emerald-500">Total Liquidado en Obra:</span>
                      <span className="font-mono text-emerald-500 text-base">
                        ${latestQuote.total?.toLocaleString('es-CO')} COP
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* MODAL: REGISTRAR NUEVO PROYECTO */}
      {newProjectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
          }`}>
            <h3 className={`text-lg font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>Registrar Nuevo Proyecto de Obra</h3>
            <p className={`text-xs mb-4 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Ingresa los datos del cliente y los parámetros iniciales de recubrimiento.
            </p>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Nombre del Proyecto u Obra
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Torre Mirador Envigado - Etapa 2"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Empresa Cliente / Constructora
                </label>
                <select
                  value={newCompanyId}
                  onChange={(e) => setNewCompanyId(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                >
                  {empresas.map((e) => (
                    <option key={e.empresaId} value={e.empresaId}>
                      {e.razonSocial} (NIT: {e.nitCedula})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Área Aproximada (m²)
                  </label>
                  <input
                    type="number"
                    required
                    min={20}
                    value={newArea}
                    onChange={(e) => setNewArea(Number(e.target.value))}
                    className={`w-full rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-emerald-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Ambiente
                  </label>
                  <select
                    value={newAmbiente}
                    onChange={(e) => setNewAmbiente(e.target.value as any)}
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Fachada">Fachada Exterior</option>
                    <option value="Interior">Interiores y Drywall</option>
                    <option value="Cubierta">Cubiertas e Impermeabilización</option>
                    <option value="Epóxico Piso Industrial">Epóxico Piso Industrial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Nombre del Color
                  </label>
                  <input
                    type="text"
                    required
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block text-xs font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Tono Hexadecimal
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className={`w-9 h-9 rounded cursor-pointer border ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                    />
                    <input
                      type="text"
                      value={newColorHex}
                      onChange={(e) => setNewColorHex(e.target.value)}
                      className={`w-full rounded-lg px-2.5 py-2 text-xs font-mono uppercase focus:outline-none focus:border-emerald-500 border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setNewProjectModal(false)}
                  className={`flex-1 py-2.5 font-semibold text-xs rounded-lg transition-colors cursor-pointer border ${
                    isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer shadow-md shadow-emerald-500/20"
                >
                  Crear Proyecto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
