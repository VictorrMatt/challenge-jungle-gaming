import { useState } from 'react'

/**
 * Returns a counter that increases every time `value` changes after the first render.
 * Use it as a React `key` (remounts the element, replaying its CSS animation) and only
 * apply the animation class when it is above zero, so nothing animates on page load.
 */
export function useBump(value: unknown) {
  const [state, setState] = useState({ value, bumps: 0 })
  if (!Object.is(state.value, value)) {
    const next = { value, bumps: state.bumps + 1 }
    setState(next)
    return next.bumps
  }
  return state.bumps
}
