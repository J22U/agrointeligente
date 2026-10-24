import { expect, test } from 'vitest'
import { summarize, toCsv } from '../lib/finance'
test('margen bruto y costo por unidad', () => {
  const r = summarize([{ amount: 100, spent_on: '2026-01-01' }], [{ quantity: 60, losses: 10, unit_price: 4, harvested_on: '2026-02-01' }])
  expect(r.income).toBe(200); expect(r.grossMargin).toBe(100); expect(r.costPerUnit).toBe(2)
})
test('sin precio no inventa ingresos', () => {
  const r = summarize([], [{ quantity: 5, losses: 0, unit_price: null, harvested_on: '2026-02-01' }])
  expect(r.income).toBeNull(); expect(r.grossMargin).toBeNull()
})
test('filtro por fechas', () => {
  expect(summarize([{ amount: 5, spent_on: '2026-01-01' }, { amount: 7, spent_on: '2026-03-01' }], [], '2026-02-01').cost).toBe(7)
})
test('csv escapa comillas', () => { expect(toCsv([{ a: 'x"y' }])).toBe('a\n"x""y"') })
