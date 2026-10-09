/**
 * Cliente HTTP del ERP. Todas las llamadas van al mismo origen (`/api/...`):
 * en producción las reenvía nginx al backend y en desarrollo las reenvía Vite.
 * La sesión es una cookie httpOnly que pone el backend; aquí nunca se guarda ningún token.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T = any>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('No hay conexión con el servidor. Revisa tu red e inténtalo de nuevo.', 0);
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* respuesta sin cuerpo JSON */
  }

  if (!res.ok || (data && data.success === false)) {
    throw new ApiError(data?.error || data?.message || `Error ${res.status} del servidor`, res.status);
  }
  return data as T;
}

const get = <T = any>(path: string) => request<T>('GET', path);
const post = <T = any>(path: string, body?: unknown) => request<T>('POST', path, body ?? {});
const patch = <T = any>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {});
const put = <T = any>(path: string, body?: unknown) => request<T>('PUT', path, body ?? {});

export const api = {
  // ---------- Sesión ----------
  login: (email: string, password: string) => post('/api/auth/login-password', { email, password }),
  logout: () => post('/api/auth/logout'),
  getProfile: () => get('/api/auth/profile'),
  updateProfile: (data: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }) =>
    patch('/api/auth/profile', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    post('/api/auth/change-password', { currentPassword, newPassword }),

  // ---------- Proyectos ----------
  getAllProjects: () => get('/api/projects/all'),
  getDispatchBoard: () => get('/api/projects/dispatch-board'),
  patchProject: (id: string, body: Record<string, unknown>) => patch(`/api/projects/${id}`, body),
  reassignProject: (id: string, body: { role: 'asesor' | 'calidad'; nuevoUsuarioId: string; motivo?: string }) =>
    patch(`/api/projects/${id}/reassign`, body),
  qualityVerdict: (id: string, body: Record<string, unknown>) => put(`/api/projects/${id}/quality-verdict`, body),
  requestImageChange: (id: string, motivo: string) => patch(`/api/projects/${id}/request-image-change`, { motivo }),
  getProjectEvidence: (id: string) => get(`/api/projects/${id}/evidence`),
  quoteProject: (id: string, body: { productoId: string; area?: number; manos?: number; descuentoPct?: number }) =>
    post(`/api/projects/${id}/quote`, body),
  dispatchProject: (id: string, body: Record<string, unknown>) => patch(`/api/projects/${id}/dispatch`, body),
  confirmDelivery: (id: string, body: { recibidoPor: string; documentoRecibe?: string }) =>
    patch(`/api/projects/${id}/delivery`, body),

  // ---------- Pedidos de la tienda ----------
  getAllOrders: () => get('/api/orders/all'),
  updateOrderStatus: (id: string, estado: string, comentario?: string) =>
    patch(`/api/orders/${id}/status`, { estado, comentario }),
  validatePickup: (code: string) => post('/api/orders/validate-pickup', { code }),

  // ---------- Inventario ----------
  getInventory: () => get('/api/inventory'),
  setStock: (inventarioId: string, cantidad: number) => patch(`/api/inventory/${inventarioId}`, { cantidad }),
  /** Ajuste relativo (+/-): el backend suma `delta` al valor actual, sin pisar cambios concurrentes. */
  adjustStock: (inventarioId: string, delta: number) => patch(`/api/inventory/${inventarioId}`, { delta }),
  createStockEntry: (body: {
    productoId: string;
    ciudadId: number;
    nombreBodega: string;
    numeroLote?: string;
    cantidadDisponible: number;
    tiempoDespacho?: number;
  }) => post('/api/inventory', body),
  getCities: () => get('/api/cities'),

  // ---------- Personas ----------
  getStaffByRole: (role: 'asesor' | 'calidad') => get(`/api/users?role=${role}`),
  getEmployees: () => get('/api/admin/employees'),
  createEmployee: (body: {
    email: string;
    nombre: string;
    apellido: string;
    telefono?: string;
    rol: string;
    password: string;
    documentId?: string;
    company?: string;
    city?: string;
  }) => post('/api/admin/employees', body),
  updateEmployee: (
    id: string,
    body: { nombre?: string; apellido?: string; telefono?: string; rol?: string; activo?: boolean; password?: string },
  ) => patch(`/api/admin/employees/${id}`, body),
};
