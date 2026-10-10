import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Usuario,
  Proyecto,
  InventarioProducto,
  Producto,
  EmpresaCliente,
  EstadoPipeline,
  DiagnosticoIA,
  DespachoInfo,
  Cotizacion,
  UserRole,
  PedidoTienda,
  EstadoPedido,
  Ciudad,
} from '../types/database';
import { api, ApiError } from '../api';
import {
  mapSessionUser,
  mapUsuario,
  mapProyecto,
  mapPedido,
  mapProducto,
  mapInventario,
  estadoPedidoToApi,
  ROLE_TO_API,
  STAFF_ROLES_API,
} from '../mappers';

export type TabType =
  | 'inicio'
  | 'pipeline'
  | 'proyectos'
  | 'calidad'
  | 'inventarios'
  | 'despachos'
  | 'reportes'
  | 'pedidos'
  | 'canje_sucursal'
  | 'colaboradores'
  | 'roles_permisos';

/** Qué módulos ve cada rol. Lo que cada uno puede *hacer* lo decide el backend; esto solo ordena el menú. */
export const ROLE_PERMISSIONS: Record<UserRole, TabType[]> = {
  'Administrador': [
    'inicio', 'proyectos', 'pedidos', 'canje_sucursal', 'pipeline', 'calidad',
    'inventarios', 'despachos', 'colaboradores', 'reportes', 'roles_permisos',
  ],
  'Asesor Comercial': ['inicio', 'proyectos', 'pedidos', 'pipeline', 'reportes', 'roles_permisos'],
  'Perito de Calidad': ['inicio', 'calidad', 'pipeline', 'roles_permisos'],
  'Jefe de Despachos': ['inicio', 'despachos', 'canje_sucursal', 'pedidos', 'inventarios', 'pipeline', 'roles_permisos'],
  'Cliente Contratista': [],
};

/** Acciones que solo puede hacer cada rol (el backend las valida; la interfaz las oculta). */
export const canRole = {
  gestionarPedidos: (r?: UserRole) => r === 'Administrador' || r === 'Jefe de Despachos',
  canjearRetiro: (r?: UserRole) => r === 'Administrador' || r === 'Jefe de Despachos' || r === 'Asesor Comercial',
  editarProyecto: (r?: UserRole) => r === 'Administrador' || r === 'Asesor Comercial',
  emitirVeredicto: (r?: UserRole) => r === 'Administrador' || r === 'Perito de Calidad',
  despachar: (r?: UserRole) => r === 'Administrador' || r === 'Jefe de Despachos',
  editarInventario: (r?: UserRole) => r === 'Administrador',
  gestionarEmpleados: (r?: UserRole) => r === 'Administrador',
};

export interface ResultadoCanje {
  success: boolean;
  pedido?: PedidoTienda;
  message: string;
}

interface AppContextType {
  currentUser: Usuario | null;
  authLoading: boolean;
  usuarios: Usuario[];
  proyectos: Proyecto[];
  inventarios: InventarioProducto[];
  productos: Producto[];
  empresas: EmpresaCliente[];
  ciudades: Ciudad[];
  pedidos: PedidoTienda[];
  dataLoading: boolean;
  refreshData: () => Promise<void>;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasModuleAccess: (tab: TabType, role?: UserRole) => boolean;
  selectedProyecto: Proyecto | null;
  setSelectedProyecto: (p: Proyecto | null) => void;
  selectedPedido: PedidoTienda | null;
  setSelectedPedido: (p: PedidoTienda | null) => void;

  // Modals
  calculatorModalOpen: boolean;
  setCalculatorModalOpen: (v: boolean) => void;
  pickupModalOpen: boolean;
  setPickupModalOpen: (v: boolean) => void;
  historyModalOpen: boolean;
  setHistoryModalOpen: (v: boolean) => void;
  escalateModalOpen: boolean;
  setEscalateModalOpen: (v: boolean) => void;
  projectToEscalate: Proyecto | null;
  setProjectToEscalate: (p: Proyecto | null) => void;
  redeemModalOpen: boolean;
  setRedeemModalOpen: (v: boolean) => void;
  userManagementModalOpen: boolean;
  setUserManagementModalOpen: (v: boolean) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (v: boolean) => void;

  // Theme & Search
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Sesión
  loginWithEmailPassword: (email: string, pass: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;

  // Proyectos
  cambiarEstadoProyecto: (proyectoId: string, nuevoEstado: EstadoPipeline, notas?: string) => Promise<boolean>;
  guardarDiagnosticoCalidad: (proyectoId: string, diagnostico: Partial<DiagnosticoIA>) => Promise<boolean>;
  calcularYGuardarCotizacion: (
    proyectoId: string, area: number, manos: number, productoId: string, descuentoPct: number,
  ) => Promise<Cotizacion | null>;
  escalarAsesorProyecto: (
    proyectoId: string, nuevoUsuarioId: string, motivo: string, role?: 'asesor' | 'calidad',
  ) => Promise<boolean>;
  solicitarCambioImagen: (proyectoId: string, motivo: string) => Promise<boolean>;
  obtenerImagenProyecto: (proyectoId: string) => Promise<string | null>;
  despacharProyecto: (proyectoId: string, despacho: Partial<DespachoInfo>) => Promise<boolean>;
  confirmarEntrega: (proyectoId: string, recibidoPor: string, docRecibe: string) => Promise<boolean>;

  // Inventario
  actualizarStockInventario: (inventarioId: string, cantidad: number) => Promise<boolean>;
  agregarEntradaInventario: (entrada: {
    productoId: string;
    ciudadId: number;
    nombreBodega: string;
    numeroLote?: string;
    cantidadDisponible: number;
    tiempoDespacho?: number;
  }) => Promise<InventarioProducto | null>;

  // Empleados
  crearUsuario: (nuevo: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    rolNombre: UserRole;
    password: string;
    documentId?: string;
    company?: string;
    city?: string;
  }) => Promise<Usuario | null>;
  actualizarEmpleado: (
    id: string,
    datos: { nombre?: string; apellido?: string; telefono?: string; rolNombre?: UserRole; activo?: boolean; password?: string },
  ) => Promise<boolean>;
  actualizarPerfilUsuario: (datos: {
    fotoUrl?: string;
    telefono?: string;
    passwordActual?: string;
    password?: string;
  }) => Promise<{ success: boolean; message: string }>;

  // Pedidos
  cambiarEstadoPedido: (pedidoId: string, nuevoEstado: EstadoPedido, notas?: string) => Promise<boolean>;
  canjearCodigoRetiro: (codigo: string) => Promise<ResultadoCanje>;

  // Conversación con el cliente: mensajes del cliente sin leer por proyecto
  mensajesSinLeer: Record<string, number>;
  refreshMensajesSinLeer: () => Promise<void>;
  /** Pone en 0 el contador local de ese proyecto (el backend los marca leídos al abrir la conversación). */
  marcarConversacionLeida: (proyectoId: string) => void;

  toastMessage: string | null;
  toastKind: ToastKind;
  /** kind 'error' pinta el aviso en rojo; por defecto se infiere del texto ("No se pudo…" = error). */
  showToast: (msg: string, kind?: ToastKind) => void;
}

export type ToastKind = 'ok' | 'error';

const AppContext = createContext<AppContextType | undefined>(undefined);

const POLL_MS = 60_000;
const UNREAD_POLL_MS = 20_000;
const ROLES_CON_MENSAJES = ['administrador', 'asesor', 'calidad', 'despachos'];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [inventarios, setInventarios] = useState<InventarioProducto[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [ciudades, setCiudades] = useState<Ciudad[]>([]);
  const [pedidos, setPedidos] = useState<PedidoTienda[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [mensajesSinLeer, setMensajesSinLeer] = useState<Record<string, number>>({});

  const [selectedPedido, setSelectedPedido] = useState<PedidoTienda | null>(null);
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [activeTab, setActiveTabRaw] = useState<TabType>('inicio');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('colorlink_theme');
    return saved === 'light' || saved === 'dark' ? saved : 'dark';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [projectToEscalate, setProjectToEscalate] = useState<Proyecto | null>(null);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);
  const [userManagementModalOpen, setUserManagementModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastKind, setToastKind] = useState<ToastKind>('ok');
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string, kind?: ToastKind) => {
    const k: ToastKind = kind || (/^(no se pudo|no se encontr|error|tu sesión terminó|no tienes)/i.test(msg.trim()) ? 'error' : 'ok');
    setToastKind(k);
    setToastMessage(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), k === 'error' ? 7000 : 4500);
  }, []);

  // ------------------------------------------------------------ Tema
  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('colorlink_theme', next);
      return next;
    });
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  // ------------------------------------------------------------ Carga de datos reales
  const roleApi = currentUser ? ROLE_TO_API[currentUser.rol.rol] : undefined;

  /** Si el servidor dice 401, la sesión venció: se vuelve a la pantalla de ingreso. */
  const handleApiError = useCallback((err: unknown, fallback: string): string => {
    if (err instanceof ApiError) {
      if (err.status === 401) {
        setCurrentUser(null);
        return 'Tu sesión terminó. Vuelve a ingresar.';
      }
      return err.message || fallback;
    }
    return fallback;
  }, []);

  const loadProjects = useCallback(async (role: string) => {
    if (role === 'despachos') {
      const r = await api.getDispatchBoard();
      setProyectos((r.projects || []).map(mapProyecto));
    } else if (['administrador', 'asesor', 'calidad'].includes(role)) {
      const r = await api.getAllProjects();
      setProyectos((r.projects || []).map(mapProyecto));
    } else {
      setProyectos([]);
    }
  }, []);

  const loadOrders = useCallback(async (role: string): Promise<PedidoTienda[]> => {
    if (!['administrador', 'despachos', 'asesor'].includes(role)) {
      setPedidos([]);
      return [];
    }
    const r = await api.getAllOrders();
    const mapped: PedidoTienda[] = (r.orders || []).map(mapPedido);
    setPedidos(mapped);
    setSelectedPedido(prev => (prev ? mapped.find(p => p.ordenId === prev.ordenId) || prev : prev));
    return mapped;
  }, []);

  const loadInventory = useCallback(async () => {
    const r = await api.getInventory();
    setProductos((r.productos || []).map(mapProducto));
    setInventarios((r.stock || []).map(mapInventario));
  }, []);

  const loadCities = useCallback(async () => {
    const r = await api.getCities();
    setCiudades((r.cities || []).map((c: any) => ({ ciudadId: c.ciudadId, ciudad: c.ciudad })));
  }, []);

  const loadStaff = useCallback(async (role: string) => {
    if (role === 'administrador') {
      const r = await api.getEmployees();
      setUsuarios((r.employees || []).map(mapUsuario));
    } else if (role === 'asesor' || role === 'calidad') {
      const [a, c] = await Promise.all([api.getStaffByRole('asesor'), api.getStaffByRole('calidad')]);
      setUsuarios([...(a.users || []), ...(c.users || [])].map(mapUsuario));
    } else {
      setUsuarios([]);
    }
  }, []);

  const loadUnread = useCallback(async (role: string) => {
    if (!ROLES_CON_MENSAJES.includes(role)) {
      setMensajesSinLeer({});
      return;
    }
    const r = await api.getUnreadMessages();
    const next: Record<string, number> = {};
    (r.unread || []).forEach((u: any) => {
      const n = Number(u.sinLeer) || 0;
      if (u.proyectoId && n > 0) next[u.proyectoId] = n;
    });
    setMensajesSinLeer(next);
  }, []);

  const loadAll = useCallback(async (role: string, silent: boolean) => {
    if (!silent) setDataLoading(true);
    const results = await Promise.allSettled([
      loadProjects(role),
      loadOrders(role),
      loadInventory(),
      loadCities(),
      loadStaff(role),
      loadUnread(role),
    ]);
    if (!silent) setDataLoading(false);

    const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
    const expired = failed.find(f => f.reason instanceof ApiError && f.reason.status === 401);
    if (expired) {
      showToast(handleApiError(expired.reason, ''));
    } else if (failed.length > 0 && !silent) {
      showToast(handleApiError(failed[0].reason, 'No se pudieron cargar algunos datos del servidor.'));
    }
  }, [loadProjects, loadOrders, loadInventory, loadCities, loadStaff, loadUnread, handleApiError, showToast]);

  const refreshData = useCallback(async () => {
    if (roleApi) await loadAll(roleApi, false);
  }, [roleApi, loadAll]);

  // Restaurar la sesión al abrir el ERP (la cookie la pone el backend)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.getProfile();
        const user = mapSessionUser(r.user);
        if (!cancelled && STAFF_ROLES_API.includes(r.user.role)) setCurrentUser(user);
      } catch {
        /* sin sesión: se muestra el ingreso */
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Cargar datos al entrar y refrescar cada minuto mientras la pestaña esté visible
  useEffect(() => {
    if (!currentUser || !roleApi) return;
    loadAll(roleApi, false);
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') loadAll(roleApi, true);
    }, POLL_MS);
    const onFocus = () => loadAll(roleApi, true);
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [currentUser?.usuarioId, roleApi, loadAll]);

  // Sondeo liviano (solo contadores de mensajes) más frecuente que la recarga completa
  useEffect(() => {
    if (!currentUser || !roleApi || !ROLES_CON_MENSAJES.includes(roleApi)) return;
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadUnread(roleApi).catch(err => {
          if (err instanceof ApiError && err.status === 401) showToast(handleApiError(err, ''));
        });
      }
    }, UNREAD_POLL_MS);
    return () => clearInterval(id);
  }, [currentUser?.usuarioId, roleApi, loadUnread, handleApiError, showToast]);

  const refreshMensajesSinLeer = useCallback(async () => {
    if (!roleApi) return;
    try {
      await loadUnread(roleApi);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) showToast(handleApiError(err, ''));
    }
  }, [roleApi, loadUnread, handleApiError, showToast]);

  const marcarConversacionLeida = useCallback((proyectoId: string) => {
    setMensajesSinLeer(prev => {
      if (!prev[proyectoId]) return prev;
      const next = { ...prev };
      delete next[proyectoId];
      return next;
    });
  }, []);

  const hasModuleAccess = (tab: TabType, role?: UserRole): boolean => {
    const userRole = role || currentUser?.rol.rol;
    if (!userRole) return false;
    return (ROLE_PERMISSIONS[userRole] || []).includes(tab);
  };

  /** Solo deja abrir módulos que el rol tiene permitidos (búsqueda, accesos directos, etc.). */
  const setActiveTab = (tab: TabType) => {
    if (tab === 'inicio' || hasModuleAccess(tab)) {
      setActiveTabRaw(tab);
    } else {
      showToast('No tienes acceso a ese módulo con tu rol.', 'error');
    }
  };

  // ------------------------------------------------------------ Sesión
  const loginWithEmailPassword = async (email: string, password: string) => {
    try {
      const r = await api.login(email.trim(), password);
      if (!STAFF_ROLES_API.includes(r.user?.role)) {
        await api.logout().catch(() => undefined);
        return { success: false, message: 'Esta cuenta es de cliente. El ERP es solo para colaboradores de ColorLink.' };
      }
      setCurrentUser(mapSessionUser(r.user));
      setActiveTabRaw('inicio');
      showToast(`¡Bienvenido, ${r.user.firstName || r.user.name}!`);
      return { success: true, message: 'Inicio de sesión exitoso' };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo iniciar sesión.';
      return { success: false, message };
    }
  };

  const logout = async () => {
    try { await api.logout(); } catch { /* la cookie se borra igual al expirar */ }
    setCurrentUser(null);
    setSelectedProyecto(null);
    setSelectedPedido(null);
    setProyectos([]);
    setPedidos([]);
    setUsuarios([]);
    setMensajesSinLeer({});
    setActiveTabRaw('inicio');
    showToast('Sesión cerrada correctamente');
  };

  // ------------------------------------------------------------ Proyectos
  const upsertProyecto = useCallback((raw: any): Proyecto => {
    const p = mapProyecto(raw);
    setProyectos(prev => (prev.some(x => x.proyectoId === p.proyectoId)
      ? prev.map(x => (x.proyectoId === p.proyectoId ? p : x))
      : [p, ...prev]));
    setSelectedProyecto(prev => (prev?.proyectoId === p.proyectoId ? p : prev));
    return p;
  }, []);

  const solicitarCambioImagen = async (proyectoId: string, motivo: string) => {
    try {
      const r = await api.requestImageChange(proyectoId, motivo);
      upsertProyecto(r.project);
      showToast('Se avisó al cliente por correo para que cambie la imagen.');
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo solicitar el cambio de imagen.'));
      return false;
    }
  };

  const despacharProyecto = async (proyectoId: string, d: Partial<DespachoInfo>) => {
    try {
      const r = await api.dispatchProject(proyectoId, {
        numeroGuia: d.numeroGuia,
        transportador: d.transportador,
        placaVehiculo: d.placaVehiculo,
        conductorNombre: d.conductorNombre,
        conductorTelefono: d.conductorTelefono,
        bodegaOrigen: d.bodegaOrigen,
        direccionEntrega: d.direccionEntrega,
        ciudadEntrega: d.ciudadEntrega,
        tiempoEstimadoHoras: d.tiempoEstimadoHoras,
      });
      upsertProyecto(r.project);
      showToast('Despacho registrado: el material salió hacia la obra.');
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo registrar el despacho.'));
      return false;
    }
  };

  const cambiarEstadoProyecto = async (proyectoId: string, nuevoEstado: EstadoPipeline, notas?: string) => {
    // Estos estados tienen su propio flujo en el backend
    if (nuevoEstado === 'imagen_por_corregir') return solicitarCambioImagen(proyectoId, notas || '');
    if (nuevoEstado === 'despachado') return despacharProyecto(proyectoId, {});
    try {
      const r = await api.patchProject(proyectoId, { estadoPipeline: nuevoEstado, comentario: notas });
      upsertProyecto(r.project);
      showToast('Estado del proyecto actualizado.');
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo cambiar el estado del proyecto.'));
      return false;
    }
  };

  const guardarDiagnosticoCalidad = async (proyectoId: string, data: Partial<DiagnosticoIA>) => {
    try {
      const r = await api.qualityVerdict(proyectoId, {
        humedadRelativa: data.humedadRelativa,
        severidadFisuras: data.severidadFisuras,
        notasPerito: data.notasPerito,
        patologiaDetectada: data.patologiaDetectada,
        aprobadoCalidad: data.aprobadoCalidad,
        sistemaRecomendado: data.sistemaRecomendado,
      });
      upsertProyecto(r.project);
      showToast('Dictamen técnico de Calidad registrado.');
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo guardar el dictamen.'));
      return false;
    }
  };

  const calcularYGuardarCotizacion = async (
    proyectoId: string, area: number, manos: number, productoId: string, descuentoPct: number,
  ): Promise<Cotizacion | null> => {
    try {
      const r = await api.quoteProject(proyectoId, { productoId, area, manos, descuentoPct });
      const p = upsertProyecto(r.project);
      const cot = p.cotizaciones?.[0] || null;
      if (cot) showToast(`Cotización generada: ${cot.cunetes5g ?? 0} cuñetes y ${cot.galones1g ?? 0} galones.`);
      return cot;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo generar la cotización.'));
      return null;
    }
  };

  const escalarAsesorProyecto = async (
    proyectoId: string, nuevoUsuarioId: string, motivo: string, role: 'asesor' | 'calidad' = 'asesor',
  ) => {
    try {
      const r = await api.reassignProject(proyectoId, { role, nuevoUsuarioId, motivo });
      upsertProyecto(r.project);
      showToast(role === 'asesor' ? 'Proyecto reasignado al nuevo asesor.' : 'Proyecto enviado a peritaje.');
      setEscalateModalOpen(false);
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo reasignar el proyecto.'));
      return false;
    }
  };

  const confirmarEntrega = async (proyectoId: string, recibidoPor: string, docRecibe: string) => {
    try {
      const r = await api.confirmDelivery(proyectoId, { recibidoPor, documentoRecibe: docRecibe });
      upsertProyecto(r.project);
      showToast('Entrega en obra confirmada.');
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo confirmar la entrega.'));
      return false;
    }
  };

  const obtenerImagenProyecto = async (proyectoId: string): Promise<string | null> => {
    try {
      const r = await api.getProjectEvidence(proyectoId);
      return r.evidence?.imageDataUri || null;
    } catch {
      return null;
    }
  };

  // ------------------------------------------------------------ Inventario
  const actualizarStockInventario = async (inventarioId: string, cantidad: number) => {
    try {
      const r = await api.setStock(inventarioId, cantidad);
      const item = mapInventario(r.item);
      setInventarios(prev => prev.map(i => (i.inventarioId === item.inventarioId ? item : i)));
      showToast('Stock actualizado en bodega.');
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo actualizar el stock.'));
      return false;
    }
  };

  const agregarEntradaInventario: AppContextType['agregarEntradaInventario'] = async (entrada) => {
    try {
      const r = await api.createStockEntry(entrada);
      const item = mapInventario(r.item);
      setInventarios(prev => [item, ...prev]);
      showToast(`Entrada registrada: ${item.cantidadDisponible} unidades en ${item.nombreBodega}.`);
      return item;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo registrar la entrada.'));
      return null;
    }
  };

  // ------------------------------------------------------------ Empleados y perfil
  const crearUsuario: AppContextType['crearUsuario'] = async (nuevo) => {
    try {
      const r = await api.createEmployee({
        email: nuevo.email,
        nombre: nuevo.nombre,
        apellido: nuevo.apellido,
        telefono: nuevo.telefono,
        rol: ROLE_TO_API[nuevo.rolNombre],
        password: nuevo.password,
        documentId: nuevo.documentId,
        company: nuevo.company,
        city: nuevo.city,
      });
      const u = mapUsuario(r.employee);
      setUsuarios(prev => [u, ...prev]);
      showToast(`Empleado ${u.nombre} ${u.apellido} creado como ${u.rol.rol}.`);
      return u;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo crear el empleado.'));
      return null;
    }
  };

  const actualizarEmpleado: AppContextType['actualizarEmpleado'] = async (id, datos) => {
    try {
      const r = await api.updateEmployee(id, {
        nombre: datos.nombre,
        apellido: datos.apellido,
        telefono: datos.telefono,
        rol: datos.rolNombre ? ROLE_TO_API[datos.rolNombre] : undefined,
        activo: datos.activo,
        password: datos.password,
      });
      const u = mapUsuario(r.employee);
      setUsuarios(prev => prev.map(x => (x.usuarioId === u.usuarioId ? u : x)));
      showToast('Empleado actualizado.');
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo actualizar el empleado.'));
      return false;
    }
  };

  const actualizarPerfilUsuario: AppContextType['actualizarPerfilUsuario'] = async (datos) => {
    if (!currentUser) return { success: false, message: 'No hay usuario autenticado.' };
    let passwordCambiada = false;
    try {
      if (datos.password) {
        if (!datos.passwordActual) return { success: false, message: 'Escribe tu contraseña actual para cambiarla.' };
        await api.changePassword(datos.passwordActual, datos.password);
        passwordCambiada = true;
      }
      // Solo se envía lo que realmente cambió
      const cambios: { phone?: string; avatarUrl?: string } = {};
      if (datos.telefono !== undefined && datos.telefono !== (currentUser.telefono || '')) cambios.phone = datos.telefono;
      if (datos.fotoUrl !== undefined && datos.fotoUrl !== (currentUser.avatarUrl || '')) cambios.avatarUrl = datos.fotoUrl;
      if (Object.keys(cambios).length) {
        const r = await api.updateProfile(cambios);
        setCurrentUser(mapSessionUser(r.user));
      }
      showToast('Tu perfil fue actualizado.');
      return { success: true, message: 'Perfil actualizado exitosamente.' };
    } catch (err) {
      // El backend responde 401 también cuando la contraseña ACTUAL es incorrecta: eso no cierra la sesión
      const claveActualMala = err instanceof ApiError && err.status === 401 && !!datos.password && !passwordCambiada
        && /contraseña actual/i.test(err.message);
      if (claveActualMala) return { success: false, message: (err as ApiError).message };
      if (err instanceof ApiError && err.status === 401) return { success: false, message: handleApiError(err, '') };
      const motivo = err instanceof ApiError ? err.message : 'No se pudo actualizar el perfil.';
      return {
        success: false,
        message: passwordCambiada ? `Tu contraseña sí se cambió, pero la foto o el teléfono no: ${motivo}` : motivo,
      };
    }
  };

  // ------------------------------------------------------------ Pedidos
  const cambiarEstadoPedido = async (pedidoId: string, nuevoEstado: EstadoPedido, notas?: string) => {
    const pedido = pedidos.find(p => p.pedidoId === pedidoId);
    if (!pedido) {
      showToast('No se encontró el pedido. Actualiza la lista e inténtalo de nuevo.');
      return false;
    }
    try {
      await api.updateOrderStatus(pedido.ordenId, estadoPedidoToApi(nuevoEstado), notas);
      if (roleApi) await loadOrders(roleApi);
      showToast(`Pedido ${pedidoId} actualizado.`);
      return true;
    } catch (err) {
      showToast(handleApiError(err, 'No se pudo actualizar el pedido.'));
      return false;
    }
  };

  const canjearCodigoRetiro = async (codigo: string): Promise<ResultadoCanje> => {
    const clean = codigo.trim().replace(/\s+/g, '');
    if (!clean) return { success: false, message: 'Escribe o escanea el código de retiro.' };
    try {
      const r = await api.validatePickup(clean);
      // El canje ya quedó hecho; si recargar la lista falla no se debe reportar como error
      const lista = roleApi ? await loadOrders(roleApi).catch(() => pedidos) : [];
      const pedido = lista.find(p => p.ordenId === r.order?.ordenId);
      showToast(`¡Código canjeado! Pedido ${pedido?.pedidoId || ''} entregado.`.trim());
      return { success: true, pedido, message: '¡Canje exitoso! Entrega confirmada.' };
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'No se pudo validar el código.';
      if (err instanceof ApiError && err.status === 401) handleApiError(err, '');
      return { success: false, message };
    }
  };

  // ------------------------------------------------------------ Derivados
  const empresas = useMemo<EmpresaCliente[]>(() => {
    const map = new Map<string, EmpresaCliente>();
    proyectos.forEach(p => { if (p.empresa) map.set(p.empresa.empresaId, p.empresa); });
    return Array.from(map.values());
  }, [proyectos]);

  return (
    <AppContext.Provider
      value={{
        currentUser, authLoading,
        usuarios, proyectos, inventarios, productos, empresas, ciudades, pedidos,
        dataLoading, refreshData,
        activeTab, setActiveTab, hasModuleAccess,
        selectedProyecto, setSelectedProyecto, selectedPedido, setSelectedPedido,
        calculatorModalOpen, setCalculatorModalOpen,
        pickupModalOpen, setPickupModalOpen,
        historyModalOpen, setHistoryModalOpen,
        escalateModalOpen, setEscalateModalOpen,
        projectToEscalate, setProjectToEscalate,
        redeemModalOpen, setRedeemModalOpen,
        userManagementModalOpen, setUserManagementModalOpen,
        profileModalOpen, setProfileModalOpen,
        theme, toggleTheme, searchQuery, setSearchQuery,
        loginWithEmailPassword, logout,
        cambiarEstadoProyecto, guardarDiagnosticoCalidad, calcularYGuardarCotizacion,
        escalarAsesorProyecto, solicitarCambioImagen, obtenerImagenProyecto,
        despacharProyecto, confirmarEntrega,
        actualizarStockInventario, agregarEntradaInventario,
        crearUsuario, actualizarEmpleado, actualizarPerfilUsuario,
        cambiarEstadoPedido, canjearCodigoRetiro,
        mensajesSinLeer, refreshMensajesSinLeer, marcarConversacionLeida,
        toastMessage, toastKind, showToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
