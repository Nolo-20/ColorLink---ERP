import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Proyecto } from '../types/database';
import { PickupReceiptModal } from './PickupReceiptModal';
import { ModalBackdrop, FieldError, bordeCampo } from './ui';
import {
  PLACA_RE, limpiarPlaca, GUIA_RE, limpiarGuia, limpiarLetras, soloDigitos, errorNombrePersona, errorCelular,
  errorTexto, errorRango, aNumero, normalizarTexto,
} from '../validation';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  FileText, 
  User, 
  Phone, 
  Building2, 
  Send,
  Navigation,
  X
} from 'lucide-react';

const CONDUCTOR_MIN = 3;
const CONDUCTOR_MAX = 60;
const TRANSPORTADOR_MAX = 60;
const DIRECCION_MIN = 5;
const DIRECCION_MAX = 120;
const HORAS_MIN = 1;
const HORAS_MAX = 240;

type CampoDespacho = 'guia' | 'placa' | 'horas' | 'conductor' | 'telefono' | 'transportador' | 'direccion' | 'ciudad';

export const CustomerOrdersView: React.FC = () => {
  const { proyectos, despacharProyecto, inventarios, ciudades, theme } = useApp();
  const isLight = theme === 'light';

  // Se guardan solo los ids: el proyecto se lee siempre de la lista viva del contexto
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const receiptProject = receiptId ? proyectos.find(p => p.proyectoId === receiptId) || null : null;
  const assignDispatchModal = assignId ? proyectos.find(p => p.proyectoId === assignId) || null : null;
  const [dispatching, setDispatching] = useState(false);

  // Formulario de despacho
  const [guia, setGuia] = useState('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [transportCompany, setTransportCompany] = useState('');
  const [transitHours, setTransitHours] = useState<string>('');
  const [bodegaOrigen, setBodegaOrigen] = useState('');
  const [direccion, setDireccion] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [touched, setTouched] = useState<Partial<Record<CampoDespacho, boolean>>>({});

  const bodegas = useMemo(
    () => Array.from(new Set(inventarios.map(i => i.nombreBodega).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [inventarios],
  );
  const ciudadOptions = useMemo(() => {
    const set = new Set(ciudades.map(c => c.ciudad));
    if (ciudad) set.add(ciudad);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [ciudades, ciudad]);

  const dispatchableProjects = proyectos.filter(p =>
    p.estadoPipeline === 'aprobado_calidad' ||
    p.estadoPipeline === 'despachado'
  );

  const handleOpenAssignModal = (p: Proyecto) => {
    // Formulario limpio para cada proyecto, con el destino que registró el cliente
    setGuia('');
    setDriverName('');
    setDriverPhone('');
    setVehiclePlate('');
    setTransportCompany('');
    setTransitHours('');
    setBodegaOrigen('');
    setDireccion((p.empresa?.direccionDespacho || '').slice(0, DIRECCION_MAX));
    setCiudad(p.empresa?.ciudad?.ciudad || '');
    setTouched({});
    setAssignId(p.proyectoId);
  };

  const errors: Partial<Record<CampoDespacho, string>> = {};
  if (guia && !GUIA_RE.test(guia)) errors.guia = 'La guía debe tener entre 4 y 30 letras, números o guiones.';
  if (!vehiclePlate) errors.placa = 'La placa es obligatoria.';
  else if (!PLACA_RE.test(vehiclePlate)) errors.placa = 'Placa no válida: carro ABC123 o moto ABC12D.';
  const eh = errorRango(transitHours, 'El tiempo estimado', { min: HORAS_MIN, max: HORAS_MAX, entero: true, unidad: 'horas' });
  if (eh) errors.horas = eh;
  const ec = errorNombrePersona(driverName, 'El nombre del conductor', CONDUCTOR_MIN, CONDUCTOR_MAX);
  if (ec) errors.conductor = ec;
  const et = errorCelular(driverPhone, 'El celular del conductor', true);
  if (et) errors.telefono = et;
  const etr = errorTexto(transportCompany, 'La transportadora', { min: 2, max: TRANSPORTADOR_MAX, requerido: true, femenino: true });
  if (etr) errors.transportador = etr;
  const ed = errorTexto(direccion, 'La dirección de entrega', { min: DIRECCION_MIN, max: DIRECCION_MAX, requerido: true, femenino: true });
  if (ed) errors.direccion = ed;
  if (!ciudad.trim()) errors.ciudad = 'Selecciona la ciudad de entrega.';
  const hayErrores = Object.keys(errors).length > 0;
  const err = (c: CampoDespacho) => (touched[c] ? errors[c] : undefined);
  const touch = (c: CampoDespacho) => setTouched(t => (t[c] ? t : { ...t, [c]: true }));

  const cerrarDespacho = () => { if (!dispatching) setAssignId(null); };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDispatchModal || dispatching) return;
    if (hayErrores) {
      setTouched({ guia: true, placa: true, horas: true, conductor: true, telefono: true, transportador: true, direccion: true, ciudad: true });
      return;
    }

    setDispatching(true);
    try {
      const ok = await despacharProyecto(assignDispatchModal.proyectoId, {
        numeroGuia: guia || undefined, // vacío: el servidor genera la guía
        conductorNombre: normalizarTexto(driverName),
        conductorTelefono: driverPhone,
        placaVehiculo: vehiclePlate,
        transportador: normalizarTexto(transportCompany),
        tiempoEstimadoHoras: aNumero(transitHours) as number,
        bodegaOrigen: bodegaOrigen || undefined,
        direccionEntrega: normalizarTexto(direccion),
        ciudadEntrega: ciudad.trim(),
      });
      if (ok) setAssignId(null);
    } finally {
      setDispatching(false);
    }
  };

  const labelCls = `block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`;
  const inputCls = (c: CampoDespacho, extra = '') => `w-full rounded-lg px-3 py-2 focus:outline-none border ${bordeCampo(err(c), isLight)} ${
    isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'
  } ${extra}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b1628] border-slate-800 text-white shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-sky-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            Centro de Despacho a Obra
          </div>
          <h2 className={`text-2xl md:text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Logística de Despachos a Obra
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Proyectos aprobados por Calidad listos para salir, asignación de vehículo y conductor, remisión y confirmación de entrega en obra.
          </p>
        </div>

        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs border ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700/80 text-white'
        }`}>
          <Navigation className="w-4 h-4 text-emerald-500" />
          <div>
            <span className={`block text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Despachos en curso:</span>
            <span className={`font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {dispatchableProjects.filter(p => p.estadoPipeline === 'aprobado_calidad').length} por despachar •{' '}
              {dispatchableProjects.filter(p => p.estadoPipeline === 'despachado' && !p.despacho?.fechaEntrega).length} en ruta
            </span>
          </div>
        </div>
      </div>

      {/* Orders in Transit / Ready for Dispatch */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {dispatchableProjects.length === 0 ? (
          <div className={`col-span-full border rounded-2xl p-12 text-center ${
            isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#091526] border-slate-800 text-slate-400'
          }`}>
            <Truck className={`w-10 h-10 mx-auto mb-3 ${isLight ? 'text-slate-400' : 'text-slate-600'}`} />
            <p className={`font-bold text-base ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>No hay pedidos pendientes de despacho.</p>
            <p className={`text-xs mt-1 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Los proyectos aparecerán aquí una vez aprobados técnicamente por Calidad.
            </p>
          </div>
        ) : (
          dispatchableProjects.map((p) => {
            const isEnRuta = p.estadoPipeline === 'despachado' && !p.despacho?.fechaEntrega;
            const isDelivered = p.estadoPipeline === 'despachado' && !!p.despacho?.fechaEntrega;
            const isAlistamiento = p.estadoPipeline === 'aprobado_calidad';
            const d = p.despacho;
            const latestQuote = p.cotizaciones && p.cotizaciones[0];

            return (
              <div 
                key={p.proyectoId}
                className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                  isLight 
                    ? 'bg-white border-slate-200 hover:border-slate-300 shadow-sm' 
                    : 'bg-[#091526] border-slate-800 hover:border-slate-700 shadow-lg'
                }`}
              >
                <div>
                  {/* Status Tag */}
                  <div className="flex items-center justify-between mb-3">
                    {isEnRuta && (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                        isLight ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-orange-950/80 text-orange-300 border-orange-500/50 animate-pulse'
                      }`}>
                        <Truck className="w-3.5 h-3.5" />
                        En Tránsito por Obra
                      </span>
                    )}
                    {isDelivered && (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                        isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      }`}>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Entregado a Conformidad
                      </span>
                    )}
                    {isAlistamiento && (
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                        isLight ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        En Bodega (Listo para Despacho)
                      </span>
                    )}

                    <span className="text-[11px] font-mono text-sky-500 font-bold">
                      {d?.numeroGuia || 'GUÍA-PENDIENTE'}
                    </span>
                  </div>

                  <h3 className={`text-base font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {p.nombreProyecto}
                  </h3>

                  <div className={`flex items-center gap-1.5 text-xs mb-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{p.empresa?.razonSocial || '—'}</span>
                  </div>

                  {/* Destination & Volume */}
                  <div className={`rounded-xl p-3 border space-y-2 mb-3 text-xs ${
                    isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
                  }`}>
                    <div className={`flex items-start gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                      <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">
                        {(d?.direccionEntrega || p.empresa?.direccionDespacho) || 'Sin dirección registrada'}
                        {(d?.ciudadEntrega || p.empresa?.ciudad?.ciudad) ? ` (${d?.ciudadEntrega || p.empresa?.ciudad?.ciudad})` : ''}
                      </span>
                    </div>

                    <div className={`flex items-center justify-between text-[11px] pt-1 border-t ${
                      isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
                    }`}>
                      <span>Carga en Obra:</span>
                      <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {latestQuote
                          ? `${latestQuote.cunetes5g ?? 0} Cuñetes (5G) + ${latestQuote.galones1g ?? 0} Gal (1G)`
                          : 'Sin cotización'}
                      </span>
                    </div>
                  </div>

                  {/* Vehicle details */}
                  {d && (
                    <div className={`rounded-xl p-3 border space-y-1.5 text-xs mb-4 ${
                      isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950/70 border-slate-800/80 text-slate-300'
                    }`}>
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Vehículo:</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{d.placaVehiculo || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Conductor:</span>
                        <span className={isLight ? 'text-slate-800' : 'text-slate-200'}>{d.conductorNombre || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Contacto:</span>
                        <span className="font-mono">{d.conductorTelefono || '—'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className={`pt-3 border-t flex flex-col gap-2 ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
                  {isAlistamiento ? (
                    <button
                      type="button"
                      onClick={() => handleOpenAssignModal(p)}
                      className="w-full py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Asignar Vehículo y Despachar</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReceiptId(p.proyectoId)}
                      className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isDelivered ? 'Ver Remisión' : 'Ver Remisión & Confirmar Entrega'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ASSIGN DISPATCH MODAL */}
      {assignDispatchModal && (
        <ModalBackdrop onClose={cerrarDespacho} bloqueado={dispatching} label="Asignación de transporte y despacho">
          <div className={`border rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative my-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
          }`}>
            <button
              type="button"
              onClick={cerrarDespacho}
              aria-label="Cerrar"
              className={`absolute top-4 right-4 p-1 rounded-lg cursor-pointer ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sky-500 mb-2 pr-8">
              <Truck className="w-5 h-5 flex-shrink-0" />
              <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Asignación de Transporte & Despacho</h3>
            </div>
            <p className={`text-xs mb-5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Asigna vehículo y guía para la entrega de <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{assignDispatchModal.nombreProyecto}</span>.
            </p>

            <form onSubmit={handleConfirmDispatch} noValidate className="space-y-4 text-xs" data-testid="dispatch-form">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dsp-placa" className={labelCls}>Placa del vehículo *</label>
                  <input
                    id="dsp-placa"
                    type="text"
                    autoComplete="off"
                    maxLength={6}
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(limpiarPlaca(e.target.value))}
                    onBlur={() => touch('placa')}
                    aria-invalid={!!err('placa')}
                    placeholder="ABC123"
                    className={inputCls('placa', 'font-mono uppercase')}
                  />
                  <FieldError msg={err('placa')} />
                </div>

                <div>
                  <label htmlFor="dsp-horas" className={labelCls}>Tiempo estimado (horas) *</label>
                  <input
                    id="dsp-horas"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={3}
                    value={transitHours}
                    onChange={(e) => setTransitHours(soloDigitos(e.target.value, 3))}
                    onBlur={() => touch('horas')}
                    aria-invalid={!!err('horas')}
                    placeholder="Ej. 4"
                    className={inputCls('horas', 'font-mono')}
                  />
                  <FieldError msg={err('horas')} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dsp-conductor" className={labelCls}>Nombre del conductor *</label>
                  <input
                    id="dsp-conductor"
                    type="text"
                    autoComplete="off"
                    maxLength={CONDUCTOR_MAX}
                    value={driverName}
                    onChange={(e) => setDriverName(limpiarLetras(e.target.value, CONDUCTOR_MAX))}
                    onBlur={() => touch('conductor')}
                    aria-invalid={!!err('conductor')}
                    className={inputCls('conductor')}
                  />
                  <FieldError msg={err('conductor')} />
                </div>

                <div>
                  <label htmlFor="dsp-telefono" className={labelCls}>Celular del conductor *</label>
                  <input
                    id="dsp-telefono"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(soloDigitos(e.target.value, 10))}
                    onBlur={() => touch('telefono')}
                    aria-invalid={!!err('telefono')}
                    placeholder="3001234567"
                    className={inputCls('telefono', 'font-mono')}
                  />
                  <FieldError msg={err('telefono')} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dsp-transportador" className={labelCls}>Empresa transportadora *</label>
                  <input
                    id="dsp-transportador"
                    type="text"
                    autoComplete="off"
                    maxLength={TRANSPORTADOR_MAX}
                    value={transportCompany}
                    onChange={(e) => setTransportCompany(e.target.value.slice(0, TRANSPORTADOR_MAX))}
                    onBlur={() => touch('transportador')}
                    aria-invalid={!!err('transportador')}
                    placeholder="Ej. Flota propia"
                    className={inputCls('transportador')}
                  />
                  <FieldError msg={err('transportador')} />
                </div>

                <div>
                  <label htmlFor="dsp-guia" className={labelCls}>Número de guía (opcional)</label>
                  <input
                    id="dsp-guia"
                    type="text"
                    autoComplete="off"
                    maxLength={30}
                    value={guia}
                    onChange={(e) => setGuia(limpiarGuia(e.target.value))}
                    onBlur={() => touch('guia')}
                    aria-invalid={!!err('guia')}
                    placeholder="Se genera automáticamente"
                    className={inputCls('guia', 'font-mono uppercase')}
                  />
                  <FieldError msg={err('guia')} />
                </div>
              </div>

              <div>
                <label htmlFor="dsp-direccion" className={labelCls}>Dirección de entrega *</label>
                <input
                  id="dsp-direccion"
                  type="text"
                  autoComplete="off"
                  maxLength={DIRECCION_MAX}
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value.slice(0, DIRECCION_MAX))}
                  onBlur={() => touch('direccion')}
                  aria-invalid={!!err('direccion')}
                  placeholder="Ej. Cra 43A # 1-50, obra torre 2"
                  className={inputCls('direccion')}
                />
                <FieldError msg={err('direccion')} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="dsp-ciudad" className={labelCls}>Ciudad de entrega *</label>
                  <select
                    id="dsp-ciudad"
                    value={ciudad}
                    onChange={(e) => { setCiudad(e.target.value); touch('ciudad'); }}
                    onBlur={() => touch('ciudad')}
                    aria-invalid={!!err('ciudad')}
                    className={inputCls('ciudad', 'cursor-pointer')}
                  >
                    <option value="">Selecciona la ciudad</option>
                    {ciudadOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <FieldError msg={err('ciudad')} />
                </div>

                <div>
                  <label htmlFor="dsp-bodega" className={labelCls}>Bodega de origen (opcional)</label>
                  <select
                    id="dsp-bodega"
                    value={bodegaOrigen}
                    onChange={(e) => setBodegaOrigen(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 focus:outline-none border cursor-pointer ${bordeCampo('', isLight)} ${
                      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'
                    }`}
                  >
                    <option value="">Sin especificar</option>
                    {bodegas.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>

              {hayErrores && (
                <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`} data-testid="pending-fields">
                  Completa correctamente los campos marcados con * para poner el pedido en ruta.
                </p>
              )}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarDespacho}
                  className={`flex-1 py-2.5 font-semibold rounded-lg transition-colors cursor-pointer border ${
                    isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={dispatching || hayErrores}
                  className="flex-1 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {dispatching ? 'Despachando…' : 'Poner en Ruta'}
                </button>
              </div>
            </form>
          </div>
        </ModalBackdrop>
      )}

      {/* RECEIPT MODAL */}
      {receiptProject && (
        <PickupReceiptModal
          key={receiptProject.proyectoId}
          proyecto={receiptProject}
          onClose={() => setReceiptId(null)}
        />
      )}
    </div>
  );
};
