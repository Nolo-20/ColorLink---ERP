import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { InventarioProducto, Producto } from '../types/database';
import { 
  Package, 
  Droplets, 
  MapPin, 
  Plus, 
  Minus, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Layers, 
  Search,
  Sparkles,
  Building,
  PlusCircle,
  X,
  Palette,
  Eye,
  RefreshCw,
  Check,
  Ban,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export const InventoryModule: React.FC = () => {
  const { 
    inventarios, 
    productos, 
    ciudades,
    actualizarStockInventario, 
    agregarEntradaInventario,
    theme,
    searchQuery,
    showToast 
  } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodegaFilter, setSelectedBodegaFilter] = useState('all');
  const [activeTabSub, setActiveTabSub] = useState<'lotes' | 'disponibilidad'>('lotes');

  // Sync with global navbar search
  useEffect(() => {
    if (searchQuery) {
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  // New inventory manual entry modal & quick inline form
  const [newEntryModalOpen, setNewEntryModalOpen] = useState(false);
  const [quickEntryExpanded, setQuickEntryExpanded] = useState(true);
  const [selectedProdId, setSelectedProdId] = useState(productos[0]?.productoId || '');
  const [selectedBodegaName, setSelectedBodegaName] = useState('Bodega Central Guayabal (Medellín)');
  const [selectedCiudadId, setSelectedCiudadId] = useState(1);
  const [loteInput, setLoteInput] = useState(`LT-2026-MED-${Math.floor(100 + Math.random() * 900)}`);
  const [cantidadInput, setCantidadInput] = useState<number>(50);
  const [tiempoDespachoInput, setTiempoDespachoInput] = useState<number>(2);


  const filteredInventarios = inventarios.filter(inv => {
    const matchesSearch = 
      (inv.producto?.nombre && inv.producto.nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.numeroLote && inv.numeroLote.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesBodega = selectedBodegaFilter === 'all' || inv.nombreBodega.includes(selectedBodegaFilter);
    return matchesSearch && matchesBodega;
  });

  const handleAdjustStock = (inv: InventarioProducto, delta: number) => {
    const nuevoTotal = inv.cantidadDisponible + delta;
    if (nuevoTotal < 0) return;
    actualizarStockInventario(inv.inventarioId, nuevoTotal);
  };

  const handleManualStockChange = (inv: InventarioProducto, val: number) => {
    if (isNaN(val) || val < 0) return;
    actualizarStockInventario(inv.inventarioId, val);
  };

  const handleCreateEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProdId || cantidadInput <= 0) return;

    const creada = await agregarEntradaInventario({
      productoId: selectedProdId,
      ciudadId: inventarios.find(i => i.nombreBodega === selectedBodegaName)?.ciudadId ?? ciudades[0]?.ciudadId ?? selectedCiudadId,
      nombreBodega: selectedBodegaName,
      numeroLote: loteInput,
      cantidadDisponible: Number(cantidadInput),
      tiempoDespacho: Number(tiempoDespachoInput),
    });

    if (!creada) return;
    setNewEntryModalOpen(false);
    // Reset lote suggestion
    setLoteInput(`LT-2026-MED-${Math.floor(100 + Math.random() * 900)}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className={`border rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
        theme === 'light'
          ? 'bg-gradient-to-r from-emerald-50 via-slate-50 to-white border-slate-200 text-slate-900'
          : 'bg-[#0b1628] border-slate-800 text-white'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">
            <Package className="w-4 h-4" />
            Gestión Centralizada de Almacenes, Lotes & Catálogo
          </div>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight">
            Inventarios & Disponibilidad de Colores
          </h2>
          <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
            Control de existencias manuales de cuñetes y galones, registro de lotes en bodegas y activación en tiempo real de productos y colores para la tienda.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setNewEntryModalOpen(true)}
            className="px-4 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span>➕ Registrar Entrada de Lote</span>
          </button>

        </div>
      </div>

      {/* Navigation Subtabs: Lotes en Bodega vs Disponibilidad en Tienda */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveTabSub('lotes')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTabSub === 'lotes'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : theme === 'light' ? 'bg-slate-200/70 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Lotes & Stock en Bodegas ({inventarios.length})</span>
        </button>

        <button
          onClick={() => setActiveTabSub('disponibilidad')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTabSub === 'disponibilidad'
              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
              : theme === 'light' ? 'bg-slate-200/70 text-slate-700 hover:bg-slate-200' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>Disponibilidad de Productos & Colores Tienda ({productos.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: LOTES EN BODEGA */}
      {activeTabSub === 'lotes' && (
        <div className="space-y-4">

          {/* Quick Manual Inventory Entry Panel (Facilitated Filling) */}
          <div className={`border rounded-2xl p-5 shadow-lg transition-all ${
            theme === 'light' 
              ? 'bg-gradient-to-r from-emerald-50/70 via-white to-slate-50 border-emerald-200 text-slate-800' 
              : 'bg-[#091526] border-slate-800 text-white'
          }`}>
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="font-extrabold text-sm tracking-tight flex items-center gap-2">
                    <span>Llenado Manual Rápido de Inventario</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                      Entrada Fácil
                    </span>
                  </h4>
                  <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                    Ingresa o repón rápidamente existencias para cualquier cuñete, galón o recubrimiento de la tienda.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setQuickEntryExpanded(!quickEntryExpanded)}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  theme === 'light' ? 'border-slate-300 hover:bg-slate-100 text-slate-700' : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                <span>{quickEntryExpanded ? 'Ocultar Formulario' : 'Mostrar Formulario'}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${quickEntryExpanded ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {quickEntryExpanded && (
              <form onSubmit={handleCreateEntrySubmit} className="pt-2 border-t border-slate-700/40 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
                {/* Product Selection */}
                <div className="md:col-span-4">
                  <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    Producto a Ingresar
                  </label>
                  <select
                    value={selectedProdId}
                    onChange={(e) => setSelectedProdId(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  >
                    {productos.map(p => (
                      <option key={p.productoId} value={p.productoId}>
                        {p.nombre} ({p.presentacion}) - Ref: {p.codigoColorLink}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Warehouse Location */}
                <div className="md:col-span-3">
                  <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    Bodega / Sucursal
                  </label>
                  <select
                    value={selectedBodegaName}
                    onChange={(e) => {
                      setSelectedBodegaName(e.target.value);
                      if (e.target.value.includes('Itagüí')) setSelectedCiudadId(2);
                      else if (e.target.value.includes('Bello')) setSelectedCiudadId(4);
                      else setSelectedCiudadId(1);
                    }}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  >
                    <option value="Bodega Central Guayabal (Medellín)">Bodega Central Guayabal (Medellín)</option>
                    <option value="Bodega Zona Sur (Itagüí)">Bodega Zona Sur (Itagüí)</option>
                    <option value="Bodega Norte Niquía (Bello)">Bodega Norte Niquía (Bello)</option>
                  </select>
                </div>

                {/* Lot Number */}
                <div className="md:col-span-2">
                  <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                    Número de Lote
                  </label>
                  <input
                    type="text"
                    required
                    value={loteInput}
                    onChange={(e) => setLoteInput(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                    placeholder="LT-2026-MED-..."
                  />
                </div>

                {/* Quantity + Quick pills */}
                <div className="md:col-span-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className={`font-bold ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                      Cantidad a Cargar
                    </label>
                    <div className="flex gap-1">
                      {[10, 25, 50, 100].map(amt => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCantidadInput(amt)}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                            cantidadInput === amt
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : theme === 'light' ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-800 text-slate-400 hover:text-white'
                          }`}
                        >
                          +{amt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      required
                      value={cantidadInput}
                      onChange={(e) => setCantidadInput(Math.max(1, parseInt(e.target.value) || 0))}
                      className={`w-28 rounded-xl px-3 py-2 text-xs font-mono font-black text-center focus:outline-none focus:border-emerald-500 ${
                        theme === 'light' ? 'bg-white border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-emerald-400'
                      }`}
                    />
                    <button
                      type="submit"
                      className="flex-1 bg-[#F2C417] hover:bg-[#C99A0A] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer py-2"
                    >
                      <Plus className="w-4 h-4 text-slate-950" />
                      <span>Cargar Stock</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
          
          {/* Filter and Search Bar */}
          <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#091526] border-slate-800'
          }`}>
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por producto o número de lote..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-emerald-500 ${
                  theme === 'light'
                    ? 'bg-slate-100 border border-slate-300 text-slate-900'
                    : 'bg-slate-900 border border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className={`text-xs whitespace-nowrap ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Filtrar Bodega:
              </span>
              <select
                value={selectedBodegaFilter}
                onChange={(e) => setSelectedBodegaFilter(e.target.value)}
                className={`rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 font-medium ${
                  theme === 'light'
                    ? 'bg-slate-100 border border-slate-300 text-slate-900'
                    : 'bg-slate-900 border border-slate-700 text-white'
                }`}
              >
                <option value="all">Todas las Bodegas (Valle de Aburrá)</option>
                <option value="Guayabal">Bodega Central Guayabal (Medellín)</option>
                <option value="Itagüí">Bodega Zona Sur (Itagüí)</option>
                <option value="Bello">Bodega Norte Niquía (Bello)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className={`border rounded-3xl overflow-hidden shadow-xl ${
            theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#091526] border-slate-800'
          }`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b font-bold uppercase tracking-wider text-[11px] ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 text-slate-600'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400'
                  }`}>
                    <th className="py-3.5 px-4">Producto & Presentación</th>
                    <th className="py-3.5 px-4">Bodega / Ubicación</th>
                    <th className="py-3.5 px-4">Número de Lote</th>
                    <th className="py-3.5 px-4 text-center">Stock Físico Disponible</th>
                    <th className="py-3.5 px-4">Fecha Tinturación</th>
                    <th className="py-3.5 px-4">Despacho</th>
                    <th className="py-3.5 px-4 text-right">Ajuste Rápido Manual</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                  {filteredInventarios.map((inv) => {
                    const isLow = inv.cantidadDisponible <= 15;
                    return (
                      <tr key={inv.inventarioId} className={`transition-colors ${
                        theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'
                      }`}>
                        <td className="py-3.5 px-4">
                          <div className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {inv.producto?.nombre}
                          </div>
                          <div className={`text-[11px] font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {inv.producto?.presentacion} • Ref: {inv.producto?.codigoColorLink}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>{inv.nombreBodega}</span>
                          </div>
                          <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {inv.ciudad?.ciudad || 'Medellín'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                          {inv.numeroLote || 'N/A'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              value={inv.cantidadDisponible}
                              onChange={(e) => handleManualStockChange(inv, parseInt(e.target.value) || 0)}
                              className={`w-20 text-center font-mono font-black text-sm px-2 py-1 rounded-lg border focus:outline-none focus:border-emerald-500 ${
                                isLow
                                  ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                                  : theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-emerald-400'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400">unid.</span>
                          </div>
                          {isLow && (
                            <span className="block text-[10px] text-rose-500 font-bold mt-1">
                              ¡Stock Crítico!
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {inv.fechaTinturado ? new Date(inv.fechaTinturado).toLocaleDateString('es-CO') : 'Al día'}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/30">
                            <Clock className="w-3 h-3" />
                            {inv.tiempoDespacho || 2}h Tránsito
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAdjustStock(inv, -1)}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                                theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                              }`}
                              title="Restar 1 unidad"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleAdjustStock(inv, 1)}
                              className="w-7 h-7 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold transition-colors cursor-pointer"
                              title="Sumar 1 unidad"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DISPONIBILIDAD DE PRODUCTOS Y COLORES EN TIENDA */}
      {activeTabSub === 'disponibilidad' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${
            theme === 'light' ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}>
            <span className="font-bold block text-xs mb-1">
              🎨 Gobernanza de Disponibilidad para Tienda y Proyectos:
            </span>
            <p className="text-xs leading-relaxed">
              Catálogo de productos con el stock real sumado de todas las bodegas. Para reponer un producto, registra una entrada de lote o ajusta las cantidades en la pestaña de lotes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productos.map((prod) => {
              const stockTotal = inventarios.filter(i => i.productoId === prod.productoId).reduce((a, i) => a + (i.cantidadDisponible || 0), 0);
              const isAvailable = stockTotal > 0;

              return (
                <div 
                  key={prod.productoId}
                  className={`border rounded-3xl p-5 shadow-lg flex flex-col justify-between space-y-4 transition-all ${
                    isAvailable
                      ? theme === 'light' ? 'bg-white border-slate-200' : 'bg-[#091526] border-slate-800'
                      : 'bg-rose-950/15 border-rose-500/30'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div>
                        <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                        }`}>
                          Ref: {prod.codigoColorLink} • {prod.categoria}
                        </span>
                        <h4 className={`text-base font-extrabold mt-0.5 ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {prod.nombre}
                        </h4>
                        <span className="text-xs text-emerald-500 font-bold font-mono">
                          ${prod.precio?.toLocaleString('es-CO')} COP • {prod.presentacion}
                        </span>
                      </div>

                      {/* General Availability Badge & Switch */}
                      <div
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                          isAvailable
                            ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/50'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                        }`}
                      >
                        {isAvailable ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{stockTotal} en stock</span>
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5 text-rose-400" />
                            <span>Agotado</span>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL: REGISTRAR ENTRADA MANUAL DE LOTE */}
      {newEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className={`border rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-xs ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <div className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                <h3 className="font-extrabold text-base">Entrada Manual de Inventario / Nuevo Lote</h3>
              </div>
              <button
                onClick={() => setNewEntryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntrySubmit} className="my-4 space-y-3.5">
              
              <div>
                <label className="block font-bold mb-1">Producto</label>
                <select
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 ${
                    theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                  }`}
                >
                  {productos.map(p => (
                    <option key={p.productoId} value={p.productoId}>
                      {p.nombre} ({p.presentacion})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Bodega de Destino</label>
                <select
                  value={selectedBodegaName}
                  onChange={(e) => {
                    setSelectedBodegaName(e.target.value);
                    if (e.target.value.includes('Itagüí')) setSelectedCiudadId(2);
                    else if (e.target.value.includes('Bello')) setSelectedCiudadId(4);
                    else setSelectedCiudadId(1);
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 ${
                    theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                  }`}
                >
                  <option value="Bodega Central Guayabal (Medellín)">Bodega Central Guayabal (Medellín)</option>
                  <option value="Bodega Zona Sur (Itagüí Industrial)">Bodega Zona Sur (Itagüí Industrial)</option>
                  <option value="Bodega Norte Niquía (Bello)">Bodega Norte Niquía (Bello)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Número de Lote</label>
                  <input
                    type="text"
                    required
                    value={loteInput}
                    onChange={(e) => setLoteInput(e.target.value)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Cantidad a Ingresar (Unidades)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(parseInt(e.target.value) || 1)}
                    className={`w-full rounded-xl px-3 py-2 text-xs font-mono font-bold focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Tiempo Estimado de Despacho (Horas)</label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={tiempoDespachoInput}
                  onChange={(e) => setTiempoDespachoInput(parseInt(e.target.value) || 2)}
                  className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                    theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewEntryModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold ${
                    theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] text-slate-950 font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Registrar Lote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
