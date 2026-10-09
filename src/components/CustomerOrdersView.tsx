import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Proyecto } from '../types/database';
import { PickupReceiptModal } from './PickupReceiptModal';
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
  Layers
} from 'lucide-react';

export const CustomerOrdersView: React.FC = () => {
  const { proyectos, despacharProyecto, theme } = useApp();
  const isLight = theme === 'light';

  // Se guardan solo los ids: el proyecto se lee siempre de la lista viva del contexto
  const [receiptId, setReceiptId] = useState<string | null>(null);
  const [assignId, setAssignId] = useState<string | null>(null);
  const receiptProject = receiptId ? proyectos.find(p => p.proyectoId === receiptId) || null : null;
  const assignDispatchModal = assignId ? proyectos.find(p => p.proyectoId === assignId) || null : null;
  const [dispatching, setDispatching] = useState(false);

  // Dispatch assignment form
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [transportCompany, setTransportCompany] = useState('');
  const [transitHours, setTransitHours] = useState<string>('');

  const dispatchableProjects = proyectos.filter(p => 
    p.estadoPipeline === 'aprobado_calidad' ||
    p.estadoPipeline === 'despachado'
  );

  const handleOpenAssignModal = (p: Proyecto) => {
    // Formulario limpio para cada proyecto
    setDriverName('');
    setDriverPhone('');
    setVehiclePlate('');
    setTransportCompany('');
    setTransitHours('');
    setAssignId(p.proyectoId);
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignDispatchModal || dispatching) return;

    setDispatching(true);
    try {
      const ok = await despacharProyecto(assignDispatchModal.proyectoId, {
        conductorNombre: driverName.trim(),
        conductorTelefono: driverPhone.trim(),
        placaVehiculo: vehiclePlate.trim(),
        transportador: transportCompany.trim(),
        tiempoEstimadoHoras: Number(transitHours),
        direccionEntrega: assignDispatchModal.empresa?.direccionDespacho,
        ciudadEntrega: assignDispatchModal.empresa?.ciudad?.ciudad,
      });
      if (ok) setAssignId(null);
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b1628] border-slate-800 text-white shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-sky-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Truck className="w-4 h-4" />
            Centro de Despacho & Flota de Transporte Metropolitano
          </div>
          <h2 className={`text-2xl md:text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Logística de Despachos en el Valle de Aburrá
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Control de guías de despacho, asignación de vehículos, tiempos de tránsito por municipio y emisión de remisiones con firma en terreno.
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
                      onClick={() => handleOpenAssignModal(p)}
                      className="w-full py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Asignar Vehículo y Despachar</span>
                    </button>
                  ) : (
                    <button
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`border rounded-2xl w-full max-w-lg p-6 shadow-2xl relative ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
          }`}>
            <div className="flex items-center gap-2 text-sky-500 mb-2">
              <Truck className="w-5 h-5" />
              <h3 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Asignación de Transporte & Despacho</h3>
            </div>
            <p className={`text-xs mb-5 leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Asigna vehículo y guía para la entrega de <span className={`font-semibold ${isLight ? 'text-slate-900' : 'text-white'}`}>{assignDispatchModal.nombreProyecto}</span>.
            </p>

            <form onSubmit={handleConfirmDispatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Placa del Vehículo
                  </label>
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 font-mono uppercase focus:outline-none focus:border-emerald-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Tiempo Estimado (Horas)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={12}
                    value={transitHours}
                    onChange={(e) => setTransitHours(e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-emerald-500 border ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Nombre del Conductor
                </label>
                <input
                  type="text"
                  required
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Teléfono / Móvil del Conductor
                </label>
                <input
                  type="text"
                  required
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-semibold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Empresa Transportadora
                </label>
                <input
                  type="text"
                  required
                  value={transportCompany}
                  onChange={(e) => setTransportCompany(e.target.value)}
                  className={`w-full rounded-lg px-3 py-2 focus:outline-none focus:border-emerald-500 border ${
                    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignId(null)}
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
                  disabled={dispatching}
                  className="flex-1 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  {dispatching ? 'Despachando…' : 'Poner en Ruta'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
