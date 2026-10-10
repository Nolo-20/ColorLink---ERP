import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { ModalBackdrop, FieldError } from './ui';
import { limpiarLetras, soloDigitos, errorNombrePersona, normalizarTexto } from '../validation';

const RECIBE_MIN = 3;
const RECIBE_MAX = 80;
const DOC_MIN = 6;
const DOC_MAX = 12;
import { Proyecto } from '../types/database';
import { 
  FileText, 
  X, 
  Printer, 
  CheckCircle2, 
  Truck, 
  ShieldCheck
} from 'lucide-react';

interface Props {
  proyecto: Proyecto;
  onClose: () => void;
}

export const PickupReceiptModal: React.FC<Props> = ({ proyecto, onClose }) => {
  const { confirmarEntrega, currentUser } = useApp();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [recibidoPor, setRecibidoPor] = React.useState(limpiarLetras(proyecto.despacho?.recibidoPor || '', RECIBE_MAX));
  const [docRecibe, setDocRecibe] = React.useState(soloDigitos(proyecto.despacho?.documentoRecibe || '', DOC_MAX));
  const [saving, setSaving] = React.useState(false);
  const [touched, setTouched] = React.useState<{ nombre?: boolean; doc?: boolean }>({});

  const errNombre = errorNombrePersona(recibidoPor, 'El nombre de quien recibe', RECIBE_MIN, RECIBE_MAX);
  const errDoc = docRecibe && (docRecibe.length < DOC_MIN || docRecibe.length > DOC_MAX)
    ? `El documento debe tener entre ${DOC_MIN} y ${DOC_MAX} números.` : '';
  const invalido = !!(errNombre || errDoc);
  const cerrar = () => { if (!saving) onClose(); };

  const latestQuote = proyecto.cotizaciones && proyecto.cotizaciones[0];
  const isDelivered = !!proyecto.despacho?.fechaEntrega;
  const d = proyecto.despacho;
  const fmtFecha = (v?: string) => {
    if (!v) return '—';
    const t = new Date(v);
    return isNaN(t.getTime()) ? '—' : t.toLocaleDateString('es-CO');
  };
  const dash = (v?: string | number | null) => (v == null || v === '' ? '—' : v);

  const handleConfirmSignature = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    if (invalido) { setTouched({ nombre: true, doc: true }); return; }
    setSaving(true);
    try {
      await confirmarEntrega(proyecto.proyectoId, normalizarTexto(recibidoPor), docRecibe);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <ModalBackdrop onClose={cerrar} bloqueado={saving} label="Remisión de despacho">
      <div className="bg-[#0b172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-4 sm:p-6 shadow-2xl relative text-white">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800" data-no-print>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Remisión Oficial de Despacho & Recibo</h3>
              <span className="text-[11px] font-mono text-emerald-400">
                Guía: {d?.numeroGuia || 'Pendiente de despacho'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!d}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={d ? 'Imprimir remisión' : 'El proyecto aún no tiene despacho para imprimir'}
              aria-label="Imprimir remisión"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={cerrar}
              aria-label="Cerrar"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div ref={receiptRef} data-printable className="overflow-y-auto space-y-5 my-4 pr-1 flex-1 bg-slate-900/60 p-5 rounded-xl border border-slate-800 text-xs">
          
          {/* Header Document */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F2C417] flex items-center justify-center text-slate-950 font-black shadow-md">
                CL
              </div>
              <div>
                <span className="font-black text-sm tracking-tight text-white block">
                  COLORLINK S.A.S.
                </span>
                <span className="text-[10px] text-slate-400 block">
                  Remisión de despacho a obra
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                REMISIÓN TÉCNICA DE DESPACHO
              </span>
              <span className="text-lg font-black font-mono text-emerald-400 block">
                {d?.numeroGuia || '—'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Salida: {fmtFecha(d?.horaSalida)}
              </span>
            </div>
          </div>

          {/* Client & Destination Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">
                Datos de la Constructora / Obra
              </span>
              <p className="font-bold text-white text-xs">{dash(proyecto.empresa?.razonSocial)}</p>
              <p className="text-slate-300">NIT: {dash(proyecto.empresa?.nitCedula)}</p>
              <p className="text-slate-300">Obra: <strong className="text-emerald-300">{proyecto.nombreProyecto}</strong></p>
              <p className="text-slate-300">Dirección: {dash(d?.direccionEntrega || proyecto.empresa?.direccionDespacho)}</p>
              <p className="text-slate-300">Municipio: {dash(d?.ciudadEntrega || proyecto.empresa?.ciudad?.ciudad)}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">
                Datos del Transporte y Flota
              </span>
              <p className="text-slate-300">Transportador: <strong>{dash(d?.transportador)}</strong></p>
              <p className="text-slate-300">Placa Vehículo: <strong className="font-mono text-amber-400">{dash(d?.placaVehiculo)}</strong></p>
              <p className="text-slate-300">Conductor: {dash(d?.conductorNombre)}</p>
              <p className="text-slate-300">Teléfono: {dash(d?.conductorTelefono)}</p>
              <p className="text-slate-300">Estado: <strong className="text-emerald-400 uppercase">{d ? d.estadoDespacho : 'Sin despachar'}</strong></p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
              Desglose de Recubrimientos & Envases
            </span>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                    <th className="p-2.5">Producto & Especificación</th>
                    <th className="p-2.5">Color Tinturado</th>
                    <th className="p-2.5 text-center">Cuñetes (5G)</th>
                    <th className="p-2.5 text-center">Galones (1G)</th>
                    <th className="p-2.5 text-right">Volumen Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/50">
                  <tr>
                    <td className="p-2.5 font-medium text-white">
                      Recubrimiento Arquitectónico Homologado
                      {(proyecto.ambiente || proyecto.tipoSuperficie) && (
                        <span className="block text-[10px] text-slate-400">
                          {[proyecto.ambiente, proyecto.tipoSuperficie].filter(Boolean).join(' • ')}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <span 
                          className="w-3 h-3 rounded-full border border-white/20 inline-block"
                          style={{ backgroundColor: proyecto.colorHex || '#CBD5E1' }}
                        />
                        <span>{proyecto.color || '—'}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-400 text-sm">
                      {latestQuote?.cunetes5g ?? '—'}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-sky-400 text-sm">
                      {latestQuote?.galones1g ?? '—'}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-white">
                      {latestQuote?.galonesExactos != null ? `${latestQuote.galonesExactos} Gal` : '—'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {!latestQuote && (
            <p className="text-[11px] text-amber-300">Este proyecto no tiene cotización registrada: las cantidades no están disponibles.</p>
          )}

          {/* Dictamen de calidad (solo si existe) */}
          {proyecto.diagnostico?.aprobadoCalidad != null && (
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Dictamen de calidad: {proyecto.diagnostico.aprobadoCalidad ? 'aprobado' : 'no aprobado'}
                {proyecto.diagnostico.peritoNombre ? ` por ${proyecto.diagnostico.peritoNombre}` : ''}
                {proyecto.diagnostico.humedadRelativa != null ? ` • Humedad del sustrato: ${proyecto.diagnostico.humedadRelativa}%` : ''}
              </span>
            </div>
          )}

          {/* Receiver Sign / Delivery Form */}
          {!isDelivered ? (
            <form onSubmit={handleConfirmSignature} noValidate data-no-print data-testid="delivery-form" className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirmación de Recibo en Terreno / Firma Digital</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Al confirmar, se dará por entregado el pedido en obra, actualizando el pipeline y registrando la remisión legalmente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="recibe-nombre" className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nombre de quien recibe en obra *
                  </label>
                  <input
                    id="recibe-nombre"
                    type="text"
                    autoComplete="off"
                    maxLength={RECIBE_MAX}
                    placeholder="Ej: Carlos Gómez"
                    value={recibidoPor}
                    onChange={(e) => setRecibidoPor(limpiarLetras(e.target.value, RECIBE_MAX))}
                    onBlur={() => setTouched(t => ({ ...t, nombre: true }))}
                    aria-invalid={!!(touched.nombre && errNombre)}
                    className={`w-full bg-slate-900 border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none ${
                      touched.nombre && errNombre ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  <FieldError msg={touched.nombre ? errNombre : ''} />
                </div>

                <div>
                  <label htmlFor="recibe-doc" className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Cédula de quien recibe (opcional)
                  </label>
                  <input
                    id="recibe-doc"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={DOC_MAX}
                    placeholder="Solo números"
                    value={docRecibe}
                    onChange={(e) => setDocRecibe(soloDigitos(e.target.value, DOC_MAX))}
                    onBlur={() => setTouched(t => ({ ...t, doc: true }))}
                    aria-invalid={!!(touched.doc && errDoc)}
                    className={`w-full bg-slate-900 border rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none ${
                      touched.doc && errDoc ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'
                    }`}
                  />
                  <FieldError msg={touched.doc ? errDoc : ''} />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !d || invalido}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                {saving ? 'Confirmando…' : 'Confirmar Entrega en Obra'}
              </button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block">ENTREGA COMPLETADA A CONFORMIDAD</span>
                  <span className="text-[11px] text-slate-300">
                    Recibido por: <strong>{dash(d?.recibidoPor)}</strong>{d?.documentoRecibe ? ` (Doc: ${d.documentoRecibe})` : ''}
                  </span>
                </div>
              </div>
              <span className="font-mono text-emerald-400 text-[11px]">
                {fmtFecha(d?.fechaEntrega)}
              </span>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-2 text-right" data-no-print>
          <button
            type="button"
            onClick={cerrar}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Cerrar Vista de Remisión
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
};
