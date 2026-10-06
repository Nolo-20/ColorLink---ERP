import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  X, 
  CheckCircle2, 
  UserCheck, 
  Truck, 
  FileText, 
  Layers, 
  Droplets, 
  QrCode, 
  ArrowRight,
  Info,
  Package
} from 'lucide-react';

interface Props {
  onClose?: () => void;
}

export const RolePermissionGuideModal: React.FC<Props> = ({ onClose }) => {
  const { theme } = useApp();
  const isLight = theme === 'light';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className={`border rounded-3xl p-6 md:p-8 relative overflow-hidden transition-all ${
        isLight
          ? 'bg-white border-slate-200 text-slate-900 shadow-sm'
          : 'bg-gradient-to-r from-[#0b1c2e] via-[#0e243b] to-[#091524] border-slate-800 text-white shadow-2xl'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Matriz de Control y Gobernanza Operativa
            </div>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
              Roles y Permisos en Estados de Pedidos y Proyectos
            </h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Guía oficial que especifica con exactitud qué rol tiene autorización para hacer la transición de cada estado, asegurando trazabilidad total en el ERP ColorLink.
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border transition-colors self-start md:self-auto cursor-pointer ${
                isLight 
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: ESTADOS DE PEDIDOS DE TIENDA ONLINE / SUCURSAL */}
      <div className={`border rounded-3xl p-6 transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
      } space-y-4`}>
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-500 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-extrabold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>1. Flujo y Estados de Pedidos de Tienda (E-Commerce)</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Modalidades: Envío a Domicilio o Recogida en Sucursal con Código/QR</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
            isLight ? 'bg-sky-50 text-sky-700 border-sky-200' : 'bg-sky-950 text-sky-300 border-sky-500/40'
          }`}>
            5 ESTADOS CLAVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          
          {/* 1. Comprado */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>ESTADO 1</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300'
              }`}>INICIAL</span>
            </div>
            <h4 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>Comprado & Confirmado</h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Pago verificado mediante PSE, tarjeta de crédito o crédito comercial.
            </p>
            <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
              <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>¿Quién lo activa?</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">👤 Cliente en Tienda Web</span>
            </div>
          </div>

          {/* 2. En Alistamiento */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-mono font-bold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>ESTADO 2</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                isLight ? 'bg-blue-100 text-blue-700' : 'bg-blue-950 text-blue-300'
              }`}>BODEGA</span>
            </div>
            <h4 className={`font-bold text-xs ${isLight ? 'text-slate-900' : 'text-white'}`}>En Alistamiento</h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
              Separación física de latas, galones y rodillos en bodega central Guayabal.
            </p>
            <div className={`pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800/80'}`}>
              <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>¿Quién lo activa?</span>
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400">📦 Jefe de Despachos / Bodega</span>
            </div>
          </div>

          {/* 3. Listo para Retiro en Sucursal */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isLight ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-950/80 border-amber-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-500">ESTADO 3 (Sucursal)</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                isLight ? 'bg-amber-200 text-amber-900' : 'bg-amber-950 text-amber-300'
              }`}>CÓDIGO QR</span>
            </div>
            <h4 className={`font-bold text-xs ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>Listo en Sucursal</h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              El producto está en mostrador y el cliente recibe su código de canje (ej. RET-8421).
            </p>
            <div className={`pt-2 border-t ${isLight ? 'border-amber-200' : 'border-slate-800/80'}`}>
              <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>¿Quién lo activa?</span>
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">🏢 Jefe de Bodega / Logística</span>
            </div>
          </div>

          {/* 4. En Ruta Domicilio */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isLight ? 'bg-orange-50/70 border-orange-300' : 'bg-slate-950/80 border-orange-500/40'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-orange-600 dark:text-orange-500">ESTADO 3 (Domicilio)</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                isLight ? 'bg-orange-200 text-orange-900' : 'bg-orange-950 text-orange-300'
              }`}>EN RUTA</span>
            </div>
            <h4 className={`font-bold text-xs ${isLight ? 'text-orange-900' : 'text-orange-300'}`}>En Ruta Domicilio</h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
              Cargado en camión de la Flota ColorLink con guía y placa asignada.
            </p>
            <div className={`pt-2 border-t ${isLight ? 'border-orange-200' : 'border-slate-800/80'}`}>
              <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>¿Quién lo activa?</span>
              <span className="text-xs font-bold text-orange-700 dark:text-orange-400">🚛 Jefe de Despachos</span>
            </div>
          </div>

          {/* 5. Entregado / Canjeado */}
          <div className={`border rounded-2xl p-4 space-y-2 ${
            isLight ? 'bg-emerald-50/70 border-emerald-300' : 'bg-emerald-950/30 border-emerald-500/50'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">FINALIZACIÓN</span>
              <span className="px-2 py-0.5 rounded bg-[#00D285] text-slate-950 font-bold text-[9px]">ENTREGADO</span>
            </div>
            <h4 className={`font-bold text-xs ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>Entregado / Recogido</h4>
            <p className={`text-[11px] ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              En sucursal: se valida código/QR y se entrega producto. En domicilio: entrega con firma.
            </p>
            <div className={`pt-2 border-t ${isLight ? 'border-emerald-200' : 'border-slate-800/80'}`}>
              <span className={`text-[10px] uppercase tracking-wider block font-bold ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>¿Quién lo activa?</span>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">🏪 Cajero de Sucursal o Conductor</span>
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 2: ESTADOS DE PROYECTOS Y GESTIÓN DE ASESORES */}
      <div className={`border rounded-3xl p-6 transition-all ${
        isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#091526] border-slate-800 shadow-xl'
      } space-y-4`}>
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-extrabold text-base ${isLight ? 'text-slate-900' : 'text-white'}`}>2. Flujo y Estados de Proyectos de Obra</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>Asignación automática de asesor comercial, dictamen de calidad y tintometría</p>
            </div>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
            isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
          }`}>
            8 HITOS AUDITABLES
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className={`font-bold uppercase text-[10px] border-b ${
                isLight ? 'bg-slate-100 text-slate-700 border-slate-200' : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}>
                <th className="py-3 px-4">Hito / Estado del Pipeline</th>
                <th className="py-3 px-4">Descripción del Proceso</th>
                <th className="py-3 px-4">Rol con Permiso de Aprobación</th>
                <th className="py-3 px-4">Gestión de Asesores</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? 'divide-slate-200' : 'divide-slate-800/80'}`}>
              <tr className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/50'}>
                <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  1. Diagnóstico Inicial (Capturado)
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Registro del área en m², fotos de la fachada/muro y sustrato (ladrillo, drywall, concreto).
                </td>
                <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  Cliente Contratista o Asesor
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                    isLight ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                  }`}>
                    ✓ Asignación Automática a Asesor
                  </span>
                </td>
              </tr>

              <tr className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/50'}>
                <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isLight ? 'text-indigo-900' : 'text-indigo-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-indigo-500" />
                  2. Cotización Técnica (Validado)
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Cálculo volumétrico en Cuñetes (5 Gal) y Galones (1 Gal) aplicando rendimiento y descuento de asesor (0-15%).
                </td>
                <td className="py-3 px-4 font-bold text-indigo-600 dark:text-indigo-400">
                  Asesor Comercial
                </td>
                <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Puede ser escalado a Asesor Senior
                </td>
              </tr>

              <tr className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/50'}>
                <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isLight ? 'text-amber-900' : 'text-amber-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  3. Revisión de Calidad (Peritaje)
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Ensayo higrométrico de humedad (&lt;12%), severidad de fisuras y homologación de sistema según norma NTC-1335.
                </td>
                <td className="py-3 px-4 font-bold text-amber-600 dark:text-amber-400">
                  Perito de Calidad (Exclusivo)
                </td>
                <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Emite veredicto técnico obligatorio
                </td>
              </tr>

              <tr className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/50'}>
                <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isLight ? 'text-emerald-900' : 'text-emerald-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  4. Aprobado Comercial
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Orden de compra formalizada y aprobación comercial por la constructora.
                </td>
                <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  Cliente Contratista / Asesor
                </td>
                <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Firma de contrato de suministro
                </td>
              </tr>

              <tr className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/50'}>
                <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isLight ? 'text-cyan-900' : 'text-cyan-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  5. Tintometría Lab
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Dispensado computarizado por espectrofotometría, dosificación de pigmentos y asignación de Lote.
                </td>
                <td className="py-3 px-4 font-bold text-cyan-600 dark:text-cyan-400">
                  Jefe de Despachos / Laboratorista
                </td>
                <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Verificación de Delta E &lt; 0.3
                </td>
              </tr>

              <tr className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/50'}>
                <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isLight ? 'text-blue-900' : 'text-blue-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  6. Alistamiento en Bodega
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Embalaje de cuñetes y galones en Bodega Guayabal, Itagüí o Bello.
                </td>
                <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400">
                  Jefe de Despachos / Almacén
                </td>
                <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Etiquetado de obra
                </td>
              </tr>

              <tr className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/50'}>
                <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isLight ? 'text-orange-900' : 'text-orange-300'}`}>
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  7. En Ruta Despacho
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Asignación de vehículo, conductor, placa y tiempo estimado de tránsito en el Valle de Aburrá.
                </td>
                <td className="py-3 px-4 font-bold text-orange-600 dark:text-orange-400">
                  Jefe de Despachos
                </td>
                <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Emisión de Hoja de Ruta
                </td>
              </tr>

              <tr className={isLight ? 'hover:bg-slate-50/70' : 'hover:bg-slate-900/50'}>
                <td className={`py-3 px-4 font-bold flex items-center gap-2 ${isLight ? 'text-emerald-900' : 'text-emerald-200'}`}>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  8. Entregado en Obra
                </td>
                <td className={`py-3 px-4 ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                  Recepción física de cuñetes en obra por el residente o interventor con remisión firmada.
                </td>
                <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                  Transportador & Residente de Obra
                </td>
                <td className={`py-3 px-4 text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Cierre de ciclo del proyecto
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

