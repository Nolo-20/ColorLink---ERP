import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Usuario, 
  Proyecto, 
  InventarioProducto, 
  Producto, 
  EmpresaCliente, 
  EstadoPipeline, 
  DiagnosticoIA, 
  DespachoInfo, 
  MovimientoLogistico, 
  Cotizacion, 
  CotizacionItem, 
  OtpVerificationCode,
  UserRole,
  PedidoTienda,
  EstadoPedido,
  ModalidadEntrega,
  AsesorHistorial
} from '../types/database';
import { 
  USUARIOS_INICIALES, 
  PROYECTOS_INICIALES, 
  INVENTARIOS_INICIALES, 
  PRODUCTOS_INICIALES, 
  EMPRESAS_INICIALES,
  ROLES,
  CIUDADES,
  PEDIDOS_INICIALES,
  SUCURSALES_COLORLINK
} from '../data/mockData';

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
  | 'tienda_cliente'
  | 'colaboradores'
  | 'roles_permisos';

export const ROLE_PERMISSIONS: Record<UserRole, TabType[]> = {
  'Administrador': [
    'inicio', 
    'proyectos', 
    'pedidos', 
    'canje_sucursal', 
    'pipeline', 
    'calidad', 
    'inventarios', 
    'despachos', 
    'colaboradores',
    'reportes', 
    'tienda_cliente', 
    'roles_permisos'
  ],
  'Asesor Comercial': [
    'inicio', 
    'proyectos', 
    'pedidos', 
    'pipeline', 
    'reportes', 
    'tienda_cliente', 
    'roles_permisos'
  ],
  'Perito de Calidad': [
    'inicio', 
    'calidad', 
    'pipeline', 
    'roles_permisos'
  ],
  'Jefe de Despachos': [
    'inicio', 
    'despachos', 
    'canje_sucursal', 
    'pedidos', 
    'inventarios', 
    'pipeline', 
    'roles_permisos'
  ],
  'Cliente Contratista': [
    'inicio', 
    'tienda_cliente', 
    'proyectos', 
    'pedidos', 
    'pipeline', 
    'despachos'
  ],
};

interface AppContextType {
  currentUser: Usuario | null;
  setCurrentUser: (u: Usuario | null) => void;
  usuarios: Usuario[];
  proyectos: Proyecto[];
  inventarios: InventarioProducto[];
  productos: Producto[];
  empresas: EmpresaCliente[];
  pedidos: PedidoTienda[];
  sucursales: typeof SUCURSALES_COLORLINK;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasModuleAccess: (tab: TabType, role?: UserRole) => boolean;
  selectedProyecto: Proyecto | null;
  setSelectedProyecto: (p: Proyecto | null) => void;
  selectedPedido: PedidoTienda | null;
  setSelectedPedido: (p: PedidoTienda | null) => void;
  
  // Modals
  otpModalOpen: boolean;
  setOtpModalOpen: (v: boolean) => void;
  emailPassModalOpen: boolean;
  setEmailPassModalOpen: (v: boolean) => void;
  roleSwitcherOpen: boolean;
  setRoleSwitcherOpen: (v: boolean) => void;
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

  // Actions
  loginWithEmailPassword: (email: string, pass: string) => { success: boolean; message: string };
  requestOtp: (email: string) => { success: boolean; code: string; message: string };
  verifyOtp: (email: string, code: string) => { success: boolean; message: string };
  loginQuickRole: (role: UserRole) => void;
  logout: () => void;
  
  cambiarEstadoProyecto: (proyectoId: string, nuevoEstado: EstadoPipeline, notas: string, extras?: { bodega?: string; numeroGuia?: string; placa?: string }) => void;
  guardarDiagnosticoCalidad: (proyectoId: string, diagnostico: Partial<DiagnosticoIA>) => void;
  calcularYGuardarCotizacion: (proyectoId: string, area: number, manos: number, productoId: string, descuentoPct: number) => Cotizacion;
  crearProyecto: (nuevo: Partial<Proyecto>) => Proyecto;
  escalarAsesorProyecto: (proyectoId: string, nuevoAsesorId: string, motivo: string) => void;
  crearDespacho: (proyectoId: string, despacho: Partial<DespachoInfo>) => void;
  confirmarEntrega: (proyectoId: string, recibidoPor: string, docRecibe: string) => void;
  actualizarStockInventario: (inventarioId: string, cantidad: number) => void;
  agregarEntradaInventario: (entrada: {
    productoId: string;
    ciudadId: number;
    nombreBodega: string;
    numeroLote: string;
    cantidadDisponible: number;
    tiempoDespacho?: number;
  }) => InventarioProducto;
  toggleDisponibilidadProducto: (productoId: string) => void;
  toggleDisponibilidadColor: (productoId: string, colorNombre: string) => void;
  
  // User Management
  crearUsuario: (nuevo: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    documentId?: string;
    rolNombre: UserRole;
    password?: string;
    company?: string;
    city?: string;
  }) => Usuario;

  actualizarPerfilUsuario: (datos: {
    fotoUrl?: string;
    telefono?: string;
    password?: string;
  }) => { success: boolean; message: string };

  // Pedidos & Retiro en Sucursal Actions
  cambiarEstadoPedido: (pedidoId: string, nuevoEstado: EstadoPedido, notas?: string) => void;
  canjearCodigoRetiro: (codigo: string, sucursalNombre?: string) => { success: boolean; pedido?: PedidoTienda; message: string };
  crearPedidoTienda: (pedido: Partial<PedidoTienda>) => PedidoTienda;

  // Notifications & helpers
  latestGeneratedOtp: string | null;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from LocalStorage if available for persistence
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('colorlink_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    const saved = localStorage.getItem('colorlink_usuarios');
    return saved ? JSON.parse(saved) : USUARIOS_INICIALES;
  });
  const [empresas] = useState<EmpresaCliente[]>(EMPRESAS_INICIALES);
  const [productos, setProductos] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('colorlink_productos');
    return saved ? JSON.parse(saved) : PRODUCTOS_INICIALES;
  });

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('colorlink_theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [userManagementModalOpen, setUserManagementModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('colorlink_theme', next);
      return next;
    });
  };

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [proyectos, setProyectos] = useState<Proyecto[]>(() => {
    const saved = localStorage.getItem('colorlink_proyectos');
    return saved ? JSON.parse(saved) : PROYECTOS_INICIALES;
  });

  const [inventarios, setInventarios] = useState<InventarioProducto[]>(() => {
    const saved = localStorage.getItem('colorlink_inventarios');
    return saved ? JSON.parse(saved) : INVENTARIOS_INICIALES;
  });

  const [pedidos, setPedidos] = useState<PedidoTienda[]>(() => {
    const saved = localStorage.getItem('colorlink_pedidos');
    return saved ? JSON.parse(saved) : PEDIDOS_INICIALES;
  });

  const [sucursales] = useState(SUCURSALES_COLORLINK);
  const [selectedPedido, setSelectedPedido] = useState<PedidoTienda | null>(null);

  const [otpCodes, setOtpCodes] = useState<OtpVerificationCode[]>([
    {
      id: 1,
      email: 'admin@colorlink.co',
      code: '849201',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      isUsed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      email: 'asesor@colorlink.co',
      code: '552984',
      expiresAt: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
      isUsed: false,
      createdAt: new Date().toISOString(),
    },
  ]);

  const [activeTab, setActiveTab] = useState<TabType>('inicio');
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);

  const hasModuleAccess = (tab: TabType, role?: UserRole): boolean => {
    const userRole = role || currentUser?.rol.rol;
    if (!userRole) return false;
    const allowed = ROLE_PERMISSIONS[userRole] || [];
    return allowed.includes(tab);
  };

  // Modals state
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [emailPassModalOpen, setEmailPassModalOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [calculatorModalOpen, setCalculatorModalOpen] = useState(false);
  const [pickupModalOpen, setPickupModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [projectToEscalate, setProjectToEscalate] = useState<Proyecto | null>(null);
  const [redeemModalOpen, setRedeemModalOpen] = useState(false);

  const [latestGeneratedOtp, setLatestGeneratedOtp] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync state to local storage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('colorlink_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('colorlink_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('colorlink_proyectos', JSON.stringify(proyectos));
  }, [proyectos]);

  useEffect(() => {
    localStorage.setItem('colorlink_inventarios', JSON.stringify(inventarios));
  }, [inventarios]);

  useEffect(() => {
    localStorage.setItem('colorlink_pedidos', JSON.stringify(pedidos));
  }, [pedidos]);

  const loginWithEmailPassword = (email: string) => {
    const found = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    if (found) {
      setCurrentUser(found);
      setActiveTab('inicio');
      setEmailPassModalOpen(false);
      showToast(`¡Bienvenido de nuevo, ${found.nombre}! Sesión iniciada como ${found.rol.rol}.`);
      return { success: true, message: 'Inicio de sesión exitoso' };
    }
    return { success: false, message: 'Credenciales inválidas o correo no registrado' };
  };

  const requestOtp = (email: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const userFound = usuarios.find(u => u.email.toLowerCase() === cleanEmail);
    // Generate 6 digit code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    const newOtp: OtpVerificationCode = {
      id: Date.now(),
      email: cleanEmail,
      usuarioId: userFound?.usuarioId,
      code: generatedCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      isUsed: false,
      createdAt: new Date().toISOString(),
    };
    setOtpCodes(prev => [newOtp, ...prev]);
    setLatestGeneratedOtp(generatedCode);
    showToast(`Código OTP generado: ${generatedCode} (Válido por 10 min)`);
    return { success: true, code: generatedCode, message: 'Código de acceso enviado a tu correo' };
  };

  const verifyOtp = (email: string, code: string) => {
    const cleanEmail = email.toLowerCase().trim();
    const match = otpCodes.find(o => o.email === cleanEmail && o.code === code.trim() && !o.isUsed);
    if (!match) {
      return { success: false, message: 'Código incorrecto o ya utilizado' };
    }
    // Mark as used
    setOtpCodes(prev => prev.map(o => o.id === match.id ? { ...o, isUsed: true } : o));
    
    // Find or create user
    let user = usuarios.find(u => u.email.toLowerCase() === cleanEmail);
    if (!user) {
      // Default to client contractor if registering new email
      user = {
        usuarioId: `usr-${Date.now()}`,
        rolId: 5,
        rol: ROLES[4],
        nombre: cleanEmail.split('@')[0],
        apellido: 'Obra',
        email: cleanEmail,
        authProvider: 'otp',
        createdAt: new Date().toISOString(),
        city: 'Medellín',
      };
    }
    setCurrentUser(user);
    setActiveTab('inicio');
    setOtpModalOpen(false);
    showToast(`Acceso verificado. Bienvenido, ${user.nombre}`);
    return { success: true, message: 'Código verificado con éxito' };
  };

  const loginQuickRole = (role: UserRole) => {
    const targetUser = usuarios.find(u => u.rol.rol === role);
    if (targetUser) {
      setCurrentUser(targetUser);
      setActiveTab('inicio');
      setRoleSwitcherOpen(false);
      showToast(`Ingresaste en modo de prueba como: ${targetUser.nombre} (${role})`);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setSelectedProyecto(null);
    showToast('Sesión cerrada correctamente');
  };

  const cambiarEstadoProyecto = (
    proyectoId: string, 
    nuevoEstado: EstadoPipeline, 
    notas: string,
    extras?: { bodega?: string; numeroGuia?: string; placa?: string }
  ) => {
    setProyectos(prev => prev.map(proy => {
      if (proy.proyectoId !== proyectoId) return proy;

      const movimiento: MovimientoLogistico = {
        id: `mov-${Date.now()}`,
        proyectoId,
        fecha: new Date().toISOString(),
        estadoAnterior: proy.estadoPipeline,
        estadoNuevo: nuevoEstado,
        usuarioNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Sistema ColorLink',
        rolNombre: currentUser ? currentUser.rol.rol : 'Control Automático',
        notas: notas || `Cambio de estado a ${nuevoEstado.replace('_', ' ').toUpperCase()}`,
        bodegaOrigen: extras?.bodega,
        numeroGuia: extras?.numeroGuia,
        placaVehiculo: extras?.placa,
      };

      const historialActualizado = [movimiento, ...(proy.historialMovimientos || [])];

      // If transition is to tintometria, check if lot is set
      let despachoActualizado = proy.despacho;
      if (nuevoEstado === 'en_ruta_despacho' && !despachoActualizado) {
        despachoActualizado = {
          numeroGuia: extras?.numeroGuia || `CL-DSP-${Math.floor(1000 + Math.random() * 9000)}`,
          transportador: 'Flota ColorLink Express',
          placaVehiculo: extras?.placa || 'COL-892',
          conductorNombre: 'Conductor Asignado',
          conductorTelefono: '+57 314 555 0192',
          horaSalida: new Date().toISOString(),
          tiempoEstimadoHoras: 2,
          direccionEntrega: proy.empresa?.direccionDespacho || 'Valle de Aburrá, Antioquia',
          ciudadEntrega: proy.empresa?.ciudad?.ciudad || 'Medellín',
          estadoDespacho: 'En Ruta',
        };
      }

      const proyModificado: Proyecto = {
        ...proy,
        estadoPipeline: nuevoEstado,
        updatedAt: new Date().toISOString(),
        despacho: despachoActualizado,
        historialMovimientos: historialActualizado,
      };

      if (selectedProyecto?.proyectoId === proyectoId) {
        setSelectedProyecto(proyModificado);
      }

      return proyModificado;
    }));

    showToast(`Estado actualizado a "${nuevoEstado.replace(/_/g, ' ').toUpperCase()}"`);
  };

  const guardarDiagnosticoCalidad = (proyectoId: string, data: Partial<DiagnosticoIA>) => {
    setProyectos(prev => prev.map(proy => {
      if (proy.proyectoId !== proyectoId) return proy;

      const peritoName = currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Ing. Andrés Felipe Ospina';

      const diagActualizado: DiagnosticoIA = {
        ...(proy.diagnostico || {
          diagnosticoId: `diag-${Date.now()}`,
          proyectoId,
          requiereVisitaHumana: true,
        }),
        ...data,
        peritoNombre: data.peritoNombre || peritoName,
        fechaVeredicto: new Date().toISOString(),
      };

      const movimiento: MovimientoLogistico = {
        id: `mov-${Date.now()}`,
        proyectoId,
        fecha: new Date().toISOString(),
        estadoAnterior: proy.estadoPipeline,
        estadoNuevo: data.aprobadoCalidad ? 'aprobado_cliente' : 'revision_calidad',
        usuarioNombre: peritoName,
        rolNombre: 'Perito de Calidad',
        notas: `Veredicto de Calidad: ${data.aprobadoCalidad ? 'APROBADO TÉCNICAMENTE' : 'OBSERVACIONES TÉCNICAS'}. Humedad: ${data.humedadRelativa ?? 'N/A'}%. Fisuras: ${data.severidadFisuras ?? 'N/A'}. Notas: ${data.notasPerito || 'Sin notas adicionales'}`,
      };

      const proyActualizado: Proyecto = {
        ...proy,
        diagnostico: diagActualizado,
        estadoPipeline: data.aprobadoCalidad ? 'aprobado_cliente' : proy.estadoPipeline,
        updatedAt: new Date().toISOString(),
        historialMovimientos: [movimiento, ...(proy.historialMovimientos || [])],
      };

      if (selectedProyecto?.proyectoId === proyectoId) {
        setSelectedProyecto(proyActualizado);
      }

      return proyActualizado;
    }));

    showToast('Dictamen técnico de Calidad registrado exitosamente');
  };

  const calcularYGuardarCotizacion = (
    proyectoId: string, 
    area: number, 
    manos: number, 
    productoId: string, 
    descuentoPct: number
  ): Cotizacion => {
    const prod = productos.find(p => p.productoId === productoId) || productos[0];
    
    // Theoretical coverage formula (Colores/Pinturas)
    // Rendimiento del producto en m2 por galón a 1 mano
    const rendimientoM2PorGalon = prod.rendimientoM2 || 45;
    
    // Galones teóricos necesarios con 6% de factor desperdicio técnico en obra
    const galonesExactosCalculados = Number((((area * manos) / rendimientoM2PorGalon) * 1.06).toFixed(1));
    
    // Conversión a Cuñetes de 5 Galones y Galones sueltos de 1 Galón
    const cunetes5g = Math.floor(galonesExactosCalculados / 5);
    const residuoGalones = galonesExactosCalculados - (cunetes5g * 5);
    const galones1g = residuoGalones > 0 ? Math.ceil(residuoGalones) : 0;

    // Precios
    // Cuñete price: si el producto ya es cuñete o precio proporcional
    const precioCunete = prod.presentacion?.includes('Cuñete') ? (prod.precio || 365000) : (prod.precio ? prod.precio * 4.6 : 365000);
    // Galón individual price
    const galonProd = productos.find(p => p.presentacion?.includes('Galón 1') && p.categoria === prod.categoria) || productos[1];
    const precioGalon = galonProd.precio || 78000;

    const subtotalBruto = (cunetes5g * precioCunete) + (galones1g * precioGalon);
    const montoDescuento = subtotalBruto * (descuentoPct / 100);
    const subtotalConDescuento = subtotalBruto - montoDescuento;
    const iva19 = subtotalConDescuento * 0.19;
    const totalFinal = Math.round(subtotalConDescuento + iva19);

    const items: CotizacionItem[] = [
      {
        citemId: `item-${Date.now()}-1`,
        cotizacionId: `cot-${Date.now()}`,
        productoId: prod.productoId,
        producto: prod,
        cantidad: cunetes5g,
        precioUnitario: precioCunete,
        total: cunetes5g * precioCunete,
        unidadMedida: 'cuñete_5g',
      },
    ];

    if (galones1g > 0) {
      items.push({
        citemId: `item-${Date.now()}-2`,
        cotizacionId: `cot-${Date.now()}`,
        productoId: galonProd.productoId,
        producto: galonProd,
        cantidad: galones1g,
        precioUnitario: precioGalon,
        total: galones1g * precioGalon,
        unidadMedida: 'galon_1g',
      });
    }

    const nuevaCotizacion: Cotizacion = {
      cotizacionId: `cot-${Date.now()}`,
      proyectoId,
      diagnosticoId: undefined,
      galonesExactos: galonesExactosCalculados,
      cunetes5g,
      galones1g,
      subtotal: Math.round(subtotalConDescuento),
      descuentoAsesorPct: descuentoPct,
      iva: Math.round(iva19),
      total: totalFinal,
      estado: 'Aprobada',
      createdAt: new Date().toISOString(),
      items,
    };

    setProyectos(prev => prev.map(proy => {
      if (proy.proyectoId !== proyectoId) return proy;

      const movimiento: MovimientoLogistico = {
        id: `mov-${Date.now()}`,
        proyectoId,
        fecha: new Date().toISOString(),
        estadoAnterior: proy.estadoPipeline,
        estadoNuevo: 'cotizacion_generada',
        usuarioNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Valentina Gómez (Asesor)',
        rolNombre: 'Asesor Comercial',
        notas: `Cotización Técnica calculada: ${cunetes5g} Cuñetes (5G) + ${galones1g} Galones (1G) = Total ${galonesExactosCalculados} galones. Descuento aplicado: ${descuentoPct}%. Total: $${totalFinal.toLocaleString('es-CO')} COP.`,
      };

      const actualizado: Proyecto = {
        ...proy,
        area,
        descuentoAsesorPct: descuentoPct,
        estadoPipeline: 'cotizacion_generada',
        cotizaciones: [nuevaCotizacion, ...(proy.cotizaciones || [])],
        updatedAt: new Date().toISOString(),
        historialMovimientos: [movimiento, ...(proy.historialMovimientos || [])],
      };

      if (selectedProyecto?.proyectoId === proyectoId) {
        setSelectedProyecto(actualizado);
      }

      return actualizado;
    }));

    showToast(`Cotización generada: ${cunetes5g} cuñetes y ${galones1g} galones.`);
    return nuevaCotizacion;
  };

  const crearProyecto = (nuevo: Partial<Proyecto>): Proyecto => {
    const id = `proy-${Date.now()}`;
    const defaultEmpresa = empresas[3] || empresas[0]; // Prefer Constructora Horizonte if available
    
    // Auto-assignment of commercial advisor
    const advisorList = usuarios.filter(u => u.rol.rol === 'Asesor Comercial');
    const autoAdvisor = nuevo.asesorAsignado || advisorList[0] || usuarios[1];

    const createdProject: Proyecto = {
      proyectoId: id,
      usuarioId: currentUser?.usuarioId || usuarios[4].usuarioId,
      usuario: currentUser || usuarios[4],
      asesorAsignadoId: autoAdvisor.usuarioId,
      asesorAsignado: autoAdvisor,
      empresaId: nuevo.empresaId || defaultEmpresa.empresaId,
      empresa: empresas.find(e => e.empresaId === (nuevo.empresaId || defaultEmpresa.empresaId)) || defaultEmpresa,
      nombreProyecto: nuevo.nombreProyecto || 'Nuevo Proyecto de Pintura y Obra',
      area: nuevo.area || 500,
      tipoSuperficie: nuevo.tipoSuperficie || 'Mampostería y Revoque Tradicional',
      ambiente: nuevo.ambiente || 'Fachada',
      acabado: nuevo.acabado || 'Satinado',
      color: nuevo.color || 'Blanco Aburrá Nieve',
      colorHex: nuevo.colorHex || '#F4F6F8',
      canalOrigen: nuevo.canalOrigen || 'Control Interno ERP',
      estadoPipeline: 'diagnostico_creado',
      descuentoAsesorPct: nuevo.descuentoAsesorPct || 0,
      observacionesAsesor: nuevo.observacionesAsesor || 'Ingresado al sistema para evaluación de calidad y cotización.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      evidencias: [],
      cotizaciones: [],
      historialMovimientos: [
        {
          id: `mov-${Date.now()}`,
          proyectoId: id,
          fecha: new Date().toISOString(),
          estadoAnterior: 'diagnostico_creado',
          estadoNuevo: 'diagnostico_creado',
          usuarioNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Sistema ColorLink Auto-Assign',
          rolNombre: currentUser ? currentUser.rol.rol : 'Asignación Automática',
          notas: `Creación formal del proyecto ${nuevo.nombreProyecto}. Asignado automáticamente al asesor ${autoAdvisor.nombre} ${autoAdvisor.apellido}.`,
        }
      ],
      historialAsesores: [
        {
          asesorId: autoAdvisor.usuarioId,
          asesorNombre: `${autoAdvisor.nombre} ${autoAdvisor.apellido}`,
          asesorEmail: autoAdvisor.email,
          fechaAsignacion: new Date().toISOString(),
          motivo: 'Asignación automática inteligente al registrar la obra',
          asignadoPor: currentUser ? `${currentUser.nombre} (${currentUser.rol.rol})` : 'Sistema Automático',
        }
      ]
    };

    setProyectos(prev => [createdProject, ...prev]);
    setSelectedProyecto(createdProject);
    showToast(`Proyecto "${createdProject.nombreProyecto}" registrado y asignado a ${autoAdvisor.nombre}.`);
    return createdProject;
  };

  const escalarAsesorProyecto = (proyectoId: string, nuevoAsesorId: string, motivo: string) => {
    const nuevoAsesor = usuarios.find(u => u.usuarioId === nuevoAsesorId);
    if (!nuevoAsesor) return;

    setProyectos(prev => prev.map(proy => {
      if (proy.proyectoId !== proyectoId) return proy;

      const historialAsesorItem: AsesorHistorial = {
        asesorId: nuevoAsesor.usuarioId,
        asesorNombre: `${nuevoAsesor.nombre} ${nuevoAsesor.apellido}`,
        asesorEmail: nuevoAsesor.email,
        fechaAsignacion: new Date().toISOString(),
        motivo: motivo || 'Escalamiento por cobertura comercial o especialidad técnica',
        asignadoPor: currentUser ? `${currentUser.nombre} (${currentUser.rol.rol})` : 'Administración Central',
      };

      const movimiento: MovimientoLogistico = {
        id: `mov-${Date.now()}`,
        proyectoId,
        fecha: new Date().toISOString(),
        estadoAnterior: proy.estadoPipeline,
        estadoNuevo: proy.estadoPipeline,
        usuarioNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Administrador',
        rolNombre: currentUser ? currentUser.rol.rol : 'Reasignación',
        notas: `ESCALAMIENTO DE ASESOR: Proyecto reasignado a ${nuevoAsesor.nombre} ${nuevoAsesor.apellido}. Motivo: ${motivo}`,
      };

      const actualizado: Proyecto = {
        ...proy,
        asesorAsignadoId: nuevoAsesor.usuarioId,
        asesorAsignado: nuevoAsesor,
        updatedAt: new Date().toISOString(),
        historialAsesores: [historialAsesorItem, ...(proy.historialAsesores || [])],
        historialMovimientos: [movimiento, ...(proy.historialMovimientos || [])],
      };

      if (selectedProyecto?.proyectoId === proyectoId) {
        setSelectedProyecto(actualizado);
      }

      return actualizado;
    }));

    showToast(`Proyecto escalado y reasignado a ${nuevoAsesor.nombre} exitosamente.`);
    setEscalateModalOpen(false);
  };

  // Pedidos & Canje de Retiro en Sucursal
  const cambiarEstadoPedido = (pedidoId: string, nuevoEstado: EstadoPedido, notas?: string) => {
    setPedidos(prev => prev.map(ped => {
      if (ped.pedidoId !== pedidoId) return ped;

      const nuevoHistorialItem = {
        fecha: new Date().toISOString(),
        estado: nuevoEstado,
        usuario: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Sistema ColorLink',
        rol: currentUser ? currentUser.rol.rol : 'Operación',
        notas: notas || `Cambio de estado del pedido a ${nuevoEstado.replace(/_/g, ' ').toUpperCase()}`,
      };

      const actualizado: PedidoTienda = {
        ...ped,
        estadoPedido: nuevoEstado,
        fechaActualizacion: new Date().toISOString(),
        historialEstados: [nuevoHistorialItem, ...(ped.historialEstados || [])],
      };

      if (selectedPedido?.pedidoId === pedidoId) {
        setSelectedPedido(actualizado);
      }

      return actualizado;
    }));

    showToast(`Pedido ${pedidoId} actualizado a ${nuevoEstado.replace(/_/g, ' ').toUpperCase()}`);
  };

  const canjearCodigoRetiro = (codigo: string, sucursalNombre?: string) => {
    const cleanCode = codigo.trim().toUpperCase();
    const pedido = pedidos.find(p => 
      p.codigoRetiro?.toUpperCase() === cleanCode || 
      p.qrCodeData?.toUpperCase().includes(cleanCode) ||
      p.pedidoId.toUpperCase() === cleanCode
    );

    if (!pedido) {
      return { success: false, message: `No se encontró ningún pedido con el código "${codigo}". Verifica e intenta nuevamente.` };
    }

    if (pedido.estadoPedido === 'entregado_recogido') {
      return { success: false, pedido, message: `El pedido ${pedido.pedidoId} ya fue reclamado y canjeado previamente el ${new Date(pedido.fechaCanje || '').toLocaleString('es-CO')}.` };
    }

    const cajeroName = currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Cajero / Atención Sucursal';
    const branchName = sucursalNombre || pedido.sucursalRetiro || 'Sucursal Principal Guayabal (Medellín)';

    const nuevoHistorialItem = {
      fecha: new Date().toISOString(),
      estado: 'entregado_recogido' as EstadoPedido,
      usuario: cajeroName,
      rol: currentUser?.rol.rol || 'Cajero de Sucursal',
      notas: `CANJE EXITOSO DE RETIRO EN SUCURSAL: Código ${cleanCode} validado en mostrador de ${branchName}. Se entregaron todos los productos al cliente ${pedido.clienteNombre} (${pedido.clienteDoc || 'Doc Verificado'}).`,
    };

    const actualizado: PedidoTienda = {
      ...pedido,
      estadoPedido: 'entregado_recogido',
      canjeadoPor: cajeroName,
      canjeadoEnSucursal: branchName,
      fechaCanje: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      historialEstados: [nuevoHistorialItem, ...(pedido.historialEstados || [])],
    };

    setPedidos(prev => prev.map(p => p.pedidoId === pedido.pedidoId ? actualizado : p));
    if (selectedPedido?.pedidoId === pedido.pedidoId) {
      setSelectedPedido(actualizado);
    }

    showToast(`¡Código ${cleanCode} canjeado con éxito! Pedido ${pedido.pedidoId} entregado en ${branchName}.`);
    return { success: true, pedido: actualizado, message: '¡Canje exitoso! Entrega confirmada.' };
  };

  const crearPedidoTienda = (pedido: Partial<PedidoTienda>): PedidoTienda => {
    const orderNum = Math.floor(224400 + Math.random() * 900);
    const pedidoId = `CL-${orderNum}`;
    const codigoRetiro = pedido.modalidadEntrega === 'recogida_sucursal' 
      ? `RET-${Math.floor(1000 + Math.random() * 9000)}` 
      : undefined;

    const nuevoPedido: PedidoTienda = {
      pedidoId,
      clienteId: currentUser?.usuarioId || 'usr-cliente-02',
      clienteNombre: pedido.clienteNombre || currentUser?.nombre || 'Carlos Mendoza',
      clienteEmail: pedido.clienteEmail || currentUser?.email || 'carlos.mendoza@constructoraaburra.com',
      clienteTelefono: pedido.clienteTelefono || '+57 (314) 789-2045',
      clienteDoc: pedido.clienteDoc || currentUser?.documentId || 'CC 71.890.412',
      empresaNombre: pedido.empresaNombre || currentUser?.company || 'Constructora Horizonte S.A.S.',
      empresaNit: pedido.empresaNit || '901.452.880-1',
      modalidadEntrega: pedido.modalidadEntrega || 'recogida_sucursal',
      sucursalRetiro: pedido.sucursalRetiro || 'Sucursal Principal Guayabal (Medellín)',
      codigoRetiro,
      qrCodeData: codigoRetiro ? `COLORLINK-PICKUP-${pedidoId}-${codigoRetiro}` : undefined,
      direccionEntrega: pedido.direccionEntrega,
      ciudadEntrega: pedido.ciudadEntrega || 'Medellín',
      barrioSector: pedido.barrioSector || 'El Poblado',
      instruccionesEntrega: pedido.instruccionesEntrega || 'Dejar en portería con conserje.',
      metodoPago: pedido.metodoPago || 'PSE / Transferencia',
      subtotal: pedido.subtotal || 239076,
      iva: pedido.iva || 45424,
      total: pedido.total || 284500,
      items: pedido.items || [],
      estadoPedido: 'comprado_confirmado',
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      historialEstados: [
        {
          fecha: new Date().toISOString(),
          estado: 'comprado_confirmado',
          usuario: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Cliente Web',
          rol: 'Cliente Web',
          notas: `Compra confirmada por $${(pedido.total || 284500).toLocaleString('es-CO')} COP mediante ${pedido.metodoPago || 'PSE'}.`,
        }
      ],
    };

    setPedidos(prev => [nuevoPedido, ...prev]);
    setSelectedPedido(nuevoPedido);
    showToast(`Pedido ${pedidoId} generado con éxito.`);
    return nuevoPedido;
  };

  const crearDespacho = (proyectoId: string, info: Partial<DespachoInfo>) => {
    setProyectos(prev => prev.map(proy => {
      if (proy.proyectoId !== proyectoId) return proy;

      const numGuia = info.numeroGuia || `CL-DSP-${Math.floor(1000 + Math.random() * 9000)}`;
      const despachoCompleto: DespachoInfo = {
        numeroGuia: numGuia,
        transportador: info.transportador || 'Flota Logística ColorLink Valle de Aburrá',
        placaVehiculo: info.placaVehiculo || 'WLC-492',
        conductorNombre: info.conductorNombre || 'Hernán Darío Cadavid',
        conductorTelefono: info.conductorTelefono || '+57 313 602 1199',
        horaSalida: new Date().toISOString(),
        tiempoEstimadoHoras: info.tiempoEstimadoHoras || 2,
        direccionEntrega: info.direccionEntrega || proy.empresa?.direccionDespacho || 'Valle de Aburrá',
        ciudadEntrega: info.ciudadEntrega || proy.empresa?.ciudad?.ciudad || 'Medellín',
        estadoDespacho: 'En Ruta',
      };

      const movimiento: MovimientoLogistico = {
        id: `mov-${Date.now()}`,
        proyectoId,
        fecha: new Date().toISOString(),
        estadoAnterior: proy.estadoPipeline,
        estadoNuevo: 'en_ruta_despacho',
        usuarioNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Javier Montoya',
        rolNombre: 'Jefe de Despachos',
        notas: `Despacho en ruta con Guía ${numGuia}. Vehículo placa ${despachoCompleto.placaVehiculo}. Conductor: ${despachoCompleto.conductorNombre}. Destino: ${despachoCompleto.direccionEntrega}.`,
        numeroGuia: numGuia,
        placaVehiculo: despachoCompleto.placaVehiculo,
      };

      const actualizado: Proyecto = {
        ...proy,
        estadoPipeline: 'en_ruta_despacho',
        despacho: despachoCompleto,
        updatedAt: new Date().toISOString(),
        historialMovimientos: [movimiento, ...(proy.historialMovimientos || [])],
      };

      if (selectedProyecto?.proyectoId === proyectoId) {
        setSelectedProyecto(actualizado);
      }

      return actualizado;
    }));

    showToast('Despacho registrado y vehículo despachado en ruta.');
  };

  const confirmarEntrega = (proyectoId: string, recibidoPor: string, docRecibe: string) => {
    setProyectos(prev => prev.map(proy => {
      if (proy.proyectoId !== proyectoId) return proy;

      const despachoActualizado: DespachoInfo = {
        ...(proy.despacho || {
          numeroGuia: 'CL-DSP-FINAL',
          transportador: 'ColorLink Express',
          placaVehiculo: 'WLC-492',
          conductorNombre: 'Conductor',
          conductorTelefono: '+57 300 000 0000',
          tiempoEstimadoHoras: 0,
          direccionEntrega: 'Obra',
          ciudadEntrega: 'Medellín',
          estadoDespacho: 'Entregado en Obra',
        }),
        estadoDespacho: 'Entregado en Obra',
        recibidoPor,
        documentoRecibe: docRecibe,
        firmaDigital: true,
        fechaEntrega: new Date().toISOString(),
      };

      const movimiento: MovimientoLogistico = {
        id: `mov-${Date.now()}`,
        proyectoId,
        fecha: new Date().toISOString(),
        estadoAnterior: proy.estadoPipeline,
        estadoNuevo: 'entregado',
        usuarioNombre: currentUser ? `${currentUser.nombre} ${currentUser.apellido}` : 'Transportador',
        rolNombre: 'Logística & Despacho',
        notas: `ENTREGA SATISFACTORIA EN OBRA. Recibido a conformidad por: ${recibidoPor} (Doc: ${docRecibe}). Se emitió remisión digital firmada.`,
        numeroGuia: proy.despacho?.numeroGuia,
      };

      const actualizado: Proyecto = {
        ...proy,
        estadoPipeline: 'entregado',
        despacho: despachoActualizado,
        updatedAt: new Date().toISOString(),
        historialMovimientos: [movimiento, ...(proy.historialMovimientos || [])],
      };

      if (selectedProyecto?.proyectoId === proyectoId) {
        setSelectedProyecto(actualizado);
      }

      return actualizado;
    }));

    showToast('¡Entrega en obra confirmada y remisión firmada con éxito!');
  };

  const actualizarStockInventario = (inventarioId: string, cantidad: number) => {
    setInventarios(prev => prev.map(item => {
      if (item.inventarioId === inventarioId) {
        return {
          ...item,
          cantidadDisponible: Math.max(0, cantidad),
          fechaTinturado: new Date().toISOString(),
        };
      }
      return item;
    }));
    showToast('Inventario y lote actualizados en bodega.');
  };

  const agregarEntradaInventario = (entrada: {
    productoId: string;
    ciudadId: number;
    nombreBodega: string;
    numeroLote: string;
    cantidadDisponible: number;
    tiempoDespacho?: number;
  }): InventarioProducto => {
    const prod = productos.find(p => p.productoId === entrada.productoId) || productos[0];
    const cd = CIUDADES.find(c => c.ciudadId === entrada.ciudadId) || CIUDADES[0];
    
    const nuevoInv: InventarioProducto = {
      inventarioId: `inv-${Date.now()}`,
      productoId: prod.productoId,
      producto: prod,
      ciudadId: cd.ciudadId,
      ciudad: cd,
      nombreBodega: entrada.nombreBodega,
      numeroLote: entrada.numeroLote || `LT-2026-${Date.now().toString().slice(-4)}`,
      cantidadDisponible: Number(entrada.cantidadDisponible),
      fechaTinturado: new Date().toISOString(),
      tiempoDespacho: entrada.tiempoDespacho || 2,
    };

    setInventarios(prev => {
      const updated = [nuevoInv, ...prev];
      localStorage.setItem('colorlink_inventarios', JSON.stringify(updated));
      return updated;
    });

    showToast(`Entrada registrada: ${nuevoInv.cantidadDisponible} unidades en ${nuevoInv.nombreBodega}.`);
    return nuevoInv;
  };

  const toggleDisponibilidadProducto = (productoId: string) => {
    setProductos(prev => {
      const updated = prev.map(p => {
        if (p.productoId === productoId) {
          const nuevoDisp = p.disponible === false ? true : false;
          showToast(`Producto "${p.nombre}" marcado como ${nuevoDisp ? 'DISPONIBLE' : 'AGOTADO'}.`);
          return { ...p, disponible: nuevoDisp };
        }
        return p;
      });
      localStorage.setItem('colorlink_productos', JSON.stringify(updated));
      return updated;
    });
  };

  const toggleDisponibilidadColor = (productoId: string, colorNombre: string) => {
    setProductos(prev => {
      const updated = prev.map(p => {
        if (p.productoId === productoId && p.coloresDisponibles) {
          const updatedColors = p.coloresDisponibles.map(c => 
            c.nombre === colorNombre ? { ...c, disponible: !c.disponible } : c
          );
          return { ...p, coloresDisponibles: updatedColors };
        }
        return p;
      });
      localStorage.setItem('colorlink_productos', JSON.stringify(updated));
      return updated;
    });
    showToast(`Disponibilidad del color "${colorNombre}" actualizada.`);
  };

  const crearUsuario = (nuevo: {
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    documentId?: string;
    rolNombre: UserRole;
    password?: string;
    company?: string;
    city?: string;
  }): Usuario => {
    const rolEncontrado = ROLES.find(r => r.rol === nuevo.rolNombre) || ROLES[1];
    const userCreated: Usuario = {
      usuarioId: `usr-${Date.now()}`,
      rolId: rolEncontrado.rolId,
      rol: rolEncontrado,
      nombre: nuevo.nombre,
      apellido: nuevo.apellido,
      email: nuevo.email,
      telefono: nuevo.telefono || '+57 300 000 0000',
      documentId: nuevo.documentId || 'CC 0.000.000',
      authProvider: 'credentials',
      passwordHash: nuevo.password || 'ColorLink2026*',
      company: nuevo.company || 'ColorLink S.A.S. - Valle de Aburrá',
      city: nuevo.city || 'Medellín',
      createdAt: new Date().toISOString(),
      avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80`,
    };

    setUsuarios(prev => {
      const updated = [userCreated, ...prev];
      localStorage.setItem('colorlink_usuarios', JSON.stringify(updated));
      return updated;
    });

    showToast(`Empleado ${userCreated.nombre} ${userCreated.apellido} registrado como ${userCreated.rol.rol}`);
    return userCreated;
  };

  const actualizarPerfilUsuario = (datos: {
    fotoUrl?: string;
    telefono?: string;
    password?: string;
  }): { success: boolean; message: string } => {
    if (!currentUser) return { success: false, message: 'No hay usuario autenticado.' };

    const updatedUser: Usuario = {
      ...currentUser,
      avatarUrl: datos.fotoUrl !== undefined ? datos.fotoUrl : currentUser.avatarUrl,
      telefono: datos.telefono !== undefined ? datos.telefono : currentUser.telefono,
      passwordHash: datos.password ? datos.password : currentUser.passwordHash,
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('colorlink_user', JSON.stringify(updatedUser));

    setUsuarios(prev => {
      const updated = prev.map(u => u.usuarioId === currentUser.usuarioId ? { ...u, ...updatedUser } : u);
      localStorage.setItem('colorlink_usuarios', JSON.stringify(updated));
      return updated;
    });

    showToast('Tu perfil de empleado ha sido actualizado exitosamente.');
    return { success: true, message: 'Perfil actualizado exitosamente.' };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        usuarios,
        proyectos,
        inventarios,
        productos,
        empresas,
        pedidos,
        sucursales,
        activeTab,
        setActiveTab,
        hasModuleAccess,
        selectedProyecto,
        setSelectedProyecto,
        selectedPedido,
        setSelectedPedido,
        otpModalOpen,
        setOtpModalOpen,
        emailPassModalOpen,
        setEmailPassModalOpen,
        roleSwitcherOpen,
        setRoleSwitcherOpen,
        calculatorModalOpen,
        setCalculatorModalOpen,
        pickupModalOpen,
        setPickupModalOpen,
        historyModalOpen,
        setHistoryModalOpen,
        escalateModalOpen,
        setEscalateModalOpen,
        projectToEscalate,
        setProjectToEscalate,
        redeemModalOpen,
        setRedeemModalOpen,
        userManagementModalOpen,
        setUserManagementModalOpen,
        profileModalOpen,
        setProfileModalOpen,
        theme,
        toggleTheme,
        searchQuery,
        setSearchQuery,
        loginWithEmailPassword,
        requestOtp,
        verifyOtp,
        loginQuickRole,
        logout,
        cambiarEstadoProyecto,
        guardarDiagnosticoCalidad,
        calcularYGuardarCotizacion,
        crearProyecto,
        escalarAsesorProyecto,
        crearDespacho,
        confirmarEntrega,
        actualizarStockInventario,
        agregarEntradaInventario,
        toggleDisponibilidadProducto,
        toggleDisponibilidadColor,
        crearUsuario,
        actualizarPerfilUsuario,
        cambiarEstadoPedido,
        canjearCodigoRetiro,
        crearPedidoTienda,
        latestGeneratedOtp,
        toastMessage,
        showToast,
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
