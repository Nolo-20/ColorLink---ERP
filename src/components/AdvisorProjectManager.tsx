import React, { useState, useEffect } from 'react';
import { ESTADO_PROYECTO_LABEL } from '../estados';
import { useApp, canRole } from '../context/AppContext';
import { Proyecto } from '../types/database';
import { 
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
    selectedProyecto, 
    setSelectedProyecto, 
    calcularYGuardarCotizacion, 
    cambiarEstadoProyecto, 
    solicitarCambioImagen,
    obtenerImagenProyecto,
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

  // Cuando llegan datos nuevos del servidor, refresca el proyecto abierto
  useEffect(() => {
    setActiveProject(prev => proyectos.find(p => p.proyectoId === prev?.proyectoId) || prev || proyectos[0]);
  }, [proyectos]);


  // Form states for technical quotation calculator
  // Solo se cotiza con productos que tienen presentación Cuñete (el servidor arma cuñetes + galones de la misma línea)
  const productosCunete = productos.filter(p => p.presentacion?.includes('Cuñete'));

  const [calcArea, setCalcArea] = useState<number>(activeProject?.area ?? 0);
  const [calcManos, setCalcManos] = useState<number>(2);
  const [calcProductoId, setCalcProductoId] = useState<string>(productosCunete[0]?.productoId || '');
  const [calcDescuento, setCalcDescuento] = useState<number>(activeProject?.descuentoAsesorPct ?? 0);
  const [cotizando, setCotizando] = useState(false);
  const [enviandoCalidad, setEnviandoCalidad] = useState(false);
  const [pidiendoImagenBusy, setPidiendoImagenBusy] = useState(false);

  // El producto elegido debe existir en la lista visible; si no, se toma el primero con presentación Cuñete
  useEffect(() => {
    if (!productosCunete.some(p => p.productoId === calcProductoId)) {
      setCalcProductoId(productosCunete[0]?.productoId || '');
    }
  }, [productos, calcProductoId]);

  // Al cambiar de proyecto (o cuando llega del servidor) se cargan su área y su descuento reales
  useEffect(() => {
    if (!activeProject) return;
    setCalcArea(activeProject.area ?? 0);
    setCalcDescuento(activeProject.descuentoAsesorPct ?? 0);
  }, [activeProject?.proyectoId]);

  const [imagen, setImagen] = useState<string | null>(null);
  const [imagenCargando, setImagenCargando] = useState(false);
  const [motivoImagen, setMotivoImagen] = useState('');
  const [pidiendoImagen, setPidiendoImagen] = useState(false);

  useEffect(() => {
    let cancelado = false;
    setImagen(null);
    setMotivoImagen('');
    setPidiendoImagen(false);
    if (!activeProject) return;
    setImagenCargando(true);
    obtenerImagenProyecto(activeProject.proyectoId)
      .then(img => { if (!cancelado) setImagen(img); })
      .finally(() => { if (!cancelado) setImagenCargando(false); });
    return () => { cancelado = true; };
  }, [activeProject?.proyectoId]);

  const handlePedirCambioImagen = async () => {
    if (!activeProject || motivoImagen.trim().length < 5) {
      showToast('Explica brevemente por qué la imagen no sirve (mínimo 5 caracteres).');
      return;
    }
    if (pidiendoImagenBusy) return;
    setPidiendoImagenBusy(true);
    try {
      const ok = await solicitarCambioImagen(activeProject.proyectoId, motivoImagen.trim());
      if (ok) { setMotivoImagen(''); setPidiendoImagen(false); }
    } finally {
      setPidiendoImagenBusy(false);
    }
  };

  const handleSelectProject = (p: Proyecto) => {
    setActiveProject(p);
    setSelectedProyecto(p);
  };

  const handleCalculateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cotizando) return;
    if (!activeProject) return;
    if (!calcProductoId) {
      showToast('No hay productos con presentación Cuñete en el catálogo para cotizar.', 'error');
      return;
    }
    if (!(Number(calcArea) > 0)) {
      showToast('Indica el área a pintar en m² (mayor a 0).', 'error');
      return;
    }
    setCotizando(true);
    try {
      await calcularYGuardarCotizacion(
        activeProject.proyectoId,
        Number(calcArea),
        Number(calcManos),
        calcProductoId,
        Number(calcDescuento)
      );
    } finally {
      setCotizando(false);
    }
  };

  const handleSendToQuality = async () => {
    if (!activeProject || enviandoCalidad) return;
    setEnviandoCalidad(true);
    try {
      const ok = await cambiarEstadoProyecto(
        activeProject.proyectoId,
        'en_peritaje',
        'El asesor comercial envió el proyecto y la cotización a verificación técnica del perito de calidad.'
      );
      if (ok) showToast('Proyecto enviado a la cola del Perito de Calidad.');
    } finally {
      setEnviandoCalidad(false);
    }
  };

  const puedeEditar = canRole.editarProyecto(currentUser?.rol.rol);
  const puedeEscalar = puedeEditar || currentUser?.rol.rol === 'Perito de Calidad';
  const proyectoCerrado = !!activeProject && ['despachado', 'cancelado'].includes(activeProject.estadoPipeline);
  const admiteCotizacion = !!activeProject && !['despachado', 'cancelado', 'aprobado_calidad'].includes(activeProject.estadoPipeline);
  // El descuento se guarda en el proyecto al cotizar (la tabla de cotizaciones no lo tiene)
  const descuentoQuote = activeProject?.descuentoAsesorPct ?? 0;
  const numeroHistorialEscalados = activeProject?.historialAsesores?.length ?? 0;
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
                      {ESTADO_PROYECTO_LABEL[p.estadoPipeline]}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-500 font-bold">
                      {p.area != null ? `${p.area} m²` : '—'}
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
                    <span className="truncate">Asesor: {p.asesorAsignado?.nombre || 'Sin asignar'}</span>
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
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('es-CO') : '—'}
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
                  {puedeEscalar && !proyectoCerrado && (
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
                  )}

                  {puedeEditar && (activeProject.estadoPipeline === 'en_revision' || activeProject.estadoPipeline === 'cotizado') && (
                  <button
                    onClick={handleSendToQuality}
                    disabled={enviandoCalidad}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border disabled:opacity-60 disabled:cursor-not-allowed ${
                      isLight 
                        ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200' 
                        : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-amber-500" />
                    <span>{enviandoCalidad ? 'Enviando…' : 'Enviar a Revisión Calidad'}</span>
                  </button>
                  )}
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
                        {numeroHistorialEscalados > 0
                          ? `Escalado (${numeroHistorialEscalados} ${numeroHistorialEscalados === 1 ? 'traspaso' : 'traspasos'})`
                          : activeProject.asesorAsignado ? 'Asignación directa' : 'Pendiente de asignar'}
                      </span>
                    </div>
                    <span className={`font-extrabold text-sm block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      {activeProject.asesorAsignado ? `${activeProject.asesorAsignado.nombre} ${activeProject.asesorAsignado.apellido}` : 'Sin asignar'}
                    </span>
                    <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {activeProject.asesorAsignado?.email || '—'} • {activeProject.asesorAsignado?.telefono || '—'}
                    </span>
                  </div>
                </div>

                {puedeEscalar && !proyectoCerrado && (
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
                )}
              </div>

              {/* Key Specs Bar */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl p-4 border ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800/90'
              }`}>
                <div>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Constructora / Cliente</span>
                  <span className={`text-xs font-bold truncate block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeProject.empresa?.razonSocial || '—'}
                  </span>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    NIT: {activeProject.empresa?.nitCedula || '—'}
                  </span>
                </div>

                <div>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Dirección de Despacho</span>
                  <span className={`text-xs font-medium block truncate ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {activeProject.empresa?.direccionDespacho || '—'}
                  </span>
                  <span className="text-[10px] text-emerald-500 font-semibold">
                    {activeProject.empresa?.ciudad?.ciudad || '—'}
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
                      {activeProject.color || '—'}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    HEX: {activeProject.colorHex || '—'}
                  </span>
                </div>

                <div>
                  <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Superficie & Ambiente</span>
                  <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeProject.ambiente || '—'}
                  </span>
                  <span className={`text-[10px] truncate block ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    {activeProject.tipoSuperficie}
                  </span>
                </div>
              </div>

              {/* Imagen enviada por el cliente */}
              <div className={`mt-4 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                <span className={`text-xs font-bold block mb-2 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Imagen enviada por el cliente
                </span>
                {imagenCargando ? (
                  <p className="text-xs text-slate-400">Cargando imagen…</p>
                ) : imagen ? (
                  <img src={imagen} alt="Superficie a intervenir" className="max-h-64 rounded-lg border border-slate-700 object-contain" />
                ) : (
                  <p className="text-xs text-slate-400">Este proyecto no tiene imagen guardada.</p>
                )}

                {activeProject.estadoPipeline === 'imagen_por_corregir' && (
                  <p className="mt-3 text-xs text-rose-400">
                    Se pidió al cliente cambiar la imagen{activeProject.observacionImagen ? `: “${activeProject.observacionImagen}”` : '.'}
                  </p>
                )}

                {puedeEditar && !['despachado', 'cancelado', 'aprobado_calidad'].includes(activeProject.estadoPipeline) && (
                  pidiendoImagen ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={2}
                        value={motivoImagen}
                        onChange={(e) => setMotivoImagen(e.target.value)}
                        placeholder="Dile al cliente qué debe corregir (borrosa, muy oscura, no corresponde a la obra…)"
                        className={`w-full rounded-lg p-3 text-xs focus:outline-none focus:border-emerald-500 border ${
                          isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                        }`}
                      />
                      <div className="flex gap-2">
                        <button type="button" onClick={handlePedirCambioImagen} disabled={pidiendoImagenBusy} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                          {pidiendoImagenBusy ? 'Enviando…' : 'Enviar solicitud al cliente'}
                        </button>
                        <button type="button" onClick={() => { setPidiendoImagen(false); setMotivoImagen(''); }} className="px-3 py-1.5 text-xs rounded-lg border border-slate-700 text-slate-300 cursor-pointer">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setPidiendoImagen(true)} className="mt-3 px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-500/50 text-amber-500 hover:bg-amber-500/10 cursor-pointer">
                      Pedir al cliente otra imagen
                    </button>
                  )
                )}
              </div>
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

              {!puedeEditar ? (
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Solo un Asesor Comercial o un Administrador puede generar cotizaciones.
                </p>
              ) : !admiteCotizacion ? (
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Este proyecto ya avanzó ({ESTADO_PROYECTO_LABEL[activeProject.estadoPipeline]}) y no admite una nueva cotización.
                </p>
              ) : (
              <form onSubmit={handleCalculateQuote} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Área Total a Pintar (m²)
                  </label>
                  <input
                    type="number"
                    value={calcArea}
                    onChange={(e) => setCalcArea(Number(e.target.value))}
                    min={1}
                    step="any"
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
                    {productosCunete.length === 0 && <option value="">Sin productos disponibles</option>}
                    {productosCunete.map(p => (
                      <option key={p.productoId} value={p.productoId}>
                        {p.nombre} ({p.rendimientoM2 ?? '—'} m²/gal)
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
                      disabled={cotizando || !calcProductoId}
                      className="py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex-shrink-0 cursor-pointer shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {cotizando ? 'Calculando…' : 'Calcular'}
                    </button>
                  </div>
                </div>
              </form>
              )}

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
                        {latestQuote.estado || '—'}
                      </span>
                    </div>

                    <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                      {latestQuote.createdAt ? new Date(latestQuote.createdAt).toLocaleString('es-CO') : '—'}
                    </span>
                  </div>

                  {/* Volume Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-lg border text-center ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
                    }`}>
                      <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Galones Teóricos Totales</span>
                      <span className={`text-2xl font-black font-mono mt-0.5 block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        {latestQuote.galonesExactos ?? '—'} <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>gal</span>
                      </span>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Incluye 6% desperdicio de obra</span>
                    </div>

                    <div className={`p-3 rounded-lg border text-center ${
                      isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-emerald-950/40 border-emerald-500/40'
                    }`}>
                      <span className={`text-[11px] font-semibold block ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>Cuñetes a Despachar (5 Gal)</span>
                      <span className="text-2xl font-black text-emerald-500 font-mono mt-0.5 block">
                        {latestQuote.cunetes5g ?? 0} <span className="text-xs font-normal opacity-80">cuñetes</span>
                      </span>
                      <span className={`text-[10px] ${isLight ? 'text-emerald-700' : 'text-emerald-300/70'}`}>{(latestQuote.cunetes5g || 0) * 5} galones en envases grandes</span>
                    </div>

                    <div className={`p-3 rounded-lg border text-center ${
                      isLight ? 'bg-white border-slate-200' : 'bg-slate-950/80 border-slate-800'
                    }`}>
                      <span className={`text-[11px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Galones Sueltos de Ajuste (1 Gal)</span>
                      <span className="text-2xl font-black text-sky-500 font-mono mt-0.5 block">
                        {latestQuote.galones1g ?? 0} <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>galones</span>
                      </span>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Para retoques y recortes</span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className={`p-4 rounded-lg border space-y-2 text-xs ${
                    isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'
                  }`}>
                    <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      <span>Subtotal bruto ({latestQuote.cunetes5g ?? 0} Cuñetes + {latestQuote.galones1g ?? 0} Galones):</span>
                      <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>
                        {latestQuote.subtotal != null && descuentoQuote < 100
                          ? `$${Math.round(latestQuote.subtotal / (1 - descuentoQuote / 100)).toLocaleString('es-CO')} COP`
                          : '—'}
                      </span>
                    </div>

                    {descuentoQuote > 0 && descuentoQuote < 100 && latestQuote.subtotal != null && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                        <span>Descuento Comercial de Asesor ({descuentoQuote}%):</span>
                        <span className="font-mono">
                          - ${Math.round((latestQuote.subtotal / (1 - descuentoQuote / 100)) * (descuentoQuote / 100)).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    )}

                    <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      <span>Subtotal gravable:</span>
                      <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>{latestQuote.subtotal != null ? `$${latestQuote.subtotal.toLocaleString('es-CO')} COP` : '—'}</span>
                    </div>

                    <div className={`flex justify-between ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                      <span>IVA (19% régimen común):</span>
                      <span className={`font-mono ${isLight ? 'text-slate-900 font-semibold' : 'text-white'}`}>{latestQuote.iva != null ? `$${latestQuote.iva.toLocaleString('es-CO')} COP` : '—'}</span>
                    </div>

                    <div className={`flex justify-between text-sm font-bold pt-2 border-t ${
                      isLight ? 'border-slate-200 text-slate-900' : 'border-slate-800 text-white'
                    }`}>
                      <span className="text-emerald-500">Total Liquidado en Obra:</span>
                      <span className="font-mono text-emerald-500 text-base">
                        {latestQuote.total != null ? `$${latestQuote.total.toLocaleString('es-CO')} COP` : '—'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`lg:col-span-8 border rounded-2xl p-8 text-center text-sm ${
            isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#091526] border-slate-800 text-slate-400'
          }`}>
            No hay proyectos registrados todavía.
          </div>
        )}
      </div>

    </div>
  );
};
