import { z } from 'zod'

/** Only same-app relative paths are accepted as post-login destinations (no open redirects). */
export function safeRedirect(value: string | undefined | null, fallback = '/') {
  if (
    !value ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.startsWith('/entrar') ||
    value.startsWith('/cadastro')
  ) {
    return fallback
  }
  return value
}

export const authSearchSchema = z.object({
  redirect: z.string().max(500).optional(),
})
