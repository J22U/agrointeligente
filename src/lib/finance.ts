export interface Expense { amount: number; spent_on: string }
export interface Harvest { quantity: number; losses: number; unit_price: number | null; harvested_on: string }
const inRange = (d: string, from?: string, to?: string) => (!from || d >= from) && (!to || d <= to)
export function summarize(expenses: Expense[], harvests: Harvest[], from?: string, to?: string) {
  const cost = expenses.filter(e => inRange(e.spent_on, from, to)).reduce((s, e) => s + e.amount, 0)
  const hs = harvests.filter(h => inRange(h.harvested_on, from, to))
  const produced = hs.reduce((s, h) => s + (h.quantity - h.losses), 0)
  const hasPrice = hs.length > 0 && hs.every(h => h.unit_price !== null)
  // Ingreso = (cantidad - pérdidas) × precio. Margen bruto = ingreso - costos directos (no es utilidad neta).
  const income = hasPrice ? hs.reduce((s, h) => s + (h.quantity - h.losses) * (h.unit_price as number), 0) : null
  return { cost, produced, income, grossMargin: income === null ? null : income - cost, costPerUnit: produced > 0 ? cost / produced : null }
}
export function toCsv(rows: Record<string, string | number | null>[]) {
  if (!rows.length) return ''
  const h = Object.keys(rows[0]); const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`
  return [h.join(','), ...rows.map(r => h.map(k => q(r[k])).join(','))].join('\n')
}
