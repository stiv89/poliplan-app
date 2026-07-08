# Funcionamiento offline

## Objetivo

Permitir consultar materias, armar horarios y detectar conflictos sin conexión, usando la última copia válida descargada.

## Componentes

- **IndexedDB (Dexie)** — fuente de verdad local para datos oficiales cacheados y selecciones del usuario.
- **Service Worker (vite-plugin-pwa)** — cachea HTML, JS, CSS, íconos y assets estáticos.
- **useOnlineStatus** — escucha eventos `online` / `offline` y muestra avisos discretos.
- **scheduleSyncService** — al recuperar internet, compara versiones y descarga cambios.

## Qué se guarda localmente

- Periodos, carreras, materias, secciones, reuniones y exámenes cacheados.
- Versión activa del horario (`localScheduleVersions`).
- Secciones seleccionadas por el usuario (`selectedSections`).
- Preferencias (`settings`).

## Qué no hace el Service Worker

No reemplaza IndexedDB como almacenamiento principal de horarios. El caché HTTP sólo garantiza que la aplicación abra sin red después de la primera carga.

## Recuperación de conexión

1. Se muestra “Conexión recuperada. Buscando actualizaciones.”
2. `scheduleSyncService` consulta la versión activa remota.
3. Si hay una versión más nueva, descarga y reemplaza la caché en una transacción Dexie.
4. Las selecciones del usuario se mantienen.

## Modo desarrollo sin Supabase

Con `VITE_USE_SAMPLE_DATA=true`, la app usa `public/data/sample-schedule.json` como fuente local.
