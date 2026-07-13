interface AuthErrorLike {
  message?: string
  status?: number
  code?: string
  msg?: string
  error_description?: string
}

function mapAuthMessage(message: string): string {
  const trimmed = message.trim()
  if (!trimmed || trimmed === '{}') {
    return AUTH_ERROR_MESSAGES.unexpected_failure!
  }

  if (/error sending confirmation email|unable to process request/i.test(trimmed)) {
    return 'No pudimos enviar el correo de verificación. Revisá el hook auth-send-email y Brevo en Supabase.'
  }
  if (/invalid login credentials/i.test(trimmed)) {
    return AUTH_ERROR_MESSAGES.invalid_credentials!
  }
  if (/email not confirmed/i.test(trimmed)) {
    return AUTH_ERROR_MESSAGES.email_not_confirmed!
  }
  if (/email rate limit exceeded|over_email_send_rate_limit/i.test(trimmed)) {
    return AUTH_ERROR_MESSAGES.over_email_send_rate_limit!
  }
  if (/rate limit/i.test(trimmed)) {
    return AUTH_ERROR_MESSAGES.over_request_rate_limit!
  }

  return trimmed
}

export function toAuthErrorMessage(error: unknown): string {
  return formatAuthError(error)
}

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  email_address_invalid: 'El correo no es válido.',
  email_address_not_authorized: 'Ese correo no está autorizado para registrarse.',
  user_already_exists: 'Ya existe una cuenta con este correo. Iniciá sesión.',
  signup_disabled: 'El registro está deshabilitado temporalmente.',
  email_not_confirmed:
    'Tu correo aún no está confirmado. Ingresá el código OTP que te enviamos.',
  invalid_credentials: 'Correo o contraseña incorrectos.',
  over_request_rate_limit: 'Demasiados intentos desde tu conexión. Esperá unos minutos e intentá de nuevo.',
  over_email_send_rate_limit:
    'Llegamos al límite de correos por hora. Esperá unos 60 minutos o revisá el código que ya te enviamos.',
  unexpected_failure:
    'Falló el envío del correo de verificación. Revisá el hook auth-send-email y Brevo en Supabase.',
  hook_payload_invalid: 'Error de configuración del hook de correo en Supabase.',
  hook_timeout: 'El envío del correo tardó demasiado. Probá de nuevo.',
}

export function isEmailRateLimitError(error: unknown): boolean {
  if (typeof error === 'string') {
    return /email rate limit exceeded|límite de correos por hora/i.test(error)
  }
  if (typeof error === 'object' && error !== null) {
    const code = getAuthErrorCode(error)
    if (code === 'over_email_send_rate_limit') return true
    const message = (error as AuthErrorLike).message
    if (typeof message === 'string' && /email rate limit exceeded/i.test(message)) return true
  }
  return false
}

export function getAuthErrorCode(error: unknown): string | null {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as AuthErrorLike).code
    return typeof code === 'string' ? code : null
  }
  return null
}

export function formatAuthError(error: unknown): string {
  if (!error) return 'Ocurrió un error inesperado. Probá de nuevo.'
  if (typeof error === 'string') return mapAuthMessage(error)

  if (error instanceof Error) {
    if (error.message.trim()) return mapAuthMessage(error.message)
    if ('status' in error && (error as AuthErrorLike).status === 500) {
      return AUTH_ERROR_MESSAGES.unexpected_failure!
    }
  }

  if (typeof error === 'object' && error !== null) {
    const authError = error as AuthErrorLike
    const code = authError.code

    if (code && AUTH_ERROR_MESSAGES[code]) {
      return AUTH_ERROR_MESSAGES[code]!
    }

    const message = authError.message ?? authError.msg ?? authError.error_description
    if (typeof message === 'string' && message.trim()) {
      return mapAuthMessage(message)
    }

    if (authError.status === 500) {
      return AUTH_ERROR_MESSAGES.unexpected_failure!
    }
  }

  return 'Ocurrió un error inesperado. Probá de nuevo.'
}
