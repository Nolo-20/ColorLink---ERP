import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  QrCode, 
  CheckCircle2, 
  X, 
  MapPin, 
  Search, 
  Building2, 
  AlertCircle, 
  Package, 
  ShieldCheck, 
  User, 
  Clock 
} from 'lucide-react';
import { PedidoTienda } from '../types/database';

export const PickupRedeemScannerModal: React.FC = () => {
  const { 
    redeemModalOpen, 
    setRedeemModalOpen, 
    canjearCodigoRetiro, 
    pedidos, 
    sucursales, 
    currentUser 
  } = useApp();

  const [inputCode, setInputCode] = useState('RET-8421');
  const [selectedSucursal, setSelectedSucursal] = useState(sucursales[0].nombre);
  const [resultPedido, setResultPedido] = useState<PedidoTienda | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!redeemModalOpen) return null;

  const handleSearchAndValidate = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanCode = inputCode.trim().toUpperCase();
    const found = pedidos.find(p => 
      p.codigoRetiro?.toUpperCase() === cleanCode || 
      p.qrCodeData?.toUpperCase().includes(cleanCode) ||
      p.pedidoId.toUpperCase() === cleanCode
    );

    if (!found) {
      setErrorMessage(`No se encontró ningún pedido con el código "${inputCode}". Verifica con el cliente.`);
      setResultPedido(null);
      return;
    }

    setResultPedido(found);
  };

  const handleConfirmRedemption = () => {
    if (!resultPedido) return;
    const res = canjearCodigoRetiro(inputCode, selectedSucursal);
    if (res.success) {
      setSuccessMessage(res.message);
      if (res.pedido) {
        setResultPedido(res.pedido);
      }
    } else {
      setErrorMessage(res.message);
    }
  };

  // Find orders currently waiting for pickup
  const waitingPickupOrders = pedidos.filter(p => p.modalidadEntrega === 'recogida_sucursal' && p.estadoPedido === 'listo_sucursal');

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b172a] border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Canje de Retiro en Sucursal / Escáner QR</h3>
              <p className="text-xs text-slate-400">
                Validación de código de entrega para clientes que seleccionaron recogida en tienda.
              </p>
            </div>
          </div>

          <button
            onClick={() => setRedeemModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-5 my-4 pr-1 flex-1">
          
          {/* Branch Selector */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <label className="block text-xs font-bold text-slate-300 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>Sucursal ColorLink de Atención Actual:</span>
            </label>
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-medium"
            >
              {sucursales.map(s => (
                <option key={s.id} value={s.nombre}>
                  {s.nombre} — {s.direccion} ({s.ciudad})
                </option>
              ))}
            </select>
          </div>

          {/* Code Search Input Form */}
          <form onSubmit={handleSearchAndValidate} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Ingresa el Código de Retiro del Cliente o Escanea QR
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    required
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value)}
                    placeholder="ej. RET-8421 o escanea el QR"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-emerald-300 focus:outline-none focus:border-emerald-500 uppercase"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Search className="w-4 h-4" />
                  <span>Verificar</span>
                </button>
              </div>
            </div>

            {/* Quick Test Codes Pill Buttons */}
            {waitingPickupOrders.length > 0 && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold block mb-1.5 text-[11px]">
                  Códigos pendientes de retiro para pruebas rápidas:
                </span>
                <div className="flex flex-wrap gap-2">
                  {waitingPickupOrders.map(p => (
                    <button
                      key={p.pedidoId}
                      type="button"
                      onClick={() => {
                        setInputCode(p.codigoRetiro || p.pedidoId);
                        setResultPedido(p);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {p.codigoRetiro} ({p.pedidoId} - {p.clienteNombre.split(' ')[0]})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-600/50 text-rose-300 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-200 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Validated Order Card */}
          {resultPedido && (
            <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl p-5 space-y-4 shadow-xl">
              
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <span className="font-extrabold text-sm text-white">Pedido #{resultPedido.pedidoId}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                    resultPedido.estadoPedido === 'entregado_recogido'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                      : 'bg-amber-950 text-amber-300 border-amber-500/50 animate-pulse'
                  }`}>
                    {resultPedido.estadoPedido === 'entregado_recogido' ? 'Ya Reclamado / Entregado' : 'Listo para Retiro en Sucursal'}
                  </span>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400">
                  Total Pagado: ${resultPedido.total.toLocaleString('es-CO')} COP
                </span>
              </div>

              {/* Client & Branch Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cliente / Reclama</span>
                  <p className="font-bold text-white text-xs">{resultPedido.clienteNombre}</p>
                  <p className="text-slate-400">{resultPedido.clienteDoc || 'Doc: Verificado'}</p>
                  <p className="text-slate-400">Tel: {resultPedido.clienteTelefono}</p>
                  {resultPedido.empresaNombre && (
                    <p className="text-emerald-400 text-[11px] font-medium">{resultPedido.empresaNombre}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sucursal de Retiro Seleccionada</span>
                  <p className="font-bold text-white text-xs">{resultPedido.sucursalRetiro}</p>
                  <p className="text-slate-400">Método de Pago: <strong className="text-slate-200">{resultPedido.metodoPago}</strong></p>
                  <p className="text-slate-400">Código Asignado: <strong className="font-mono text-emerald-400">{resultPedido.codigoRetiro}</strong></p>
                </div>
              </div>

              {/* Items List to Hand Over */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  Productos a Entregar en Mostrador ({resultPedido.items.length})
                </span>
                <div className="space-y-2">
                  {resultPedido.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {item.imagenUrl ? (
                            <img src={item.imagenUrl} alt={item.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <span className="font-bold text-white block">{item.nombre}</span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {item.presentacion} {item.color && `• Color: ${item.color}`}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-emerald-400 block">
                          Cant: {item.cantidad}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ${item.total.toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Confirm Delivery */}
              {resultPedido.estadoPedido !== 'entregado_recogido' ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmRedemption}
                    className="w-full py-3.5 bg-[#00D285] hover:bg-[#00c078] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span>Confirmar Entrega en Mostrador y Finalizar Pedido</span>
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                    Responsable de la entrega: <strong className="text-white">{currentUser?.nombre} ({currentUser?.rol.rol})</strong>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-emerald-300 font-bold">
                    ✓ Entregado por {resultPedido.canjeadoPor || 'Cajero'} en {resultPedido.canjeadoEnSucursal || selectedSucursal}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {resultPedido.fechaCanje ? new Date(resultPedido.fechaCanje).toLocaleString('es-CO') : 'Canjeado'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            onClick={() => setRedeemModalOpen(false)}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Escáner
          </button>
        </div>
      </div>
    </div>
  );
};
