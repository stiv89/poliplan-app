# Correos con Brevo (Supabase Auth + avisos de horario)

PoliPlan envía correos desde **PoliPlan `<noreply@poliplan.app>`** usando [Brevo](https://www.brevo.com).

## Variables (.env.admin y secrets de Edge Functions)

| Variable | Uso |
|----------|-----|
| `BREVO_API_KEY` o `BREVOKEY` | API key de Brevo (Transactional) |
| `EMAIL_FROM` | `noreply@poliplan.app` |
| `EMAIL_FROM_NAME` | `PoliPlan` |
| `APP_URL` | `https://poliplan.app` (logo y links en plantillas) |
| `SEND_EMAIL_HOOK_SECRET` | Secret del hook Send Email (Auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Para `notify-schedule-update` |

## 1. Auth (OTP / magic link / recuperación)

La app usa **`signInWithOtp`** de Supabase Auth (sin contraseña). Los correos los envía la Edge Function **`auth-send-email`** vía Brevo, con plantillas minimalistas y logo.

### Desplegar

```bash
supabase functions deploy auth-send-email --no-verify-jwt
supabase secrets set BREVO_API_KEY=... APP_URL=https://poliplan.app EMAIL_FROM=noreply@poliplan.app
```

### Activar en Supabase Dashboard

1. **Authentication → Hooks → Send Email → Enable**
2. URL: `https://<project-ref>.supabase.co/functions/v1/auth-send-email`
3. Generá el secret y guardalo en **Edge Function Secrets** como `SEND_EMAIL_HOOK_SECRET` (mismo valor en el hook)
4. Desactivá el SMTP por defecto de Supabase si el hook reemplaza todo el envío

### Tipos de correo Auth

| Evento | Plantilla |
|--------|-----------|
| Primer acceso / registro | Bienvenida + enlace o código OTP |
| Inicio de sesión | Enlace o código OTP |
| Recuperación | Enlace de acceso |
| Cambio de correo | Confirmación |

## 2. Aviso de horario actualizado

Cuando se importa una **nueva versión** de un periodo, la Edge Function **`notify-schedule-update`** avisa por correo a usuarios que:

- Tienen al menos un `user_schedules` en ese **mismo periodo**
- Tienen `notify_schedule_updates = true` en su perfil (default: sí)

Se dispara automáticamente al final de `import:schedule` / `admin:fresh-start`.

### Desplegar

```bash
supabase functions deploy notify-schedule-update --no-verify-jwt
```

La función solo acepta llamadas con **service role** (importador admin o CI).

### Probar manualmente

```bash
npm run admin:notify-schedule -- --period-id=aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1
```

## 3. Logo en correos

El logo se sirve desde la app en `/email/poliplan-logo.png` (carpeta `public/email/`). Asegurate de que `APP_URL` apunte al dominio donde está desplegada la web.

## 4. Migración

Aplicá `supabase/migrations/20260708160000_email_notifications.sql`:

- `profiles.notify_schedule_updates`
- trigger `on_auth_user_created` (crea perfil al registrarse)
- RPC `get_schedule_update_recipients(period_id)`

## Checklist producción

- [ ] Dominio `poliplan.app` verificado en Brevo
- [ ] Remitente `noreply@poliplan.app` autorizado
- [ ] Edge Functions desplegadas + secrets
- [ ] Hook Send Email activo
- [ ] Migración aplicada en Supabase remoto
