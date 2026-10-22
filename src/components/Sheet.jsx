import { useEffect } from 'react'

/** Bottom-sheet modal (centered on desktop): backdrop click or Esc closes. */
export default function Sheet({ title, onClose, onSubmit, wide = false, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form className={`sheet ${wide ? 'wide' : ''}`} onSubmit={onSubmit}>
        <div className="sheet-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="بستن">✕</button>
        </div>
        {children}
      </form>
    </div>
  )
}
