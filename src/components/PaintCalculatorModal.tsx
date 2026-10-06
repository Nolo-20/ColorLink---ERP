import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Calculator, X, Layers, Droplets, CheckCircle2 } from 'lucide-react';

export const PaintCalculatorModal: React.FC = () => {
  const { calculatorModalOpen, setCalculatorModalOpen, productos } = useApp();

  const [area, setArea] = useState<number>(500);
  const [manos, setManos] = useState<number>(2);
  const [productoId, setProductoId] = useState<string>(productos[0].productoId);
  const [desperdicioPct, setDesperdicioPct] = useState<number>(6);

  if (!calculatorModalOpen) return null;

  const selectedProd = productos.find(p => p.productoId === productoId) || productos[0];
  const rendimientoM2 = selectedProd.rendimientoM2 || 45;

  // Formula
  const totalM2Manos = area * manos;
  const galonesTeoricos = totalM2Manos / rendimientoM2;
  const galonesConDesperdicio = Number((galonesTeoricos * (1 + desperdicioPct / 100)).toFixed(1));
  const cunetes5g = Math.floor(galonesConDesperdicio / 5);
  const residuo = galonesConDesperdicio - (cunetes5g * 5);
  const galones1g = residuo > 0 ? Math.ceil(residuo) : 0;

  const precioCunete = selectedProd.presentacion?.includes('Cuñete') ? (selectedProd.precio || 365000) : 365000;
  const precioGalon = 78000;
  const totalEstimado = (cunetes5g * precioCunete) + (galones1g * precioGalon);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0b172a] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative text-white">
        <button
          onClick={() => setCalculatorModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-emerald-400 mb-2">
          <Calculator className="w-5 h-5" />
          <h3 className="font-bold text-lg text-white">Calculadora Técnica de Cuñetes</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Dosificación volumétrica de recubrimientos para constructoras y obras en el Valle de Aburrá.
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Área de Superficie (m²)
            </label>
            <input
              type="number"
              min={10}
              step={10}
              value={area}
              onChange={(e) => setArea(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-500"
            />
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
                <option value={1}>1 Mano</option>
                <option value={2}>2 Manos (Recomendado)</option>
                <option value={3}>3 Manos</option>
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
              value={productoId}
              onChange={(e) => setProductoId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {productos.map(p => (
                <option key={p.productoId} value={p.productoId}>
                  {p.nombre} ({p.rendimientoM2} m²/gal)
                </option>
              ))}
            </select>
          </div>

          {/* Results Box */}
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
              <span className="text-emerald-400 font-mono text-sm">${totalEstimado.toLocaleString('es-CO')} COP</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => setCalculatorModalOpen(false)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Aplicar al Proyecto
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
