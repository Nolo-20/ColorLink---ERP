import React, { useState, useEffect } from 'react';
import { useApp, canRole } from '../context/AppContext';
import { EstadoPedido, ModalidadEntrega, PedidoTienda } from '../types/database';
import { ESTADO_PEDIDO_LABEL } from '../estados';
import { ModalBackdrop, FieldError, bordeCampo, descargarCsv, hoyArchivo } from './ui';
import { errorTexto } from '../validation';

const NOTA_MAX = 300;
import { 
  Package, 
  QrCode, 
  MapPin, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Building2, 
  User, 
  Phone, 
  Search, 
  Filter, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  PlusCircle, 
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Info,
  Palette,
  Check,
  Ban,
  RefreshCw,
  Layers,
  Download,
  X
} from 'lucide-react';

export const OrdersStoreView: React.FC = () => {
  const { 
    pedidos, 
    productos,
    inventarios,
    currentUser, 
    cambiarEstadoPedido, 
    setRedeemModalOpen, 
    setActiveTab, 
    searchQuery,
    selectedPedido,
    setSelectedPedido,
    hasModuleAccess,
    theme 
  } = useApp();

  const isLight = theme === 'light';

  const [activeStoreTab, setActiveStoreTab] = useState<'pedidos' | 'catalogo'>('pedidos');
  const [filterModalidad, setFilterModalidad] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Solo se guarda el id: el detalle se lee de la lista viva para reflejar cambios de estado
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const selectedOrderDetails: PedidoTienda | null = selectedOrderId
    ? pedidos.find(p => p.ordenId === selectedOrderId) || null
    : null;
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  // Confirmación del cambio de estado, con nota opcional para el historial
  const [pendingAdvance, setPendingAdvance] = useState<{ ordenId: string; nextState: EstadoPedido; nextLabel: string } | null>(null);
  const [nota, setNota] = useState('');
  const pedidoAvance = pendingAdvance ? pedidos.find(p => p.ordenId === pendingAdvance.ordenId) || null : null;
  const errNota = errorTexto(nota, 'La nota', { max: NOTA_MAX });

  // Si se llegó desde la búsqueda global con un pedido elegido, se abre su detalle
  useEffect(() => {
    if (selectedPedido) {
      setActiveStoreTab('pedidos');
      setSelectedOrderId(selectedPedido.ordenId);
      setSelectedPedido(null);
    }
  }, [selectedPedido, setSelectedPedido]);

  // Sincroniza con la búsqueda global de la barra superior (también cuando se borra)
  useEffect(() => {
    setSearchTerm(searchQuery || '');
  }, [searchQuery]);

  const fmtFechaHora = (v?: string) => {
    if (!v) return '—';
    const t = new Date(v);
    return isNaN(t.getTime()) ? '—' : t.toLocaleString('es-CO');
  };

  const abrirAvance = (p: PedidoTienda, nextState: EstadoPedido, nextLabel: string) => {
    setNota('');
    setPendingAdvance({ ordenId: p.ordenId, nextState, nextLabel });
  };

  const confirmarAvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingAdvance || !pedidoAvance || advancingId || errNota) return;
    setAdvancingId(pedidoAvance.ordenId);
    try {
      const notaLimpia = nota.trim().replace(/\s+/g, ' ');
      const ok = await cambiarEstadoPedido(
        pedidoAvance.pedidoId,
        pendingAdvance.nextState,
        notaLimpia || `Avanzado a "${ESTADO_PEDIDO_LABEL[pendingAdvance.nextState]}" por ${currentUser?.nombre || 'Colaborador'} (${currentUser?.rol?.rol || 'Equipo'})`
      );
      if (ok) setPendingAdvance(null);
    } finally {
      setAdvancingId(null);
    }
  };

  const exportarPedidos = () => {
    descargarCsv(
      `pedidos-tienda-${hoyArchivo()}.csv`,
      ['Pedido', 'Fecha', 'Cliente', 'Correo', 'Teléfono', 'Modalidad', 'Sucursal / Dirección', 'Código retiro', 'Estado', 'Productos', 'Total COP'],
      filteredOrders.map(p => [
        p.pedidoId,
        p.fechaCreacion && !isNaN(new Date(p.fechaCreacion).getTime()) ? new Date(p.fechaCreacion).toLocaleString('es-CO') : '',
        p.clienteNombre, p.clienteEmail, p.clienteTelefono,
        p.modalidadEntrega === 'recogida_sucursal' ? 'Retiro en sucursal' : 'Domicilio',
        p.sucursalRetiro || p.direccionEntrega || '',
        p.codigoRetiro || '',
        ESTADO_PEDIDO_LABEL[p.estadoPedido],
        (p.items || []).map(it => `${it.cantidad}x ${it.nombre}`).join(' | '),
        p.total ?? 0,
      ]),
    );
  };

  // Filtered orders list
  const term = searchTerm.trim().toLowerCase();
  const filteredOrders = pedidos.filter(p => {
    const matchesModalidad = filterModalidad === 'all' || p.modalidadEntrega === filterModalidad;
    const matchesEstado = filterEstado === 'all' || p.estadoPedido === filterEstado;
    const matchesSearch = !term ||
      p.pedidoId.toLowerCase().includes(term) ||
      p.clienteNombre.toLowerCase().includes(term) ||
      p.clienteEmail.toLowerCase().includes(term) ||
      (p.codigoRetiro && p.codigoRetiro.toLowerCase().includes(term)) ||
      (p.empresaNombre && p.empresaNombre.toLowerCase().includes(term));

    return matchesModalidad && matchesEstado && matchesSearch;
  });

  // Filtered store catalog
  const filteredProducts = productos.filter(p => {
    return !term || p.nombre.toLowerCase().includes(term) ||
      (p.categoria && p.categoria.toLowerCase().includes(term));
  });

  // Helper description of who can advance each order state
  const getRolePermissionBadge = (estado: EstadoPedido, modalidad: ModalidadEntrega) => {
    switch (estado) {
      case 'comprado_confirmado':
        return {
          role: 'Jefe de Despachos / Administrador',
          nextState: 'en_alistamiento' as EstadoPedido,
          nextLabel: 'Pasar a Alistamiento en Bodega',
          badgeColor: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
        };
      case 'en_alistamiento':
        return {
          role: 'Jefe de Despachos / Administrador',
          nextState: (modalidad === 'recogida_sucursal' ? 'listo_sucursal' : 'en_ruta_domicilio') as EstadoPedido,
          nextLabel: modalidad === 'recogida_sucursal' ? 'Marcar Listo en Sucursal para Retiro' : 'Despachar a Domicilio',
          badgeColor: 'text-amber-500 bg-amber-500/10 border-amber-500/30',
        };
      case 'listo_sucursal':
        // La entrega en mostrador SOLO se hace validando el código del cliente (escáner de retiro)
        return {
          role: 'Despachos / Administrador / Asesor (con código de retiro)',
          nextState: 'entregado_recogido' as EstadoPedido,
          nextLabel: 'Validar Código & Entregar en Mostrador',
          badgeColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30',
        };
      case 'en_ruta_domicilio':
        return {
          role: 'Jefe de Despachos / Administrador',
          nextState: 'entregado_recogido' as EstadoPedido,
          nextLabel: 'Confirmar Entrega en Obra',
          badgeColor: 'text-orange-500 bg-orange-500/10 border-orange-500/30',
        };
      case 'entregado_recogido':
        return {
          role: 'Finalizado (Auditable)',
          nextState: null,
          nextLabel: 'Pedido Finalizado y Entregado',
          badgeColor: isLight ? 'text-slate-500 bg-slate-100 border-slate-300' : 'text-slate-400 bg-slate-900 border-slate-700',
        };
      case 'cancelado':
        return {
          role: 'Pedido cancelado',
          nextState: null,
          nextLabel: 'Pedido cancelado',
          badgeColor: 'text-rose-500 bg-rose-500/10 border-rose-500/30',
        };
      default:
        return {
          role: 'Administrador',
          nextState: null,
          nextLabel: 'Acción Requerida',
          badgeColor: isLight ? 'text-slate-500 bg-slate-100 border-slate-300' : 'text-slate-400 bg-slate-900 border-slate-700',
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner (Responsive Theme) */}
      <div className={`border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all ${
        isLight
          ? 'bg-gradient-to-r from-emerald-50 via-slate-50 to-white border-slate-200 text-slate-900'
          : 'bg-gradient-to-r from-[#0b1c2e] via-[#091b2c] to-[#071322] border-slate-800 text-white'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">
              <ShoppingBag className="w-4 h-4" />
              Gestión Integral de Pedidos de Tienda & Retiro en Sucursal
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Control de Pedidos & Canje de Retiro en Tienda
            </h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Monitoreo del ciclo completo de ventas de la tienda web: alistamiento, despacho a domicilio y entrega en mostrador validando el código de retiro del cliente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setRedeemModalOpen(true)}
              className="px-5 py-3 bg-[#F2C417] hover:bg-[#C99A0A] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-slate-950" />
              <span>Escanear / Canjear QR en Tienda</span>
            </button>

          </div>
        </div>

        {/* Roles & Permissions Fast Explanation Strip */}
        <div className={`mt-6 pt-5 border-t grid grid-cols-1 md:grid-cols-4 gap-3 text-xs ${
          isLight ? 'border-slate-200' : 'border-slate-800/80'
        }`}>
          <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              1. Comprado & Confirmado
            </span>
            <span className={`font-semibold block mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>👤 Cliente en Tienda Web</span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pago registrado en la tienda web</span>
          </div>

          <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">
              2. En Alistamiento
            </span>
            <span className={`font-semibold block mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>📦 Jefe de Despachos / Bodega</span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Separación y empaque en bodega</span>
          </div>

          <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">
              3. Listo en Sucursal / Ruta
            </span>
            <span className={`font-semibold block mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>🏢 Jefe de Despachos</span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>El cliente recibe su código de retiro y QR</span>
          </div>

          <div className={`p-3 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800'}`}>
            <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider block">
              4. Entregado / Recogido
            </span>
            <span className={`font-semibold block mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>🏬 Asesor Mostrador / Despachos</span>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Canje inmediato con código o QR</span>
          </div>
        </div>
      </div>

      {/* SUBTABS: Orders & Deliveries VS Live Store Catalog & Color Availability */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveStoreTab('pedidos')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeStoreTab === 'pedidos'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : isLight ? 'bg-slate-200/70 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Pedidos & Retiros en Sucursal ({pedidos.length})</span>
        </button>

        <button
          onClick={() => setActiveStoreTab('catalogo')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeStoreTab === 'catalogo'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : isLight ? 'bg-slate-200/70 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Catálogo & Disponibilidad ({productos.length})</span>
        </button>
      </div>

      {/* TAB 1: PEDIDOS & RETIRO EN SUCURSAL */}
      {activeStoreTab === 'pedidos' && (
        <div className="space-y-4">
          
          {/* Filter and Search Bar */}
          <div className={`border rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 transition-colors ${
            isLight ? 'bg-white border-slate-200' : 'bg-[#091526] border-slate-800'
          }`}>
            {/* Search */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                maxLength={80}
                aria-label="Buscar pedidos"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.slice(0, 80))}
                placeholder="Buscar por pedido, cliente o código de retiro..."
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium ${
                  isLight ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                }`}
              />
            </div>

            {/* Modalidad Filter */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <div className={`flex items-center gap-1 border rounded-xl p-1 ${
                isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <button
                  onClick={() => setFilterModalidad('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    filterModalidad === 'all'
                      ? 'bg-emerald-500 text-slate-950'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({pedidos.length})
                </button>
                <button
                  onClick={() => setFilterModalidad('recogida_sucursal')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    filterModalidad === 'recogida_sucursal'
                      ? 'bg-emerald-500 text-slate-950'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Retiro ({pedidos.filter(p => p.modalidadEntrega === 'recogida_sucursal').length})</span>
                </button>
                <button
                  onClick={() => setFilterModalidad('envio_domicilio')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    filterModalidad === 'envio_domicilio'
                      ? 'bg-emerald-500 text-slate-950'
                      : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  <span>Domicilio ({pedidos.filter(p => p.modalidadEntrega === 'envio_domicilio').length})</span>
                </button>
              </div>

              {/* Status Selector */}
              <select
                value={filterEstado}
                onChange={(e) => setFilterEstado(e.target.value)}
                className={`border rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium ${
                  isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                }`}
              >
                <option value="all">Todos los Estados</option>
                <option value="comprado_confirmado">Comprado & Confirmado</option>
                <option value="en_alistamiento">En Alistamiento</option>
                <option value="listo_sucursal">Listo para Retiro en Sucursal</option>
                <option value="en_ruta_domicilio">En Ruta Domicilio</option>
                <option value="entregado_recogido">Entregado / Recogido</option>
                <option value="cancelado">Cancelado</option>
              </select>

              <button
                type="button"
                onClick={exportarPedidos}
                disabled={filteredOrders.length === 0}
                title="Descargar los pedidos visibles en CSV (Excel)"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
            </div>
          </div>

          {/* Orders Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredOrders.length === 0 ? (
              <div className={`col-span-full border rounded-2xl p-12 text-center ${
                isLight ? 'bg-white border-slate-200 text-slate-500' : 'bg-[#091526] border-slate-800 text-slate-400'
              }`}>
                <Package className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <p className={`font-bold text-base ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                  No se encontraron pedidos con los filtros aplicados.
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {pedidos.length === 0
                    ? 'Aún no hay pedidos de la tienda web.'
                    : 'Prueba cambiando la búsqueda o los filtros.'}
                </p>
              </div>
            ) : (
              filteredOrders.map((p) => {
                const isPickup = p.modalidadEntrega === 'recogida_sucursal';
                const perm = getRolePermissionBadge(p.estadoPedido, p.modalidadEntrega);

                return (
                  <div 
                    key={p.pedidoId}
                    className={`border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all ${
                      isLight 
                        ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800' 
                        : 'bg-[#091526] border-slate-800 hover:border-slate-700 text-white'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Pedido ID + Modalidad + Badge Estado */}
                      <div className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${
                        isLight ? 'border-slate-200' : 'border-slate-800'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`font-black text-sm font-mono px-2.5 py-1 rounded-lg border ${
                            isLight ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                          }`}>
                            #{p.pedidoId}
                          </span>

                          {isPickup ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                              <span>Recogida en Sucursal</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-500 border border-sky-500/30 flex items-center gap-1.5">
                              <Truck className="w-3.5 h-3.5 text-sky-500" />
                              <span>Envío a Domicilio</span>
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div>
                          {p.estadoPedido === 'comprado_confirmado' && (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${
                              isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-600'
                            }`}>
                              Comprado & Pagado
                            </span>
                          )}
                          {p.estadoPedido === 'en_alistamiento' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-500 border border-blue-500/30 uppercase flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              En Alistamiento
                            </span>
                          )}
                          {p.estadoPedido === 'listo_sucursal' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/40 uppercase animate-pulse flex items-center gap-1">
                              <QrCode className="w-3 h-3 text-amber-500" />
                              Listo para Retiro en Sucursal
                            </span>
                          )}
                          {p.estadoPedido === 'en_ruta_domicilio' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-500 border border-orange-500/30 uppercase flex items-center gap-1">
                              <Truck className="w-3 h-3 text-orange-500" />
                              En Tránsito
                            </span>
                          )}
                          {p.estadoPedido === 'entregado_recogido' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/40 uppercase flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              Entregado & Finalizado
                            </span>
                          )}
                          {p.estadoPedido === 'cancelado' && (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-500 border border-rose-500/40 uppercase flex items-center gap-1">
                              <Ban className="w-3 h-3 text-rose-500" />
                              Cancelado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Pick Up Specific Box (Código de Retiro & Sucursal) */}
                      {isPickup && (
                        <div className={`my-3 p-3.5 rounded-2xl border flex items-center justify-between ${
                          isLight
                            ? 'bg-gradient-to-r from-emerald-50 via-white to-slate-50 border-emerald-300'
                            : 'bg-gradient-to-r from-emerald-950/40 to-slate-900 border-emerald-500/30'
                        }`}>
                          <div>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider block">
                              Sucursal de Retiro Seleccionada:
                            </span>
                            <span className={`text-xs font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>
                              {p.sucursalRetiro || 'Sucursal no especificada'}
                            </span>
                          </div>

                          <div className="text-right">
                            <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                              Código de Retiro:
                            </span>
                            <span className={`text-base font-black font-mono tracking-widest px-2.5 py-0.5 rounded-lg border inline-block mt-0.5 ${
                              isLight 
                                ? 'text-emerald-700 bg-white border-emerald-400 shadow-sm' 
                                : 'text-emerald-300 bg-slate-950/80 border-emerald-500/40'
                            }`}>
                              {p.codigoRetiro || '—'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Client info & items */}
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.clienteNombre}</span>
                            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              {[p.clienteTelefono, p.clienteEmail].filter(Boolean).join(' • ') || '—'}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-sm font-mono text-emerald-500">
                              ${(p.total ?? 0).toLocaleString('es-CO')} COP
                            </span>
                            {p.metodoPago && (
                              <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Método: {p.metodoPago}</span>
                            )}
                          </div>
                        </div>

                        {/* Items list */}
                        <div className={`p-3 rounded-2xl border space-y-1.5 ${
                          isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800'
                        }`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wider block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            Productos Incluidos ({p.items?.length || 0}):
                          </span>
                          {p.items?.map((item) => (
                            <div key={item.itemId} className="flex items-center justify-between text-xs">
                              <span className={`font-medium truncate max-w-[260px] ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                                {item.cantidad}x {item.nombre}
                                {item.presentacion ? ` (${item.presentacion})` : ''}
                                {item.color && <> - <strong className="text-emerald-500">{item.color}</strong></>}
                              </span>
                              <span className="font-mono font-bold text-[11px] text-slate-400">
                                ${(item.total ?? 0).toLocaleString('es-CO')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions & State Transition Button */}
                    <div className={`pt-3 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isLight ? 'border-slate-200' : 'border-slate-800'
                    }`}>
                      <div>
                        <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Rol Autorizado para este paso:</span>
                        <span className={`text-xs font-bold inline-block px-2 py-0.5 rounded border mt-0.5 ${perm.badgeColor}`}>
                          {perm.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedOrderId(p.ordenId)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Ver Detalle
                        </button>

                        {/* Next transition button */}
                        {p.estadoPedido === 'listo_sucursal' ? (
                          // Entrega en mostrador: siempre validando el código del cliente
                          canRole.canjearRetiro(currentUser?.rol.rol) && (
                            <button
                              type="button"
                              onClick={() => setRedeemModalOpen(true)}
                              className="px-3.5 py-1.5 bg-[#F2C417] hover:bg-[#C99A0A] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                              <span>{perm.nextLabel}</span>
                            </button>
                          )
                        ) : perm.nextState && canRole.gestionarPedidos(currentUser?.rol.rol) && (
                          <button
                            type="button"
                            onClick={() => abrirAvance(p, perm.nextState!, perm.nextLabel)}
                            disabled={advancingId !== null}
                            className="px-3.5 py-1.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{advancingId === p.ordenId ? 'Actualizando…' : perm.nextLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CATÁLOGO DE TIENDA & DISPONIBILIDAD DE COLORES */}
      {activeStoreTab === 'catalogo' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${
            isLight ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="font-bold block text-xs mb-0.5">
                  🛒 Catálogo en Línea & Disponibilidad Reflejada en Tiempo Real:
                </span>
                <p className="text-xs leading-relaxed">
                  Productos del catálogo con su disponibilidad según el stock registrado en bodegas.
                </p>
              </div>
              {hasModuleAccess('inventarios') && <button
                type="button"
                onClick={() => setActiveTab('inventarios')}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ir a Gestionar Inventario</span>
              </button>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => {
              const isAvailable = inventarios.some(i => i.productoId === prod.productoId && (i.cantidadDisponible || 0) > 0);

              return (
                <div
                  key={prod.productoId}
                  className={`border rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all ${
                    isAvailable
                      ? isLight ? 'bg-white border-slate-200 hover:shadow-xl' : 'bg-[#091526] border-slate-800 hover:border-slate-700'
                      : 'bg-rose-950/15 border-rose-500/40'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-700/40">
                      <div>
                        {prod.categoria && (
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {prod.categoria}
                          </span>
                        )}
                        <h4 className={`text-base font-extrabold mt-0.5 leading-snug ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {prod.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`font-black text-sm font-mono text-emerald-500 ${!isAvailable ? 'line-through text-slate-400' : ''}`}>
                            {prod.precio != null ? `$${prod.precio.toLocaleString('es-CO')} COP` : 'Sin precio'}
                          </span>
                          {prod.presentacion && (
                            <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              • {prod.presentacion}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Availability Tag */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        isAvailable
                          ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}>
                        {isAvailable ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Disponible</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3 h-3 text-rose-400" />
                            <span>Agotado</span>
                          </>
                        )}
                      </span>
                    </div>

                  </div>

                  {!isAvailable && (
                    <div className="pt-2">
                      <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-center text-[11px] font-bold">
                        ⚠️ Sin stock en bodegas
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: ORDER DETAILS */}
      {selectedOrderDetails && (
        <ModalBackdrop onClose={() => setSelectedOrderId(null)} label="Detalle del pedido">
          <div className={`border rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5 sm:p-6 shadow-2xl relative text-xs space-y-4 my-auto ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
          }`} data-testid="order-detail">
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <span className={`font-mono font-bold ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`}>#{selectedOrderDetails.pedidoId}</span>
                <h3 className="font-extrabold text-base">Detalle Completo del Pedido</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                aria-label="Cerrar"
                className={`p-1 rounded-lg cursor-pointer ${isLight ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {[
                ['Cliente', selectedOrderDetails.clienteNombre],
                ['Contacto', [selectedOrderDetails.clienteTelefono, selectedOrderDetails.clienteEmail].filter(Boolean).join(' • ') || '—'],
                ['Estado', ESTADO_PEDIDO_LABEL[selectedOrderDetails.estadoPedido]],
                ['Modalidad', selectedOrderDetails.modalidadEntrega === 'recogida_sucursal' ? 'Retiro en sucursal' : 'Envío a domicilio'],
                ...(selectedOrderDetails.destinatario ? [[selectedOrderDetails.modalidadEntrega === 'recogida_sucursal' ? 'Retira' : 'Recibe', selectedOrderDetails.destinatario]] : []),
                ...(selectedOrderDetails.telefonoContacto ? [['Celular de contacto', selectedOrderDetails.telefonoContacto]] : []),
                ...(selectedOrderDetails.ciudadEntrega && selectedOrderDetails.modalidadEntrega !== 'recogida_sucursal' ? [['Ciudad', selectedOrderDetails.ciudadEntrega]] : []),
                ...(selectedOrderDetails.instruccionesEntrega ? [['Instrucciones', selectedOrderDetails.instruccionesEntrega]] : []),
                ...(selectedOrderDetails.metodoPago ? [['Método de pago (simulado)', selectedOrderDetails.metodoPago]] : []),
                ...(selectedOrderDetails.facturaNit ? [['Factura a', `${selectedOrderDetails.facturaRazonSocial || ''} · NIT ${selectedOrderDetails.facturaNit}`]] : []),
                ...(selectedOrderDetails.costoEnvio ? [['Envío', `$${selectedOrderDetails.costoEnvio.toLocaleString('es-CO')} COP`]] : []),
                ...(selectedOrderDetails.direccionEntrega ? [['Dirección de entrega', selectedOrderDetails.direccionEntrega]] : []),
                ...(selectedOrderDetails.sucursalRetiro ? [['Sucursal de retiro', selectedOrderDetails.sucursalRetiro]] : []),
                ...(selectedOrderDetails.codigoRetiro ? [['Código de retiro', selectedOrderDetails.codigoRetiro]] : []),
                ['Fecha de compra', fmtFechaHora(selectedOrderDetails.fechaCreacion)],
                ['Total pagado', `$${(selectedOrderDetails.total ?? 0).toLocaleString('es-CO')} COP`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3">
                  <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>{k}:</span>
                  <span className="font-bold text-right break-words min-w-0">{v}</span>
                </div>
              ))}
            </div>

            <div className={`space-y-1.5 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <span className={`font-bold block uppercase text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Productos ({selectedOrderDetails.items?.length || 0}):</span>
              {(selectedOrderDetails.items || []).map(it => (
                <div key={it.itemId} className="flex justify-between gap-3">
                  <span className="min-w-0">{it.cantidad}x {it.nombre}{it.presentacion ? ` (${it.presentacion})` : ''}</span>
                  <span className="font-mono">${(it.total ?? 0).toLocaleString('es-CO')}</span>
                </div>
              ))}
            </div>

            {/* Traceability history */}
            <div className={`space-y-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <span className={`font-bold block uppercase text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Historial de Estados y Roles:</span>
              {selectedOrderDetails.historialEstados.length === 0 && (
                <p className={isLight ? 'text-slate-500' : 'text-slate-400'}>Sin movimientos registrados.</p>
              )}
              {selectedOrderDetails.historialEstados.map((h, i) => (
                <div key={i} className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`font-bold uppercase text-[10px] ${isLight ? 'text-emerald-700' : 'text-emerald-500'}`}>{ESTADO_PEDIDO_LABEL[h.estado] || h.estado}</span>
                    <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{fmtFechaHora(h.fecha)}</span>
                  </div>
                  {h.notas && <p className="font-medium break-words">{h.notas}</p>}
                  <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Por: <strong className={isLight ? 'text-slate-700' : 'text-slate-300'}>{h.usuario}</strong> ({h.rol})</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedOrderId(null)}
              className={`w-full py-2.5 rounded-xl font-bold text-xs cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Cerrar
            </button>
          </div>
        </ModalBackdrop>
      )}

      {/* MODAL: CONFIRMAR CAMBIO DE ESTADO */}
      {pendingAdvance && pedidoAvance && (
        <ModalBackdrop onClose={() => { if (!advancingId) setPendingAdvance(null); }} bloqueado={!!advancingId} label="Confirmar cambio de estado">
          <form
            onSubmit={confirmarAvance}
            noValidate
            data-testid="advance-form"
            className={`border rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl text-xs space-y-4 my-auto ${
              isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
            }`}
          >
            <div>
              <h3 className="font-extrabold text-base">Confirmar cambio de estado</h3>
              <p className={`mt-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Pedido <strong className="font-mono">#{pedidoAvance.pedidoId}</strong> de {pedidoAvance.clienteNombre}:{' '}
                <strong>{ESTADO_PEDIDO_LABEL[pedidoAvance.estadoPedido]}</strong> → <strong className={isLight ? 'text-emerald-700' : 'text-emerald-400'}>{ESTADO_PEDIDO_LABEL[pendingAdvance.nextState]}</strong>.
                El cliente recibe aviso por correo.
              </p>
            </div>
            <div>
              <label htmlFor="advance-nota" className={`block font-bold mb-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                Nota para el historial (opcional)
              </label>
              <textarea
                id="advance-nota"
                rows={3}
                maxLength={NOTA_MAX}
                value={nota}
                onChange={(e) => setNota(e.target.value.slice(0, NOTA_MAX))}
                placeholder="Ej. Se entregó a la transportadora a las 10 a. m."
                className={`w-full rounded-xl p-3 text-xs focus:outline-none border ${bordeCampo(errNota, isLight)} ${
                  isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'
                }`}
              />
              <div className="flex items-start justify-between gap-2">
                <FieldError msg={errNota} />
                <span className={`ml-auto text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{nota.length}/{NOTA_MAX}</span>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setPendingAdvance(null)}
                disabled={!!advancingId}
                className={`flex-1 py-2.5 rounded-xl font-bold cursor-pointer disabled:opacity-50 ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!!advancingId || !!errNota}
                className="flex-1 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black uppercase tracking-wider rounded-xl cursor-pointer"
              >
                {advancingId ? 'Actualizando…' : 'Confirmar'}
              </button>
            </div>
          </form>
        </ModalBackdrop>
      )}

    </div>
  );
};
