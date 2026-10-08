import React from 'react';

interface State { error: Error | null }

/** Evita la pantalla en blanco: si un módulo falla al dibujarse, muestra el error y deja recargar. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ERP] error de interfaz:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="min-h-screen bg-[#050C18] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#0b172a] border border-slate-700 rounded-2xl p-6 space-y-3">
          <h1 className="text-lg font-bold">Algo salió mal en esta pantalla</h1>
          <p className="text-sm text-slate-300">Recarga la página. Si vuelve a pasar, envía este mensaje a soporte:</p>
          <pre className="text-xs bg-black/40 border border-slate-800 rounded-lg p-3 overflow-auto text-rose-300 whitespace-pre-wrap">{this.state.error.message}</pre>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm rounded-lg cursor-pointer">
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
