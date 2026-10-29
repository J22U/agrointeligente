export const PALETA = ['#2f7d46', '#8fc66b', '#f2c14e', '#c58b5a', '#6aa6c8', '#a58bd0']
type D = { label: string; value: number }
type P = { data: D[]; fmt: (n: number) => string; color?: string }
export const Bars = ({ data, fmt, color = '#2f7d46' }: P) => {
  const max = Math.max(...data.map(d => d.value), 1)
  return <ul className="bars">{data.map(d => <li key={d.label}><span className="bl">{d.label}</span><span className="bt"><span style={{ width: `${(d.value / max) * 100}%`, background: color }} /></span><b>{fmt(d.value)}</b></li>)}</ul>
}
export const Columns = ({ data, fmt, color = '#2f7d46' }: P) => {
  const max = Math.max(...data.map(d => d.value), 1)
  return <div className="cols">{data.map(d => <div key={d.label} className="col"><span className="cv">{d.value > 0 ? fmt(d.value) : ''}</span><span className="cb"><span style={{ height: `${(d.value / max) * 100}%`, background: color }} /></span><span className="cl">{d.label}</span></div>)}</div>
}
export const Donut = ({ data, fmt }: Omit<P, 'color'>) => {
  const total = data.reduce((a, d) => a + d.value, 0) || 1; const C = 2 * Math.PI * 40; let acc = 0
  return <div className="donut"><svg viewBox="0 0 100 100" role="img" aria-label="Distribución de gastos"><circle cx="50" cy="50" r="40" fill="none" stroke="#eef3ec" strokeWidth="16" />
    {data.map((d, i) => { const len = (d.value / total) * C; const el = <circle key={d.label} cx="50" cy="50" r="40" fill="none" stroke={PALETA[i % PALETA.length]} strokeWidth="16" strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-acc} transform="rotate(-90 50 50)" />; acc += len; return el })}</svg>
    <ul>{data.map((d, i) => <li key={d.label}><i style={{ background: PALETA[i % PALETA.length] }} />{d.label}<b>{fmt(d.value)}</b></li>)}</ul></div>
}
