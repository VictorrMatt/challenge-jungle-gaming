import { describe, expect, it } from 'vitest'

import {
  add,
  compare,
  formatEth,
  fromWei,
  isEthString,
  multiply,
  normalize,
  percentage,
  subtract,
  toWei,
} from './eth'

describe('eth decimal arithmetic', () => {
  it('round-trips between decimal strings and wei', () => {
    expect(toWei('1')).toBe(10n ** 18n)
    expect(toWei('0.016')).toBe(16n * 10n ** 15n)
    expect(fromWei(toWei('26.846'))).toBe('26.846')
    expect(fromWei(1n)).toBe('0.000000000000000001')
  })

  it('keeps at least two decimals in canonical form', () => {
    expect(normalize('1')).toBe('1.00')
    expect(normalize('1.190')).toBe('1.19')
    expect(normalize('01.5')).toBe('1.50')
  })

  it('reproduces the Figma cart totals exactly', () => {
    const subtotal = add(multiply('1.19', 2), multiply('1.39', 6), multiply('1.79', 9))
    expect(subtotal).toBe('26.83')
    expect(add(subtotal, '0.016')).toBe('26.846')
  })

  it('avoids binary floating point drift', () => {
    expect(add('0.1', '0.2')).toBe('0.30')
    expect(multiply('0.07', 3)).toBe('0.21')
  })

  it('applies basis-point discounts rounding down to the wei', () => {
    expect(percentage('26.83', 1000)).toBe('2.683')
    expect(percentage('0.000000000000000003', 5000)).toBe('0.000000000000000001')
  })

  it('never returns negative totals', () => {
    expect(subtract('1.00', '2.50')).toBe('0.00')
  })

  it('compares values by magnitude, not by string', () => {
    expect(compare('10.0', '9.99')).toBe(1)
    expect(compare('1.10', '1.1')).toBe(0)
    expect(compare('0.39', '0.99')).toBe(-1)
  })

  it('rejects malformed input and fractional quantities', () => {
    expect(isEthString('1e3')).toBe(false)
    expect(isEthString('-1')).toBe(false)
    expect(() => toWei('abc')).toThrow(TypeError)
    expect(() => multiply('1.00', 1.5)).toThrow(RangeError)
  })

  it('formats for display', () => {
    expect(formatEth('1.190')).toBe('1.19 ETH')
    expect(formatEth('0.016', { withUnit: false })).toBe('0.016')
  })
})
