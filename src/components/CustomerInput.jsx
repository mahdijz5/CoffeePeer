import { useState } from 'react'
import { useStore } from '../store/index.js'
import { normName } from '../lib/format.js'

const MAX = 6

/** Name field with a dropdown of existing customers that match what is being typed. */
export default function CustomerInput({ value, onChange, placeholder = 'نام مشتری (اختیاری)' }) {
  const customers = useStore((s) => s.customers)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const q = normName(value)
  const matches = q ? customers.filter((c) => c.key.includes(q)).slice(0, MAX) : customers.slice(0, MAX)
  const exact = customers.some((c) => c.key === q)
  const showList = open && (matches.length > 0 || (q && !exact))

  const pick = (c) => { onChange(c.name); setOpen(false); setActive(-1) }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, matches.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && showList && matches[active]) { e.preventDefault(); pick(matches[active]) }
    else if (e.key === 'Escape' && showList) { e.stopPropagation(); setOpen(false) } // keep the sheet open
  }

  return (
    <div className="combo">
      <input
        dir="auto"
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul className="suggest" role="listbox">
          {matches.map((c, i) => (
            // onMouseDown (not onClick) so the input's blur doesn't close the list before the pick lands
            <li key={c.key} role="option" aria-selected={i === active} className={i === active ? 'on' : ''} onMouseDown={(e) => { e.preventDefault(); pick(c) }}>
              <span>{c.name}</span>
            </li>
          ))}
          {q && !exact && <li className="new" aria-hidden="true">مشتری جدید «{value.trim()}» ذخیره می‌شود</li>}
        </ul>
      )}
    </div>
  )
}
