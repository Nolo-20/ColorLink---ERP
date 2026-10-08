import React, { useState, useEffect } from 'react';
import { useApp, canRole } from '../context/AppContext';
import { EstadoPedido, ModalidadEntrega, PedidoTienda, Producto } from '../types/database';
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
  Sparkles
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
    showToast,
    searchQuery,
    theme 
  } = useApp();

  const isLight = theme === 'light';

  const [activeStoreTab, setActiveStoreTab] = useState<'pedidos' | 'catalogo'>('pedidos');
  const [filterModalidad, setFilterModalidad] = useState<string>('all');
  const [filterEstado, setFilterEstado] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<PedidoTienda | null>(null);


  // Sync with global navbar search
  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  // Filtered orders list
  const filteredOrders = pedidos.filter(p => {
    const matchesModalidad = filterModalidad === 'all' || p.modalidadEntrega === filterModalidad;
    const matchesEstado = filterEstado === 'all' || p.estadoPedido === filterEstado;
    const matchesSearch = 
      p.pedidoId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.clienteNombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigoRetiro && p.codigoRetiro.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.empresaNombre && p.empresaNombre.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesModalidad && matchesEstado && matchesSearch;
  });

  // Filtered store catalog
  const filteredProducts = productos.filter(p => {
    return p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.codigoColorLink && p.codigoColorLink.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.coloresDisponibles && p.coloresDisponibles.some(c => c.nombre.toLowerCase().includes(searchTerm.toLowerCase())));
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
        return {
          role: 'Jefe de Despachos / Administrador (o escáner de retiro)',
          nextState: 'entregado_recogido' as EstadoPedido,
          nextLabel: 'Canjear Código & Entregar en Mostrador',
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
              Monitoreo del ciclo completo de ventas de ColorLink. Asignación automática de códigos de canje QR para retiro en mostrador, despacho a domicilio y verificación de disponibilidad de colores en tiempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setRedeemModalOpen(true)}
              className="px-5 py-3 bg-[#00D285] hover:bg-[#00c078] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-xl shadow-emerald-500/25 flex items-center gap-2 cursor-pointer"
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
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Verificado vía PSE o Tarjeta</span>
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
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Genera código RET-xxxx y QR</span>
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
          <span>Catálogo de Tienda & Disponibilidad de Colores ({productos.length})</span>
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
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID, cliente, código RET..."
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
              </select>
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
                  Prueba cambiando la búsqueda o presiona "Registrar Venta / Pedido en Línea" para ingresar una nueva orden.
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
                              {p.sucursalRetiro || 'Sucursal Principal Guayabal'}
                            </span>
                            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                              Horario: Lunes a Sábado 7:30 AM - 5:30 PM
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
                              {p.codigoRetiro || 'GENERANDO'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Client info & items */}
                      <div className="space-y-2 mt-3">
                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className={`font-bold block ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.clienteNombre}</span>
                            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{p.clienteTelefono} • {p.clienteEmail}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-sm font-mono text-emerald-500">
                              ${p.total?.toLocaleString('es-CO')} COP
                            </span>
                            <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Método: {p.metodoPago}</span>
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
                                {item.cantidad}x {item.nombre} ({item.presentacion}) - <strong className="text-emerald-500">{item.color}</strong>
                              </span>
                              <span className="font-mono font-bold text-[11px] text-slate-400">
                                ${item.total?.toLocaleString('es-CO')}
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
                          onClick={() => setSelectedOrderDetails(p)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                            isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          Ver Detalle
                        </button>

                        {/* Next transition button */}
                        {perm.nextState && canRole.gestionarPedidos(currentUser?.rol.rol) && (
                          <button
                            onClick={() => {
                              cambiarEstadoPedido(
                                p.pedidoId, 
                                perm.nextState!, 
                                `Avanzado a "${perm.nextLabel}" por ${currentUser?.nombre || 'Colaborador'} (${currentUser?.rol?.rol || 'Staff'})`
                              );
                            }}
                            className="px-3.5 py-1.5 bg-[#00D285] hover:bg-[#00c078] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>{perm.nextLabel}</span>
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
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold block text-xs mb-0.5">
                  🛒 Catálogo en Línea & Disponibilidad Reflejada en Tiempo Real:
                </span>
                <p className="text-xs leading-relaxed">
                  Catálogo oficial y formulaciones tintométricas disponibles para compra en tienda web y mostrador. La disponibilidad de inventario se sincroniza en tiempo real con las bodegas.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('inventarios')}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap ml-4 flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Ir a Gestionar Inventario</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProducts.map((prod) => {
              const isAvailable = inventarios.some(i => i.productoId === prod.productoId && (i.cantidadDisponible || 0) > 0);
              const availableColors = prod.coloresDisponibles?.filter(c => c.disponible !== false) || [];

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
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          isLight ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          Ref: {prod.codigoColorLink} • {prod.categoria}
                        </span>
                        <h4 className={`text-base font-extrabold mt-0.5 leading-snug ${
                          isLight ? 'text-slate-900' : 'text-white'
                        }`}>
                          {prod.nombre}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`font-black text-sm font-mono text-emerald-500 ${!isAvailable ? 'line-through text-slate-400' : ''}`}>
                            ${prod.precio?.toLocaleString('es-CO')} COP
                          </span>
                          <span className={`text-[11px] font-medium ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            • {prod.presentacion}
                          </span>
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

                    {/* Colors Availability Swatches */}
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className={`font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                          Colores de Formulación:
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {availableColors.length} de {prod.coloresDisponibles?.length || 0} disponibles
                        </span>
                      </div>

                      {!prod.coloresDisponibles || prod.coloresDisponibles.length === 0 ? (
                        <p className={`text-xs italic ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          Color estándar de fábrica.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 gap-1.5">
                          {prod.coloresDisponibles.map((c) => (
                            <div
                              key={c.nombre}
                              className={`p-1.5 rounded-lg border flex items-center justify-between gap-1 text-[11px] ${
                                c.disponible
                                  ? isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
                                  : 'bg-rose-950/20 border-rose-500/30 text-rose-400 opacity-60'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                <span 
                                  className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0"
                                  style={{ backgroundColor: c.hex }}
                                />
                                <span className={`truncate ${c.disponible ? '' : 'line-through'}`}>
                                  {c.nombre}
                                </span>
                              </div>
                              <span className={`text-[10px] font-bold ${c.disponible ? 'text-emerald-500' : 'text-rose-400'}`}>
                                {c.disponible ? '✓' : '✗'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
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
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-xs space-y-4 ${
            isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              <div>
                <span className="font-mono text-emerald-500 font-bold">#{selectedOrderDetails.pedidoId}</span>
                <h3 className="font-extrabold text-base">Detalle Completo del Pedido</h3>
              </div>
              <button
                onClick={() => setSelectedOrderDetails(null)}
                className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Cliente:</span>
                <span className="font-bold">{selectedOrderDetails.clienteNombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Modalidad:</span>
                <span className="font-bold capitalize">{selectedOrderDetails.modalidadEntrega.replace('_', ' ')}</span>
              </div>
              {selectedOrderDetails.sucursalRetiro && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Sucursal de Retiro:</span>
                  <span className="font-bold text-emerald-500">{selectedOrderDetails.sucursalRetiro}</span>
                </div>
              )}
              {selectedOrderDetails.codigoRetiro && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Código de Retiro:</span>
                  <span className="font-mono font-black text-sm text-emerald-500">{selectedOrderDetails.codigoRetiro}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Total a Pagar / Pagado:</span>
                <span className="font-mono font-black text-emerald-500">${selectedOrderDetails.total?.toLocaleString('es-CO')} COP</span>
              </div>
            </div>

            {/* Traceability history */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="font-bold block uppercase text-[10px] text-slate-400">Historial de Estados y Roles:</span>
              {selectedOrderDetails.historialEstados.map((h, i) => (
                <div key={i} className={`p-3 rounded-xl border text-xs space-y-1 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-500 uppercase text-[10px]">{h.estado.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-mono text-slate-400">{new Date(h.fecha).toLocaleString('es-CO')}</span>
                  </div>
                  <p className="font-medium">{h.notas}</p>
                  <p className="text-slate-400 text-[10px]">Por: <strong className={isLight ? 'text-slate-700' : 'text-slate-300'}>{h.usuario}</strong> ({h.rol})</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedOrderDetails(null)}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-xs cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
