import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  UserPlus, 
  X, 
  ArrowRight, 
  Building2, 
  UserCheck, 
  History, 
  AlertTriangle, 
  Send 
} from 'lucide-react';

export const EscalateAdvisorModal: React.FC = () => {
  const { 
    escalateModalOpen, 
    setEscalateModalOpen, 
    projectToEscalate, 
    usuarios, 
    escalarAsesorProyecto, 
    currentUser 
  } = useApp();

  // El backend solo acepta como destino usuarios activos con rol "asesor"
  const currentAdvisor = projectToEscalate?.asesorAsignado || null;
  const advisors = usuarios.filter(u => u.rol.rol === 'Asesor Comercial' && u.activo !== false);
  const candidates = advisors.filter(a => a.usuarioId !== currentAdvisor?.usuarioId);

  const [selectedAdvisorId, setSelectedAdvisorId] = useState('');
  const [motivo, setMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Cada vez que se abre (o llegan los usuarios del servidor) se elige un asesor válido
  useEffect(() => {
    if (!escalateModalOpen) return;
    setError('');
    setSelectedAdvisorId(prev => (candidates.some(c => c.usuarioId === prev) ? prev : candidates[0]?.usuarioId || ''));
  }, [escalateModalOpen, projectToEscalate?.proyectoId, usuarios]);

  useEffect(() => {
    if (escalateModalOpen) { setMotivo(''); setSaving(false); }
  }, [escalateModalOpen, projectToEscalate?.proyectoId]);

  if (!escalateModalOpen || !projectToEscalate) return null;

  const targetAdvisor = usuarios.find(u => u.usuarioId === selectedAdvisorId);
  const proyectoCerrado = ['despachado', 'cancelado'].includes(projectToEscalate.estadoPipeline);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (proyectoCerrado) { setError('Este proyecto ya está cerrado y no se puede reasignar.'); return; }
    if (!selectedAdvisorId) { setError('No hay otro asesor comercial activo para recibir el proyecto.'); return; }
    if (motivo.trim().length < 5) { setError('Escribe el motivo del escalamiento.'); return; }
    setError('');
    setSaving(true);
    const ok = await escalarAsesorProyecto(projectToEscalate.proyectoId, selectedAdvisorId, motivo.trim());
    setSaving(false);
    if (!ok) setError('El servidor no aceptó la reasignación. Revisa el aviso e inténtalo de nuevo.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b172a] border border-slate-700 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col p-6 shadow-2xl relative text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Escalamiento & Reasignación de Asesor</h3>
              <p className="text-xs text-slate-400">
                Transfiere la gestión del proyecto a otro asesor comercial o líder de obra.
              </p>
            </div>
          </div>

          <button
            onClick={() => setEscalateModalOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto space-y-4 my-4 pr-1 flex-1 text-xs">
          
          {/* Project Summary */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-2">
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
              Proyecto a Escalar
            </span>
            <h4 className="text-sm font-extrabold text-white">{projectToEscalate.nombreProyecto}</h4>
            <div className="flex flex-wrap items-center gap-3 text-slate-300">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {projectToEscalate.empresa?.razonSocial}
              </span>
              <span>•</span>
              <span className="font-mono text-emerald-400">{projectToEscalate.area} m²</span>
              <span>•</span>
              <span className="text-slate-400">{projectToEscalate.ambiente}</span>
            </div>
          </div>

          {/* Current Advisor vs Target Advisor preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Asesor Actual
              </span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                  {currentAdvisor?.avatarUrl && (
                    <img src={currentAdvisor.avatarUrl} alt={currentAdvisor.nombre} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-white block text-xs">
                    {currentAdvisor ? `${currentAdvisor.nombre} ${currentAdvisor.apellido || ''}` : 'Sin asesor asignado'}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-medium">
                    {currentAdvisor?.rol?.rol}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/40">
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block mb-1">
                Nuevo Asesor Seleccionado
              </span>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-800 overflow-hidden border border-emerald-500/50">
                  {targetAdvisor?.avatarUrl && (
                    <img src={targetAdvisor.avatarUrl} alt={targetAdvisor.nombre} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <span className="font-bold text-white block text-xs">
                    {targetAdvisor ? `${targetAdvisor.nombre} ${targetAdvisor.apellido || ''}` : '—'}
                  </span>
                  <span className="text-[10px] text-emerald-300 font-medium">
                    {targetAdvisor?.rol.rol}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* New Advisor Select */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Seleccionar Nuevo Asesor Comercial
            </label>
            {candidates.length === 0 ? (
              <p className="text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3.5 py-2.5">
                No hay otro asesor comercial activo. Crea uno en Gestión de Empleados para poder escalar.
              </p>
            ) : (
              <select
                value={selectedAdvisorId}
                onChange={(e) => setSelectedAdvisorId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-medium"
              >
                {candidates.map(adv => (
                  <option key={adv.usuarioId} value={adv.usuarioId}>
                    {adv.nombre} {adv.apellido} ({adv.rol.rol})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Reason for escalation */}
          <div>
            <label className="block text-slate-300 font-bold mb-1.5">
              Motivo del Escalamiento / Justificación
            </label>
            <textarea
              rows={3}
              required
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              minLength={5}
              maxLength={500}
              placeholder="Detalla por qué se transfiere el proyecto (ej. sobrecarga, solicitud de asesor senior, especialidad en epóxicos)..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Previous Escalation History if any */}
          {projectToEscalate.historialAsesores && projectToEscalate.historialAsesores.length > 0 && (
            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-amber-400" />
                Historial de Asignaciones Previas
              </span>
              <div className="space-y-1.5">
                {projectToEscalate.historialAsesores.map((h, i) => (
                  <div key={i} className="text-[11px] text-slate-300 flex justify-between">
                    <span>
                      <strong className="text-white">{h.asesorNombre}</strong> — {h.motivo || 'Asignación'}
                    </span>
                    <span className="font-mono text-slate-500">
                      {new Date(h.fechaAsignacion).toLocaleDateString('es-CO')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="text-red-300 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5 font-semibold">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={() => setEscalateModalOpen(false)}
              className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || candidates.length === 0 || proyectoCerrado}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{saving ? 'Escalando…' : 'Confirmar Escalamiento'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
