import React from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types/database';
import { 
  X, 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  Truck, 
  Layers, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const RoleSwitcherModal: React.FC = () => {
  const { roleSwitcherOpen, setRoleSwitcherOpen, loginQuickRole, usuarios, currentUser } = useApp();

  if (!roleSwitcherOpen) return null;

  const rolesConfig: { role: UserRole; title: string; desc: string; icon: React.ElementType; color: string }[] = [
    {
      role: 'Administrador',
      title: 'Carlos Mario Restrepo (Admin General)',
      desc: 'Control total de inventarios, reportes ejecutivos, permisos y configuración del ERP.',
      icon: ShieldCheck,
      color: 'bg-purple-950/80 text-purple-300 border-purple-500/40',
    },
    {
      role: 'Asesor Comercial',
      title: 'Valentina Gómez Palacio (Asesor)',
      desc: 'Gestión de proyectos en obra, motor de cotizaciones en cuñetes y descuentos técnicos.',
      icon: FileText,
      color: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
    },
    {
      role: 'Perito de Calidad',
      title: 'Ing. Andrés Felipe Ospina (Calidad)',
      desc: 'Inspección de sustratos, medición de humedad en muro, fisuras y veredicto de aprobación.',
      icon: CheckCircle2,
      color: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
    },
    {
      role: 'Jefe de Despachos',
      title: 'Javier Montoya Uribe (Bodega & Despacho)',
      desc: 'Tintometría computarizada, control de lotes, asignación de flota y remisiones de entrega.',
      icon: Truck,
      color: 'bg-blue-950/80 text-blue-300 border-blue-500/40',
    },
    {
      role: 'Cliente Contratista',
      title: 'Arq. Mateo Jaramillo (Constructora Aburrá)',
      desc: 'Aprobación de cotizaciones técnicas, seguimiento en tiempo real y recepción en obra.',
      icon: Layers,
      color: 'bg-slate-800 text-slate-300 border-slate-700',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b172a] border border-slate-700 rounded-2xl w-full max-w-2xl p-6 md:p-8 shadow-2xl relative text-white">
        <button
          onClick={() => setRoleSwitcherOpen(false)}
          className="absolute top-5 right-5 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-bold text-xl text-white">Conmutador Rápido de Roles (Modo Prueba)</h3>
        </div>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Cambia instantáneamente de perfil para validar cómo interactúan el Asesor, el Perito de Calidad, el Jefe de Bodega y el Administrador en tiempo real.
        </p>

        <div className="space-y-3">
          {rolesConfig.map((item) => {
            const Icon = item.icon;
            const isCurrent = currentUser?.rol.rol === item.role;
            const userObj = usuarios.find(u => u.rol.rol === item.role);

            return (
              <div
                key={item.role}
                className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isCurrent
                    ? 'bg-slate-900 border-emerald-500 shadow-md shadow-emerald-500/10'
                    : 'bg-[#091526] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-700">
                    {userObj?.avatarUrl ? (
                      <img src={userObj.avatarUrl} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-300">
                        {item.role[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{item.title}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border flex items-center gap-1 ${item.color}`}>
                        <Icon className="w-3 h-3" />
                        {item.role}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{item.desc}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => loginQuickRole(item.role)}
                  disabled={isCurrent}
                  className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer ${
                    isCurrent
                      ? 'bg-slate-800 text-slate-500 cursor-default'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <span>{isCurrent ? 'Rol Activo' : 'Activar Rol'}</span>
                  {!isCurrent && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
