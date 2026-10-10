import React, { useState, useEffect, useMemo } from 'react';
import { useApp, canRole } from '../context/AppContext';
import { UserRole, Usuario } from '../types/database';
import { STAFF_ROLE_LABELS } from '../mappers';
import { passwordPolicyError, PASSWORD_POLICY_HINT } from '../passwordPolicy';
import {
  limpiarLetras, soloDigitos, errorNombrePersona, errorEmail, errorCelular, EMAIL_MAX, normalizarTexto,
} from '../validation';
import { ModalBackdrop, FieldError, bordeCampo, descargarCsv, hoyArchivo } from './ui';
import {
  UserPlus,
  ShieldCheck,
  User,
  Mail,
  CheckCircle2,
  Lock,
  MapPin,
  Users,
  Search,
  Filter,
  AlertCircle,
  Pencil,
  X,
  Download,
} from 'lucide-react';

// ---------------------------------------------------------------- Reglas (mismas que el backend en el registro)

const NOMBRE_MAX = 40;
const PASSWORD_MAX = 64;

type TipoDoc = 'CC' | 'CE' | 'PAS';
const DOC_RULES: Record<TipoDoc, { label: string; re: RegExp; max: number; soloNumeros: boolean; ayuda: string; placeholder: string }> = {
  CC: { label: 'Cédula de ciudadanía', re: /^\d{6,10}$/, max: 10, soloNumeros: true, ayuda: 'Solo números, entre 6 y 10 dígitos.', placeholder: '1037000000' },
  CE: { label: 'Cédula de extranjería', re: /^[A-Z0-9]{6,12}$/, max: 12, soloNumeros: false, ayuda: 'Letras o números, entre 6 y 12 caracteres.', placeholder: 'E1234567' },
  PAS: { label: 'Pasaporte', re: /^[A-Z0-9]{5,12}$/, max: 12, soloNumeros: false, ayuda: 'Letras o números, entre 5 y 12 caracteres.', placeholder: 'AB123456' },
};
const limpiarDoc = (v: string, tipo: TipoDoc) => {
  const r = DOC_RULES[tipo];
  return (r.soloNumeros ? v.replace(/\D/g, '') : v.toUpperCase().replace(/[^A-Z0-9]/g, '')).slice(0, r.max);
};

const EMPRESA_EMPLEADOS = 'ColorLink S.A.S.';

const ROLE_HINT: Record<string, string> = {
  'Asesor Comercial': 'Asesor Comercial (proyectos, cotizaciones y pedidos)',
  'Perito de Calidad': 'Perito de Calidad (peritaje y dictamen técnico)',
  'Jefe de Despachos': 'Jefe de Despachos (despachos, pedidos e inventario)',
  'Administrador': 'Administrador (control total)',
};

const CAMPO_LABEL: Record<string, string> = {
  nombre: 'nombres', apellido: 'apellidos', email: 'correo', telefono: 'teléfono',
  documentId: 'documento', city: 'sede', password: 'contraseña', rol: 'rol',
};

export const EmployeeManagementPanel: React.FC = () => {
  const {
    usuarios,
    ciudades,
    crearUsuario,
    actualizarEmpleado,
    theme,
    currentUser,
  } = useApp();

  const isLight = theme === 'light';
  const puedeGestionar = canRole.gestionarEmpleados(currentUser?.rol.rol);

  // Sedes: las ciudades reales del backend
  const cityOptions = useMemo(
    () => Array.from(new Set(ciudades.map(c => c.ciudad))).sort((a, b) => a.localeCompare(b, 'es')),
    [ciudades],
  );

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoDoc, setTipoDoc] = useState<TipoDoc>('CC');
  const [documentId, setDocumentId] = useState('');
  const [rolNombre, setRolNombre] = useState<UserRole>('Asesor Comercial');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitErrorNotice, setSubmitErrorNotice] = useState<string>('');

  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('todos');
  const [activeTabMode, setActiveTabMode] = useState<'roster' | 'create'>('roster');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingUser = editingId ? usuarios.find(u => u.usuarioId === editingId) || null : null;

  const term = searchFilter.trim().toLowerCase();
  const digitosBusqueda = term.replace(/\D/g, '');
  const filteredUsers = usuarios.filter((u) => {
    const matchesSearch =
      !term ||
      `${u.nombre} ${u.apellido}`.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.documentId && u.documentId.toLowerCase().includes(term)) ||
      (digitosBusqueda.length >= 3 && !!u.telefono && u.telefono.replace(/\D/g, '').includes(digitosBusqueda));
    const matchesRole = roleFilter === 'todos' || u.rol.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  const docRule = DOC_RULES[tipoDoc];

  // Errores calculados en vivo; se muestran cuando el campo ya se tocó
  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    const en = errorNombrePersona(nombre, 'El nombre', 2, NOMBRE_MAX); if (en) e.nombre = en;
    const ea = errorNombrePersona(apellido, 'El apellido', 2, NOMBRE_MAX); if (ea) e.apellido = ea;
    const em = errorEmail(email);
    if (em) e.email = em;
    else if (usuarios.some(u => u.email.toLowerCase() === email.trim().toLowerCase())) e.email = 'Ya existe un colaborador con este correo.';
    const et = errorCelular(telefono, 'El teléfono móvil', true); if (et) e.telefono = et;
    if (documentId && !docRule.re.test(documentId)) e.documentId = `${docRule.label}: ${docRule.ayuda}`;
    if (!STAFF_ROLE_LABELS.includes(rolNombre)) e.rol = 'Selecciona un rol válido del equipo.';
    if (!city) e.city = cityOptions.length ? 'Selecciona la sede del colaborador.' : 'Cargando sedes del servidor…';
    const ep = passwordPolicyError(password); if (ep) e.password = ep;
    return e;
  }, [nombre, apellido, email, telefono, documentId, docRule, rolNombre, city, cityOptions.length, password, usuarios]);

  const hayErrores = Object.keys(errors).length > 0;
  const err = (campo: string) => (touched[campo] ? errors[campo] : undefined);
  const touch = (campo: string) => setTouched(t => (t[campo] ? t : { ...t, [campo]: true }));

  const resetForm = () => {
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefono('');
    setTipoDoc('CC');
    setDocumentId('');
    setRolNombre('Asesor Comercial');
    setPassword('');
    setCity('');
    setTouched({});
    setSubmitErrorNotice('');
  };

  const abrirCreacion = () => {
    resetForm();
    setActiveTabMode('create');
  };

  const cancelarCreacion = () => {
    if (saving) return;
    resetForm();
    setActiveTabMode('roster');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSubmitErrorNotice('');
    if (hayErrores) {
      setTouched(Object.fromEntries(Object.keys(CAMPO_LABEL).map(k => [k, true])));
      return;
    }

    setSaving(true);
    const creado = await crearUsuario({
      nombre: normalizarTexto(nombre),
      apellido: normalizarTexto(apellido),
      email: email.trim().toLowerCase(),
      telefono: `+57 ${telefono}`,
      documentId: documentId ? `${tipoDoc} ${documentId}` : undefined,
      rolNombre,
      password,
      company: EMPRESA_EMPLEADOS,
      city,
    });
    setSaving(false);

    // Si el servidor lo rechazó, se conservan los datos para corregirlos (el motivo sale en el aviso)
    if (!creado) {
      setSubmitErrorNotice('El servidor no pudo crear el colaborador. Revisa el aviso con el motivo y corrige los datos.');
      return;
    }

    resetForm();
    setActiveTabMode('roster');
  };

  const exportarDirectorio = () => {
    descargarCsv(
      `colaboradores-colorlink-${hoyArchivo()}.csv`,
      ['Nombres', 'Apellidos', 'Correo', 'Teléfono', 'Documento', 'Rol', 'Sede', 'Estado'],
      filteredUsers.map(u => [
        u.nombre, u.apellido, u.email, u.telefono || '', u.documentId || '', u.rol.rol, u.city || '',
        u.activo === false ? 'Desactivado' : 'Activo',
      ]),
    );
  };

  if (!puedeGestionar) {
    return (
      <div className={`border rounded-3xl p-8 text-center text-sm ${
        isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#091526] border-slate-800 text-slate-300'
      }`}>
        Solo el Administrador puede gestionar los colaboradores del ERP.
      </div>
    );
  }

  const labelCls = `text-xs font-bold ${isLight ? 'text-slate-700' : 'text-slate-300'}`;
  const hintCls = `text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`;
  const inputBase = `w-full rounded-xl py-2.5 text-xs focus:outline-none border transition-all ${
    isLight ? 'bg-slate-50 text-slate-900 placeholder:text-slate-400' : 'bg-slate-900 text-white placeholder:text-slate-500'
  }`;
  const pendientes = Object.keys(errors).map(k => CAMPO_LABEL[k] || k);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className={`border rounded-3xl p-5 md:p-8 shadow-sm relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900'
          : 'bg-[#091526] border-slate-800 text-white shadow-xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-500 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Administración de Personal
            </div>
            <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Gestión de Empleados
            </h1>
            <p className={`text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Alta de colaboradores, cargos, sedes y credenciales de acceso al ERP ColorLink.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={abrirCreacion}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                activeTabMode === 'create'
                  ? 'bg-[#F2C417] text-slate-950'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar Nuevo Empleado</span>
            </button>

            <button
              type="button"
              onClick={cancelarCreacion}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
                activeTabMode === 'roster'
                  ? 'bg-indigo-600 text-white'
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

        {/* Conteos reales por rol */}
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          {[
            { label: 'Total Cuentas', value: usuarios.length, cls: isLight ? 'text-slate-900' : 'text-white' },
            { label: 'Asesores Comerciales', value: usuarios.filter(u => u.rol.rol === 'Asesor Comercial').length, cls: isLight ? 'text-emerald-700' : 'text-emerald-400' },
            { label: 'Peritos de Calidad', value: usuarios.filter(u => u.rol.rol === 'Perito de Calidad').length, cls: isLight ? 'text-amber-700' : 'text-amber-400' },
            { label: 'Jefes de Despachos', value: usuarios.filter(u => u.rol.rol === 'Jefe de Despachos').length, cls: isLight ? 'text-sky-700' : 'text-sky-400' },
          ].map(k => (
            <div key={k.label} className={`p-3 rounded-2xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
              <span className={`text-[10px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{k.label}</span>
              <span className={`text-xl font-black font-mono ${k.cls}`}>{k.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main View: Form OR Roster */}
      {activeTabMode === 'create' ? (
        <div className={`border rounded-3xl p-5 md:p-8 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
        }`}>
          <div className={`flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className={`font-bold text-lg ${isLight ? 'text-slate-900' : 'text-white'}`}>Nuevo colaborador</h2>
                <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Los campos con * son obligatorios.</p>
              </div>
            </div>

            <button
              type="button"
              onClick={cancelarCreacion}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Volver al Directorio
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-6" data-testid="employee-create-form">
            {submitErrorNotice && (
              <div role="alert" className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitErrorNotice}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Nombres */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="emp-nombre" className={labelCls}>Nombres *</label>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{nombre.length}/{NOMBRE_MAX}</span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="emp-nombre"
                    name="nombre"
                    type="text"
                    autoComplete="off"
                    maxLength={NOMBRE_MAX}
                    value={nombre}
                    onChange={(e) => setNombre(limpiarLetras(e.target.value, NOMBRE_MAX))}
                    onBlur={() => touch('nombre')}
                    aria-invalid={!!err('nombre')}
                    placeholder="Ej. Andrés Felipe"
                    className={`${inputBase} pl-10 pr-4 ${bordeCampo(err('nombre'), isLight)}`}
                  />
                </div>
                {err('nombre') ? <FieldError msg={err('nombre')} /> : <p className={hintCls}>Solo letras y espacios (2 a {NOMBRE_MAX}).</p>}
              </div>

              {/* Apellidos */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="emp-apellido" className={labelCls}>Apellidos *</label>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{apellido.length}/{NOMBRE_MAX}</span>
                </div>
                <input
                  id="emp-apellido"
                  name="apellido"
                  type="text"
                  autoComplete="off"
                  maxLength={NOMBRE_MAX}
                  value={apellido}
                  onChange={(e) => setApellido(limpiarLetras(e.target.value, NOMBRE_MAX))}
                  onBlur={() => touch('apellido')}
                  aria-invalid={!!err('apellido')}
                  placeholder="Ej. Londoño Restrepo"
                  className={`${inputBase} px-4 ${bordeCampo(err('apellido'), isLight)}`}
                />
                {err('apellido') ? <FieldError msg={err('apellido')} /> : <p className={hintCls}>Solo letras y espacios (2 a {NOMBRE_MAX}).</p>}
              </div>

              {/* Correo */}
              <div>
                <label htmlFor="emp-email" className={`${labelCls} block mb-1.5`}>Correo electrónico *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="emp-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="off"
                    maxLength={EMAIL_MAX}
                    value={email}
                    onChange={(e) => setEmail(e.target.value.replace(/\s/g, '').toLowerCase().slice(0, EMAIL_MAX))}
                    onBlur={() => touch('email')}
                    aria-invalid={!!err('email')}
                    placeholder="colaborador@colorlink.co"
                    className={`${inputBase} pl-10 pr-4 ${bordeCampo(err('email'), isLight)}`}
                  />
                </div>
                {err('email') ? <FieldError msg={err('email')} /> : <p className={hintCls}>Será su usuario para ingresar al ERP.</p>}
              </div>

              {/* Teléfono */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="emp-telefono" className={labelCls}>Celular *</label>
                  <span className={`text-[10px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{telefono.length}/10</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 select-none">+57</span>
                  <input
                    id="emp-telefono"
                    name="telefono"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    pattern="3[0-9]{9}"
                    value={telefono}
                    onChange={(e) => setTelefono(soloDigitos(e.target.value, 10))}
                    onBlur={() => touch('telefono')}
                    aria-invalid={!!err('telefono')}
                    placeholder="3001234567"
                    className={`${inputBase} pl-12 pr-4 font-mono tracking-wider ${bordeCampo(err('telefono'), isLight)}`}
                  />
                </div>
                {err('telefono') ? <FieldError msg={err('telefono')} /> : <p className={hintCls}>10 números, empieza por 3.</p>}
              </div>

              {/* Documento */}
              <div>
                <label htmlFor="emp-doc" className={`${labelCls} block mb-1.5`}>Documento de identidad (opcional)</label>
                <div className="flex gap-2">
                  <select
                    aria-label="Tipo de documento"
                    value={tipoDoc}
                    onChange={(e) => {
                      const tipo = e.target.value as TipoDoc;
                      setTipoDoc(tipo);
                      setDocumentId(prev => limpiarDoc(prev, tipo));
                    }}
                    className={`rounded-xl px-2 py-2.5 text-xs font-bold border focus:outline-none cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                  <input
                    id="emp-doc"
                    name="documentId"
                    type="text"
                    inputMode={docRule.soloNumeros ? 'numeric' : 'text'}
                    autoComplete="off"
                    maxLength={docRule.max}
                    value={documentId}
                    onChange={(e) => setDocumentId(limpiarDoc(e.target.value, tipoDoc))}
                    onBlur={() => touch('documentId')}
                    aria-invalid={!!err('documentId')}
                    placeholder={docRule.placeholder}
                    className={`${inputBase} px-4 font-mono ${bordeCampo(err('documentId'), isLight)}`}
                  />
                </div>
                {err('documentId') ? <FieldError msg={err('documentId')} /> : <p className={hintCls}>{docRule.label}: {docRule.ayuda}</p>}
              </div>

              {/* Rol */}
              <div>
                <label htmlFor="emp-rol" className={`${labelCls} block mb-1.5`}>Rol en el ERP *</label>
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-indigo-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="emp-rol"
                    value={rolNombre}
                    onChange={(e) => setRolNombre(e.target.value as UserRole)}
                    className={`${inputBase} pl-10 pr-4 font-bold cursor-pointer ${bordeCampo(errors.rol, isLight)}`}
                  >
                    {STAFF_ROLE_LABELS.map(r => <option key={r} value={r}>{ROLE_HINT[r] || r}</option>)}
                  </select>
                </div>
                <p className={hintCls}>Determina los módulos que verá el colaborador.</p>
              </div>

              {/* Sede */}
              <div>
                <label htmlFor="emp-city" className={`${labelCls} block mb-1.5`}>Sede / ciudad *</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <select
                    id="emp-city"
                    value={city}
                    onChange={(e) => { setCity(e.target.value); touch('city'); }}
                    onBlur={() => touch('city')}
                    disabled={cityOptions.length === 0}
                    aria-invalid={!!err('city')}
                    className={`${inputBase} pl-10 pr-4 cursor-pointer disabled:opacity-60 ${bordeCampo(err('city'), isLight)}`}
                  >
                    <option value="">{cityOptions.length ? 'Selecciona la sede' : 'Cargando sedes…'}</option>
                    {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                {err('city') ? <FieldError msg={err('city')} /> : <p className={hintCls}>Ciudades registradas en el sistema.</p>}
              </div>

              {/* Contraseña */}
              <div>
                <label htmlFor="emp-password" className={`${labelCls} block mb-1.5`}>Contraseña temporal *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="emp-password"
                    name="password"
                    type="text"
                    autoComplete="new-password"
                    maxLength={PASSWORD_MAX}
                    value={password}
                    onChange={(e) => setPassword(e.target.value.slice(0, PASSWORD_MAX))}
                    onBlur={() => touch('password')}
                    aria-invalid={!!err('password')}
                    className={`${inputBase} pl-10 pr-4 font-mono ${bordeCampo(err('password'), isLight)}`}
                  />
                </div>
                {err('password') ? <FieldError msg={err('password')} /> : (
                  <p className={hintCls}>{PASSWORD_POLICY_HINT} El colaborador podrá cambiarla en su perfil.</p>
                )}
              </div>
            </div>

            <div className={`flex flex-col sm:flex-row sm:items-center justify-end gap-3 pt-4 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
              {hayErrores && (
                <p className={`text-[11px] sm:mr-auto ${isLight ? 'text-slate-500' : 'text-slate-400'}`} data-testid="pending-fields">
                  Falta completar o corregir: {pendientes.join(', ')}.
                </p>
              )}
              <button
                type="button"
                onClick={cancelarCreacion}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                }`}
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={saving || hayErrores}
                className="px-6 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{saving ? 'Creando…' : 'Crear colaborador'}</span>
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* ROSTER VIEW */
        <div className={`border rounded-3xl p-5 md:p-8 space-y-6 transition-all ${
          isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
        }`}>
          {/* Search & Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                maxLength={80}
                aria-label="Buscar colaborador"
                placeholder="Buscar por nombre, correo, documento o celular…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value.slice(0, 80))}
                className={`w-full rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-500 border ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                aria-label="Filtrar por rol"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className={`flex-1 sm:flex-none rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-emerald-500 border cursor-pointer ${
                  isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700 text-white'
                }`}
              >
                <option value="todos">Todos los Roles</option>
                {STAFF_ROLE_LABELS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                type="button"
                onClick={exportarDirectorio}
                disabled={filteredUsers.length === 0}
                title="Descargar la lista visible en CSV (Excel)"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isLight ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>
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
                      ? 'bg-slate-50/70 border-slate-200 hover:border-slate-300 hover:bg-white'
                      : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-11 h-11 rounded-2xl overflow-hidden border flex-shrink-0 ${
                          isLight ? 'bg-slate-200 border-slate-300' : 'bg-slate-800 border-slate-700'
                        }`}>
                          {u.avatarUrl ? (
                            <img src={u.avatarUrl} alt={u.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-sm text-slate-500">
                              {(u.nombre || u.email || '?').charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <h3 className={`font-bold text-sm leading-tight truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {u.nombre} {u.apellido}
                          </h3>
                          <span className={`text-[11px] font-mono block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {u.documentId || 'Documento no registrado'}
                          </span>
                        </div>
                      </div>

                      {isCurrentUser && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          Tú
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 text-xs mb-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          u.rol.rol === 'Administrador'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800'
                            : u.rol.rol === 'Asesor Comercial'
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : u.rol.rol === 'Perito de Calidad'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                                : 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-800'
                        }`}>
                          {u.rol.rol}
                        </span>

                        {u.city && (
                          <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>• {u.city}</span>
                        )}
                      </div>

                      <div className={`truncate pt-1 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>{u.email}</div>

                      {u.telefono && (
                        <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{u.telefono}</div>
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
                      <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Activo en ERP
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setEditingId(u.usuarioId)}
                      aria-label={`Editar a ${u.nombre} ${u.apellido}`}
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
                {usuarios.length === 0 ? 'Aún no hay colaboradores registrados.' : 'No hay colaboradores que coincidan con la búsqueda.'}
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

type EditDatos = { nombre?: string; apellido?: string; telefono?: string; rolNombre?: UserRole; activo?: boolean; password?: string };

const EmployeeEditPanel: React.FC<{
  empleado: Usuario;
  isSelf: boolean;
  isLight: boolean;
  onClose: () => void;
  onSave: (datos: EditDatos) => Promise<boolean>;
}> = ({ empleado, isSelf, isLight, onClose, onSave }) => {
  // El componente se monta con key = usuarioId: el formulario siempre arranca con los datos del empleado elegido
  const telefonoInicial = (empleado.telefono || '').replace(/\D/g, '').slice(-10);
  const activoInicial = empleado.activo !== false;
  const [nombre, setNombre] = useState(empleado.nombre || '');
  const [apellido, setApellido] = useState(empleado.apellido || '');
  const [rol, setRol] = useState<UserRole>(empleado.rol.rol);
  const [telefono, setTelefono] = useState(telefonoInicial);
  const [activo, setActivo] = useState(activoInicial);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const errors: Record<string, string> = {};
  // Nombre y apellido solo se validan si se cambian (cuentas antiguas pueden no cumplir la regla nueva)
  if (normalizarTexto(nombre) !== empleado.nombre) { const en = errorNombrePersona(nombre, 'El nombre'); if (en) errors.nombre = en; }
  if (normalizarTexto(apellido) !== (empleado.apellido || '')) { const ea = errorNombrePersona(apellido, 'El apellido'); if (ea) errors.apellido = ea; }
  // El teléfono se puede dejar vacío para quitarlo; si se cambia, debe ser un celular válido
  if (telefono !== telefonoInicial) { const et = errorCelular(telefono, 'El teléfono'); if (et) errors.telefono = et; }
  if (password) { const ep = passwordPolicyError(password); if (ep) errors.password = ep; }
  const hayErrores = Object.keys(errors).length > 0;

  const datos: EditDatos = {};
  if (normalizarTexto(nombre) !== empleado.nombre) datos.nombre = normalizarTexto(nombre);
  if (normalizarTexto(apellido) !== (empleado.apellido || '')) datos.apellido = normalizarTexto(apellido);
  if (telefono !== telefonoInicial) datos.telefono = telefono ? `+57 ${telefono}` : '';
  if (!isSelf && rol !== empleado.rol.rol) datos.rolNombre = rol;
  if (!isSelf && activo !== activoInicial) datos.activo = activo;
  if (password) datos.password = password;
  const sinCambios = Object.keys(datos).length === 0;

  const inputCls = (e?: string) => `w-full rounded-xl px-3.5 py-2.5 text-xs focus:outline-none border ${bordeCampo(e, isLight)} ${
    isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'
  }`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || hayErrores || sinCambios) return;
    setError('');
    setSaving(true);
    const ok = await onSave(datos);
    setSaving(false);
    if (ok) onClose();
    else setError('El servidor rechazó el cambio. Revisa el aviso con el motivo.');
  };

  return (
    <ModalBackdrop onClose={onClose} bloqueado={saving} label="Editar colaborador">
      <form
        onSubmit={handleSave}
        noValidate
        data-testid="employee-edit-form"
        className={`w-full max-w-md rounded-3xl border p-5 sm:p-6 shadow-2xl space-y-4 my-auto ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#091526] border-slate-800 text-white'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-base">Editar colaborador</h3>
            <p className={`text-xs truncate ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{empleado.email}</p>
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
          <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor="edit-nombre" className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Nombres</label>
            <input id="edit-nombre" type="text" maxLength={NOMBRE_MAX} value={nombre}
              onChange={(e) => setNombre(limpiarLetras(e.target.value, NOMBRE_MAX))} className={inputCls(errors.nombre)} />
            <FieldError msg={errors.nombre} />
          </div>
          <div>
            <label htmlFor="edit-apellido" className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Apellidos</label>
            <input id="edit-apellido" type="text" maxLength={NOMBRE_MAX} value={apellido}
              onChange={(e) => setApellido(limpiarLetras(e.target.value, NOMBRE_MAX))} className={inputCls(errors.apellido)} />
            <FieldError msg={errors.apellido} />
          </div>
        </div>

        <div>
          <label htmlFor="edit-rol" className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Rol en el ERP</label>
          <select
            id="edit-rol"
            value={rol}
            disabled={isSelf}
            onChange={(e) => setRol(e.target.value as UserRole)}
            className={`${inputCls()} cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed`}
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
          <label htmlFor="edit-telefono" className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Celular</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 select-none">+57</span>
            <input
              id="edit-telefono"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={telefono}
              onChange={(e) => setTelefono(soloDigitos(e.target.value, 10))}
              placeholder="3001234567"
              className={`${inputCls(errors.telefono)} pl-12 font-mono`}
            />
          </div>
          <FieldError msg={errors.telefono} />
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
          <label htmlFor="edit-password" className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
            Contraseña temporal (opcional)
          </label>
          <input
            id="edit-password"
            type="text"
            maxLength={PASSWORD_MAX}
            value={password}
            onChange={(e) => setPassword(e.target.value.slice(0, PASSWORD_MAX))}
            placeholder="Dejar en blanco para no cambiarla"
            autoComplete="new-password"
            className={`${inputCls(errors.password)} font-mono`}
          />
          {errors.password ? <FieldError msg={errors.password} /> : (
            <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{PASSWORD_POLICY_HINT}</p>
          )}
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
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
            disabled={saving || hayErrores || sinCambios}
            title={sinCambios ? 'No hay cambios para guardar' : undefined}
            className="px-5 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl cursor-pointer"
          >
            {saving ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </ModalBackdrop>
  );
};
