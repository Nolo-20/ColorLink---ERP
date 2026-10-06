import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  BarChart3, 
  TrendingUp, 
  CheckCircle2, 
  Truck, 
  Layers, 
  Users, 
  ShieldCheck, 
  Building2, 
  Droplets,
  DollarSign,
  MapPin
} from 'lucide-react';

export const RoleDashboard: React.FC = () => {
  const { proyectos, usuarios, inventarios, theme } = useApp();
  const isLight = theme === 'light';

  // Aggregate metrics
  const totalProyectos = proyectos.length;
  const enRuta = proyectos.filter(p => p.estadoPipeline === 'en_ruta_despacho').length;
  const entregados = proyectos.filter(p => p.estadoPipeline === 'entregado').length;
  const enCalidad = proyectos.filter(p => p.estadoPipeline === 'revision_calidad').length;

  // Total cuñetes sum
  const totalCunetes = proyectos.reduce((acc, p) => {
    const q = p.cotizaciones && p.cotizaciones[0];
    return acc + (q?.cunetes5g || 0);
  }, 0);

  // Total revenue sum in COP
  const totalRevenue = proyectos.reduce((acc, p) => {
    const q = p.cotizaciones && p.cotizaciones[0];
    return acc + (q?.total || 0);
  }, 0);

  // Quality approval rate
  const totalEvaluated = proyectos.filter(p => p.diagnostico?.fechaVeredicto).length;
  const totalApproved = proyectos.filter(p => p.diagnostico?.aprobadoCalidad).length;
  const qualityRate = totalEvaluated > 0 ? Math.round((totalApproved / totalEvaluated) * 100) : 92;

  // Total inventory units in bodegas
  const totalStockUnits = inventarios.reduce((acc, inv) => acc + inv.cantidadDisponible, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
        isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#0b1628] border-slate-800 text-white shadow-xl'
      }`}>
        <div>
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            Panel Ejecutivo & Reportes de Gestión
          </div>
          <h2 className={`text-2xl md:text-3xl font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
            Métricas Operativas en Tiempo Real
          </h2>
          <p className={`text-sm mt-1 max-w-2xl ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
            Trazabilidad global de ventas, consumo de cuñetes, índice de aprobación de peritaje técnico y despachos en el Valle de Aburrá.
          </p>
        </div>

        <div className={`flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-lg self-start md:self-auto border ${
          isLight ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-emerald-950/60 text-emerald-400 border-emerald-500/30'
        }`}>
          <span>● Conectado a Prisma / DB Local</span>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Volumen en Cuñetes (5G)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalCunetes}</div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block font-medium">
            Cuñetes industriales en gestión de obra
          </span>
        </div>

        <div className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Facturación Cotizada</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
            ${(totalRevenue / 1000000).toFixed(1)}M <span className={`text-xs font-normal ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>COP</span>
          </div>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 mt-1 block font-medium">
            Portafolio comercial activo
          </span>
        </div>

        <div className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Índice Conformidad Calidad</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{qualityRate}%</div>
          <span className={`text-[11px] mt-1 block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            Sustratos aptos bajo norma NTC
          </span>
        </div>

        <div className={`border rounded-2xl p-5 relative overflow-hidden transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-lg'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Existencias en Bodegas</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-3xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{totalStockUnits}</div>
          <span className="text-[11px] text-purple-600 dark:text-purple-300 mt-1 block font-medium">
            Unidades en Guayabal, Itagüí y Bello
          </span>
        </div>
      </div>

      {/* Middle Grid: Pipeline Distribution & Municipality breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pipeline Distribution */}
        <div className={`border rounded-2xl p-6 space-y-4 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
        }`}>
          <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Distribución del Pipeline Operativo
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { label: 'En Evaluación Técnica (Calidad)', count: enCalidad, total: totalProyectos, color: 'bg-amber-400' },
              { label: 'Tintometría y Alistamiento en Bodega', count: proyectos.filter(p => p.estadoPipeline === 'tintometria' || p.estadoPipeline === 'alistamiento_bodega').length, total: totalProyectos, color: 'bg-cyan-500' },
              { label: 'En Tránsito / Despacho', count: enRuta, total: totalProyectos, color: 'bg-orange-500' },
              { label: 'Entregados y Conformes en Obra', count: entregados, total: totalProyectos, color: 'bg-emerald-500' },
            ].map((item, idx) => {
              const pct = item.total > 0 ? Math.round((item.count / item.total) * 100) : 0;
              return (
                <div key={idx} className="space-y-1 text-xs">
                  <div className={`flex justify-between font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    <span>{item.label}</span>
                    <span className={`font-mono font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>{item.count} ({pct}%)</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isLight ? 'bg-slate-100' : 'bg-slate-900'}`}>
                    <div 
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${Math.max(pct, 5)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Municipality Breakdown (Valle de Aburrá) */}
        <div className={`border rounded-2xl p-6 space-y-4 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
        }`}>
          <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <MapPin className="w-4 h-4 text-emerald-500" />
            Cobertura & Operación por Municipio
          </h3>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {[
              { ciudad: 'Medellín', desc: 'Centro Logístico Guayabal', cuñetes: 37, tiempo: '2.5 hrs' },
              { ciudad: 'Itagüí', desc: 'Zona Sur Industrial', cuñetes: 22, tiempo: '2.0 hrs' },
              { ciudad: 'Bello', desc: 'Sede Norte Niquía', cuñetes: 16, tiempo: '3.5 hrs' },
              { ciudad: 'Envigado', desc: 'Obras Residenciales Loma', cuñetes: 19, tiempo: '2.8 hrs' },
            ].map((loc, i) => (
              <div key={i} className={`p-3.5 border rounded-xl space-y-1 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/80 border-slate-800'
              }`}>
                <span className={`font-bold text-sm block ${isLight ? 'text-slate-900' : 'text-white'}`}>{loc.ciudad}</span>
                <span className={`text-[10px] block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{loc.desc}</span>
                <div className={`flex justify-between items-center text-xs pt-2 border-t ${
                  isLight ? 'border-slate-200 text-slate-600' : 'border-slate-800 text-slate-300'
                }`}>
                  <span>Demanda: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{loc.cuñetes} 5G</strong></span>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{loc.tiempo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users and Role Directory (Directly reflecting Prisma Usuario model) */}
      <div className={`border rounded-2xl p-6 space-y-4 transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className={`font-bold text-base flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
            <Users className="w-4 h-4 text-emerald-500" />
            Usuarios & Roles del Sistema (Modelo Prisma)
          </h3>
          <span className={`text-xs font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
            {usuarios.length} cuentas registradas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {usuarios.map(u => (
            <div key={u.usuarioId} className={`p-3.5 border rounded-xl flex items-center gap-3 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className={`w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border ${
                isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'
              }`}>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.nombre} className="w-full h-full object-cover" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center font-bold text-xs ${
                    isLight ? 'text-slate-600' : 'text-slate-400'
                  }`}>
                    {u.nombre[0]}
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1 text-xs">
                <div className={`font-bold truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>{u.nombre} {u.apellido}</div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{u.rol.rol}</div>
                <div className={`text-[10px] font-mono truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{u.email}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
