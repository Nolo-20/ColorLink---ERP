import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ColorLinkLogo } from './ColorLinkLogo';
import { 
  User, 
  Eye, 
  EyeOff, 
  Key, 
  AlertCircle,
  Building2,
  ShieldCheck,
  X
} from 'lucide-react';

// Representative company images of ColorLink: paint manufacturing, tintometry lab, architectural application
const REPRESENTATIVE_COMPANY_IMAGES = [
  {
    url: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
    alt: 'Acabados y recubrimientos arquitectónicos de alta calidad ColorLink',
  },
  {
    url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Aplicación profesional de recubrimientos en obras y fachadas',
  },
  {
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    alt: 'Paleta y formulación cromática arquitectónica ColorLink',
  },
  {
    url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=1200&q=80',
    alt: 'Laboratorio de tintometría y control técnico de color',
  },
  {
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    alt: 'Formulación y alistamiento de recubrimientos industriales',
  }
];

export const ModernLoginScreen: React.FC = () => {
  const { 
    loginWithEmailPassword
  } = useApp();

  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [forgotPasswordNotice, setForgotPasswordNotice] = useState(false);

  // Representative company image that changes every time someone visits the page
  const [representativeImage] = useState(() => {
    const randomIndex = Math.floor(Math.random() * REPRESENTATIVE_COMPANY_IMAGES.length);
    return REPRESENTATIVE_COMPANY_IMAGES[randomIndex];
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setErrorMessage(null);

    if (!emailInput.trim()) {
      setErrorMessage('Por favor ingresa tu correo electrónico corporativo.');
      return;
    }
    if (!passwordInput.trim()) {
      setErrorMessage('Por favor ingresa tu contraseña.');
      return;
    }

    setSubmitting(true);
    const res = await loginWithEmailPassword(emailInput, passwordInput);
    setSubmitting(false);
    if (!res.success) {
      // La contraseña se conserva para poder verla con el ojo y corregirla
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#050C18] text-white flex flex-col justify-between overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[480px] h-[480px] bg-sky-600/10 rounded-full blur-[160px] pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] pointer-events-none" 
      />

      {/* Main Content Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 md:py-16 flex-1 flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center w-full">
          
          {/* Left Column: Fixed Authentic Logo & Clean Representative Image */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Fixed Authentic ColorLink Logo */}
            <div>
              <ColorLinkLogo size="lg" theme="dark" showSubtitle={true} />
            </div>

            {/* Clean Internal ERP Title */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" />
                Portal de Gestión Interna • Colaboradores
              </div>
              
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.15] text-white">
                Bienvenido a la Gestión Interna
              </h1>

              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl font-normal">
                Plataforma unificada para colaboradores y personal operativo. Gestión de inventarios, pedidos con retiro en sucursal y trazabilidad de proyectos.
              </p>
            </div>

            {/* Representative company image that changes each visit (no text overlays) */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-800/80 bg-slate-900 max-w-lg aspect-[16/10]">
              <img 
                src={representativeImage.url} 
                alt={representativeImage.alt} 
                className="w-full h-full object-cover object-center filter brightness-95 contrast-105 transition-all duration-700"
              />
            </div>
          </div>

          {/* Right Column: Clean Login Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end">
            <div className="w-full max-w-md bg-[#091526]/95 border border-slate-800/90 rounded-3xl p-7 md:p-9 shadow-2xl backdrop-blur-xl relative space-y-6">
              
              {/* Header Icon + Title */}
              <div className="text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <User className="w-7 h-7" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-white tracking-wide uppercase">
                    INICIA SESIÓN
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Portal de Gestión Interna para Colaboradores
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Direct Email and Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    placeholder="tu-correo@empresa.com"
                    autoComplete="username"
                    className="w-full bg-[#050C18] border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                {/* Password Field with Eye Toggle */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      autoComplete="current-password"
                      className="w-full bg-[#050C18] border border-slate-700/80 rounded-xl pl-4 pr-11 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      onMouseDown={(e) => e.preventDefault()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
                      title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      aria-pressed={showPassword}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-[#F2C417] hover:bg-[#C99A0A] disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/25 cursor-pointer"
                  >
                    {submitting ? 'INGRESANDO…' : 'INGRESAR'}
                  </button>
                </div>
              </form>

              {/* Forgot password link */}
              <div className="text-center pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setForgotPasswordNotice(true)}
                  className="text-xs text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-slate-800/60 py-5 px-6 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-7xl mx-auto">
        <p>Copyright 2026 © COLORLINK S.A.S. • Control Interno & Auditoría Operacional</p>
        <span className="text-[11px] text-slate-500 font-mono">Medellín • Valle de Aburrá, Colombia</span>
      </footer>

      {/* FORGOT PASSWORD DIALOG */}
      {forgotPasswordNotice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b172a] border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl text-white space-y-4">
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Recuperación de Contraseña
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Por políticas de seguridad interna de ColorLink, para restablecer tus credenciales debes pedirle al <strong>Administrador</strong> que te asigne una contraseña temporal desde el módulo <em>Gestión de Empleados</em>. Después podrás cambiarla en <em>Mi Perfil</em>.
            </p>
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs space-y-1 font-mono text-slate-300">
              <p>Mesa de Ayuda: soporte@colorlink.co</p>
              <p>Extensión Interna: 101 - Sede Guayabal</p>
            </div>
            <button
              onClick={() => setForgotPasswordNotice(false)}
              className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

