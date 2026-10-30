import { expect, test } from 'vitest'
import { construirPDF } from '../lib/pdf'
const gastos = Array.from({ length: 45 }, (_, i) => ({ fecha: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`, lote: 'Lote 01 · Cebolla', tipo: 'Insumos', monto: '$ ' + (120000 + i * 1000), nota: 'Compra de abono orgánico y herramientas' }))
test('genera un PDF válido con varias páginas', () => {
  const doc = construirPDF({ fmt: n => '$ ' + n, filtros: ['Todos los lotes', 'Todo el periodo'], resumen: { costos: '$ 5.400.000', produccion: '1200 kg', ingresos: '$ 8.100.000', margen: '$ 2.700.000', costoUnidad: '$ 4.500 por kg' },
    porTipo: [{ nombre: 'Insumos', valor: 3000000 }, { nombre: 'Mano de obra', valor: 2000000 }, { nombre: 'Transporte', valor: 400000 }], gastos,
    cosechas: [{ fecha: '2026-10-20', lote: 'Lote 01 · Cebolla', cantidad: '1300 kg', perdidas: '100', precio: '$ 6.750/kg' }] })
  const buf = new Uint8Array(doc.output('arraybuffer')); expect(String.fromCharCode(...buf.slice(0, 5))).toBe('%PDF-'); expect(doc.getNumberOfPages()).toBeGreaterThan(1)
})
test('PDF sin datos no falla', () => {
  const doc = construirPDF({ fmt: n => String(n), filtros: [], resumen: { costos: '$ 0', produccion: '-', ingresos: '-', margen: '-', costoUnidad: '-' }, porTipo: [], gastos: [], cosechas: [] }); expect(doc.getNumberOfPages()).toBe(1)
})
