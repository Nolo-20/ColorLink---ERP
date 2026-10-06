# ColorLink-ERP — despliegue

El ERP es una app estática (React) servida por nginx. Todo lo que muestra viene de la API real de ColorLink
(`/api/...`), que nginx reenvía al backend. No hay datos de ejemplo.

## Cómo encaja en el servidor

`docker-compose.yml` del backend (repo ColorLink) define el servicio `erp`, que comparte la red del contenedor
`colorlink-tailscale`. Por eso nginx llega al backend en `127.0.0.1:3000` y el ERP queda en el puerto `8080`
del mismo nodo Tailscale.

## Pasos (en el servidor)

```bash
# 1. Backend
cd ~/ColorLink && git pull            # rama con los cambios del ERP
pnpm install
pnpm exec prisma migrate deploy       # crea el rol "despachos", tablas de historial/despacho y columnas nuevas
pnpm exec prisma generate

# 2. ERP al lado del backend
cd ~ && git clone https://github.com/Nolo-20/ColorLink---ERP.git ColorLink-ERP   # o git pull si ya existe

# 3. Levantar todo
cd ~/ColorLink && docker compose up -d --build

# 4. HTTPS para el ERP (la cookie de sesión es Secure en producción)
docker exec colorlink-tailscale tailscale serve --bg --https=8443 http://127.0.0.1:8080
```

El ERP queda en `https://<nombre-del-nodo>.<tailnet>.ts.net:8443`.

> El compose espera el ERP en `../ColorLink-ERP`. Si lo clonaste en otra ruta, ajusta `build:` del servicio `erp`.

## Primer usuario de despachos / empleados

Entra al ERP con un administrador → módulo **Colaboradores** → crear empleado con rol *Jefe de Despachos*.
(Alternativa por consola: `pnpm exec tsx scripts/create-employee.ts` en el repo del backend.)

## Desarrollo local

```bash
pnpm install
COLORLINK_API=http://localhost:3000 pnpm dev   # Vite reenvía /api al backend
```
