/** Item icon, or a colored initial (hue derived from the title) when none is set. */
export default function ItemAvatar({ title = '', icon = '', className = '' }) {
  const hue = [...title].reduce((h, c) => (h + c.charCodeAt(0)) % 360, 20)
  return (
    <div className={`avatar ${className}`} style={{ '--h': hue }}>
      {icon ? <img src={icon} alt="" draggable="false" /> : <span>{title.trim().charAt(0).toUpperCase() || '?'}</span>}
    </div>
  )
}
