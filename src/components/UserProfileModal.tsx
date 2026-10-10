import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { passwordPolicyError, PASSWORD_POLICY_HINT } from '../passwordPolicy';
import { soloDigitos, errorCelular } from '../validation';
import { ModalBackdrop, FieldError, bordeCampo } from './ui';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  ShieldCheck, 
  Camera, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Mail, 
  MapPin, 
  Building2, 
  Key, 
  Eye, 
  EyeOff,
  Sparkles,
  Trash2
} from 'lucide-react';

const FOTO_MAX_MB = 3;
const PASSWORD_MAX = 64;
const URL_MAX = 500;

function errorUrlFoto(url: string): string {
  if (!url) return 'Pega la dirección (URL) de la imagen.';
  if (url.length > URL_MAX) return `La URL puede tener máximo ${URL_MAX} caracteres.`;
  try {
    const u = new URL(url);
    if (u.protocol !== 'https:') return 'La URL debe empezar por https://';
  } catch {
    return 'La URL no es válida (ej. https://sitio.com/foto.jpg).';
  }
  return '';
}

export const UserProfileModal: React.FC = () => {
  const { 
    currentUser, 
    profileModalOpen, 
    setProfileModalOpen, 
    actualizarPerfilUsuario,
    theme 
  } = useApp();

  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states - ONLY phone and password can be edited, plus profile photo
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [telefono, setTelefono] = useState<string>('');
  const [passwordActual, setPasswordActual] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showCustomUrlInput, setShowCustomUrlInput] = useState<boolean>(false);
  const [customUrl, setCustomUrl] = useState<string>('');
  
  // Errores que no dependen solo del valor del campo
  const [formError, setFormError] = useState<string>('');
  const [photoError, setPhotoError] = useState<string>('');
  const [urlError, setUrlError] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);

  // Se sincroniza con currentUser solo al abrir el modal (no cuando currentUser cambia al guardar,
  // porque eso borraría el aviso de éxito y el formulario)
  useEffect(() => {
    if (currentUser && profileModalOpen) {
      setPhotoUrl(currentUser.avatarUrl || '');
      // Clean phone number: keep only 10 digits
      const cleanPhone = (currentUser.telefono || '').replace(/\D/g, '').slice(-10);
      setTelefono(cleanPhone);
      setPasswordActual('');
      setPassword('');
      setConfirmPassword('');
      setFormError('');
      setPhotoError('');
      setUrlError('');
      setSuccessNotice('');
      setShowCustomUrlInput(false);
      setCustomUrl('');
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileModalOpen]);

  if (!profileModalOpen || !currentUser) return null;

  const cerrar = () => { if (!saving) setProfileModalOpen(false); };

  // Teléfono: solo números, máximo 10 (celular colombiano que empieza por 3)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTelefono(soloDigitos(e.target.value, 10));
    setFormError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    setPhotoError('');
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setPhotoError('Selecciona una imagen JPG, PNG o WebP.');
      return;
    }
    if (file.size > FOTO_MAX_MB * 1024 * 1024) {
      setPhotoError(`La imagen no debe superar los ${FOTO_MAX_MB} MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') setPhotoUrl(event.target.result);
    };
    reader.onerror = () => setPhotoError('No se pudo leer la imagen. Intenta con otro archivo.');
    reader.readAsDataURL(file);
  };

  const aplicarUrl = () => {
    const url = customUrl.trim();
    const e = errorUrlFoto(url);
    if (e) { setUrlError(e); return; }
    setPhotoUrl(url);
    setShowCustomUrlInput(false);
    setCustomUrl('');
    setUrlError('');
    setPhotoError('');
  };

  // ---- Validación en vivo
  const telefonoOriginal = (currentUser.telefono || '').replace(/\D/g, '').slice(-10);
  const cambiaTelefono = telefono !== telefonoOriginal;
  const phoneError = cambiaTelefono ? errorCelular(telefono, 'El celular') : '';
  const quiereCambiarClave = password.length > 0 || confirmPassword.length > 0 || passwordActual.length > 0;
  const pwErrors: { actual?: string; nueva?: string; confirmar?: string } = {};
  if (quiereCambiarClave) {
    if (!passwordActual) pwErrors.actual = 'Escribe tu contraseña actual para poder cambiarla.';
    const pol = password ? passwordPolicyError(password) : 'Escribe la nueva contraseña.';
    if (pol) pwErrors.nueva = pol;
    else if (password === passwordActual) pwErrors.nueva = 'La nueva contraseña debe ser distinta a la actual.';
    if (password && confirmPassword !== password) pwErrors.confirmar = 'La confirmación no coincide con la nueva contraseña.';
  }
  const cambiaFoto = photoUrl !== (currentUser.avatarUrl || '');
  const hayCambios = cambiaTelefono || cambiaFoto || quiereCambiarClave;
  const hayErrores = !!phoneError || Object.keys(pwErrors).length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving || hayErrores || !hayCambios) return;
    setFormError('');

    // El contexto solo envía al servidor lo que realmente cambió. Foto vacía = quitar foto.
    const payload: { fotoUrl?: string; telefono?: string; passwordActual?: string; password?: string } = {
      fotoUrl: photoUrl,
      telefono: cambiaTelefono ? (telefono ? `+57 ${telefono}` : '') : currentUser.telefono || '',
    };
    if (password) {
      payload.password = password;
      payload.passwordActual = passwordActual;
    }

    setSaving(true);
    const res = await actualizarPerfilUsuario(payload);
    setSaving(false);
    if (!res.success) {
      setFormError(res.message);
      return;
    }
    setSuccessNotice('¡Perfil actualizado con éxito!');
    setTimeout(() => setProfileModalOpen(false), 1200);
  };

  return (
    <ModalBackdrop onClose={cerrar} bloqueado={saving} label="Mi perfil">
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#091526] border-slate-800 text-white'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-5 border-b flex items-center justify-between ${
          isLight ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800/80 bg-slate-900/60'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">
                  Mi Perfil de Colaborador
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  {currentUser.rol.rol}
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Actualización de fotografía, línea de contacto y contraseña de acceso
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={cerrar}
            aria-label="Cerrar"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isLight 
                ? 'hover:bg-slate-200 text-slate-500 border-slate-200' 
                : 'hover:bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Banner */}
        {successNotice && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-6 space-y-6" data-testid="profile-form">
          {formError && (
            <div role="alert" className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}
          {/* 1. SECCIÓN DE FOTO DE PERFIL */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/40 border-slate-800'
          }`}>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              1. Fotografía de Perfil
            </label>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Preview */}
              <div className="relative group flex-shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-lg bg-slate-800">
                  {photoUrl ? (
                    <img src={photoUrl} alt={currentUser.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-emerald-400">
                      {currentUser.nombre[0]}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-2 -right-2 p-2 bg-emerald-500 text-slate-950 rounded-xl shadow-md hover:bg-emerald-400 transition-all cursor-pointer"
                  title="Subir imagen desde equipo"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Upload & Presets */}
              <div className="flex-1 space-y-2.5 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm ${
                      isLight 
                        ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300' 
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Subir desde dispositivo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setShowCustomUrlInput(!showCustomUrlInput); setUrlError(''); }}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                      isLight 
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                        : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    <span>Pegar URL</span>
                  </button>
                </div>

                {/* Custom URL Input if toggled */}
                {showCustomUrlInput && (
                  <div className="pt-1 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        inputMode="url"
                        aria-label="URL de la foto"
                        maxLength={URL_MAX}
                        placeholder="https://ejemplo.com/mifoto.jpg"
                        value={customUrl}
                        onChange={(e) => { setCustomUrl(e.target.value.trim()); setUrlError(''); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); aplicarUrl(); } }}
                        className={`flex-1 min-w-0 text-xs px-3 py-1.5 rounded-xl border focus:outline-none ${bordeCampo(urlError, isLight)} ${
                          isLight ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={aplicarUrl}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                      >
                        Aplicar
                      </button>
                    </div>
                    <FieldError msg={urlError} />
                  </div>
                )}
                <FieldError msg={photoError} />

                {photoUrl && (
                  <button
                    type="button"
                    onClick={() => setPhotoUrl('')}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-rose-500 hover:text-rose-400 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar foto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. SECCIÓN DE CAMPOS PERMITIDOS (TELÉFONO Y CONTRASEÑA NADA MÁS) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2 border-slate-200 dark:border-slate-800">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                2. Campos Modificables por el Colaborador
              </span>
              <span className="text-[10px] font-semibold text-slate-400">
                Solo Teléfono y Contraseña
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Teléfono (Solo números, longitud 10) */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="perfil-telefono" className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    Teléfono Móvil Corporativo
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${
                    telefono.length === 10 ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                    {telefono.length} / 10 números
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400 select-none">
                    +57
                  </span>
                  <input
                    id="perfil-telefono"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    aria-invalid={!!phoneError}
                    value={telefono}
                    onChange={handlePhoneChange}
                    placeholder="3001234567"
                    className={`w-full rounded-xl pl-12 pr-4 py-2.5 text-xs font-mono font-bold tracking-wider focus:outline-none border ${
                      phoneError 
                        ? 'border-rose-500 bg-rose-500/5 text-rose-500' 
                        : telefono.length === 10
                          ? 'border-emerald-500/80'
                          : isLight ? 'border-slate-300' : 'border-slate-700'
                    } ${isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'}`}
                  />
                  {telefono.length === 10 && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                {phoneError ? <FieldError msg={phoneError} /> : (
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Celular de 10 números que empieza por 3 (ej. 3105556677). Déjalo vacío para quitarlo.
                  </p>
                )}
              </div>

              {/* Contraseña actual (necesaria solo para cambiarla) */}
              <div className="sm:col-span-2">
                <label htmlFor="perfil-pw-actual" className={`text-xs font-bold flex items-center gap-1.5 mb-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Contraseña actual
                </label>
                <input
                  id="perfil-pw-actual"
                  type={showPassword ? 'text' : 'password'}
                  maxLength={PASSWORD_MAX}
                  value={passwordActual}
                  onChange={(e) => { setPasswordActual(e.target.value); setFormError(''); }}
                  placeholder="Solo si vas a cambiar tu contraseña"
                  autoComplete="current-password"
                  aria-invalid={!!pwErrors.actual}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none border ${bordeCampo(pwErrors.actual, isLight)} ${
                    isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'
                  }`}
                />
                <FieldError msg={pwErrors.actual} />
              </div>

              {/* Nueva Contraseña */}
              <div>
                <label htmlFor="perfil-pw-nueva" className={`text-xs font-bold flex items-center gap-1.5 mb-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    id="perfil-pw-nueva"
                    type={showPassword ? 'text' : 'password'}
                    maxLength={PASSWORD_MAX}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFormError(''); }}
                    placeholder="Dejar en blanco para mantener la actual"
                    autoComplete="new-password"
                    aria-invalid={!!pwErrors.nueva}
                    className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono focus:outline-none border ${bordeCampo(pwErrors.nueva, isLight)} ${
                      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseñas' : 'Ver contraseñas'}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <FieldError msg={pwErrors.nueva} />
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label htmlFor="perfil-pw-confirmar" className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    id="perfil-pw-confirmar"
                    type={showPassword ? 'text' : 'password'}
                    maxLength={PASSWORD_MAX}
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFormError(''); }}
                    placeholder="Repite la nueva contraseña"
                    autoComplete="new-password"
                    disabled={!password}
                    aria-invalid={!!pwErrors.confirmar}
                    className={`w-full rounded-xl pl-3.5 pr-9 py-2.5 text-xs font-mono focus:outline-none border disabled:opacity-50 disabled:cursor-not-allowed ${bordeCampo(pwErrors.confirmar, isLight)} ${
                      isLight ? 'bg-slate-50 text-slate-900' : 'bg-slate-900 text-white'
                    }`}
                  />
                  {password && confirmPassword && password === confirmPassword && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
                <FieldError msg={pwErrors.confirmar} />
              </div>
            </div>

            {quiereCambiarClave && (
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Requisitos: {PASSWORD_POLICY_HINT}
              </p>
            )}
          </div>

          {/* 3. SECCIÓN DE CAMPOS BLOQUEADOS / SÓLO LECTURA (NADA MÁS PERMITIDO) */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${
            isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-slate-900/70 border-slate-800'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isLight ? 'text-slate-600' : 'text-slate-400'
              }`}>
                <ShieldCheck className="w-4 h-4 text-slate-400" />
                3. Datos Oficiales Bloqueados por Gobernanza
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                Solo lectura
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Nombre y Apellido */}
              <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Nombres y Apellidos Oficiales
                </span>
                <span className="font-extrabold block mt-0.5">
                  {currentUser.nombre} {currentUser.apellido}
                </span>
              </div>

              {/* Correo */}
              <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Correo Electrónico Institucional
                </span>
                <span className="font-bold font-mono block mt-0.5 truncate text-emerald-500">
                  {currentUser.email}
                </span>
              </div>

              {/* Documento */}
              <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cédula / Documento de Identidad
                </span>
                <span className="font-bold font-mono block mt-0.5">
                  {currentUser.documentId || 'No registrado'}
                </span>
              </div>

              {/* Cargo & Sede */}
              <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cargo Asignado & Sede
                </span>
                <span className="font-bold block mt-0.5">
                  {currentUser.rol.rol}{currentUser.city ? ` • ${currentUser.city}` : ''}
                </span>
              </div>
            </div>

            <p className={`text-[10px] mt-3 leading-relaxed ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Por políticas de seguridad corporativa de ColorLink, las modificaciones a nombre, identificación, cargo y sede de trabajo deben ser solicitadas formalmente ante el área de Recursos Humanos / Administración.
            </p>
          </div>

          {/* Footer Actions */}
          <div className={`pt-4 border-t flex items-center justify-end gap-3 ${
            isLight ? 'border-slate-200' : 'border-slate-800'
          }`}>
            <button
              type="button"
              onClick={cerrar}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={saving || hayErrores || !hayCambios}
              title={!hayCambios ? 'No hay cambios para guardar' : undefined}
              className="px-6 py-2.5 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Guardando…' : 'Guardar Cambios de Perfil'}</span>
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
};
