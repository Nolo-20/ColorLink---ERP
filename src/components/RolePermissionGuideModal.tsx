import React from 'react';
import { useApp } from '../context/AppContext';
import { ESTADO_PROYECTO_LABEL, ESTADO_PEDIDO_LABEL } from '../estados';
import { EstadoPipeline, EstadoPedido } from '../types/database';
import { ShieldCheck, X } from 'lucide-react';

interface Props {
  onClose?: () => void;
}

interface Fila {
  estado: string;
  descripcion: string;
  quien: string;
}

const PROYECTOS: { key: EstadoPipeline; descripcion: string; quien: string }[] = [
  { key: 'en_revision', descripcion: 'El cliente envió su solicitud desde la tienda; el equipo comercial la revisa.', quien: 'Automático al crear el proyecto • Asesor / Administrador' },
  { key: 'imagen_por_corregir', descripcion: 'La imagen no sirve; se avisa al cliente por correo y en su cuenta para que suba otra.', quien: 'Asesor / Perito / Administrador' },
  { key: 'en_peritaje', descripcion: 'El perito verifica humedad, fisuras y adherencia.', quien: 'Asesor / Administrador' },
  { key: 'cotizado', descripcion: 'El asesor calculó cuñetes y galones con el catálogo real y aplicó descuento.', quien: 'Asesor / Administrador' },
  { key: 'aprobado_calidad', descripcion: 'El perito dictaminó que el sistema es viable. Queda listo para despacho.', quien: 'Perito de Calidad / Administrador' },
  { key: 'rechazado', descripcion: 'El perito pidió ajustes técnicos antes de continuar.', quien: 'Perito de Calidad / Administrador' },
  { key: 'despachado', descripcion: 'Salió el vehículo con guía, conductor y placa. La entrega en obra se confirma con la remisión firmada.', quien: 'Jefe de Despachos / Administrador' },
  { key: 'cancelado', descripcion: 'Proyecto cerrado sin despacho.', quien: 'Asesor / Administrador' },
];

const PEDIDOS: { key: EstadoPedido; descripcion: string; quien: string }[] = [
  { key: 'comprado_confirmado', descripcion: 'Pedido confirmado en la tienda.', quien: 'Automático al comprar' },
  { key: 'en_alistamiento', descripcion: 'Se prepara el pedido en bodega.', quien: 'Jefe de Despachos / Administrador' },
  { key: 'listo_sucursal', descripcion: 'Listo para que el cliente lo recoja con su QR o código.', quien: 'Jefe de Despachos / Administrador' },
  { key: 'en_ruta_domicilio', descripcion: 'El pedido va en camino al domicilio.', quien: 'Jefe de Despachos / Administrador' },
  { key: 'entregado_recogido', descripcion: 'Entregado en domicilio, o canjeado en tienda con el escáner de retiro (también lo puede hacer un Asesor).', quien: 'Jefe de Despachos / Administrador' },
  { key: 'cancelado', descripcion: 'Pedido cancelado.', quien: 'Jefe de Despachos / Administrador' },
];

const ROLES: { nombre: string; modulos: string }[] = [
  { nombre: 'Administrador', modulos: 'Todos los módulos, empleados y reasignaciones.' },
  { nombre: 'Asesor Comercial', modulos: 'Proyectos y cotizaciones, consulta de pedidos, canje de retiro en tienda y escalamiento de proyectos.' },
  { nombre: 'Perito de Calidad', modulos: 'Cola de peritaje y dictamen técnico; puede pedir cambio de imagen.' },
  { nombre: 'Jefe de Despachos', modulos: 'Despachos de proyectos aprobados, remisiones y entrega; gestión de pedidos y retiro en tienda.' },
];

export const RolePermissionGuideModal: React.FC<Props> = ({ onClose }) => {
  const { theme } = useApp();
  const isLight = theme === 'light';
  const card = isLight ? 'bg-white border-slate-200 text-slate-900 shadow-sm' : 'bg-[#091526] border-slate-800 text-white';
  const muted = isLight ? 'text-slate-600' : 'text-slate-300';

  const tabla = (titulo: string, filas: Fila[]) => (
    <div className={`border rounded-3xl overflow-hidden ${card}`}>
      <div className={`px-5 py-4 border-b font-bold ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>{titulo}</div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className={isLight ? 'bg-slate-50 text-slate-500' : 'bg-slate-900/70 text-slate-400'}>
            <tr>
              <th className="py-3 px-4">Estado</th>
              <th className="py-3 px-4">Qué significa</th>
              <th className="py-3 px-4">Quién lo puede hacer</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${isLight ? 'divide-slate-100' : 'divide-slate-800/70'}`}>
            {filas.map(f => (
              <tr key={f.estado}>
                <td className="py-3 px-4 font-bold whitespace-nowrap">{f.estado}</td>
                <td className={`py-3 px-4 ${muted}`}>{f.descripcion}</td>
                <td className="py-3 px-4 font-semibold text-emerald-500">{f.quien}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className={`border rounded-3xl p-6 md:p-8 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-500 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              Matriz de Control y Gobernanza Operativa
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Roles y Permisos en Pedidos y Proyectos</h2>
            <p className={`text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed ${muted}`}>
              Quién puede mover cada estado. El servidor valida estos permisos, y cada cambio de un proyecto queda en su historial con nombre y rol de quien lo hizo.
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-xl border self-start md:self-auto cursor-pointer ${
                isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ROLES.map(r => (
          <div key={r.nombre} className={`border rounded-2xl p-4 ${card}`}>
            <div className="text-sm font-bold text-emerald-500">{r.nombre}</div>
            <p className={`text-xs mt-1 leading-relaxed ${muted}`}>{r.modulos}</p>
          </div>
        ))}
      </div>

      {tabla('Estados de un proyecto', PROYECTOS.map(p => ({ estado: ESTADO_PROYECTO_LABEL[p.key], descripcion: p.descripcion, quien: p.quien })))}
      {tabla('Estados de un pedido de la tienda', PEDIDOS.map(p => ({ estado: ESTADO_PEDIDO_LABEL[p.key], descripcion: p.descripcion, quien: p.quien })))}
    </div>
  );
};
