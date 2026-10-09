import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { UserRole, Usuario } from '../types/database';
import { STAFF_ROLE_LABELS } from '../mappers';
import { passwordPolicyError, PASSWORD_POLICY_HINT } from '../passwordPolicy';
import { 
  UserPlus, 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  CheckCircle2, 
  Key, 
  Lock, 
  MapPin,
  Users,
  Search,
  Filter,
  UserCheck,
  AlertCircle,
  Pencil,
  X
} from 'lucide-react';

export const EmployeeManagementPanel: React.FC = () => {
  const { 
    usuarios, 
    crearUsuario, 
    actualizarEmpleado,
    theme,
    currentUser
  } = useApp();

  const isLight = theme === 'light';

  // Form states with strict limits
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [documentId, setDocumentId] = useState('');
  const [rolNombre, setRolNombre] = useState<UserRole>('Asesor Comercial');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('ColorLink S.A.S. - Valle de Aburrá');
  const [city, setCity] = useState('Medellín');
  
  // Validation errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [submitErrorNotice, setSubmitErrorNotice] = useState<string>('');

  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [activeTabMode, setActiveTabMode] = useState<'roster' | 'create'>('roster');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingUser = editingId ? usuarios.find(u => u.usuarioId === editingId) || null : null;

  const filteredUsers = usuarios.filter((u) => {
    const matchesSearch = 
      `${u.nombre} ${u.apellido}`.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.email.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (u.documentId && u.documentId.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesRole = roleFilter === 'todos' || u.rol.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Strict Field Change Handlers
  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only letters and spaces, max 15 characters
    const filtered = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 15);
    setNombre(filtered);
    if (formErrors.nombre) {
      setFormErrors(prev => ({ ...prev, nombre: '' }));
    }
  };

  const handleApellidoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ONLY letters and spaces, MAX EXACT 10 characters
    const filtered = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').slice(0, 10);
    setApellido(filtered);
    if (formErrors.apellido) {
      setFormErrors(prev => ({ ...prev, apellido: '' }));
    }
  };

  const handleTelefonoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ONLY numbers, MAX EXACT 10 digits
    const filtered = e.target.value.replace(/\D/g, '').slice(0, 10);
    setTelefono(filtered);
    if (formErrors.telefono) {
      setFormErrors(prev => ({ ...prev, telefono: '' }));
    }
  };

  const handleDocumentIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // ONLY numbers, max 10 digits
    const filtered = e.target.value.replace(/\D/g, '').slice(0, 10);
    setDocumentId(filtered);
    if (formErrors.documentId) {
      setFormErrors(prev => ({ ...prev, documentId: '' }));
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Clean email, max 40 characters
    const filtered = e.target.value.trim().toLowerCase().slice(0, 40);
    setEmail(filtered);
    if (formErrors.email) {
      setFormErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.slice(0, 20);
    setPassword(val);
    if (formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: '' }));
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    // 1. Nombre: solo letras, longitud 2 a 15
    if (!nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio.';
    } else if (nombre.trim().length < 2) {
      errors.nombre = 'El nombre debe tener al menos 2 letras.';
    }

    // 2. Apellido: solo letras, longitud permitida máx 10 letras
    if (!apellido.trim()) {
      errors.apellido = 'El apellido es obligatorio.';
    } else if (apellido.trim().length < 2) {
      errors.apellido = 'El apellido debe tener al menos 2 letras.';
    } else if (apellido.length > 10) {
      errors.apellido = 'El apellido no puede superar 10 letras.';
    }

    // 3. Email: formato válido, max 40
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = 'El correo electrónico es obligatorio.';
    } else if (!emailRegex.test(email.trim())) {
      errors.email = 'Ingresa un correo electrónico institucional válido (ej. usuario@colorlink.co).';
    }

    // 4. Teléfono: solo números y longitud exacta de 10 números
    if (!telefono.trim()) {
      errors.telefono = 'El teléfono móvil es obligatorio.';
    } else if (telefono.trim().length !== 10) {
      errors.telefono = 'El teléfono debe contener exactamente 10 números (ej. 3001234567).';
    }

    // 5. Cédula: si se digita, debe tener entre 7 y 10 números
    if (documentId.trim() && (documentId.trim().length < 7 || documentId.trim().length > 10)) {
      errors.documentId = 'La cédula debe contener entre 7 y 10 dígitos numéricos.';
    }

    // 6. Contraseña: misma política que exige el servidor
    const policyError = passwordPolicyError(password);
    if (policyError) {
      errors.password = policyError;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSubmitErrorNotice('');

    if (!validateForm()) {
      setSubmitErrorNotice('Por favor corrige los campos señalados antes de continuar.');
      return;
    }

    setSaving(true);
    const creado = await crearUsuario({
      nombre: nombre.trim(),
      apellido: apellido.trim(),
      email: email.trim(),
      telefono: `+57 ${telefono.trim()}`,
      documentId: documentId.trim() ? `CC ${documentId.trim()}` : undefined,
      rolNombre,
      password,
      company,
      city,
    });
    setSaving(false);

    // Si el servidor lo rechazó, se conservan los datos para corregirlos (el motivo sale en el aviso)
    if (!creado) {
      setSubmitErrorNotice('El servidor no pudo crear el colaborador. Revisa el aviso y corrige los datos.');
      return;
    }

    // Reset form & view roster
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefono('');
    setDocumentId('');
    setPassword('');
    setFormErrors({});
    setSubmitErrorNotice('');
    setActiveTabMode('roster');
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className={`border rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden transition-all ${
        isLight 
          ? 'bg-white border-slate-200 text-slate-900' 
          : 'bg-[#091526] border-slate-800 text-white shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Gobernanza & Administración de Personal
            </div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Gestión Centralizada de Empleados
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Alta de nuevos colaboradores, configuración de cargos operativos, sedes de trabajo y gobernanza de credenciales en el ERP ColorLink.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTabMode('create')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                activeTabMode === 'create'
                  ? 'bg-[#F2C417] text-slate-950 shadow-emerald-500/20'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Nuevo Empleado</span>
            </button>

            <button
              onClick={() => setActiveTabMode('roster')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                activeTabMode === 'roster'
                  ? 'bg-indigo-600 text-white shadow-indigo-500/20'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Directorio ({usuarios.length})</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Count */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-200/60 dark:border-slate-800/80">
          <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Total Cuentas</span>
            <span className={`text-xl font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>{usuarios.length}</span>
          </div>
          <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Asesores Comerciales</span>
            <span className="text-xl font-black font-mono text-emerald-500">
              {usuarios.filter(u => u.rol.rol === 'Asesor Comercial').length}
            </span>
          </div>
          <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Peritos de Calidad</span>
            <span className="text-xl font-black font-mono text-amber-500">
              {usuarios.filter(u => u.rol.rol === 'Perito de Calidad').length}
            </span>
          </div>
          <div className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
            <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Logística & Despachos</span>
            <span className="text-xl font-black font-mono text-sky-500">
              {usuarios.filter(u => u.rol.rol === 'Jefe de Despachos').length}
            </span>
          </div>
        </div>
      </div>

      {/* Main View: Form OR Roster */}
      {activeTabMode === 'create' ? (
        <div className={`border rounded-3xl p-6 md:p-8 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
        }`}>
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Formulario de Creación de Colaborador</h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Completa los datos para habilitar el acceso institucional al sistema ERP</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTabMode('roster')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Volver al Directorio
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {submitErrorNotice && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitErrorNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. NOMBRES (SOLO LETRAS, MÁX 15) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Nombres *
                  </label>
                  <span className={`text-[10px] font-mono ${nombre.length >= 2 ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                    {nombre.length} / 15 letras
                  </span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={15}
                    value={nombre}
                    onChange={handleNombreChange}
                    placeholder="Ej. Andrés Felipe"
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none border transition-all ${
                      formErrors.nombre 
                        ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
                        : nombre.length >= 2
                          ? 'border-emerald-500/70 focus:border-emerald-500'
                          : isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                {formErrors.nombre ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {formErrors.nombre}
                  </p>
                ) : (
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Solo letras y espacios permitidos • Máximo 15 letras
                  </p>
                )}
              </div>

              {/* 2. APELLIDOS (SOLO LETRAS, LONGITUD EXACTA MÁXIMA 10 LETRAS) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Apellidos *
                  </label>
                  <span className={`text-[10px] font-mono ${apellido.length >= 2 ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                    {apellido.length} / 10 letras
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={apellido}
                    onChange={handleApellidoChange}
                    placeholder="Ej. Londoño"
                    className={`w-full rounded-xl px-4 py-2.5 text-xs focus:outline-none border transition-all ${
                      formErrors.apellido 
                        ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
                        : apellido.length >= 2
                          ? 'border-emerald-500/70 focus:border-emerald-500'
                          : isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                {formErrors.apellido ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {formErrors.apellido}
                  </p>
                ) : (
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Solo letras • Longitud máxima: 10 letras permitidas
                  </p>
                )}
              </div>

              {/* 3. CORREO INSTITUCIONAL (MAX 40 CARACTERES) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Correo Electrónico Institucional *
                  </label>
                  <span className={`text-[10px] font-mono ${email.includes('@') ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                    {email.length} / 40 car.
                  </span>
                </div>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    maxLength={40}
                    value={email}
                    onChange={handleEmailChange}
                    placeholder="colaborador@colorlink.co"
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none border transition-all ${
                      formErrors.email 
                        ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
                        : email.includes('@')
                          ? 'border-emerald-500/70 focus:border-emerald-500'
                          : isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                {formErrors.email ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {formErrors.email}
                  </p>
                ) : (
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Formato oficial de dominio corporativo • Máx 40 caracteres
                  </p>
                )}
              </div>

              {/* 4. TELÉFONO (SOLO NÚMEROS, LONGITUD EXACTA 10 NÚMEROS) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Teléfono / Móvil Corporativo *
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${telefono.length === 10 ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {telefono.length} / 10 números
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 select-none">
                    +57
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    value={telefono}
                    onChange={handleTelefonoChange}
                    placeholder="3100000000"
                    className={`w-full rounded-xl pl-12 pr-4 py-2.5 text-xs font-mono font-bold tracking-wider focus:outline-none border transition-all ${
                      formErrors.telefono 
                        ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
                        : telefono.length === 10
                          ? 'border-emerald-500/80 focus:border-emerald-500'
                          : isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                  {telefono.length === 10 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {formErrors.telefono ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {formErrors.telefono}
                  </p>
                ) : (
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Solo números permitidos • Longitud exacta: 10 números (ej. 3001234567)
                  </p>
                )}
              </div>

              {/* 5. CÉDULA / DOCUMENTO DE IDENTIDAD (SOLO NÚMEROS, 7 A 10 DÍGITOS) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Cédula / Documento de Identidad
                  </label>
                  <span className={`text-[10px] font-mono ${documentId.length >= 7 ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                    {documentId.length} / 10 números
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 select-none">
                    CC
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={documentId}
                    onChange={handleDocumentIdChange}
                    placeholder="1037000000"
                    className={`w-full rounded-xl pl-11 pr-4 py-2.5 text-xs font-mono focus:outline-none border transition-all ${
                      formErrors.documentId 
                        ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
                        : documentId.length >= 7
                          ? 'border-emerald-500/70 focus:border-emerald-500'
                          : isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                {formErrors.documentId ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {formErrors.documentId}
                  </p>
                ) : (
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Solo números permitidos • Entre 7 y 10 dígitos numéricos
                  </p>
                )}
              </div>

              {/* 6. ROL ASIGNADO EN EL ERP */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Rol Asignado en el ERP *
                </label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={rolNombre}
                    onChange={(e) => setRolNombre(e.target.value as UserRole)}
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-bold focus:outline-none focus:border-emerald-500 border cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Asesor Comercial">Asesor Comercial (Cotizaciones, Obras y Catálogo)</option>
                    <option value="Perito de Calidad">Perito de Calidad (Dictamen NTC y Pruebas Higrométricas)</option>
                    <option value="Jefe de Despachos">Jefe de Despachos (Inventarios, Tintometría y Rutas)</option>
                    <option value="Administrador">Administrador (Control Total y Gobernanza)</option>
                  </select>
                </div>
                <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Determina los módulos y permisos operativos del usuario en el ERP
                </p>
              </div>

              {/* 7. SEDE / CIUDAD */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Sede / Ciudad de Operación *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 border cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="Medellín">Medellín (Sede Principal Guayabal / Poblado)</option>
                    <option value="Itagüí">Itagüí (Centro Logístico Sur)</option>
                    <option value="Envigado">Envigado (Sucursal Las Vegas)</option>
                    <option value="Bello">Bello (Bodega Industrial Norte)</option>
                    <option value="Sabaneta">Sabaneta</option>
                    <option value="Rionegro">Rionegro (Oriente Antioqueño)</option>
                  </select>
                </div>
                <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Sucursal de adscripción en el Valle de Aburrá / Antioquia
                </p>
              </div>

              {/* 8. CONTRASEÑA INICIAL (MÍNIMO 8 CARACTERES, MÁX 20) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Contraseña Inicial de Acceso *
                  </label>
                  <span className={`text-[10px] font-mono ${password.length >= 8 ? 'text-emerald-500 font-bold' : 'text-amber-400'}`}>
                    {password.length} / 20 car.
                  </span>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={20}
                    value={password}
                    onChange={handlePasswordChange}
                    className={`w-full rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono focus:outline-none border transition-all ${
                      formErrors.password 
                        ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
                        : password.length >= 8
                          ? 'border-emerald-500/70 focus:border-emerald-500'
                          : isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                </div>
                {formErrors.password ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {formErrors.password}
                  </p>
                ) : (
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {PASSWORD_POLICY_HINT} Máximo 20 (el colaborador podrá modificarla en su perfil).
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTabMode('roster')}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Creando…' : 'Crear y Habilitar Colaborador'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ROSTER VIEW */
        <div className={`border rounded-3xl p-6 md:p-8 space-y-6 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
        }`}>
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nombre, correo o documento..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 border cursor-pointer ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="todos">Todos los Roles</option>
                <option value="Administrador">Administrador</option>
                <option value="Asesor Comercial">Asesor Comercial</option>
                <option value="Perito de Calidad">Perito de Calidad</option>
                <option value="Jefe de Despachos">Jefe de Despachos</option>
              </select>
            </div>
          </div>

          {/* Employee Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUsers.map((u) => {
              const isCurrentUser = currentUser?.usuarioId === u.usuarioId;

              return (
                <div
                  key={u.usuarioId}
                  className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
                    isLight 
                      ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white shadow-xs' 
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-11 h-11 rounded-2xl overflow-hidden border flex-shrink-0 ${
                          isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'
                        }`}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-500">
                              {u.nombre[0]}
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className={`font-bold text-sm leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {u.nombre} {u.apellido}
                          </h3>
                          <span className="text-[11px] text-slate-500 font-mono block">
                            {u.documentId || 'CC N/D'}
                          </span>
                        </div>
                      </div>

                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Tú
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.rol.rol === 'Administrador'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            : u.rol.rol === 'Asesor Comercial'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : u.rol.rol === 'Perito de Calidad'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                        }`}>
                          {u.rol.rol}
                        </span>

                        <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          • {u.city || 'Medellín'}
                        </span>
                      </div>

                      <div className={`truncate pt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                        {u.email}
                      </div>

                      {u.telefono && (
                        <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                          {u.telefono}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`pt-3 border-t flex items-center justify-between text-[11px] ${
                    isLight ? 'border-slate-200 text-slate-500' : 'border-slate-800 text-slate-400'
                  }`}>
                    {u.activo === false ? (
                      <span className="flex items-center gap-1.5 text-rose-500 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Desactivado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Activo en ERP
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingId(u.usuarioId)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-bold transition-colors cursor-pointer ${
                        isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      }`}
                    >
                      <Pencil className="w-3 h-3" />
                      Editar
                    </button>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <p className={`text-xs col-span-full text-center py-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                No hay colaboradores que coincidan con la búsqueda.
              </p>
            )}
          </div>
        </div>
      )}

      {editingUser && (
        <EmployeeEditPanel
          key={editingUser.usuarioId}
          empleado={editingUser}
          isSelf={currentUser?.usuarioId === editingUser.usuarioId}
          isLight={isLight}
          onClose={() => setEditingId(null)}
          onSave={(datos) => actualizarEmpleado(editingUser.usuarioId, datos)}
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------- Edición de un colaborador

type EditDatos = { telefono?: string; rolNombre?: UserRole; activo?: boolean; password?: string };

const EmployeeEditPanel: React.FC<{
  empleado: Usuario;
  isSelf: boolean;
  isLight: boolean;
  onClose: () => void;
  onSave: (datos: EditDatos) => Promise<boolean>;
}> = ({ empleado, isSelf, isLight, onClose, onSave }) => {
  // El componente se monta con key = usuarioId, así el formulario siempre arranca con los datos del empleado elegido
  const telefonoInicial = (empleado.telefono || '').replace(/\D/g, '').slice(-10);
  const activoInicial = empleado.activo !== false;
  const [rol, setRol] = useState<UserRole>(empleado.rol.rol);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [activo, setActivo] = useState(activoInicial);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const inputCls = `w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-emerald-500 border ${
    isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
  }`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError('');

    if (telefono && telefono.length !== 10) {
      setError('El teléfono debe contener exactamente 10 números (ej. 3001234567).');
      return;
    }
    if (password) {
      const policyError = passwordPolicyError(password);
      if (policyError) { setError(policyError); return; }
    }

    // Solo se envía lo que cambió
    const datos: EditDatos = {};
    if (telefono !== telefonoInicial) datos.telefono = telefono ? `+57 ${telefono}` : '';
    if (!isSelf && rol !== empleado.rol.rol) datos.rolNombre = rol;
    if (!isSelf && activo !== activoInicial) datos.activo = activo;
    if (password) datos.password = password;

    if (Object.keys(datos).length === 0) {
      setError('No hay cambios para guardar.');
      return;
    }

    setSaving(true);
    const ok = await onSave(datos);
    setSaving(false);
    if (ok) onClose();
    else setError('El servidor rechazó el cambio. Revisa el aviso con el motivo.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <form
        onSubmit={handleSave}
        className={`w-full max-w-md rounded-3xl border p-6 shadow-2xl space-y-4 ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#091526] border-slate-800 text-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-base">Editar colaborador</h3>
            <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {empleado.nombre} {empleado.apellido} • {empleado.email}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg cursor-pointer ${isLight ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-slate-800 text-slate-400'}`}
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Rol en el ERP</label>
          <select
            value={rol}
            disabled={isSelf}
            onChange={(e) => setRol(e.target.value as UserRole)}
            className={`${inputCls} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {STAFF_ROLE_LABELS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {isSelf && (
            <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              No puedes cambiar tu propio rol ni desactivar tu propia cuenta.
            </p>
          )}
        </div>

        <div>
          <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Teléfono móvil</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 select-none">+57</span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={telefono}
              onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="3001234567"
              className={`${inputCls} pl-12 font-mono`}
            />
          </div>
        </div>

        <label className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs font-bold ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-900/60'
        } ${isSelf ? 'opacity-60' : 'cursor-pointer'}`}>
          <span>Cuenta activa (puede iniciar sesión)</span>
          <input
            type="checkbox"
            checked={activo}
            disabled={isSelf}
            onChange={(e) => setActivo(e.target.checked)}
            className="w-4 h-4 accent-emerald-500"
          />
        </label>

        <div>
          <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Contraseña temporal (opcional)
          </label>
          <input
            type="text"
            maxLength={20}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Dejar en blanco para no cambiarla"
            autoComplete="new-password"
            className={`${inputCls} font-mono`}
          />
          <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{PASSWORD_POLICY_HINT}</p>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
              isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
