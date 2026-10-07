# ColorLink-ERP — despliegue

El ERP es una app estática (React) servida por nginx. Todo lo que muestra viene de la API real de ColorLink
(`/api/...`), que nginx reenvía al backend. No hay datos de ejemplo.

## Cómo encaja en el servidor

El ERP es **independiente de la tienda**: tiene su propio nodo de Tailscale (`colorlink-erp`) y su propia URL,
`https://colorlink-erp.<tu-tailnet>.ts.net`, publico por Tailscale Funnel (los empleados entran desde cualquier lugar, sin instalar Tailscale).
`docker-compose.yml` del backend (repo ColorLink) define `tailscale-erp` + `erp`. nginx sirve el ERP en el
puerto 8080 y reenvía `/api` al backend por la red interna de Docker (`http://tailscale:3000`).
La tienda sigue en `colorlink-web`; no comparten cookies de sesión.

## Pasos (en el servidor)

```bash
# 1. Backend
cd ~/ColorLink && git pull            # rama con los cambios del ERP
pnpm install
pnpm exec prisma migrate deploy       # rol "despachos", tablas de historial/despacho y columnas nuevas
pnpm exec prisma generate

# 2. ERP al lado del backend (debe quedar en ~/ColorLink-ERP)
cd ~/ColorLink-ERP && git pull

# 3. Levantar todo (crea el nodo colorlink-erp en Tailscale la primera vez)
cd ~/ColorLink && docker compose up -d --build
```

Requisito: `TS_AUTHKEY` en el `.env` debe ser una clave **reutilizable** (Tailscale → Settings → Keys → "Reusable"),
porque ahora se registran dos nodos. El HTTPS lo configura solo `tailscale/erp-serve.json` (no hay que correr `tailscale serve`).

El ERP queda en `https://colorlink-erp.<tu-tailnet>.ts.net`. Al ser publico, la seguridad depende de las contrasenas de los empleados: usa contrasenas fuertes y desactiva (campo `activo`) a quien deje de trabajar contigo. Para volverlo privado, quita la linea `AllowFunnel` de `tailscale/erp-serve.json`.

## Primer usuario de despachos / empleados

Entra al ERP con un administrador → módulo **Colaboradores** → crear empleado con rol *Jefe de Despachos*.
(Alternativa por consola: `pnpm exec tsx scripts/create-employee.ts` en el repo del backend.)

## Desarrollo local

```bash
pnpm install
COLORLINK_API=http://localhost:3000 pnpm dev   # Vite reenvía /api al backend
```
