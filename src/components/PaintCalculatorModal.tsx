import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calculator, X } from 'lucide-react';
import { ModalBackdrop, FieldError } from './ui';
import { limpiarDecimal, aNumero, errorRango, AREA_MAX_M2, MANOS_MIN, MANOS_MAX } from '../validation';

export const PaintCalculatorModal: React.FC = () => {
  const { calculatorModalOpen, setCalculatorModalOpen, productos } = useApp();

  const [area, setArea] = useState<string>('500');
  const [manos, setManos] = useState<number>(2);
  // Se elige la LÍNEA de producto (nombre); sus presentaciones Cuñete/Galón dan los precios reales
  const [lineaNombre, setLineaNombre] = useState<string>('');
  const [desperdicioPct, setDesperdicioPct] = useState<number>(6);

  if (!calculatorModalOpen) return null;
  const cerrar = () => setCalculatorModalOpen(false);

  const lineas = Array.from(new Set(productos.map(p => p.nombre))).sort((a, b) => a.localeCompare(b, 'es'));
  const nombreActivo = lineas.includes(lineaNombre) ? lineaNombre : lineas[0];
  const familia = productos.filter(p => p.nombre === nombreActivo);
  const selectedProd = familia.find(p => p.rendimientoM2 && p.rendimientoM2 > 0) || familia[0];

  // El catálogo llega del servidor: si aún no carga o está vacío, no hay nada que calcular
  if (!selectedProd) {
    return (
      <ModalBackdrop onClose={cerrar} label="Calculadora de cuñetes">
        <div className="bg-[#0b172a] border border-slate-700 rounded-2xl w-full max-w-sm p-6 text-white text-sm">
          <p className="mb-4 text-slate-300">El catálogo de productos aún no está disponible. Inténtalo de nuevo en unos segundos.</p>
          <button type="button" onClick={cerrar} className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg cursor-pointer">Cerrar</button>
        </div>
      </ModalBackdrop>
    );
  }

  const rendimientoM2 = selectedProd.rendimientoM2 && selectedProd.rendimientoM2 > 0 ? selectedProd.rendimientoM2 : null;

  // Misma fórmula que el servidor (/api/projects/:id/quote)
  const errArea = errorRango(area, 'El área', { min: 1, max: AREA_MAX_M2, unidad: 'm²' });
  const areaValida = errArea ? 0 : (aNumero(area) as number);
  const galonesConDesperdicio = rendimientoM2
    ? Number((((areaValida * manos) / rendimientoM2) * (1 + desperdicioPct / 100)).toFixed(1))
    : 0;
  const cunetes5g = Math.floor(galonesConDesperdicio / 5);
  const residuo = galonesConDesperdicio - (cunetes5g * 5);
  const galones1g = residuo > 0.0001 ? Math.ceil(residuo) : 0;

  // Precios del catálogo real: cada presentación con su precio; si falta una, se deriva como lo hace el servidor (factor 4.6)
  const cuneteProd = familia.find(p => p.presentacion?.includes('Cuñete'));
  const galonProd = familia.find(p => p.presentacion?.includes('Galón'));
  const precioGalon = galonProd?.precio ?? (cuneteProd?.precio ? cuneteProd.precio / 4.6 : selectedProd.precio);
  const precioCunete = cuneteProd?.precio ?? (galonProd?.precio ? galonProd.precio * 4.6 : selectedProd.precio);
  const totalEstimado = precioGalon && precioCunete
    ? Math.round((cunetes5g * precioCunete) + (galones1g * precioGalon))
    : null;

  return (
    <ModalBackdrop onClose={cerrar} label="Calculadora de cuñetes">
      <div className="bg-[#0b172a] border border-slate-700 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative text-white my-auto">
        <button
          type="button"
          onClick={cerrar}
          aria-label="Cerrar"
          className="absolute top-4 right-4 text-slate-400 hover:text-white cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
          <Calculator className="w-5 h-5" />
          <h3 className="font-bold text-lg text-white">Calculadora Técnica de Cuñetes</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Estimado rápido de cuñetes y galones con el rendimiento y los precios del catálogo. No guarda nada.
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <label htmlFor="calc-area" className="block text-slate-300 font-semibold mb-1">
              Área de Superficie (m²)
            </label>
            <input
              id="calc-area"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={area}
              onChange={(e) => setArea(limpiarDecimal(e.target.value, 2, 6))}
              aria-invalid={!!errArea}
              className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-white font-mono focus:outline-none ${errArea ? 'border-rose-500' : 'border-slate-700 focus:border-emerald-500'}`}
            />
            <FieldError msg={errArea} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Número de Manos
              </label>
              <select
                value={manos}
                onChange={(e) => setManos(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                {Array.from({ length: MANOS_MAX - MANOS_MIN + 1 }, (_, i) => MANOS_MIN + i).map(n => (
                  <option key={n} value={n}>{n === 1 ? '1 Mano' : `${n} Manos`}{n === 2 ? ' (Recomendado)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Margen Desperdicio Obra
              </label>
              <select
                value={desperdicioPct}
                onChange={(e) => setDesperdicioPct(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value={5}>5% (Aplicación experta)</option>
                <option value={6}>6% (Estándar)</option>
                <option value={10}>10% (Sustrato muy rugoso)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Línea de Recubrimiento ColorLink
            </label>
            <select
              value={nombreActivo}
              onChange={(e) => setLineaNombre(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {lineas.map(nombre => {
                const r = productos.find(p => p.nombre === nombre && p.rendimientoM2)?.rendimientoM2;
                return (
                  <option key={nombre} value={nombre}>
                    {nombre} ({r ? `${r} m²/gal` : 'sin rendimiento'})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Results Box */}
          {errArea ? null : !rendimientoM2 ? (
            <div className="bg-slate-900 border border-amber-500/40 rounded-xl p-4 text-amber-300">
              Esta línea no tiene rendimiento (m²/galón) configurado en el catálogo; no se puede calcular por área.
            </div>
          ) : (
          <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-4 space-y-3">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Despiece Óptimo para Pedido
            </span>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Cuñetes (5 Galones)</span>
                <span className="text-2xl font-black text-emerald-400 font-mono">{cunetes5g}</span>
                <span className="text-[10px] text-slate-500 block">{cunetes5g * 5} galones</span>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Galones (1 Galón)</span>
                <span className="text-2xl font-black text-sky-400 font-mono">{galones1g}</span>
                <span className="text-[10px] text-slate-500 block">{galones1g} galón suelto</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-300">Total Volumen Necesario:</span>
              <span className="font-bold text-white font-mono">{galonesConDesperdicio} Galones</span>
            </div>

            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-emerald-400">Presupuesto Estimado:</span>
              <span className="text-emerald-400 font-mono text-sm">
                {totalEstimado != null ? `$${totalEstimado.toLocaleString('es-CO')} COP` : 'Sin precio en catálogo'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Precio de lista antes de IVA y descuentos. Para guardar una cotización usa el módulo Proyectos.</p>
          </div>
          )}

          <div className="pt-2">
            <button
              type="button"
              onClick={cerrar}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </ModalBackdrop>
  );
};
