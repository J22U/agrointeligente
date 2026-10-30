import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
export type Informe = {
  fmt: (n: number) => string; filtros: string[]
  resumen: { costos: string; produccion: string; ingresos: string; margen: string; costoUnidad: string }
  porTipo: { nombre: string; valor: number }[]
  gastos: { fecha: string; lote: string; tipo: string; monto: string; nota: string }[]
  cosechas: { fecha: string; lote: string; cantidad: string; perdidas: string; precio: string }[]
}
type RGB = [number, number, number]
const PAL: RGB[] = [[47, 125, 70], [143, 198, 107], [242, 193, 78], [197, 139, 90]]
const t = (x: string) => x.replace(/\u2014/g, '-').replace(/[\u00a0\u202f]/g, ' ')
const fit = (doc: jsPDF, s: string, w: number, size: number) => { doc.setFontSize(size); while (doc.getTextWidth(s) > w && size > 6) { size -= 0.5; doc.setFontSize(size) } }
const finalY = (doc: jsPDF) => (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY
const titulo = (doc: jsPDF, y: number, texto: string, need: number) => {
  if (y + need > 280) { doc.addPage(); y = 20 }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(12.5); doc.setTextColor(20, 48, 31); doc.text(texto, 14, y); return y + 6 }
export function construirPDF(d: Informe): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }); const W = 210, M = 14
  doc.setFillColor(20, 48, 31); doc.rect(0, 0, W, 30, 'F'); doc.setFillColor(143, 198, 107); doc.rect(0, 30, W, 1.2, 'F')
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text('AgroInteligente', M, 14)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5); doc.text('Informe de costos y cosechas', M, 22)
  doc.setFontSize(9); doc.text('Generado el ' + new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }), W - M, 14, { align: 'right' })
  doc.setTextColor(95, 112, 100); doc.setFontSize(9.5); doc.text(t(d.filtros.join('   |   ')), M, 39)
  const k: [string, string, RGB][] = [['Costos', d.resumen.costos, [230, 244, 227]], ['Producción neta', d.resumen.produccion, [238, 246, 220]], ['Ingresos', d.resumen.ingresos, [251, 240, 211]], ['Margen bruto', d.resumen.margen, [243, 233, 222]]]
  const cw = (W - 2 * M - 9) / 4
  k.forEach(([lab, val, col], i) => { const x = M + i * (cw + 3); doc.setFillColor(...col); doc.roundedRect(x, 44, cw, 21, 3, 3, 'F')
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(95, 112, 100); doc.text(lab, x + 3, 51)
    doc.setFont('helvetica', 'bold'); doc.setTextColor(20, 48, 31); fit(doc, t(val), cw - 6, 12); doc.text(t(val), x + 3, 60) })
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(95, 112, 100)
  const nota = doc.splitTextToSize(`Producción neta = cosechado - pérdidas. Ingresos = producción neta x precio de venta (solo si todas las cosechas tienen precio). Margen bruto = ingresos - costos registrados; no es utilidad neta.${d.resumen.costoUnidad !== '-' ? ' Costo por unidad: ' + t(d.resumen.costoUnidad) + '.' : ''}`, W - 2 * M)
  doc.text(nota, M, 71); let y = 71 + nota.length * 3.6 + 7
  if (d.porTipo.length) {
    y = titulo(doc, y, 'Costos por tipo', 30); const max = Math.max(...d.porTipo.map(p => p.valor), 1)
    d.porTipo.forEach((p, i) => { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(34, 48, 40); doc.text(t(p.nombre), M, y + 4)
      doc.setFillColor(...PAL[i % PAL.length]); doc.roundedRect(M + 42, y, Math.max(1.5, (p.valor / max) * 100), 5, 1.5, 1.5, 'F'); doc.text(t(d.fmt(p.valor)), W - M, y + 4, { align: 'right' }); y += 8 })
    y += 4 }
  const estilo = { theme: 'striped' as const, headStyles: { fillColor: [31, 90, 53] as RGB, textColor: 255 as number, fontStyle: 'bold' as const }, alternateRowStyles: { fillColor: [245, 249, 244] as RGB }, styles: { fontSize: 9, cellPadding: 2.2, textColor: [34, 48, 40] as RGB }, margin: { left: M, right: M } }
  y = titulo(doc, y, `Gastos (${d.gastos.length})`, 30)
  if (!d.gastos.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(95, 112, 100); doc.text('Sin registros con estos filtros.', M, y + 2); y += 12 }
  else { autoTable(doc, { ...estilo, startY: y, head: [['Fecha', 'Lote', 'Tipo', 'Monto', 'Nota']], body: d.gastos.map(g => [g.fecha, g.lote, g.tipo, t(g.monto), t(g.nota)]), columnStyles: { 3: { halign: 'right' } } }); y = finalY(doc) + 10 }
  y = titulo(doc, y, `Cosechas (${d.cosechas.length})`, 30)
  if (!d.cosechas.length) { doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5); doc.setTextColor(95, 112, 100); doc.text('Sin registros con estos filtros.', M, y + 2) }
  else autoTable(doc, { ...estilo, startY: y, head: [['Fecha', 'Lote', 'Cantidad', 'Pérdidas', 'Precio']], body: d.cosechas.map(c => [c.fecha, c.lote, c.cantidad, c.perdidas, t(c.precio)]), columnStyles: { 4: { halign: 'right' } } })
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) { doc.setPage(i); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(120, 135, 125); doc.text('AgroInteligente - datos registrados por el usuario', M, 290); doc.text(`Página ${i} de ${n}`, W - M, 290, { align: 'right' }) }
  return doc
}
export const exportarPDF = (d: Informe) => construirPDF(d).save('informe-agrointeligente.pdf')
