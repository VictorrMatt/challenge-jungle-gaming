/** Copies API `fieldErrors` into react-hook-form, returns whether any field matched. */
export function applyFieldErrors<T extends string>(
  fieldErrors: Record<string, string[]>,
  setError: (name: T, error: { message: string }, options?: { shouldFocus: boolean }) => void,
  fields: readonly T[],
) {
  let applied = false
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if ((fields as readonly string[]).includes(field) && messages[0]) {
      setError(field as T, { message: messages[0] }, { shouldFocus: !applied })
      applied = true
    }
  }
  return applied
}
