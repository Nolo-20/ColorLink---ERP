import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Proyecto } from '../types/database';
import { 
  FileText, 
  X, 
  Printer, 
  CheckCircle2, 
  Truck, 
  MapPin, 
  Building2, 
  ShieldCheck, 
  QrCode 
} from 'lucide-react';

interface Props {
  proyecto: Proyecto;
  onClose: () => void;
}

export const PickupReceiptModal: React.FC<Props> = ({ proyecto, onClose }) => {
  const { confirmarEntrega, currentUser } = useApp();
  const receiptRef = useRef<HTMLDivElement>(null);

  const [recibidoPor, setRecibidoPor] = React.useState(
    proyecto.despacho?.recibidoPor || 'Residente de Obra / Interventor'
  );
  const [docRecibe, setDocRecibe] = React.useState(
    proyecto.despacho?.documentoRecibe || 'CC 1.037.892.401'
  );

  const latestQuote = proyecto.cotizaciones && proyecto.cotizaciones[0];
  const isDelivered = proyecto.estadoPipeline === 'entregado';

  const handleConfirmSignature = (e: React.FormEvent) => {
    e.preventDefault();
    confirmarEntrega(proyecto.proyectoId, recibidoPor, docRecibe);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b172a] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col p-6 shadow-2xl relative text-white">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Remisión Oficial de Despacho & Recibo</h3>
              <span className="text-[11px] font-mono text-emerald-400">
                Guía: {proyecto.despacho?.numeroGuia || 'CL-DSP-2026-PENDIENTE'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Imprimir Remisión"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div ref={receiptRef} className="overflow-y-auto space-y-5 my-4 pr-1 flex-1 bg-slate-900/60 p-5 rounded-xl border border-slate-800 text-xs">
          
          {/* Header Document */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00D285] flex items-center justify-center text-slate-950 font-black shadow-md">
                CL
              </div>
              <div>
                <span className="font-black text-sm tracking-tight text-white block">
                  COLORLINK S.A.S.
                </span>
                <span className="text-[10px] text-slate-400 block">
                  NIT: 901.442.890-4 • Valle de Aburrá, Colombia
                </span>
                <span className="text-[10px] text-slate-400">
                  PBX: (+57 4) 444 2026 • logistica@colorlink.co
                </span>
              </div>
            </div>

            <div className="text-right sm:text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-bold">
                REMISIÓN TÉCNICA DE DESPACHO
              </span>
              <span className="text-lg font-black font-mono text-emerald-400 block">
                {proyecto.despacho?.numeroGuia || 'CL-DSP-2026-0891'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Fecha: {new Date().toLocaleDateString('es-CO')}
              </span>
            </div>
          </div>

          {/* Client & Destination Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/80 p-3.5 rounded-lg border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">
                Datos de la Constructora / Obra
              </span>
              <p className="font-bold text-white text-xs">{proyecto.empresa?.razonSocial}</p>
              <p className="text-slate-300">NIT: {proyecto.empresa?.nitCedula}</p>
              <p className="text-slate-300">Obra: <strong className="text-emerald-300">{proyecto.nombreProyecto}</strong></p>
              <p className="text-slate-300">Dirección: {proyecto.empresa?.direccionDespacho}</p>
              <p className="text-slate-300">Municipio: {proyecto.empresa?.ciudad?.ciudad || 'Medellín'}</p>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold mb-1">
                Datos del Transporte y Flota
              </span>
              <p className="text-slate-300">Transportador: <strong>{proyecto.despacho?.transportador || 'ColorLink Express'}</strong></p>
              <p className="text-slate-300">Placa Vehículo: <strong className="font-mono text-amber-400">{proyecto.despacho?.placaVehiculo || 'WLC-492'}</strong></p>
              <p className="text-slate-300">Conductor: {proyecto.despacho?.conductorNombre || 'Hernán Darío Cadavid'}</p>
              <p className="text-slate-300">Teléfono: {proyecto.despacho?.conductorTelefono || '+57 313 602 1199'}</p>
              <p className="text-slate-300">Estado: <strong className="text-emerald-400 uppercase">{proyecto.despacho?.estadoDespacho || 'En Ruta'}</strong></p>
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
                      <span className="block text-[10px] text-slate-400">{proyecto.ambiente} • {proyecto.tipoSuperficie}</span>
                    </td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5 font-medium text-slate-200">
                        <span 
                          className="w-3 h-3 rounded-full border border-white/20 inline-block"
                          style={{ backgroundColor: proyecto.colorHex || '#CBD5E1' }}
                        />
                        <span>{proyecto.color}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-emerald-400 text-sm">
                      {latestQuote?.cunetes5g ?? 15}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-sky-400 text-sm">
                      {latestQuote?.galones1g ?? 2}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-white">
                      {latestQuote?.galonesExactos ?? 77} Gal
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quality & Security Disclaimer */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                Producto revisado bajo norma NTC 1335. Sustrato verificado por perito: Humedad {proyecto.diagnostico?.humedadRelativa || '8.2'}%.
              </span>
            </div>
            <div className="flex items-center gap-1 font-mono text-emerald-400">
              <QrCode className="w-4 h-4" />
              <span>QR-VERIFIED</span>
            </div>
          </div>

          {/* Receiver Sign / Delivery Form */}
          {!isDelivered ? (
            <form onSubmit={handleConfirmSignature} className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Confirmación de Recibo en Terreno / Firma Digital</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Al confirmar, se dará por entregado el pedido en obra, actualizando el pipeline y registrando la remisión legalmente.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Nombre de quien recibe en obra
                  </label>
                  <input
                    type="text"
                    required
                    value={recibidoPor}
                    onChange={(e) => setRecibidoPor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    Cédula / Documento de Identidad
                  </label>
                  <input
                    type="text"
                    required
                    value={docRecibe}
                    onChange={(e) => setDocRecibe(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar Entrega en Obra y Emitir Remisión
              </button>
            </form>
          ) : (
            <div className="p-4 bg-emerald-950/60 border border-emerald-500/60 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block">ENTREGA COMPLETADA A CONFORMIDAD</span>
                  <span className="text-[11px] text-slate-300">
                    Recibido por: <strong>{proyecto.despacho?.recibidoPor}</strong> (Doc: {proyecto.despacho?.documentoRecibe})
                  </span>
                </div>
              </div>
              <span className="font-mono text-emerald-400 text-[11px]">
                {proyecto.despacho?.fechaEntrega ? new Date(proyecto.despacho.fechaEntrega).toLocaleDateString('es-CO') : 'Firmado'}
              </span>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Cerrar Vista de Remisión
          </button>
        </div>
      </div>
    </div>
  );
};
