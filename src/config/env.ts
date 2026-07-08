import { z } from 'zod'

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  VITE_USE_SAMPLE_DATA: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => value === 'true'),
})

function parseEnv() {
  const result = envSchema.safeParse(import.meta.env)

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('\n')
    throw new Error(`Variables de entorno inválidas:\n${details}`)
  }

  const useSampleData = result.data.VITE_USE_SAMPLE_DATA ?? false
  const hasSupabase =
    Boolean(result.data.VITE_SUPABASE_URL) &&
    Boolean(result.data.VITE_SUPABASE_PUBLISHABLE_KEY)

  if (!useSampleData && !hasSupabase) {
    throw new Error(
      'Configuración incompleta: definí VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY, ' +
        'o activá VITE_USE_SAMPLE_DATA=true para desarrollo offline.',
    )
  }

  return {
    VITE_SUPABASE_URL: result.data.VITE_SUPABASE_URL ?? '',
    VITE_SUPABASE_PUBLISHABLE_KEY: result.data.VITE_SUPABASE_PUBLISHABLE_KEY ?? '',
    VITE_USE_SAMPLE_DATA: useSampleData,
    isSupabaseConfigured: hasSupabase,
  }
}

export const env = parseEnv()
