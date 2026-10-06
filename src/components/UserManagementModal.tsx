import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole } from '../types/database';
import { 
  UserPlus, 
  X, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  Key, 
  Lock, 
  MapPin,
  Users
} from 'lucide-react';

export const UserManagementModal: React.FC = () => {
  const { 
    userManagementModalOpen, 
    setUserManagementModalOpen, 
    usuarios, 
    crearUsuario, 
    theme 
  } = useApp();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [rolNombre, setRolNombre] = useState<UserRole>('Asesor Comercial');
  const [password, setPassword] = useState('ColorLink2026*');
  const [company, setCompany] = useState('ColorLink S.A.S. - Valle de Aburrá');
  const [city, setCity] = useState('Medellín');
  const [activeSubTab, setActiveSubTab] = useState<'create' | 'list'>('create');

  if (!userManagementModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !apellido.trim() || !email.trim()) return;

    crearUsuario({
      nombre,
      apellido,
      email,
      telefono,
      documentId,
      rolNombre,
      password,
      company,
      city,
    });

    // Reset form & switch to list to see the created employee
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefono('');
    setDocumentId('');
    setActiveSubTab('list');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className={`border rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl relative transition-colors ${
        theme === 'light'
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#0b172a] border-slate-700 text-white'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Gestión de Empleados & Control de Roles</h3>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                Módulo exclusivo de administración interna para habilitar colaboradores autorizados.
              </p>
            </div>
          </div>

          <button
            onClick={() => setUserManagementModalOpen(false)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              theme === 'light' ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch between New Employee and Existing Directory */}
        <div className="flex items-center gap-2 my-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('create')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'create'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-slate-400'
            }`}
          >
            ➕ Registrar Nuevo Empleado
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'list'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : theme === 'light' ? 'bg-slate-100 text-slate-600' : 'bg-slate-900 text-slate-400'
            }`}
          >
            👥 Directorio de Empleados ({usuarios.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto space-y-4 pr-1 flex-1 text-xs">
          
          {activeSubTab === 'create' ? (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="ej. Daniel"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Apellido</label>
                  <input
                    type="text"
                    required
                    value={apellido}
                    onChange={(e) => setApellido(e.target.value)}
                    placeholder="ej. Morales"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Correo Electrónico Corporativo</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ej. daniel.morales@colorlink.co"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Cédula / Documento</label>
                  <input
                    type="text"
                    required
                    value={documentId}
                    onChange={(e) => setDocumentId(e.target.value)}
                    placeholder="CC 1.020.304.506"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Rol Operativo Asignado</label>
                  <select
                    value={rolNombre}
                    onChange={(e) => setRolNombre(e.target.value as UserRole)}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  >
                    <option value="Administrador">Administrador (Acceso total)</option>
                    <option value="Asesor Comercial">Asesor Comercial (Cotizaciones & Obras)</option>
                    <option value="Perito de Calidad">Perito de Calidad (Dictámenes Técnicos NTC)</option>
                    <option value="Jefe de Despachos">Jefe de Despachos (Bodegas, Lotes & Flota)</option>
                    <option value="Cliente Contratista">Cliente Contratista (Portal de Obra & Tienda)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Contraseña Inicial</label>
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Teléfono / Móvil</label>
                  <input
                    type="text"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="+57 300 123 4567"
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Sede / Municipio</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 ${
                      theme === 'light' ? 'bg-slate-100 border border-slate-300 text-slate-900' : 'bg-slate-900 border border-slate-700 text-white'
                    }`}
                  >
                    <option value="Medellín">Medellín (Sede Principal Guayabal)</option>
                    <option value="Itagüí">Itagüí (Centro Logístico)</option>
                    <option value="Bello">Bello (Sede Norte Niquía)</option>
                    <option value="Envigado">Envigado (Sede Las Vegas)</option>
                  </select>
                </div>
              </div>

              <div className={`p-3 rounded-xl border text-[11px] ${
                theme === 'light' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
              }`}>
                El nuevo colaborador quedará registrado formalmente en la base de datos interna. Podrá iniciar sesión de inmediato con su correo y contraseña en la pantalla de acceso.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserManagementModalOpen(false)}
                  className={`flex-1 py-2.5 rounded-xl font-semibold cursor-pointer ${
                    theme === 'light' ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#00D285] hover:bg-[#00c078] text-slate-950 font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Crear Empleado
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5">
              {usuarios.map(u => (
                <div
                  key={u.usuarioId}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 overflow-hidden border border-slate-700 flex-shrink-0 flex items-center justify-center">
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-emerald-400">{u.nombre[0]}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{u.nombre} {u.apellido}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-500 border border-emerald-500/40">
                          {u.rol.rol}
                        </span>
                      </div>
                      <span className={`text-[11px] block font-mono ${theme === 'light' ? 'text-slate-500' : 'text-slate-400'}`}>
                        {u.email} • {u.documentId || 'CC Verificado'} • {u.city}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-emerald-500 font-bold">
                    Activo
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`pt-3 border-t text-right ${
          theme === 'light' ? 'border-slate-200' : 'border-slate-800'
        }`}>
          <button
            onClick={() => setUserManagementModalOpen(false)}
            className={`px-4 py-2 rounded-xl font-semibold text-xs cursor-pointer ${
              theme === 'light' ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
