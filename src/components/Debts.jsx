import { useState } from 'react'
import { useStore } from '../store/index.js'
import { fmtNum, fmtMoney, normName } from '../lib/format.js'
import DebtCard from './DebtCard.jsx'
import PayDebtForm from './PayDebtForm.jsx'
import DebtForm from './DebtForm.jsx'

const FILTERS = [['open', 'باز'], ['settled', 'تسویه‌شده'], ['all', 'همه']]

/** All debts, newest first: summary, open/settled filter, search, pay and add buttons. */
export default function Debts() {
  const debts = useStore((s) => s.debts)
  const [filter, setFilter] = useState('open')
  const [search, setSearch] = useState('')
  const [paying, setPaying] = useState(null)
  const [adding, setAdding] = useState(false)

  const open = debts.filter((d) => d.remaining > 0)
  const owed = open.reduce((n, d) => n + d.remaining, 0)
  const debtors = new Set(open.map((d) => normName(d.customer))).size

  const q = normName(search)
  const rows = debts
    .filter((d) => (filter === 'all' ? true : filter === 'open' ? d.remaining > 0 : d.remaining <= 0))
    .filter((d) => !q || normName(d.customer).includes(q))
    .sort((a, b) => b.ts - a.ts)

  return (
    <section>
      <div className="stats debts">
        <div className={`stat ${owed > 0 ? 'bad' : ''}`}><b>{fmtMoney(owed)}</b><span>مجموع بدهی باز</span></div>
        <div className="stat"><b>{fmtNum(open.length)}</b><span>بدهی باز</span></div>
        <div className="stat"><b>{fmtNum(debtors)}</b><span>بدهکار</span></div>
      </div>

      <div className="toolbar">
        <div className="seg" role="tablist">
          {FILTERS.map(([k, label]) => (
            <button key={k} role="tab" aria-selected={filter === k} onClick={() => setFilter(k)}>{label}</button>
          ))}
        </div>
        <button className="btn primary" onClick={() => setAdding(true)}>+ بدهی دستی</button>
      </div>
      <input className="search" dir="auto" placeholder="جستجوی مشتری…" value={search} onChange={(e) => setSearch(e.target.value)} />

      {rows.length === 0 ? (
        <p className="muted center">{debts.length === 0 ? 'هنوز بدهی‌ای ثبت نشده. هنگام «فروش» مبلغ پرداخت‌شده را کمتر بزنید یا بدهی دستی اضافه کنید.' : 'بدهی‌ای پیدا نشد.'}</p>
      ) : (
        <div className="rows">{rows.map((d) => <DebtCard key={d.id} debt={d} onPay={setPaying} />)}</div>
      )}

      {paying && <PayDebtForm debt={debts.find((d) => d.id === paying.id) || paying} onClose={() => setPaying(null)} />}
      {adding && <DebtForm onClose={() => setAdding(false)} />}
    </section>
  )
}
