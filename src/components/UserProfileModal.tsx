import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
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
  Sparkles
} from 'lucide-react';

// Preset professional avatars for quick selection
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=250&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=250&q=80',
];

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
  
  // Validation errors
  const [phoneError, setPhoneError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');

  // Sync with currentUser when modal opens
  useEffect(() => {
    if (currentUser && profileModalOpen) {
      setPhotoUrl(currentUser.avatarUrl || '');
      // Clean phone number: keep only 10 digits
      const cleanPhone = (currentUser.telefono || '').replace(/\D/g, '').slice(-10);
      setTelefono(cleanPhone);
      setPasswordActual('');
      setPassword('');
      setConfirmPassword('');
      setPhoneError('');
      setPasswordError('');
      setSuccessNotice('');
      setShowCustomUrlInput(false);
    }
  }, [currentUser, profileModalOpen]);

  if (!profileModalOpen || !currentUser) return null;

  // Handle phone input: strictly numbers, max 10 digits
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 10);
    setTelefono(rawVal);
    if (rawVal.length > 0 && rawVal.length !== 10) {
      setPhoneError('El teléfono debe tener exactamente 10 números (ej. 3001234567)');
    } else {
      setPhoneError('');
    }
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG o WebP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      alert('La imagen no debe superar los 3 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setPhotoUrl(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate Phone: exactly 10 digits if filled
    if (telefono.trim().length > 0 && telefono.trim().length !== 10) {
      setPhoneError('El número de teléfono debe contener exactamente 10 números.');
      return;
    }

    // 2. Validate Password: if user wants to change it
    if (password.length > 0) {
      if (!passwordActual) {
        setPasswordError('Escribe tu contraseña actual para poder cambiarla.');
        return;
      }
      if (password.length < 8) {
        setPasswordError('La nueva contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (password.length > 20) {
        setPasswordError('La nueva contraseña no debe superar los 20 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError('La confirmación de la contraseña no coincide.');
        return;
      }
    }

    // Prepare update payload
    const payload: { fotoUrl?: string; telefono?: string; passwordActual?: string; password?: string } = {
      fotoUrl: photoUrl || currentUser.avatarUrl,
      telefono: telefono.length === 10 ? `+57 ${telefono}` : currentUser.telefono,
    };

    if (password.length >= 8) {
      payload.password = password;
      payload.passwordActual = passwordActual;
    }

    const res = await actualizarPerfilUsuario(payload);
    if (!res.success) {
      setPasswordError(res.message);
      return;
    }
    setSuccessNotice('¡Perfil actualizado con éxito!');
    setTimeout(() => {
      setProfileModalOpen(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
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
            onClick={() => setProfileModalOpen(false)}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
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
                    accept="image/*"
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
                    onClick={() => setShowCustomUrlInput(!showCustomUrlInput)}
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
                  <div className="flex items-center gap-2 pt-1 animate-fadeIn">
                    <input
                      type="url"
                      placeholder="https://ejemplo.com/mifoto.jpg"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className={`flex-1 text-xs px-3 py-1.5 rounded-xl border focus:outline-none focus:border-emerald-500 ${
                        isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-slate-900 border-slate-700 text-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customUrl.trim()) {
                          setPhotoUrl(customUrl.trim());
                          setShowCustomUrlInput(false);
                        }
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer"
                    >
                      Aplicar
                    </button>
                  </div>
                )}

                {/* Avatar presets gallery */}
                <div>
                  <span className={`text-[10px] font-semibold block mb-1.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    O elige un avatar profesional oficial:
                  </span>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    {PRESET_AVATARS.map((url, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(url)}
                        className={`w-8 h-8 rounded-lg overflow-hidden border-2 transition-transform hover:scale-110 cursor-pointer ${
                          photoUrl === url ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-transparent opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt={`Avatar ${idx}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
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
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
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
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
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
                {phoneError ? (
                  <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {phoneError}
                  </p>
                ) : (
                  <p className={`text-[10px] mt-1 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Solo números permitidos • Longitud exacta: 10 dígitos (ej. 3105556677)
                  </p>
                )}
              </div>

              {/* Contraseña actual (necesaria solo para cambiarla) */}
              <div>
                <label className={`text-xs font-bold flex items-center gap-1.5 mb-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                  Contraseña Actual
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordActual}
                  onChange={(e) => { setPasswordActual(e.target.value); setPasswordError(''); }}
                  placeholder="Solo si vas a cambiar tu contraseña"
                  autoComplete="current-password"
                  className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none border ${
                    isLight ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-slate-700 bg-slate-900 text-white'
                  }`}
                />
              </div>

              {/* Nueva Contraseña */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    Nueva Contraseña
                  </label>
                  {password.length > 0 && (
                    <span className={`text-[10px] font-mono ${password.length >= 8 ? 'text-emerald-500 font-bold' : 'text-amber-400'}`}>
                      {password.length}/20 car.
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    maxLength={20}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Dejar en blanco para mantener actual"
                    className={`w-full rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-mono focus:outline-none border ${
                      passwordError ? 'border-rose-500' : isLight ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-slate-700 bg-slate-900 text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Nueva Contraseña */}
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    maxLength={20}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setPasswordError('');
                    }}
                    placeholder="Repite la nueva contraseña"
                    disabled={!password}
                    className={`w-full rounded-xl pl-3.5 pr-4 py-2.5 text-xs font-mono focus:outline-none border ${
                      !password 
                        ? 'opacity-50 cursor-not-allowed border-slate-700/50' 
                        : password && confirmPassword && password === confirmPassword
                          ? 'border-emerald-500 bg-emerald-500/5'
                          : isLight ? 'border-slate-300 bg-slate-50 text-slate-900' : 'border-slate-700 bg-slate-900 text-white'
                    }`}
                  />
                  {password && confirmPassword && password === confirmPassword && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>
            </div>

            {passwordError && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {passwordError}
              </p>
            )}

            {password.length > 0 && (
              <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Requisitos: Mínimo 8 caracteres, máximo 20 caracteres con números o caracteres especiales.
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
                🔒 Solo Lectura
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
                  {currentUser.documentId || 'CC 1.037.000.000'}
                </span>
              </div>

              {/* Cargo & Sede */}
              <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-white border-slate-200' : 'bg-slate-950/60 border-slate-800/80'}`}>
                <span className={`text-[10px] font-semibold block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cargo Asignado & Sede
                </span>
                <span className="font-bold block mt-0.5">
                  {currentUser.rol.rol} • {currentUser.city || 'Medellín'}
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
              onClick={() => setProfileModalOpen(false)}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-[#00D285] hover:bg-[#00c078] text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Guardar Cambios de Perfil</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
