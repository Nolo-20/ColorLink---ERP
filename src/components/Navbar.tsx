import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  Clock, 
  MapPin, 
  UserCheck, 
  LogOut,
  Layers,
  ShieldCheck,
  Package,
  Truck,
  BarChart3,
  GitCommit,
  Menu,
  Sun,
  Moon,
  X,
  ShoppingBag,
  Users,
  Info
} from 'lucide-react';

interface NavbarProps {
  collapsed: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ collapsed, onToggleSidebar }) => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    logout, 
    theme,
    toggleTheme,
    proyectos,
    pedidos,
    productos,
    inventarios,
    setSelectedProyecto,
    setSelectedPedido,
    setSearchQuery,
    setProfileModalOpen,
    hasModuleAccess
  } = useApp();

  const [searchInput, setSearchInput] = useState<string>('');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  // Real-time search query matching
  const query = searchInput.trim().toLowerCase();

  // Solo se buscan módulos que el rol puede abrir
  const canProjects = hasModuleAccess('proyectos');
  const canOrders = hasModuleAccess('pedidos');
  const canInventory = hasModuleAccess('inventarios');

  const matchedProjects = query && canProjects
    ? proyectos.filter(p => 
        (p.nombreProyecto || '').toLowerCase().includes(query) ||
        (p.empresa?.razonSocial || '').toLowerCase().includes(query) ||
        (p.color && p.color.toLowerCase().includes(query)) ||
        (p.despacho?.numeroGuia && p.despacho.numeroGuia.toLowerCase().includes(query))
      ).slice(0, 4)
    : [];

  const matchedOrders = query && canOrders
    ? pedidos.filter(p => 
        p.pedidoId.toLowerCase().includes(query) ||
        p.clienteNombre.toLowerCase().includes(query) ||
        (p.codigoRetiro && p.codigoRetiro.toLowerCase().includes(query)) ||
        (p.sucursalRetiro && p.sucursalRetiro.toLowerCase().includes(query))
      ).slice(0, 4)
    : [];

  const matchedProducts = query && canInventory
    ? productos.filter(p => 
        p.nombre.toLowerCase().includes(query) ||
        (p.codigoColorLink && p.codigoColorLink.toLowerCase().includes(query)) ||
        (p.categoria && p.categoria.toLowerCase().includes(query))
      ).slice(0, 4)
    : [];

  const matchedLots = query && canInventory
    ? inventarios.filter(inv =>
        (inv.numeroLote && inv.numeroLote.toLowerCase().includes(query)) ||
        (inv.nombreBodega && inv.nombreBodega.toLowerCase().includes(query))
      ).slice(0, 3)
    : [];

  const totalResults = matchedProjects.length + matchedOrders.length + matchedProducts.length + matchedLots.length;

  const handleSelectProject = (p: typeof proyectos[0]) => {
    setSelectedProyecto(p);
    setActiveTab('proyectos');
    setIsSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchInput('');
    setSearchQuery('');
  };

  const handleSelectOrder = (p: typeof pedidos[0]) => {
    setSelectedPedido(p);
    setActiveTab('pedidos');
    setIsSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchInput('');
    setSearchQuery('');
  };

  const handleSelectProduct = (prod?: typeof productos[0]) => {
    setActiveTab('inventarios');
    setIsSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchInput('');
    if (prod) setSearchQuery(prod.nombre);
  };

  const handleSelectLot = (inv: typeof inventarios[0]) => {
    setActiveTab('inventarios');
    setIsSearchOpen(false);
    setMobileSearchOpen(false);
    setSearchInput('');
    if (inv.numeroLote) setSearchQuery(inv.numeroLote);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (matchedProjects.length > 0) {
        handleSelectProject(matchedProjects[0]);
      } else if (matchedOrders.length > 0) {
        handleSelectOrder(matchedOrders[0]);
      } else if (matchedProducts.length > 0) {
        handleSelectProduct(matchedProducts[0]);
      } else if (matchedLots.length > 0) {
        handleSelectLot(matchedLots[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
      setMobileSearchOpen(false);
    }
  };

  const getModuleTitle = () => {
    switch (activeTab) {
      case 'proyectos': return { title: 'Proyectos & Cotizaciones', icon: Layers };
      case 'pipeline': return { title: 'Pipeline & Trazabilidad', icon: GitCommit };
      case 'calidad': return { title: 'Control de Calidad Técnica', icon: ShieldCheck };
      case 'inventarios': return { title: 'Inventarios & Bodegas', icon: Package };
      case 'despachos': return { title: 'Módulo de Despachos', icon: Truck };
      case 'pedidos': return { title: 'Pedidos & Retiro Tienda', icon: ShoppingBag };
      case 'reportes': return { title: 'Reportes & Métricas', icon: BarChart3 };
      case 'canje_sucursal': return { title: 'Canje de Retiro en Sucursal', icon: ShoppingBag };
      case 'colaboradores': return { title: 'Gestión de Empleados', icon: Users };
      case 'roles_permisos': return { title: 'Matriz de Roles & Estados', icon: Info };
      default: return { title: 'Panel Principal', icon: Home };
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

  const searchPlaceholder = 'Buscar obras, clientes, pedidos RET, cuñetes, lotes... (Enter para ir)';

  const moduleInfo = getModuleTitle();
  const ModuleIcon = moduleInfo.icon;

  const resultsContent = (
    <>
              {totalResults === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  No se encontraron coincidencias para "<span className="font-bold text-emerald-500">{searchInput}</span>".
                </div>
              ) : (
                <>
                  {/* Matched Projects */}
                  {matchedProjects.length > 0 && (
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-2 ${
                        theme === 'light' ? 'text-indigo-600' : 'text-indigo-400'
                      }`}>
                        Proyectos y Obras ({matchedProjects.length})
                      </span>
                      <div className="space-y-1">
                        {matchedProjects.map(p => (
                          <div
                            key={p.proyectoId}
                            onClick={() => handleSelectProject(p)}
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Layers className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                              <div className="truncate">
                                <span className="font-bold block truncate">{p.nombreProyecto}</span>
                                <span className={`text-[10px] truncate block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {p.empresa?.razonSocial} • {p.color}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 font-mono ml-2">
                              {p.area} m²
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Orders */}
                  {matchedOrders.length > 0 && (
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-2 ${
                        theme === 'light' ? 'text-emerald-600' : 'text-emerald-400'
                      }`}>
                        Pedidos de Tienda / Códigos Retiro ({matchedOrders.length})
                      </span>
                      <div className="space-y-1">
                        {matchedOrders.map(o => (
                          <div
                            key={o.pedidoId}
                            onClick={() => handleSelectOrder(o)}
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <ShoppingBag className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <div className="truncate">
                                <span className="font-bold block truncate">Pedido #{o.pedidoId} — {o.clienteNombre}</span>
                                <span className={`text-[10px] truncate block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {o.sucursalRetiro || o.direccionEntrega}
                                </span>
                              </div>
                            </div>
                            {o.codigoRetiro && (
                              <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/40">
                                {o.codigoRetiro}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Matched Products */}
                  {matchedProducts.length > 0 && (
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-2 ${
                        theme === 'light' ? 'text-cyan-600' : 'text-cyan-400'
                      }`}>
                        Catálogo de Productos & Cuñetes ({matchedProducts.length})
                      </span>
                      <div className="space-y-1">
                        {matchedProducts.map(prod => (
                          <div
                            key={prod.productoId}
                            onClick={() => handleSelectProduct(prod)}
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Package className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                              <div className="truncate">
                                <span className="font-bold block truncate">{prod.nombre}</span>
                                <span className={`text-[10px] truncate block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {prod.presentacion} • Ref: {prod.codigoColorLink}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                              ${prod.precio?.toLocaleString('es-CO')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Matched Lots */}
                  {matchedLots.length > 0 && (
                    <div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 px-2 ${
                        theme === 'light' ? 'text-amber-600' : 'text-amber-400'
                      }`}>
                        Lotes y Existencias en Bodega ({matchedLots.length})
                      </span>
                      <div className="space-y-1">
                        {matchedLots.map(inv => (
                          <div
                            key={inv.inventarioId}
                            onClick={() => handleSelectLot(inv)}
                            className={`p-2.5 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-colors ${
                              theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800/80'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <MapPin className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              <div className="truncate">
                                <span className="font-bold block truncate">Lote: {inv.numeroLote}</span>
                                <span className={`text-[10px] truncate block ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                                  {inv.nombreBodega} • {inv.producto?.nombre}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-500 font-mono">
                              {inv.cantidadDisponible} unid
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
    </>
  );

  return (
    <header className={`sticky top-0 z-30 w-full backdrop-blur-md border-b transition-colors ${
      theme === 'light' 
        ? 'bg-white/95 border-slate-200 text-slate-800 shadow-sm' 
        : 'bg-[#071120]/95 border-slate-800 text-white'
    }`}>
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Sidebar Toggle + Breadcrumb or "Volver a Inicio" button */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                theme === 'light' 
                  ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Alternar Menú Lateral"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          {activeTab !== 'inicio' ? (
            <button
              onClick={() => setActiveTab('inicio')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors cursor-pointer border shadow-sm ${
                theme === 'light'
                  ? 'bg-slate-100 hover:bg-slate-200 text-emerald-600 border-slate-200'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border-slate-700'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Panel</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs font-medium">
              <Home className="w-4 h-4 text-emerald-500" />
              <span className={`font-bold ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>Panel Principal</span>
              <span className={theme === 'light' ? 'text-slate-400' : 'text-slate-500'}>•</span>
              <span className={theme === 'light' ? 'text-slate-500' : 'text-slate-400'}>ColorLink ERP</span>
            </div>
          )}

          {activeTab !== 'inicio' && (
            <div className={`hidden sm:flex items-center gap-2 text-xs pl-2 border-l ${
              theme === 'light' ? 'border-slate-200' : 'border-slate-800'
            }`}>
              <ModuleIcon className={`w-4 h-4 ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`} />
              <span className={`font-bold ${theme === 'light' ? 'text-slate-800' : 'text-slate-200'}`}>{moduleInfo.title}</span>
            </div>
          )}
        </div>

        {/* Center: FUNCTIONAL Search Box with live dropdown results */}
        <div ref={searchRef} className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
          <div className="relative w-full">
            <Search className={`w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 ${
              theme === 'light' ? 'text-slate-400' : 'text-slate-400'
            }`} />
            
            <input
              type="text"
              value={searchInput}
              onFocus={() => setIsSearchOpen(true)}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              placeholder={searchPlaceholder}
              className={`w-full rounded-xl pl-9 pr-8 py-2 text-xs transition-colors focus:outline-none focus:border-emerald-500 ${
                theme === 'light'
                  ? 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  : 'bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:bg-slate-950'
              }`}
            />

            {searchInput && (
              <button
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Search Results Dropdown Popover */}
          {isSearchOpen && query.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-2xl border p-3 z-50 max-h-[420px] overflow-y-auto space-y-3 ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-[#0b172a] border-slate-700 text-white'
            }`}>
              
              {resultsContent}
            </div>
          )}
        </div>

        {/* Right: Mobile Search Button, Working Status, Theme Switch, Time and Profile */}
        <div className="flex items-center gap-3">
          {/* Mobile Search Button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className={`md:hidden p-2 rounded-xl border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title="Buscar"
          >
            <Search className="w-4 h-4" />
          </button>
          
          {/* Theme Switcher Button (Sun / Moon) */}
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sky-600" />
            )}
          </button>

          {/* City indicator */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-500" />
            <span className={`font-medium ${theme === 'light' ? 'text-slate-600' : 'text-slate-300'}`}>Valle de Aburrá</span>
          </div>

          {/* User Profile Pill (Production - Clickable to Manage Profile) */}
          <button
            onClick={() => setProfileModalOpen(true)}
            className={`flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border text-left select-none transition-all cursor-pointer group hover:scale-[1.02] ${
              theme === 'light'
                ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 hover:border-emerald-500/50'
                : 'bg-slate-900 hover:bg-slate-800/90 border-slate-800 hover:border-emerald-500/50'
            }`}
            title="Haz clic para gestionar tu perfil, foto, teléfono y contraseña"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 bg-slate-800 relative group-hover:border-emerald-500 transition-colors">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-emerald-400 flex items-center justify-center h-full">
                  {currentUser.nombre[0]}
                </span>
              )}
            </div>

            <div className="hidden md:block">
              <span className={`font-bold text-xs block leading-none group-hover:text-emerald-500 transition-colors ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                {currentUser.nombre} {currentUser.apellido}
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold block mt-0.5">
                {currentUser.rol.rol}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Mobile search panel */}
      {mobileSearchOpen && (
        <div className={`md:hidden px-4 pb-3 border-t ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="relative mt-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={searchInput}
              onKeyDown={handleKeyDown}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setSearchQuery(e.target.value);
              }}
              placeholder={searchPlaceholder}
              className={`w-full rounded-xl pl-9 pr-8 py-2 text-xs focus:outline-none focus:border-emerald-500 ${
                theme === 'light'
                  ? 'bg-slate-100 border border-slate-200 text-slate-900 placeholder-slate-400'
                  : 'bg-slate-900 border border-slate-800 text-white placeholder-slate-500'
              }`}
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                aria-label="Limpiar búsqueda"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {query.length > 0 && (
            <div className={`mt-2 rounded-2xl border p-3 max-h-[60vh] overflow-y-auto space-y-3 ${
              theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b172a] border-slate-700 text-white'
            }`}>
              {resultsContent}
            </div>
          )}
        </div>
      )}
    </header>
  );
};
