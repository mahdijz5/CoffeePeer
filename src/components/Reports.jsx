import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../store/index.js'
import { buildReport, margin, net, topItems } from '../lib/reports.js'
import { fmtNum, fmtMoney, fmtPct } from '../lib/format.js'

const PERIODS = [['day', 'روزانه'], ['week', 'هفتگی'], ['month', 'ماهانه']]
const SHOWN = { day: 14, week: 12, month: 12 } // how many recent buckets the chart shows

/** Daily / weekly / monthly report: chart of the recent periods, detail of the selected one, all-time totals. */
export default function Reports() {
  const sales = useStore((s) => s.sales)
  const expenses = useStore((s) => s.expenses)
  const [period, setPeriod] = useState('day')
  const [selected, setSelected] = useState(null)
  const chartRef = useRef(null)

  const { buckets, totals } = useMemo(() => buildReport(sales, period, expenses), [sales, period, expenses])
  const shown = buckets.slice(-SHOWN[period])
  const current = shown.find((b) => b.key === selected) || shown[shown.length - 1]
  const top = Math.max(1, ...shown.map((b) => Math.max(b.revenue, Math.abs(net(b)))))

  // RTL scrolls from the oldest bar; start at the newest (negative scrollLeft = toward the left end)
  useEffect(() => { if (chartRef.current) chartRef.current.scrollLeft = -chartRef.current.scrollWidth }, [period, shown.length])

  if (!current) return <p className="muted center">هنوز فروشی ثبت نشده تا گزارشی ساخته شود.</p>

  const cards = [
    ['سود خالص (پس از هزینه‌های عمومی)', fmtMoney(net(current)), net(current) < 0 ? 'bad' : 'good'], // first = full-width row
    ['فروش', fmtMoney(current.revenue), ''],
    ['هزینه تولید', fmtMoney(current.cogs), ''],
    ['سود فروش', fmtMoney(current.profit), current.profit < 0 ? 'bad' : 'good'],
    ['هزینه‌های عمومی', fmtMoney(current.expenses), current.expenses > 0 ? 'bad' : ''],
    ['حاشیه سود فروش', fmtPct(margin(current)), ''],
    ['تعداد فروش', fmtNum(current.units), ''],
  ]

  return (
    <section className="reports">
      <div className="seg" role="tablist">
        {PERIODS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={period === k} onClick={() => { setPeriod(k); setSelected(null) }}>{label}</button>
        ))}
      </div>

      <div className="panel">
        <div className="chart" key={period} ref={chartRef}>
          {shown.map((b, i) => (
            <button key={b.key} className="col" aria-pressed={b === current} onClick={() => setSelected(b.key)} style={{ '--i': i }}>
              <span className="bars">
                <i className="bar rev" style={{ '--h': `${(b.revenue / top) * 100}%` }} />
                <i className={`bar profit ${net(b) < 0 ? 'neg' : ''}`} style={{ '--h': `${(Math.abs(net(b)) / top) * 100}%` }} />
              </span>
              <small>{b.label}</small>
            </button>
          ))}
        </div>
        <div className="legend"><span><i className="sw rev" />فروش</span><span><i className="sw profit" />سود خالص</span></div>
      </div>

      <h2 className="sect">{current.label}</h2>
      <div className="stats hero">
        {cards.map(([label, value, tone], i) => (
          <div key={label} className={`stat ${tone}`} style={{ animationDelay: `${i * 50}ms` }}><b>{value}</b><span>{label}</span></div>
        ))}
      </div>

      {topItems(current).length > 0 && (
        <>
          <h2 className="sect">پرسودترین کالاها</h2>
          <div className="rows">
            {topItems(current).map((it, i) => (
              <article key={it.itemId} className="rowcard" style={{ '--i': i }}>
                <div className="rowcard-main"><b>{it.title}</b><small>{fmtNum(it.units)} عدد · فروش {fmtMoney(it.revenue)}</small></div>
                <div className="rowcard-amount"><b className={it.profit < 0 ? 'bad' : 'good'}>{fmtMoney(it.profit)}</b></div>
              </article>
            ))}
          </div>
        </>
      )}

      <h2 className="sect">از ابتدا تا امروز</h2>
      <div className="stats hero">
        <div className={`stat ${net(totals) < 0 ? 'bad' : 'good'}`}><b>{fmtMoney(net(totals))}</b><span>سود خالص (پس از هزینه‌های عمومی)</span></div>
        <div className="stat"><b>{fmtMoney(totals.revenue)}</b><span>فروش</span></div>
        <div className="stat"><b>{fmtMoney(totals.cogs)}</b><span>هزینه تولید</span></div>
        <div className={`stat ${totals.profit < 0 ? 'bad' : 'good'}`}><b>{fmtMoney(totals.profit)}</b><span>سود فروش</span></div>
        <div className={`stat ${totals.expenses > 0 ? 'bad' : ''}`}><b>{fmtMoney(totals.expenses)}</b><span>هزینه‌های عمومی</span></div>
      </div>
    </section>
  )
}
