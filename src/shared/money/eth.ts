/**
 * Exact ETH arithmetic.
 *
 * ETH amounts travel as decimal strings (e.g. "1.19", "0.016") across REST, sockets and UI.
 * Every calculation converts them to a `bigint` in wei (18 decimals), operates on integers and
 * converts back — never through `number` — so totals are always exact.
 */
export type EthString = string & { readonly __brand?: 'EthString' }

export const ETH_DECIMALS = 18
const SCALE = 10n ** BigInt(ETH_DECIMALS)
const ETH_PATTERN = /^\d+(\.\d{1,18})?$/

export function isEthString(value: unknown): value is EthString {
  return typeof value === 'string' && ETH_PATTERN.test(value)
}

/** Parses a non-negative decimal string into wei. Throws on malformed input. */
export function toWei(value: EthString): bigint {
  if (!isEthString(value)) throw new TypeError(`Invalid ETH amount: "${value}"`)
  const [whole = '0', fraction = ''] = value.split('.')
  return BigInt(whole) * SCALE + BigInt(fraction.padEnd(ETH_DECIMALS, '0'))
}

/** Converts wei back into the canonical decimal string (no trailing zeros, at least 2 decimals). */
export function fromWei(wei: bigint): EthString {
  if (wei < 0n) throw new RangeError('ETH amounts cannot be negative')
  const whole = wei / SCALE
  const fraction = (wei % SCALE).toString().padStart(ETH_DECIMALS, '0').replace(/0+$/, '')
  return `${whole}.${fraction.padEnd(2, '0')}`
}

export function add(...values: EthString[]): EthString {
  return fromWei(values.reduce((sum, value) => sum + toWei(value), 0n))
}

/** a − b, clamped at zero (a discount can never make a total negative). */
export function subtract(a: EthString, b: EthString): EthString {
  const result = toWei(a) - toWei(b)
  return fromWei(result > 0n ? result : 0n)
}

export function multiply(value: EthString, quantity: number): EthString {
  if (!Number.isInteger(quantity) || quantity < 0) {
    throw new RangeError(`Quantity must be a non-negative integer, received ${quantity}`)
  }
  return fromWei(toWei(value) * BigInt(quantity))
}

/** Applies a percentage expressed in basis points (1000 = 10%), rounding down to the wei. */
export function percentage(value: EthString, basisPoints: number): EthString {
  if (!Number.isInteger(basisPoints) || basisPoints < 0) {
    throw new RangeError(`Basis points must be a non-negative integer, received ${basisPoints}`)
  }
  return fromWei((toWei(value) * BigInt(basisPoints)) / 10_000n)
}

export function compare(a: EthString, b: EthString): -1 | 0 | 1 {
  const diff = toWei(a) - toWei(b)
  return diff === 0n ? 0 : diff > 0n ? 1 : -1
}

export function isEqual(a: EthString, b: EthString): boolean {
  return compare(a, b) === 0
}

export function min(a: EthString, b: EthString): EthString {
  return compare(a, b) <= 0 ? a : b
}

/** Normalizes any valid representation ("1.190", "01.19") to the canonical one ("1.19"). */
export function normalize(value: EthString): EthString {
  return fromWei(toWei(value))
}

/** Display helper: "1.19 ETH". Purely presentational; never feed the output back into math. */
export function formatEth(value: EthString, { withUnit = true } = {}): string {
  const canonical = normalize(value)
  return withUnit ? `${canonical} ETH` : canonical
}
