import React, { useState, useEffect } from 'react';
import { useApp, canRole } from '../context/AppContext';
import { Proyecto, DiagnosticoIA } from '../types/database';
import { ESTADO_PROYECTO_LABEL } from '../estados';
import { 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Droplets, 
  Activity, 
  FileCheck, 
  Layers, 
  Building2, 
  Clock, 
  Sparkles,
  Award
} from 'lucide-react';

export const QualityReviewModule: React.FC = () => {
  const { 
    proyectos, 
    guardarDiagnosticoCalidad, 
    solicitarCambioImagen,
    obtenerImagenProyecto,
    currentUser, 
    selectedProyecto, 
    setSelectedProyecto, 
    showToast,
    theme
  } = useApp();

  const isLight = theme === 'light';

  const [activeProject, setActiveProject] = useState<Proyecto>(
    selectedProyecto || proyectos.find(p => p.estadoPipeline === 'en_peritaje') || proyectos[0]
  );

  // Foto que subió el cliente + pedido de cambio de imagen
  const [imagen, setImagen] = useState<string | null>(null);
  const [imagenCargando, setImagenCargando] = useState(false);
  const [motivoImagen, setMotivoImagen] = useState('');
  const [pidiendoImagen, setPidiendoImagen] = useState(false);
  const [pidiendoImagenBusy, setPidiendoImagenBusy] = useState(false);
  const [guardandoVeredicto, setGuardandoVeredicto] = useState(false);

  // Cuando llegan datos nuevos del servidor, refresca el proyecto abierto
  useEffect(() => {
    setActiveProject(prev => proyectos.find(p => p.proyectoId === prev?.proyectoId) || prev || proyectos[0]);
  }, [proyectos]);

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

  // Perito evaluation form state
  const existingDiag = activeProject?.diagnostico;
  // null = el perito todavía no ha registrado la medición (no se inventa un valor)
  const [humedad, setHumedad] = useState<number | null>(existingDiag?.humedadRelativa ?? null);
  const [fisuras, setFisuras] = useState<NonNullable<DiagnosticoIA['severidadFisuras']>>(
    existingDiag?.severidadFisuras || 'Sin fisuras'
  );
  const [patologia, setPatologia] = useState<string>(existingDiag?.patologiaDetectada || '');
  const [sistema, setSistema] = useState<string>(existingDiag?.sistemaRecomendado || '');
  const [notasPerito, setNotasPerito] = useState<string>(existingDiag?.notasPerito || '');

  // Cada vez que cambia el proyecto abierto, el formulario muestra SOLO los datos de ese proyecto
  useEffect(() => {
    const d = activeProject?.diagnostico;
    setHumedad(d?.humedadRelativa ?? null);
    setFisuras(d?.severidadFisuras || 'Sin fisuras');
    setPatologia(d?.patologiaDetectada || '');
    setSistema(d?.sistemaRecomendado || '');
    setNotasPerito(d?.notasPerito || '');
  }, [activeProject?.proyectoId]);

  const handleSelectProject = (p: Proyecto) => {
    setActiveProject(p);
    setSelectedProyecto(p);
  };

  const proyectoCerrado = !!activeProject && ['despachado', 'cancelado'].includes(activeProject.estadoPipeline);

  const handleSaveVerdict = async (aprobado: boolean) => {
    if (!activeProject || guardandoVeredicto) return;
    if (humedad == null) {
      showToast('Registra la medición de humedad del muro antes de emitir el dictamen.', 'error');
      return;
    }
    setGuardandoVeredicto(true);
    try {
      await guardarDiagnosticoCalidad(activeProject.proyectoId, {
        humedadRelativa: Number(humedad),
        severidadFisuras: fisuras,
        patologiaDetectada: patologia.trim() || undefined,
        sistemaRecomendado: sistema.trim() || undefined,
        notasPerito,
        aprobadoCalidad: aprobado,
      });
    } finally {
      setGuardandoVeredicto(false);
    }
  };

  const getHumidityStatus = (val: number) => {
    if (val < 10) return { label: 'Óptimo para Pintar (<10%)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
    if (val <= 14) return { label: 'Precaución (10% - 14%)', color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
    return { label: 'Crítico / No Apto (>14%)', color: 'text-rose-400 bg-rose-950/60 border-rose-500/40' };
  };

  const humStatus = humedad != null
    ? getHumidityStatus(humedad)
    : { label: 'Sin medición', color: 'text-slate-400 bg-slate-900/60 border-slate-600/40' };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#091526] border-slate-800 text-white shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-amber-500 text-xs font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Control de Calidad Técnica & Laboratorio en Terreno
          </div>
          <h2 className={`text-2xl md:text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Validación de Sustrato & Dictamen de Perito
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Inspección rigurosa de humedad relativa, fisuración y compatibilidad química antes de la tintometría y el despacho de cuñetes.
          </p>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs border ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-700/80'
        }`}>
          <Award className="w-4 h-4 text-emerald-500" />
          <div>
            <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Perito en Turno:</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{currentUser?.nombre} ({currentUser?.rol.rol})</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Projects Queue on Left (4 cols), Inspection Lab on Right (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Queue of Projects */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Cola de Proyectos ({proyectos.length})
            </span>
          </div>

          <div className="space-y-2.5 max-h-[750px] overflow-y-auto pr-1">
            {proyectos.map((p) => {
              const isSelected = activeProject?.proyectoId === p.proyectoId;
              const isPending = p.estadoPipeline === 'en_peritaje';
              const diag = p.diagnostico;

              return (
                <div
                  key={p.proyectoId}
                  onClick={() => handleSelectProject(p)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? 'bg-amber-50/70 border-amber-500 shadow-sm'
                        : 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-500/10'
                      : isLight
                        ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        : 'bg-[#091526] border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    {isPending ? (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 animate-pulse ${
                        isLight ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                      }`}>
                        <Clock className="w-3 h-3" />
                        Requiere Dictamen
                      </span>
                    ) : (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                        isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {ESTADO_PROYECTO_LABEL[p.estadoPipeline]}
                      </span>
                    )}

                    {diag?.aprobadoCalidad ? (
                      <span className="text-[10px] font-semibold text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Aprobado
                      </span>
                    ) : diag?.fechaVeredicto ? (
                      <span className="text-[10px] font-semibold text-rose-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Con Reparos
                      </span>
                    ) : null}
                  </div>

                  <h4 className={`text-sm font-bold leading-snug line-clamp-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {p.nombreProyecto}
                  </h4>

                  <div className={`flex items-center gap-1.5 text-xs mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{p.empresa?.razonSocial}</span>
                  </div>

                  <div className={`flex items-center justify-between text-xs mt-3 pt-2.5 border-t ${
                    isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800/80 text-slate-400'
                  }`}>
                    <span className={`font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      {p.ambiente || '—'} ({p.area != null ? `${p.area} m²` : '— m²'})
                    </span>
                    <span className="font-mono text-emerald-500 text-[11px]">
                      {diag?.humedadRelativa != null ? `${diag.humedadRelativa}% Hum.` : 'Sin Medición'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Technical Inspection Console */}
        {activeProject ? (
          <div className="lg:col-span-8 space-y-6">
            
            {/* Top Project Badge */}
            <div className={`border rounded-2xl p-6 shadow-sm transition-all ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#091526] border-slate-800 text-white shadow-xl'
            }`}>
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs text-amber-500 font-semibold tracking-wider uppercase block">
                    Protocolo de Calidad NTC 1335
                  </span>
                  <h3 className={`text-xl md:text-2xl font-bold mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {activeProject.nombreProyecto}
                  </h3>
                  <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Cliente: <span className={`font-medium ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{activeProject.empresa?.razonSocial || '—'}</span> • Dirección: <span className={isLight ? 'text-slate-700' : 'text-slate-200'}>{activeProject.empresa?.direccionDespacho || '—'}</span>
                  </p>
                </div>

                {activeProject.diagnostico?.aprobadoCalidad ? (
                  <div className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-2 ${
                    isLight 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                      : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>CERTIFICADO APROBADO</span>
                  </div>
                ) : (
                  <div className={`px-3.5 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-2 ${
                    isLight 
                      ? 'bg-amber-50 text-amber-800 border-amber-300' 
                      : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                  }`}>
                    <Clock className="w-4 h-4 text-amber-500 animate-spin" />
                    <span>EN AUDITORÍA TÉCNICA</span>
                  </div>
                )}
              </div>

              {/* Imagen enviada por el cliente */}
              <div className={`border rounded-xl p-4 mb-5 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                <span className={`text-xs font-bold block mb-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Imagen enviada por el cliente
                </span>
                {imagenCargando ? (
                  <p className="text-xs text-slate-400">Cargando imagen…</p>
                ) : imagen ? (
                  <img src={imagen} alt="Superficie a intervenir" className="max-h-72 rounded-lg border border-slate-700 object-contain" />
                ) : (
                  <p className="text-xs text-slate-400">Este proyecto no tiene imagen guardada.</p>
                )}

                {activeProject.estadoPipeline === 'imagen_por_corregir' && (
                  <p className="mt-3 text-xs text-rose-400">
                    Se pidió al cliente cambiar la imagen{activeProject.observacionImagen ? `: “${activeProject.observacionImagen}”` : '.'}
                  </p>
                )}

                {canRole.emitirVeredicto(currentUser?.rol.rol) && !['despachado', 'cancelado', 'aprobado_calidad'].includes(activeProject.estadoPipeline) && (
                  pidiendoImagen ? (
                    <div className="mt-3 space-y-2">
                      <textarea
                        rows={2}
                        value={motivoImagen}
                        onChange={(e) => setMotivoImagen(e.target.value)}
                        placeholder="Dile al cliente qué debe corregir (borrosa, muy oscura, no se ve la fisura…)"
                        className={`w-full rounded-lg p-3 text-xs focus:outline-none focus:border-amber-500 border ${
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

              {/* Physical Parameters Form */}
              <div className={`space-y-5 pt-3 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                
                {/* 1. Medición de Humedad Relativa */}
                <div className={`border rounded-xl p-4 ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <label className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                      <Droplets className="w-4 h-4 text-sky-500" />
                      Medición Higrométrica de Humedad en Muro (%)
                    </label>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md border font-mono ${humStatus.color}`}>
                      {humStatus.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3">
                    <input
                      type="range"
                      min={2}
                      max={24}
                      step={0.1}
                      value={humedad ?? 2}
                      onChange={(e) => setHumedad(Number(e.target.value))}
                      className="flex-1 accent-emerald-500 h-2 bg-slate-300 dark:bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <div className={`w-20 border rounded-lg py-1 px-2 text-center font-mono font-bold text-lg ${
                      isLight ? 'bg-white border-slate-300 text-emerald-600' : 'bg-slate-950 border-slate-700 text-emerald-400'
                    }`}>
                      {humedad != null ? `${humedad}%` : '—'}
                    </div>
                  </div>
                  <p className={`text-[11px] mt-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Pinturas vinílicas y acrílicas exigen humedad &lt;12%. Recubrimientos epóxicos de pisos exigen &lt;5%.
                  </p>
                </div>

                {/* 2. Fisuración y Sustrato */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Severidad de Fisuras en el Sustrato
                    </label>
                    <select
                      value={fisuras}
                      onChange={(e) => setFisuras(e.target.value as any)}
                      className={`w-full rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    >
                      <option value="Sin fisuras">Sin fisuras (Sustrato liso y firme)</option>
                      <option value="Fisuración capilar <0.2mm">Fisuración capilar &lt;0.2mm (Tratable con elastómero)</option>
                      <option value="Fisura activa 0.5-1mm">Fisura activa 0.5-1mm (Requiere masilla elastomérica)</option>
                      <option value="Grieta estructural >2mm">Grieta estructural &gt;2mm (Requiere intervención civil)</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      Diagnóstico de Patología Detectada
                    </label>
                    <input
                      type="text"
                      value={patologia}
                      onChange={(e) => setPatologia(e.target.value)}
                      placeholder="ej. Porosidad media por intemperismo en fachada sur"
                      className={`w-full rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 border ${
                        isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                  </div>
                </div>

                {/* 3. Sistema Técnico Recomendado */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Sistema Técnico Homologado por el Perito
                  </label>
                  <input
                    type="text"
                    value={sistema}
                    onChange={(e) => setSistema(e.target.value)}
                    placeholder="ej. 1 Mano Imprimante Antialcalino + 2 Manos Elastómero Fachadas"
                    className={`w-full rounded-lg px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                {/* 4. Notas del Perito */}
                <div>
                  <label className={`block text-xs font-semibold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Dictamen Técnico & Notas Oficiales de Inspección
                  </label>
                  <textarea
                    rows={3}
                    value={notasPerito}
                    onChange={(e) => setNotasPerito(e.target.value)}
                    placeholder="Escribe las consideraciones técnicas para el aplicador de obra y el despacho..."
                    className={`w-full rounded-lg p-3 text-xs focus:outline-none focus:border-amber-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                {/* Digital Stamp Certificate info */}
                <div className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
                }`}>
                  <div className="flex items-center gap-2.5">
                    <FileCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                      <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                        Firma Digital del Perito Responsable
                      </span>
                      <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {existingDiag?.peritoNombre || (currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : '')} • ColorLink S.A.S.
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    ID Registro: {existingDiag?.diagnosticoId || 'PENDIENTE-EMISIÓN'}
                  </span>
                </div>

                {/* Verdict Buttons */}
                {canRole.emitirVeredicto(currentUser?.rol.rol) && proyectoCerrado ? (
                  <p className="pt-2 text-xs text-slate-400">Este proyecto ya está cerrado ({ESTADO_PROYECTO_LABEL[activeProject.estadoPipeline]}); no admite un nuevo dictamen.</p>
                ) : canRole.emitirVeredicto(currentUser?.rol.rol) ? (
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => handleSaveVerdict(false)}
                    disabled={guardandoVeredicto}
                    className="disabled:opacity-60 disabled:cursor-not-allowed flex-1 py-3 px-4 bg-rose-950/40 hover:bg-rose-950 border border-rose-600/50 text-rose-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>{guardandoVeredicto ? 'Guardando…' : 'Rechazar Sustrato / Solicitar Corrección'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSaveVerdict(true)}
                    disabled={guardandoVeredicto}
                    className="disabled:opacity-60 disabled:cursor-not-allowed flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>{guardandoVeredicto ? 'Guardando…' : 'Aprobar Sustrato y Autorizar Despacho'}</span>
                  </button>
                </div>
                ) : (
                  <p className="pt-2 text-xs text-slate-400">Solo el Perito de Calidad o un Administrador puede emitir el dictamen.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className={`lg:col-span-8 border rounded-2xl p-8 text-center text-sm ${
            isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#091526] border-slate-800 text-slate-400'
          }`}>
            No hay proyectos en la cola de calidad.
          </div>
        )}
      </div>
    </div>
  );
};
