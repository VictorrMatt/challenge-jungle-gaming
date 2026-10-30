/** Honors the OS "reduce motion" setting for every scripted scroll. */
export function smooth(): ScrollBehavior {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ? 'auto'
    : 'smooth'
}
