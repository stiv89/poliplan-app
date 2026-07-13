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

## 1. Auth (registro con contraseña + OTP)

La app registra con **correo, nombre y contraseña** (`signUp`). Supabase envía un **código OTP** de 6 dígitos; la Edge Function **`auth-send-email`** lo entrega vía Brevo (`renderOtpEmail`).

El inicio de sesión usa **correo + contraseña** (`signInWithPassword`).

### Desplegar

```bash
supabase functions deploy auth-send-email --no-verify-jwt
supabase secrets set BREVO_API_KEY=... APP_URL=https://poliplan.app EMAIL_FROM=noreply@poliplan.app
```

### Activar en Supabase Dashboard

1. **Authentication → Hooks → Send Email → Enable**
2. URL: `https://<project-ref>.supabase.co/functions/v1/auth-send-email`
3. Generá el secret y guardalo en **Edge Function Secrets** como `SEND_EMAIL_HOOK_SECRET` (mismo valor que en el hook, incluyendo el prefijo `v1,whsec_` si lo muestra el dashboard)
4. Desactivá el SMTP por defecto de Supabase si el hook reemplaza todo el envío

### Si aparece "email rate limit exceeded"

Supabase limita cuántos correos de auth puede disparar el proyecto por hora (por defecto **2/h** si no configuraste SMTP propio).

Durante pruebas repetidas de "Crear cuenta" o "Reenviar código" es normal topar el límite.

**Qué hacer ahora**
- Revisá la bandeja: puede que **ya te haya llegado un código** de un intento anterior.
- Esperá ~1 hora antes de volver a pedir otro correo al mismo email.

**Para desarrollo / producción**
- Dashboard → **Authentication → Rate Limits** → subí `Rate limit for sending emails` (p. ej. 30).
- Con hook Brevo activo, conviene subir ese límite porque cada signup/resend cuenta igual.

### Si signup devuelve 500

Supabase llama al hook **Send Email** al registrar. Si la función no existe, la firma falla o Brevo rechaza el envío, el signup responde 500.

**Diagnóstico rápido (local):**

```bash
npm run admin:verify-auth-email
```

Si devuelve **404**, la función **no está desplegada** en el proyecto remoto.

Checklist:

1. **Edge Function desplegada**
   ```bash
   supabase functions deploy auth-send-email --no-verify-jwt
   ```
2. **Secrets en el proyecto** (Dashboard → Edge Functions → Secrets):
   - `BREVO_API_KEY` (o `BREVOKEY`)
   - `EMAIL_FROM=noreply@poliplan.app`
   - `EMAIL_FROM_NAME=PoliPlan`
   - `APP_URL=https://poliplan.app`
   - `SEND_EMAIL_HOOK_SECRET` (mismo valor que en el hook)
3. **Hook activo**: Authentication → Hooks → Send Email → URL
   `https://sfyovljgzriaquguygte.supabase.co/functions/v1/auth-send-email`
4. **Redirect URLs**: Authentication → URL Configuration → agregar
   `http://localhost:5173/**` para desarrollo local
5. **Logs**: Edge Functions → auth-send-email → Logs (ver error de Brevo o secret inválido)

### Si login devuelve 400

- **Correo o contraseña incorrectos**: credenciales inválidas.
- **Email not confirmed**: la cuenta existe pero falta ingresar el código OTP del correo.

## Tipos de correo Auth

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
