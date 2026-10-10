import React, { useState, useEffect } from 'react';
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
import { ModalBackdrop, FieldError } from './ui';
import { normalizarCodigoRetiro } from '../validation';

const CODIGO_MAX = 40;
const ERROR_FORMATO = 'El código debe tener 8 caracteres (números y letras de la A a la F), el número de pedido CL-XXXXXXXX o el QR completo.';

export const PickupRedeemScannerModal: React.FC = () => {
  const { 
    redeemModalOpen, 
    setRedeemModalOpen, 
    canjearCodigoRetiro, 
    pedidos, 
    currentUser,
    refreshData
  } = useApp();

  const [inputCode, setInputCode] = useState('');
  // Solo se guarda el id: el pedido se lee de la lista viva (refleja la entrega tras el canje)
  const [resultId, setResultId] = useState<string | null>(null);
  const resultPedido: PedidoTienda | null = resultId ? pedidos.find(p => p.ordenId === resultId) || null : null;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [searching, setSearching] = useState(false);
  const [codeTouched, setCodeTouched] = useState(false);

  // Cada vez que se abre el escáner empieza limpio
  useEffect(() => {
    if (redeemModalOpen) {
      setInputCode('');
      setResultId(null);
      setErrorMessage(null);
      setSuccessMessage(null);
      setConfirming(false);
      setSearching(false);
      setCodeTouched(false);
    }
  }, [redeemModalOpen]);

  // Coincidencia exacta: el código corto de 8 caracteres, el código completo del QR o el número de pedido
  const findByCode = (list: PedidoTienda[], raw: string) => {
    const code = normalizarCodigoRetiro(raw);
    if (!code) return undefined;
    return list.find(p =>
      p.modalidadEntrega === 'recogida_sucursal' && (
        p.codigoRetiro?.toUpperCase() === code ||
        p.qrCodeData?.toUpperCase() === code ||
        p.pedidoId.toUpperCase() === `CL-${code}`
      )
    );
  };

  // Si el código no estaba en la lista local, se recarga y se vuelve a buscar con los datos nuevos
  const [pendingLookup, setPendingLookup] = useState<string | null>(null);
  useEffect(() => {
    if (pendingLookup === null || searching) return;
    const found = findByCode(pedidos, pendingLookup);
    if (found) {
      setResultId(found.ordenId);
    } else {
      setErrorMessage(`No se encontró ningún pedido de retiro con el código "${pendingLookup.length > 12 ? pendingLookup.slice(0, 8) + '…' : pendingLookup}". Verifica con el cliente.`);
    }
    setPendingLookup(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLookup, searching, pedidos]);

  if (!redeemModalOpen) return null;

  const codigoNormalizado = normalizarCodigoRetiro(inputCode);
  const errorCodigo = !inputCode.trim() ? 'Escribe o escanea el código de retiro.' : codigoNormalizado ? '' : ERROR_FORMATO;
  const cerrar = () => { if (!confirming) setRedeemModalOpen(false); };

  const handleSearchAndValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searching) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    if (errorCodigo) { setCodeTouched(true); return; }

    const found = findByCode(pedidos, inputCode);
    if (found) {
      setResultId(found.ordenId);
      return;
    }

    // Puede ser un pedido creado después de la última actualización: se recarga antes de decir que no existe
    setResultId(null);
    setSearching(true);
    try {
      await refreshData();
    } finally {
      setSearching(false);
      setPendingLookup(codigoNormalizado);
    }
  };

  const handleConfirmRedemption = async () => {
    if (!resultPedido || confirming) return;
    setConfirming(true);
    setErrorMessage(null);
    try {
      // Se envía el código completo del QR: no hay ambigüedad posible
      const res = await canjearCodigoRetiro(resultPedido.qrCodeData || resultPedido.codigoRetiro || inputCode);
      if (res.success) {
        setSuccessMessage(res.message);
      } else {
        setErrorMessage(res.message);
      }
    } finally {
      setConfirming(false);
    }
  };

  // Find orders currently waiting for pickup
  const waitingPickupOrders = pedidos.filter(p => p.modalidadEntrega === 'recogida_sucursal' && p.estadoPedido === 'listo_sucursal');

  return (
    <ModalBackdrop onClose={cerrar} bloqueado={confirming} label="Canje de retiro en sucursal">
      <div className="bg-[#0b172a] border border-slate-700 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6 shadow-2xl relative text-white">
        
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
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto space-y-5 my-4 pr-1 flex-1">
          
          {/* Code Search Input Form */}
          <form onSubmit={handleSearchAndValidate} noValidate className="space-y-3" data-testid="redeem-form">
            <div>
              <label htmlFor="redeem-code" className="block text-xs font-bold text-slate-300 mb-1.5">
                Ingresa el Código de Retiro del Cliente o Escanea QR
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    id="redeem-code"
                    type="text"
                    maxLength={CODIGO_MAX}
                    spellCheck={false}
                    value={inputCode}
                    onChange={(e) => { setInputCode(e.target.value.slice(0, CODIGO_MAX)); setErrorMessage(null); setResultId(null); }}
                    onBlur={() => { if (inputCode) setCodeTouched(true); }}
                    aria-invalid={!!(codeTouched && errorCodigo)}
                    placeholder="Código de 8 caracteres o escanea el QR"
                    autoFocus
                    autoComplete="off"
                    className={`w-full bg-slate-900 border rounded-xl px-4 py-3 text-center text-lg font-mono font-bold tracking-widest text-emerald-300 focus:outline-none uppercase ${
                      codeTouched && errorCodigo ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  <FieldError msg={codeTouched ? errorCodigo : ''} />
                </div>
                <button
                  type="submit"
                  disabled={searching || (codeTouched && !!errorCodigo)}
                  className="px-5 py-3 justify-center sm:self-start bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <Search className="w-4 h-4" />
                  <span>{searching ? 'Buscando…' : 'Verificar'}</span>
                </button>
              </div>
            </div>

            {/* Quick Test Codes Pill Buttons */}
            {waitingPickupOrders.length > 0 && (
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-semibold block mb-1.5 text-[11px]">
                  Pedidos listos para entregar en mostrador:
                </span>
                <div className="flex flex-wrap gap-2">
                  {waitingPickupOrders.map(p => (
                    <button
                      key={p.pedidoId}
                      type="button"
                      onClick={() => {
                        setInputCode(p.codigoRetiro || p.pedidoId);
                        setCodeTouched(false);
                        setResultId(p.ordenId);
                        setErrorMessage(null);
                        setSuccessMessage(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold transition-colors cursor-pointer"
                    >
                      {p.codigoRetiro || '—'} ({p.pedidoId} - {p.clienteNombre.split(' ')[0]})
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
                      : resultPedido.estadoPedido === 'listo_sucursal'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/50 animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-slate-600'
                  }`}>
                    {resultPedido.estadoPedido === 'entregado_recogido'
                      ? 'Ya Reclamado / Entregado'
                      : resultPedido.estadoPedido === 'listo_sucursal'
                        ? 'Listo para Retiro en Sucursal'
                        : resultPedido.estadoPedido === 'cancelado'
                          ? 'Pedido Cancelado'
                          : 'Aún no está listo'}
                  </span>
                </div>

                <span className="text-xs font-mono font-bold text-emerald-400">
                  Total Pagado: ${(resultPedido.total ?? 0).toLocaleString('es-CO')} COP
                </span>
              </div>

              {/* Client & Branch Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/70 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cliente / Reclama</span>
                  <p className="font-bold text-white text-xs">{resultPedido.clienteNombre}</p>
                  {resultPedido.clienteDoc && <p className="text-slate-400">Doc: {resultPedido.clienteDoc}</p>}
                  <p className="text-slate-400">Tel: {resultPedido.clienteTelefono || '—'}</p>
                  {resultPedido.empresaNombre && (
                    <p className="text-emerald-400 text-[11px] font-medium">{resultPedido.empresaNombre}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Sucursal de Retiro Seleccionada</span>
                  <p className="font-bold text-white text-xs">{resultPedido.sucursalRetiro || 'Sucursal no especificada'}</p>
                  <p className="text-slate-400">Entrega: <strong className="text-slate-200">Retiro en sucursal</strong></p>
                  <p className="text-slate-400">Código Asignado: <strong className="font-mono text-emerald-400">{resultPedido.codigoRetiro || '—'}</strong></p>
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
                            {[item.presentacion, item.color ? `Color: ${item.color}` : ''].filter(Boolean).join(' • ')}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-emerald-400 block">
                          Cant: {item.cantidad}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ${(item.total ?? 0).toLocaleString('es-CO')} COP
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button: Confirm Delivery */}
              {resultPedido.estadoPedido === 'cancelado' ? (
                <div className="p-3 bg-rose-950/60 border border-rose-500/50 rounded-xl text-xs text-rose-300 font-bold">
                  Este pedido fue cancelado: no se puede entregar.
                </div>
              ) : resultPedido.estadoPedido !== 'entregado_recogido' && resultPedido.estadoPedido !== 'listo_sucursal' ? (
                <div className="p-3 bg-amber-950/50 border border-amber-500/40 rounded-xl text-xs text-amber-200">
                  El pedido todavía no está alistado. Primero márcalo como <strong>Listo para recoger</strong> en el módulo de Pedidos.
                </div>
              ) : resultPedido.estadoPedido !== 'entregado_recogido' ? (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleConfirmRedemption}
                    disabled={confirming}
                    className="w-full py-3.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5 text-slate-950" />
                    <span>{confirming ? 'Validando…' : 'Confirmar Entrega en Mostrador y Finalizar Pedido'}</span>
                  </button>
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                    Responsable de la entrega: <strong className="text-white">{currentUser?.nombre} ({currentUser?.rol.rol})</strong>
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/50 rounded-xl text-xs flex items-center justify-between">
                  <span className="text-emerald-300 font-bold">
                    ✓ Entregado por {resultPedido.canjeadoPor || 'Personal de sucursal'}{resultPedido.sucursalRetiro ? ` • ${resultPedido.sucursalRetiro}` : ''}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {resultPedido.fechaCanje && !isNaN(new Date(resultPedido.fechaCanje).getTime())
                      ? new Date(resultPedido.fechaCanje).toLocaleString('es-CO')
                      : '—'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={cerrar}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Escáner
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
