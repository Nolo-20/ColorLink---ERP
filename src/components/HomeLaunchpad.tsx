import React from 'react';
import { useApp } from '../context/AppContext';
import { TabType } from '../context/AppContext';
import { 
  Layers, 
  GitCommit, 
  ShieldCheck, 
  Package, 
  Truck, 
  BarChart3, 
  Calculator, 
  PlusCircle, 
  ArrowRight, 
  Clock, 
  CheckCircle2, 
  MapPin, 
  Building2, 
  AlertCircle,
  TrendingUp,
  FileText,
  UserCheck,
  Lock,
  ShoppingBag
} from 'lucide-react';

interface ModuleCardConfig {
  id: TabType;
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  badgeColor: string;
  cardBg: string;
  borderColor: string;
  iconBg: string;
  iconColor: string;
  icon: React.ElementType;
}

export const HomeLaunchpad: React.FC = () => {
  const { 
    currentUser, 
    activeTab, 
    setActiveTab, 
    hasModuleAccess, 
    proyectos, 
    inventarios, 
    pedidos,
    setCalculatorModalOpen, 
    setRoleSwitcherOpen,
    crearProyecto,
    setSelectedProyecto,
    theme
  } = useApp();

  const isLight = theme === 'light';

  if (!currentUser) return null;

  // Real-time metric counts
  const pendingQuality = proyectos.filter(p => p.estadoPipeline === 'revision_calidad').length;
  const inTransit = proyectos.filter(p => p.estadoPipeline === 'en_ruta_despacho').length;
  const inTintingOrWarehouse = proyectos.filter(p => p.estadoPipeline === 'tintometria' || p.estadoPipeline === 'alistamiento_bodega').length;
  const delivered = proyectos.filter(p => p.estadoPipeline === 'entregado').length;
  
  const totalCunetes = proyectos.reduce((acc, p) => {
    const q = p.cotizaciones && p.cotizaciones[0];
    return acc + (q?.cunetes5g || 0);
  }, 0);

  // Master definitions of all modules that moved from Navbar to the Home Launchpad buttons!
  const ALL_MODULES: ModuleCardConfig[] = [
    {
      id: 'pedidos',
      title: 'Pedidos & Canje en Sucursal',
      subtitle: 'Tienda Online & Punto de Venta',
      description: 'Gestión de compras, control de estados (comprado, alistamiento, listo en tienda) y canje de código/QR para retiro en sucursal.',
      badge: `${pedidos.length} Pedidos Activos`,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      cardBg: 'from-[#0a1e2f] to-[#071421] hover:from-[#0d273d] hover:to-[#0a1a2b]',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/70',
      iconBg: 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950',
      iconColor: 'text-emerald-400 group-hover:text-slate-950',
      icon: ShoppingBag,
    },
    {
      id: 'proyectos',
      title: 'Proyectos & Cotizaciones',
      subtitle: 'Comercial & Obras',
      description: 'Gestión de obras, cálculo volumétrico en cuñetes de 5 galones y galones sueltos, con márgenes y descuentos de obra.',
      badge: `${proyectos.length} Proyectos Activos`,
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      cardBg: 'from-[#0b1c2b] to-[#091524] hover:from-[#0e2437] hover:to-[#0c1c2f]',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/70',
      iconBg: 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950',
      iconColor: 'text-emerald-400 group-hover:text-slate-950',
      icon: Layers,
    },
    {
      id: 'pipeline',
      title: 'Pipeline & Trazabilidad',
      subtitle: 'Flujo en Tiempo Real',
      description: 'Tablero de 8 estados operativos desde el diagnóstico inicial hasta la entrega en obra, con bitácora técnica de cada movimiento.',
      badge: `${proyectos.length} En Seguimiento`,
      badgeColor: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40',
      cardBg: 'from-[#101935] to-[#0a1224] hover:from-[#152247] hover:to-[#0e1832]',
      borderColor: 'border-indigo-500/30 hover:border-indigo-500/70',
      iconBg: 'bg-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-slate-950',
      iconColor: 'text-indigo-400 group-hover:text-slate-950',
      icon: GitCommit,
    },
    {
      id: 'calidad',
      title: 'Control de Calidad',
      subtitle: 'Peritaje Técnico NTC',
      description: 'Verificación higrométrica de humedad en muro, severidad de fisuras, adherencia y dictamen de aprobación técnica de sustratos.',
      badge: pendingQuality > 0 ? `${pendingQuality} Requiere Dictamen` : 'Al Día (100%)',
      badgeColor: pendingQuality > 0 ? 'bg-amber-950/80 text-amber-300 border-amber-500/50 animate-pulse' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      cardBg: 'from-[#1f1a11] to-[#12100d] hover:from-[#2a2215] hover:to-[#17130f]',
      borderColor: 'border-amber-500/30 hover:border-amber-500/70',
      iconBg: 'bg-amber-500/20 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950',
      iconColor: 'text-amber-400 group-hover:text-slate-950',
      icon: ShieldCheck,
    },
    {
      id: 'inventarios',
      title: 'Inventarios & Bodegas',
      subtitle: 'Lotes & Tintometría Lab',
      description: 'Control de existencias por bodegas en Medellín, Itagüí y Bello. Trazabilidad de lotes y formulación computarizada de color.',
      badge: `${inventarios.length} Almacenes Activos`,
      badgeColor: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40',
      cardBg: 'from-[#0b1f2b] to-[#081520] hover:from-[#0d2737] hover:to-[#0b1b2a]',
      borderColor: 'border-cyan-500/30 hover:border-cyan-500/70',
      iconBg: 'bg-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-slate-950',
      iconColor: 'text-cyan-400 group-hover:text-slate-950',
      icon: Package,
    },
    {
      id: 'despachos',
      title: 'Módulo de Despachos',
      subtitle: 'Flota Valle de Aburrá',
      description: 'Asignación de vehículos y conductores, cálculo de tiempos de tránsito por municipio y emisión de remisiones con firma en terreno.',
      badge: inTransit > 0 ? `${inTransit} Vehículo en Ruta` : 'Flota Disponible',
      badgeColor: inTransit > 0 ? 'bg-orange-950/80 text-orange-300 border-orange-500/50' : 'bg-slate-800 text-slate-300 border-slate-700',
      cardBg: 'from-[#1f1710] to-[#120e0a] hover:from-[#2b2016] hover:to-[#18120c]',
      borderColor: 'border-orange-500/30 hover:border-orange-500/70',
      iconBg: 'bg-orange-500/20 text-orange-400 group-hover:bg-orange-500 group-hover:text-slate-950',
      iconColor: 'text-orange-400 group-hover:text-slate-950',
      icon: Truck,
    },
    {
      id: 'reportes',
      title: 'Reportes & Métricas',
      subtitle: 'KPIs Ejecutivos ERP',
      description: 'Analítica en tiempo real de cuñetes producidos, facturación en COP, índice de conformidad de peritaje y tiempos logísticos.',
      badge: 'Analítica en Vivo',
      badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
      cardBg: 'from-[#0d1f19] to-[#091511] hover:from-[#112a22] hover:to-[#0c1c17]',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/70',
      iconBg: 'bg-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950',
      iconColor: 'text-emerald-400 group-hover:text-slate-950',
      icon: BarChart3,
    },
    {
      id: 'roles_permisos',
      title: 'Matriz de Roles & Estados',
      subtitle: 'Gobernanza Operativa',
      description: 'Consulta oficial de qué rol tiene permitido dar paso a cada estado en pedidos de tienda, despachos a obra y proyectos.',
      badge: 'Guía de Auditoría',
      badgeColor: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
      cardBg: 'from-[#1a122e] to-[#0f0b1c] hover:from-[#241940] hover:to-[#140e26]',
      borderColor: 'border-purple-500/30 hover:border-purple-500/70',
      iconBg: 'bg-purple-500/20 text-purple-400 group-hover:bg-purple-500 group-hover:text-slate-950',
      iconColor: 'text-purple-400 group-hover:text-slate-950',
      icon: ShieldCheck,
    },
  ];

  // FILTER STRICTLY ACCORDING TO ROLE PERMISSIONS!
  // Only authorized modules are enabled and visible; the others are completely hidden!
  const authorizedModules = ALL_MODULES.filter(m => hasModuleAccess(m.id));
  const hiddenCount = ALL_MODULES.length - authorizedModules.length;

  const handleCreateNewProject = () => {
    const nuevo = crearProyecto({
      nombreProyecto: 'Nueva Obra Urbanización El Poblado',
      area: 680,
      ambiente: 'Fachada',
      tipoSuperficie: 'Revoque Tradicional',
      color: 'Gris Grafito Suave',
      colorHex: '#64748B',
    });
    setSelectedProyecto(nuevo);
    setActiveTab('proyectos');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* 1. TOP WELCOME & EMPLOYEE PROFILE HERO BANNER (Bitrix24 / Emerge style) */}
      <div className={`border rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden transition-all ${
        isLight 
          ? 'bg-gradient-to-r from-emerald-50 via-slate-50 to-white border-slate-200 text-slate-900' 
          : 'bg-gradient-to-r from-[#091829] via-[#0b1f35] to-[#081320] border-slate-800 text-white'
      }`}>
        {/* Glow background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl border-2 border-emerald-500/50 overflow-hidden shadow-xl flex-shrink-0 flex items-center justify-center ${
              isLight ? 'bg-white' : 'bg-slate-800/90'
            }`}>
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-black text-emerald-400">{currentUser.nombre[0]}</span>
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Hola, {currentUser.nombre} {currentUser.apellido}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-slate-950 uppercase tracking-wider">
                  {currentUser.rol.rol}
                </span>
              </div>

              <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span className={`flex items-center gap-1.5 font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                  {currentUser.company || 'ColorLink S.A.S. - Valle de Aburrá'}
                </span>
                <span>•</span>
                <span className={`flex items-center gap-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  <MapPin className="w-3.5 h-3.5 text-sky-500" />
                  {currentUser.city || 'Medellín'} (Sede Matriz)
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-emerald-500 font-mono font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Conectado al ERP en Vivo
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons on Top Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setCalculatorModalOpen(true)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm border ${
                isLight
                  ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                  : 'bg-slate-800/90 hover:bg-slate-750 text-slate-200 border-slate-700 hover:border-emerald-500/50'
              }`}
            >
              <Calculator className="w-4 h-4 text-emerald-500" />
              <span>Calculadora Cuñetes</span>
            </button>

            {hasModuleAccess('proyectos') && (
              <button
                onClick={handleCreateNewProject}
                className="px-4 py-2.5 bg-[#00D285] hover:bg-[#00c078] text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nueva Obra / Cotización</span>
              </button>
            )}
          </div>
        </div>

        {/* Security / RBAC Banner notice */}
        <div className={`mt-5 pt-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
          isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800/80 text-slate-400'
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              Vista personalizada para <strong className={isLight ? 'text-slate-900' : 'text-white'}>{currentUser.rol.rol}</strong>. Tienes acceso a <strong className="text-emerald-500 font-bold">{authorizedModules.length} módulos habilitados</strong>.
            </span>
          </div>

          {hiddenCount > 0 ? (
            <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
              isLight 
                ? 'bg-slate-100 text-slate-600 border-slate-200' 
                : 'text-slate-400 bg-slate-950/60 border-slate-800/80'
            }`}>
              <Lock className="w-3 h-3 text-slate-400" />
              <span>{hiddenCount} módulo(s) restringido(s) para este perfil</span>
            </div>
          ) : (
            <div className={`flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border ${
              isLight 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30'
            }`}>
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Acceso Administrativo Completo</span>
            </div>
          )}
        </div>
      </div>

      {/* 2. SUMMARY KPI METRIC TILES (Inspired by Zoho Inventory & Emerge image 2/3) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-4 shadow-lg transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#091526] border-slate-800 text-white'
        }`}>
          <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Obras Activas</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-2xl md:text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{proyectos.length}</div>
          <span className={`text-[10px] block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>En el Valle de Aburrá</span>
        </div>

        <div className={`border rounded-2xl p-4 shadow-lg transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#091526] border-slate-800 text-white'
        }`}>
          <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Volumen Cotizado</span>
            <Calculator className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-emerald-500 font-mono">
            {totalCunetes} <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>cuñetes (5G)</span>
          </div>
          <span className={`text-[10px] block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{(totalCunetes * 5).toLocaleString()} galones totales</span>
        </div>

        <div className={`border rounded-2xl p-4 shadow-lg transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#091526] border-slate-800 text-white'
        }`}>
          <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>En Revisión Calidad</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-amber-500 font-mono">{pendingQuality}</div>
          <span className={`text-[10px] block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Pruebas higrométricas</span>
        </div>

        <div className={`border rounded-2xl p-4 shadow-lg transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#091526] border-slate-800 text-white'
        }`}>
          <div className={`flex items-center justify-between text-xs mb-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Despachos en Ruta</span>
            <Truck className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl md:text-3xl font-black text-orange-500 font-mono">{inTransit}</div>
          <span className={`text-[10px] block mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Vehículos en tránsito</span>
        </div>
      </div>

      {/* 3. PRIMARY MODULE LAUNCHPAD BUTTONS GRID */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className={`text-xl md:text-2xl font-black tracking-tight flex items-center gap-2 ${
              isLight ? 'text-slate-900' : 'text-white'
            }`}>
              <span>Módulos de Control Interno ColorLink</span>
            </h2>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Selecciona el módulo correspondiente para gestionar cotizaciones, verificar calidad, alistar lotes o coordinar despachos.
            </p>
          </div>
          <span className={`text-xs font-semibold font-mono self-start sm:self-auto ${
            isLight ? 'text-slate-500' : 'text-slate-400'
          }`}>
            {authorizedModules.length} de {ALL_MODULES.length} habilitados
          </span>
        </div>

        {/* The Grid of Primary Large Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {authorizedModules.map((module) => {
            const Icon = module.icon;
            return (
              <div
                key={module.id}
                onClick={() => setActiveTab(module.id)}
                className={`rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden hover:-translate-y-1 ${
                  isLight
                    ? 'bg-white border border-slate-200/90 hover:border-emerald-400 shadow-sm hover:shadow-md'
                    : `bg-gradient-to-br ${module.cardBg} border ${module.borderColor} shadow-xl hover:shadow-2xl`
                }`}
              >
                {/* Subtle light accent */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform ${
                  isLight ? 'bg-emerald-500/[0.04]' : 'bg-white/[0.03]'
                }`} />

                <div>
                  {/* Top Bar with Icon and Badge */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md ${
                      isLight 
                        ? 'bg-slate-100 border border-slate-200 text-slate-800 group-hover:bg-[#00D285] group-hover:text-slate-950 group-hover:border-emerald-400' 
                        : module.iconBg
                    }`}>
                      <Icon className="w-7 h-7" />
                    </div>

                    <span className={`px-3 py-1 rounded-full text-[11px] font-bold border font-mono ${
                      isLight
                        ? 'bg-slate-100 text-slate-700 border-slate-200'
                        : module.badgeColor
                    }`}>
                      {module.badge}
                    </span>
                  </div>

                  {/* Subtitle & Title */}
                  <span className={`text-[11px] font-bold uppercase tracking-wider block mb-1 ${
                    isLight ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {module.subtitle}
                  </span>
                  <h3 className={`text-lg md:text-xl font-black transition-colors leading-tight mb-2 ${
                    isLight ? 'text-slate-900 group-hover:text-emerald-600' : 'text-white group-hover:text-emerald-400'
                  }`}>
                    {module.title}
                  </h3>

                  {/* Description */}
                  <p className={`text-xs leading-relaxed font-normal mb-5 ${
                    isLight ? 'text-slate-600' : 'text-slate-300/90'
                  }`}>
                    {module.description}
                  </p>
                </div>

                {/* Bottom Entry Action */}
                <div className={`pt-4 border-t flex items-center justify-between text-xs font-bold transition-colors ${
                  isLight 
                    ? 'border-slate-200 text-slate-700 group-hover:text-emerald-600' 
                    : 'border-slate-800/80 text-white group-hover:text-emerald-400'
                }`}>
                  <span className="tracking-wide">Ingresar al Módulo</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isLight
                      ? 'bg-slate-100 text-slate-700 group-hover:bg-[#00D285] group-hover:text-slate-950'
                      : 'bg-slate-800/80 group-hover:bg-emerald-500 group-hover:text-slate-950'
                  }`}>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. WORKFLOW STEP PROGRESSION STRIP (Inspired by Emerge Step 1 to 4) */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-4 transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#091526] border-slate-800 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">
            Flujo Logístico Estandarizado de Obra
          </span>
          <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Norma NTC-1335</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1">
          {[
            { step: 'PASO 1', title: 'Diagnóstico & Mampostería', desc: 'Levantamiento de m² y fotos', color: isLight ? 'border-slate-200 bg-slate-50 text-slate-700' : 'border-slate-700 bg-slate-900/80 text-slate-300' },
            { step: 'PASO 2', title: 'Cotización en Cuñetes', desc: 'Despiece exacto 5G y 1G', color: isLight ? 'border-emerald-200 bg-emerald-50/60 text-emerald-800' : 'border-emerald-600/40 bg-emerald-950/30 text-emerald-300' },
            { step: 'PASO 3', title: 'Peritaje de Calidad', desc: 'Medición humedad <12%', color: isLight ? 'border-amber-200 bg-amber-50/60 text-amber-800' : 'border-amber-600/40 bg-amber-950/30 text-amber-300' },
            { step: 'PASO 4', title: 'Tintometría en Bodega', desc: 'Dispensado de color y lote', color: isLight ? 'border-cyan-200 bg-cyan-50/60 text-cyan-800' : 'border-cyan-600/40 bg-cyan-950/30 text-cyan-300' },
            { step: 'PASO 5', title: 'Despacho & Remisión', desc: 'Entrega y firma en terreno', color: isLight ? 'border-sky-200 bg-sky-50/60 text-sky-800' : 'border-sky-600/40 bg-sky-950/30 text-sky-300' },
          ].map((s, idx) => (
            <div key={idx} className={`p-3.5 rounded-xl border ${s.color} space-y-1`}>
              <span className="text-[10px] font-black uppercase tracking-widest block opacity-80">{s.step}</span>
              <h4 className={`font-bold text-xs leading-snug ${isLight ? 'text-slate-900' : 'text-white'}`}>{s.title}</h4>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 5. RECENT LOGISTIC ACTIVITY FEED */}
      <div className={`border rounded-2xl p-6 shadow-xl space-y-4 transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#091526] border-slate-800 text-white'
      }`}>
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>Últimos Movimientos en el Valle de Aburrá</span>
          </h3>
          <button 
            onClick={() => setActiveTab('pipeline')}
            className="text-xs text-emerald-500 hover:underline font-semibold cursor-pointer"
          >
            Ver Bitácora Completa →
          </button>
        </div>

        <div className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
          {proyectos.slice(0, 3).map((p) => {
            const latestMov = p.historialMovimientos && p.historialMovimientos[0];
            return (
              <div key={p.proyectoId} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-sm ${isLight ? 'text-slate-900' : 'text-white'}`}>{p.nombreProyecto}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded border font-semibold uppercase ${
                      isLight ? 'bg-slate-100 text-slate-700 border-slate-300' : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {p.estadoPipeline.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {latestMov?.notas || 'Actualización de obra en terreno'}
                  </p>
                </div>

                <div className="flex items-center gap-3 sm:self-center">
                  <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {latestMov?.fecha ? new Date(latestMov.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedProyecto(p);
                      setActiveTab(hasModuleAccess('proyectos') ? 'proyectos' : 'pipeline');
                    }}
                    className={`p-2 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                      isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                    }`}
                  >
                    Abrir Obra →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
