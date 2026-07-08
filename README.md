# PoliPlan

PoliPlan es una aplicación web progresiva (PWA) para estudiantes universitarios. Permite consultar materias y secciones, armar un horario semanal, detectar superposiciones y consultar fechas de exámenes, con soporte offline-first.

## Tecnologías

- Vite + React + TypeScript
- React Router
- Tailwind CSS
- Supabase (datos oficiales remotos)
- Dexie / IndexedDB (persistencia local)
- vite-plugin-pwa
- Lucide React
- Zod
- Vitest + React Testing Library
- ESLint + Prettier

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
cp .env.example .env
```

## Configuración

### Variables de entorno

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_USE_SAMPLE_DATA=true
```

- Usá **sólo** la publishable/anon key en el frontend.
- **Nunca** expongas `service_role`, secret keys ni contraseñas de base de datos en Vite.

Para desarrollo sin Supabase, dejá `VITE_USE_SAMPLE_DATA=true`.

### Supabase

1. Creá un proyecto en Supabase.
2. Aplicá las migraciones de `supabase/migrations/`.
3. Completá `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en `.env`.
4. Opcional: ejecutá `supabase/seed.sql` en un entorno de prueba.

## Comandos

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run test
npm run test:run
npm run format
npm run typecheck
npm run import:schedule -- "./excel/archivo.xlsx" --dry-run --all-sheets --verbose
```

## Estructura del proyecto

```text
src/
  app/              Router, providers y App
  components/       UI reusable
  config/           env y constantes
  db/               Dexie / IndexedDB
  features/         módulos de dominio
  hooks/            online status, install prompt
  lib/              supabase, query keys
  pages/            vistas principales
  repositories/     acceso a datos
  services/         sincronización y versiones
  types/            tipos compartidos
  utils/            conflictos, fechas, horas
public/
  data/sample-schedule.json
  icons/            íconos PWA temporales
supabase/
  migrations/
scripts/import-schedule/
docs/
```

## Offline

- Los datos oficiales se guardan explícitamente en IndexedDB.
- Las selecciones del usuario se persisten localmente.
- El Service Worker cachea el app shell y assets estáticos.
- Si falla una sincronización, se conserva la última copia válida.

Ver `docs/OFFLINE.md`.

## Sincronización

`scheduleSyncService`:

1. Consulta la versión activa remota.
2. Compara con la versión local.
3. Descarga y valida datos si hay cambios.
4. Guarda en transacción Dexie.
5. Expone estados: `idle`, `checking`, `downloading`, `updated`, `offline`, `error`.

Se sincroniza al iniciar, al recuperar internet, manualmente y cada 30 minutos con la app abierta.

## Pruebas

```bash
npm run test:run
```

Incluye pruebas de conflictos, versiones, normalización, repositorio local y estado online/offline.

## Build

```bash
npm run build
npm run preview
```

## Deploy en Netlify

1. Conectá el repositorio.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Variables de entorno:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
5. Activá HTTPS y headers de PWA si lo necesitás.

## Reemplazar el logo

Reemplazá estos archivos temporales:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/icon-maskable-512.png`
- `public/favicon.png`

Los originales de marca están en `logos/`.

## Próximos pasos

1. Conectar Supabase con datos reales importados desde Excel.
2. Implementar parser del Excel institucional.
3. Activar GitHub Actions para detectar nuevas versiones.
4. Agregar Supabase Auth para sincronizar horarios entre dispositivos.
