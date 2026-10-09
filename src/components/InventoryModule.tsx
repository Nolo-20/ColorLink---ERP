import React, { useState, useEffect, useMemo } from 'react';
import { useApp, canRole } from '../context/AppContext';
import { InventarioProducto } from '../types/database';
import { api, ApiError } from '../api';
import {
  Package,
  MapPin,
  Plus,
  Minus,
  Clock,
  Layers,
  Search,
  PlusCircle,
  Palette,
  Check,
  Ban,
  ChevronDown
} from 'lucide-react';

const NUEVA_BODEGA = '__nueva__';

export const InventoryModule: React.FC = () => {
  const {
    inventarios,
    productos,
    ciudades,
    currentUser,
    actualizarStockInventario,
    agregarEntradaInventario,
    refreshData,
    theme,
    searchQuery,
    showToast
  } = useApp();

  const canEdit = canRole.editarInventario(currentUser?.rol.rol);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBodegaFilter, setSelectedBodegaFilter] = useState('all');
  const [activeTabSub, setActiveTabSub] = useState<'lotes' | 'disponibilidad'>('lotes');

  // Sincroniza con la búsqueda global de la barra superior (también cuando se borra)
  useEffect(() => {
    setSearchTerm(searchQuery || '');
  }, [searchQuery]);

  // Bodegas reales registradas en el inventario, con su ciudad
  const bodegas = useMemo(() => {
    const map = new Map<string, { nombre: string; ciudadId: number; ciudad?: string }>();
    inventarios.forEach(i => {
      if (!map.has(i.nombreBodega)) {
        map.set(i.nombreBodega, { nombre: i.nombreBodega, ciudadId: i.ciudadId, ciudad: i.ciudad?.ciudad });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  }, [inventarios]);

  // Formulario de entrada (compartido entre el panel rápido y el modal)
  const [newEntryModalOpen, setNewEntryModalOpen] = useState(false);
  const [quickEntryExpanded, setQuickEntryExpanded] = useState(true);
  const [selectedProdId, setSelectedProdId] = useState('');
  const [selectedBodegaName, setSelectedBodegaName] = useState('');
  const [nuevaBodegaNombre, setNuevaBodegaNombre] = useState('');
  const [nuevaBodegaCiudadId, setNuevaBodegaCiudadId] = useState<number | ''>('');
  const [loteInput, setLoteInput] = useState('');
  const [cantidadInput, setCantidadInput] = useState<number>(50);
  const [tiempoDespachoInput, setTiempoDespachoInput] = useState<string>('');
  const [savingEntry, setSavingEntry] = useState(false);

  // Los productos y bodegas llegan después del primer render: se eligen cuando estén disponibles
  useEffect(() => {
    if (productos.length && !productos.some(p => p.productoId === selectedProdId)) {
      setSelectedProdId(productos[0].productoId);
    }
  }, [productos, selectedProdId]);

  useEffect(() => {
    if (selectedBodegaName === NUEVA_BODEGA) return;
    if (!bodegas.some(b => b.nombre === selectedBodegaName)) {
      setSelectedBodegaName(bodegas[0]?.nombre ?? NUEVA_BODEGA);
    }
  }, [bodegas, selectedBodegaName]);

  // Ajuste de la celda de stock: se edita en borrador y se guarda al salir del campo o con Enter
  const [stockDraft, setStockDraft] = useState<Record<string, string>>({});
  const [savingStock, setSavingStock] = useState<Record<string, boolean>>({});

  const filteredInventarios = inventarios.filter(inv => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      (inv.producto?.nombre && inv.producto.nombre.toLowerCase().includes(term)) ||
      (inv.numeroLote && inv.numeroLote.toLowerCase().includes(term));
    const matchesBodega = selectedBodegaFilter === 'all' || inv.nombreBodega === selectedBodegaFilter;
    return matchesSearch && matchesBodega;
  });

  const errorMsg = (err: unknown, fallback: string) =>
    err instanceof ApiError && err.message ? err.message : fallback;

  const handleAdjustStock = async (inv: InventarioProducto, delta: number) => {
    if (delta < 0 && inv.cantidadDisponible <= 0) return;
    try {
      // Ajuste relativo: varios clics seguidos se suman en el servidor sin perderse
      await api.adjustStock(inv.inventarioId, delta);
      await refreshData();
    } catch (err) {
      showToast(errorMsg(err, 'No se pudo ajustar el stock.'), 'error');
    }
  };

  const commitStockDraft = async (inv: InventarioProducto) => {
    const raw = stockDraft[inv.inventarioId];
    if (raw === undefined) return;
    const val = parseInt(raw, 10);
    if (!Number.isFinite(val) || val < 0 || val === inv.cantidadDisponible) {
      setStockDraft(({ [inv.inventarioId]: _omit, ...rest }) => rest);
      if (raw.trim() !== '' && (!Number.isFinite(val) || val < 0)) {
        showToast('La cantidad debe ser un número entero mayor o igual a 0.', 'error');
      }
      return;
    }
    setSavingStock(s => ({ ...s, [inv.inventarioId]: true }));
    try {
      await actualizarStockInventario(inv.inventarioId, val);
    } finally {
      setSavingStock(({ [inv.inventarioId]: _omit, ...rest }) => rest);
      setStockDraft(({ [inv.inventarioId]: _omit, ...rest }) => rest);
    }
  };

  const esNuevaBodega = selectedBodegaName === NUEVA_BODEGA;
  const bodegaSeleccionada = bodegas.find(b => b.nombre === selectedBodegaName);

  const handleCreateEntrySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingEntry) return;
    if (!selectedProdId) {
      showToast('Selecciona un producto. Si la lista está vacía, espera a que cargue el catálogo.', 'error');
      return;
    }
    if (!Number.isFinite(cantidadInput) || cantidadInput <= 0) {
      showToast('La cantidad debe ser mayor a 0.', 'error');
      return;
    }

    let nombreBodega: string;
    let ciudadId: number | undefined;
    if (esNuevaBodega) {
      nombreBodega = nuevaBodegaNombre.trim();
      ciudadId = nuevaBodegaCiudadId === '' ? undefined : nuevaBodegaCiudadId;
      if (!nombreBodega || ciudadId == null) {
        showToast('Escribe el nombre de la nueva bodega y elige su ciudad.', 'error');
        return;
      }
    } else {
      if (!bodegaSeleccionada) {
        showToast('Selecciona una bodega.', 'error');
        return;
      }
      nombreBodega = bodegaSeleccionada.nombre;
      ciudadId = bodegaSeleccionada.ciudadId;
    }

    const tiempo = tiempoDespachoInput.trim() === '' ? undefined : Number(tiempoDespachoInput);

    setSavingEntry(true);
    try {
      const creada = await agregarEntradaInventario({
        productoId: selectedProdId,
        ciudadId,
        nombreBodega,
        numeroLote: loteInput.trim(), // vacío: el servidor genera el número de lote
        cantidadDisponible: Number(cantidadInput),
        tiempoDespacho: tiempo != null && Number.isFinite(tiempo) ? tiempo : undefined,
      });

      if (!creada) return;
      setNewEntryModalOpen(false);
      setLoteInput('');
      if (esNuevaBodega) {
        setSelectedBodegaName(creada.nombreBodega);
        setNuevaBodegaNombre('');
        setNuevaBodegaCiudadId('');
      }
    } finally {
      setSavingEntry(false);
    }
  };

  const fieldClass = (light: string, dark: string) => (theme === 'light' ? light : dark);

  const productOptions = productos.map(p => (
    <option key={p.productoId} value={p.productoId}>
      {p.nombre}{p.presentacion ? ` (${p.presentacion})` : ''}
    </option>
  ));

  const bodegaOptions = (
    <>
      {bodegas.map(b => (
        <option key={b.nombre} value={b.nombre}>
          {b.nombre}{b.ciudad ? ` — ${b.ciudad}` : ''}
        </option>
      ))}
      <option value={NUEVA_BODEGA}>+ Nueva bodega…</option>
    </>
  );

  const nuevaBodegaFields = (inputClass: string) => (
    <>
      <div>
        <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
          Nombre de la nueva bodega
        </label>
        <input
          type="text"
          required
          value={nuevaBodegaNombre}
          onChange={(e) => setNuevaBodegaNombre(e.target.value)}
          placeholder="Ej: Bodega Central"
          className={inputClass}
        />
      </div>
      <div>
        <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
          Ciudad
        </label>
        <select
          required
          value={nuevaBodegaCiudadId}
          onChange={(e) => setNuevaBodegaCiudadId(e.target.value === '' ? '' : Number(e.target.value))}
          className={inputClass}
        >
          <option value="">{ciudades.length ? 'Selecciona la ciudad' : 'Cargando ciudades…'}</option>
          {ciudades.map(c => (
            <option key={c.ciudadId} value={c.ciudadId}>{c.ciudad}</option>
          ))}
        </select>
      </div>
    </>
  );

  const quickInputClass = `w-full rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:border-emerald-500 ${
    fieldClass('bg-white border border-slate-300 text-slate-900', 'bg-slate-900 border border-slate-700 text-white')
  }`;
  const modalInputClass = `w-full rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 ${
    fieldClass('bg-slate-100 border border-slate-300 text-slate-900', 'bg-slate-900 border border-slate-700 text-white')
  }`;

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
            Inventarios & Disponibilidad
          </h2>
          <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>
            {canEdit
              ? 'Control de existencias de cuñetes y galones y registro de lotes en bodegas.'
              : 'Consulta de existencias por bodega. Solo el Administrador puede ajustar el stock o registrar lotes.'}
          </p>
        </div>

        {canEdit && (
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setNewEntryModalOpen(true)}
              className="px-4 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>Registrar Entrada de Lote</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Subtabs */}
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
          <span>Disponibilidad de Productos ({productos.length})</span>
        </button>
      </div>

      {/* SUBTAB 1: LOTES EN BODEGA */}
      {activeTabSub === 'lotes' && (
        <div className="space-y-4">

          {/* Quick Manual Inventory Entry Panel */}
          {canEdit && (
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
                      Ingresa o repón rápidamente existencias de un producto en una bodega.
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
                      required
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      disabled={productos.length === 0}
                      className={quickInputClass}
                    >
                      {productos.length === 0 && <option value="">Cargando productos…</option>}
                      {productOptions}
                    </select>
                  </div>

                  {/* Warehouse Location */}
                  <div className="md:col-span-3">
                    <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                      Bodega / Sucursal
                    </label>
                    <select
                      value={selectedBodegaName}
                      onChange={(e) => setSelectedBodegaName(e.target.value)}
                      className={quickInputClass}
                    >
                      {bodegaOptions}
                    </select>
                  </div>

                  {/* Lot Number */}
                  <div className="md:col-span-2">
                    <label className={`block font-bold mb-1 ${theme === 'light' ? 'text-slate-700' : 'text-slate-300'}`}>
                      Número de Lote
                    </label>
                    <input
                      type="text"
                      value={loteInput}
                      onChange={(e) => setLoteInput(e.target.value)}
                      className={`${quickInputClass} font-mono font-bold`}
                      placeholder="Automático"
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
                            {amt}
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
                        disabled={savingEntry || productos.length === 0}
                        className="flex-1 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer py-2"
                      >
                        <Plus className="w-4 h-4 text-slate-950" />
                        <span>{savingEntry ? 'Guardando…' : 'Cargar Stock'}</span>
                      </button>
                    </div>
                  </div>

                  {esNuevaBodega && (
                    <div className="md:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {nuevaBodegaFields(quickInputClass)}
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

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
                <option value="all">Todas las Bodegas</option>
                {bodegas.map(b => (
                  <option key={b.nombre} value={b.nombre}>
                    {b.nombre}{b.ciudad ? ` — ${b.ciudad}` : ''}
                  </option>
                ))}
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
                    {canEdit && <th className="py-3.5 px-4 text-right">Ajuste Rápido Manual</th>}
                  </tr>
                </thead>
                <tbody className={`divide-y ${theme === 'light' ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
                  {filteredInventarios.length === 0 && (
                    <tr>
                      <td colSpan={canEdit ? 7 : 6} className={`py-10 text-center ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {inventarios.length === 0
                          ? 'Aún no hay lotes registrados en ninguna bodega.'
                          : 'Ningún lote coincide con la búsqueda o el filtro.'}
                      </td>
                    </tr>
                  )}
                  {filteredInventarios.map((inv) => {
                    const isLow = inv.cantidadDisponible <= 15;
                    const draft = stockDraft[inv.inventarioId];
                    const saving = !!savingStock[inv.inventarioId];
                    return (
                      <tr key={inv.inventarioId} className={`transition-colors ${
                        theme === 'light' ? 'hover:bg-slate-50' : 'hover:bg-slate-900/40'
                      }`}>
                        <td className="py-3.5 px-4">
                          <div className={`font-bold text-sm ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
                            {inv.producto?.nombre || '—'}
                          </div>
                          {(inv.producto?.presentacion || inv.producto?.categoria) && (
                            <div className={`text-[11px] font-medium ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                              {[inv.producto?.presentacion, inv.producto?.categoria].filter(Boolean).join(' • ')}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                            <span>{inv.nombreBodega}</span>
                          </div>
                          <span className={`text-[10px] ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                            {inv.ciudad?.ciudad || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-500">
                          {inv.numeroLote || '—'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-2">
                            {canEdit ? (
                              <input
                                type="number"
                                min={0}
                                disabled={saving}
                                value={draft ?? String(inv.cantidadDisponible)}
                                onChange={(e) => setStockDraft(s => ({ ...s, [inv.inventarioId]: e.target.value }))}
                                onBlur={() => commitStockDraft(inv)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                  if (e.key === 'Escape') setStockDraft(({ [inv.inventarioId]: _omit, ...rest }) => rest);
                                }}
                                title="Escribe la cantidad y presiona Enter para guardar"
                                className={`w-20 text-center font-mono font-black text-sm px-2 py-1 rounded-lg border focus:outline-none focus:border-emerald-500 disabled:opacity-60 ${
                                  isLow
                                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-500'
                                    : theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-900' : 'bg-slate-950 border-slate-700 text-emerald-400'
                                }`}
                              />
                            ) : (
                              <span className={`font-mono font-black text-sm ${isLow ? 'text-rose-500' : theme === 'light' ? 'text-slate-900' : 'text-emerald-400'}`}>
                                {inv.cantidadDisponible}
                              </span>
                            )}
                            <span className="text-[10px] text-slate-400">unid.</span>
                          </div>
                          {isLow && (
                            <span className="block text-[10px] text-rose-500 font-bold mt-1">
                              ¡Stock Crítico!
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                          {inv.fechaTinturado && !isNaN(new Date(inv.fechaTinturado).getTime())
                            ? new Date(inv.fechaTinturado).toLocaleDateString('es-CO')
                            : '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          {inv.tiempoDespacho != null ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-500 border border-sky-500/30">
                              <Clock className="w-3 h-3" />
                              {inv.tiempoDespacho}h Tránsito
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {canEdit && (
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleAdjustStock(inv, -1)}
                                disabled={inv.cantidadDisponible <= 0}
                                className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
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
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: DISPONIBILIDAD DE PRODUCTOS */}
      {activeTabSub === 'disponibilidad' && (
        <div className="space-y-4">
          <div className={`p-4 rounded-2xl border ${
            theme === 'light' ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900' : 'bg-slate-900/80 border-slate-800 text-slate-300'
          }`}>
            <span className="font-bold block text-xs mb-1">
              🎨 Disponibilidad para Tienda y Proyectos:
            </span>
            <p className="text-xs leading-relaxed">
              Catálogo de productos con el stock real sumado de todas las bodegas. Para reponer un producto, registra una entrada de lote o ajusta las cantidades en la pestaña de lotes.
            </p>
          </div>

          {productos.length === 0 && (
            <p className={`text-xs text-center py-8 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
              No hay productos en el catálogo.
            </p>
          )}

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
                    <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                      <div>
                        {prod.categoria && (
                          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                            theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {prod.categoria}
                          </span>
                        )}
                        <h4 className={`text-base font-extrabold mt-0.5 ${
                          theme === 'light' ? 'text-slate-900' : 'text-white'
                        }`}>
                          {prod.nombre}
                        </h4>
                        <span className="text-xs text-emerald-500 font-bold font-mono">
                          {prod.precio != null ? `$${prod.precio.toLocaleString('es-CO')} COP` : 'Sin precio'}
                          {prod.presentacion ? ` • ${prod.presentacion}` : ''}
                        </span>
                      </div>

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
      {canEdit && newEntryModalOpen && (
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
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateEntrySubmit} className="my-4 space-y-3.5">

              <div>
                <label className="block font-bold mb-1">Producto</label>
                <select
                  required
                  value={selectedProdId}
                  onChange={(e) => setSelectedProdId(e.target.value)}
                  disabled={productos.length === 0}
                  className={modalInputClass}
                >
                  {productos.length === 0 && <option value="">Cargando productos…</option>}
                  {productOptions}
                </select>
              </div>

              <div>
                <label className="block font-bold mb-1">Bodega de Destino</label>
                <select
                  value={selectedBodegaName}
                  onChange={(e) => setSelectedBodegaName(e.target.value)}
                  className={modalInputClass}
                >
                  {bodegaOptions}
                </select>
              </div>

              {esNuevaBodega && (
                <div className="grid grid-cols-2 gap-3">
                  {nuevaBodegaFields(modalInputClass)}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Número de Lote</label>
                  <input
                    type="text"
                    value={loteInput}
                    onChange={(e) => setLoteInput(e.target.value)}
                    placeholder="Automático si se deja vacío"
                    className={`${modalInputClass} font-mono uppercase`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Cantidad a Ingresar (Unidades)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={cantidadInput}
                    onChange={(e) => setCantidadInput(Math.max(1, parseInt(e.target.value) || 0))}
                    className={`${modalInputClass} font-mono font-bold`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold mb-1">Tiempo Estimado de Despacho (Horas, opcional)</label>
                <input
                  type="number"
                  min={0}
                  max={240}
                  value={tiempoDespachoInput}
                  onChange={(e) => setTiempoDespachoInput(e.target.value)}
                  className={`${modalInputClass} font-mono`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNewEntryModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold cursor-pointer ${
                    theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEntry || productos.length === 0}
                  className="flex-1 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  {savingEntry ? 'Guardando…' : 'Registrar Lote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
