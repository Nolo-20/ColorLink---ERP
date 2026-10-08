import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../context/AppContext';
import { ColorLinkLogo } from './ColorLinkLogo';
import { 
  Home, 
  Layers, 
  GitCommit, 
  ShieldCheck, 
  Package, 
  Truck, 
  BarChart3, 
  Calculator, 
  LogOut, 
  ChevronRight,
  ChevronLeft,
  MapPin, 
  Lock, 
  ShoppingBag, 
  Info,
  Users,
  User
} from 'lucide-react';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    hasModuleAccess, 
    proyectos, 
    pedidos,
    usuarios,
    logout, 
    setCalculatorModalOpen,
    setProfileModalOpen,
    theme
  } = useApp();


  if (!currentUser) return null;

  const pendingQuality = proyectos.filter(p => p.estadoPipeline === 'en_peritaje').length;
  const inTransit = proyectos.filter(p => p.estadoPipeline === 'despachado' && !p.despacho?.fechaEntrega).length;
  const pendingPickup = pedidos.filter(p => p.estadoPedido === 'listo_sucursal').length;

  const menuItems: { id: TabType; label: string; icon: React.ElementType; badge?: string | number; badgeColor?: string }[] = [
    { id: 'inicio', label: 'Inicio / Panel Principal', icon: Home },
    { id: 'pedidos', label: 'Pedidos & Retiro Tienda', icon: ShoppingBag, badge: pendingPickup > 0 ? `${pendingPickup} Retiro` : pedidos.length, badgeColor: pendingPickup > 0 ? 'bg-amber-500 text-slate-950 font-bold' : undefined },
    { id: 'proyectos', label: 'Proyectos & Cotizaciones', icon: Layers, badge: proyectos.length },
    { id: 'pipeline', label: 'Pipeline & Trazabilidad', icon: GitCommit },
    { id: 'calidad', label: 'Control de Calidad', icon: ShieldCheck, badge: pendingQuality > 0 ? pendingQuality : undefined, badgeColor: 'bg-amber-500 text-slate-950 font-bold' },
    { id: 'inventarios', label: 'Inventarios & Bodegas', icon: Package },
    { id: 'despachos', label: 'Módulo de Despachos', icon: Truck, badge: inTransit > 0 ? inTransit : undefined, badgeColor: 'bg-orange-500 text-slate-950 font-bold' },
    { id: 'reportes', label: 'Reportes & Métricas', icon: BarChart3 },
    { id: 'colaboradores', label: 'Gestión de Empleados', icon: Users, badge: usuarios.length },
    { id: 'roles_permisos', label: 'Matriz de Roles & Estados', icon: Info },
  ];

  // Filter based on employee role permissions
  const visibleItems = menuItems.filter(item => item.id === 'inicio' || hasModuleAccess(item.id));
  const isAdmin = currentUser.rol.rol === 'Administrador';

  return (
    <aside 
      className={`fixed top-0 left-0 bottom-0 z-40 flex flex-col justify-between transition-all duration-300 ${
        theme === 'light' 
          ? 'bg-white border-r border-slate-200 text-slate-800 shadow-md' 
          : 'bg-[#071120] border-r border-slate-800 text-slate-100'
      } ${collapsed ? 'w-20' : 'w-64'}`}
    >
      {/* Top Brand Logo Section */}
      <div>
        <div className={`h-16 flex items-center border-b transition-all ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        } ${collapsed ? 'justify-center px-2' : 'justify-between px-4'}`}>
          
          {collapsed ? (
            <button 
              onClick={() => setCollapsed(false)}
              className="p-1 rounded-2xl hover:bg-emerald-500/10 transition-transform hover:scale-105 cursor-pointer"
              title="Expandir Menú ColorLink ERP"
            >
              <ColorLinkLogo collapsed={true} size="md" theme={theme} />
            </button>
          ) : (
            <>
              <button 
                onClick={() => setActiveTab('inicio')}
                className="flex items-center gap-3 text-left cursor-pointer group flex-1 mr-1"
              >
                <ColorLinkLogo collapsed={false} size="md" theme={theme} showSubtitle={true} />
              </button>

              <button
                onClick={() => setCollapsed(true)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'light' 
                    ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Colapsar Menú"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* User Role Tag */}
        {!collapsed && (
          <div className={`px-4 py-2.5 border-b ${
            theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800/80'
          }`}>
            <span className={`text-[10px] uppercase tracking-wider block font-bold ${
              theme === 'light' ? 'text-slate-500' : 'text-slate-400'
            }`}>
              Rol:
            </span>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-xs font-bold text-emerald-500 truncate">
                {currentUser.rol.rol}
              </span>
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}>
                ACTIVO
              </span>
            </div>
          </div>
        )}

        {/* Authorized Modules Navigation List */}
        <nav className="p-3 space-y-1.5">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer relative group ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/40 shadow-sm'
                    : theme === 'light'
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent'
                } ${collapsed ? 'justify-center px-2' : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${
                  isActive 
                    ? 'text-emerald-500' 
                    : theme === 'light' 
                      ? 'text-slate-500 group-hover:text-slate-900' 
                      : 'text-slate-400 group-hover:text-white'
                }`} />
                
                {!collapsed && (
                  <span className="truncate flex-1 text-left">{item.label}</span>
                )}

                {item.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    item.badgeColor || (theme === 'light' ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300')
                  } ${collapsed ? 'absolute top-1 right-1' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Tools & Profile */}
      <div className={`p-3 border-t space-y-1.5 ${
        theme === 'light' ? 'border-slate-200 bg-slate-50/50' : 'border-slate-800 bg-[#071120]'
      }`}>
        {/* Profile Button */}
        <button
          onClick={() => setProfileModalOpen(true)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            theme === 'light' 
              ? 'text-slate-700 hover:text-emerald-600 hover:bg-emerald-500/10' 
              : 'text-slate-300 hover:text-emerald-400 hover:bg-slate-800'
          } ${collapsed ? 'justify-center px-2' : ''}`}
          title="Mi Perfil de Empleado (Foto, Teléfono y Contraseña)"
        >
          <User className="w-4 h-4 text-emerald-500 flex-shrink-0" />
          {!collapsed && <span>Mi Perfil</span>}
        </button>

        {/* Paint Calculator Modal trigger */}
        <button
          onClick={() => setCalculatorModalOpen(true)}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
            theme === 'light' 
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70' 
              : 'text-slate-300 hover:text-white hover:bg-slate-800'
          } ${collapsed ? 'justify-center px-2' : ''}`}
          title="Calculadora de Cuñetes"
        >
          <Calculator className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          {!collapsed && <span>Calculadora</span>}
        </button>

        {/* Logout */}
        <button
          onClick={logout}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer ${
            collapsed ? 'justify-center px-2' : ''
          }`}
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};
