import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import { getMenu } from '../lib/supabase'

const CATS = {
  specials:  { icon: '⚡', label: 'Specials',  color: '#F0C040' },
  drinks:    { icon: '🍺', label: 'Drinks',    color: '#C9922A' },
  cocktails: { icon: '🍹', label: 'Cocktails', color: '#CC2200' },
  shots:     { icon: '🥃', label: 'Shots',     color: '#C9922A' },
  food:      { icon: '🍔', label: 'Food',      color: '#C9922A' },
}

export default function Menu() {
  const { venue } = useStore()
  const [items,     setItems]    = useState([])
  const [loading,   setLoading]  = useState(true)
  const [activeCat, setActiveCat] = useState('specials')

  useEffect(() => {
    if (!venue) return
    getMenu(venue.id).then((data) => {
      setItems(data)
      const cats = [...new Set(data.map((i) => i.category))]
      if (cats.includes('specials')) setActiveCat('specials')
      else if (cats.length) setActiveCat(cats[0])
    }).finally(() => setLoading(false))
  }, [venue])

  const categories = [...new Set(items.map((i) => i.category))]
  const visible    = items.filter((i) => i.category === activeCat)

  return (
    <div className="h-full flex flex-col page-enter">

      <div className="flex-shrink-0 px-4 pt-5 pb-3">
        <p className="font-script text-sm" style={{ color: '#C9922A88' }}>Tonight's</p>
        <h1 className="font-display text-4xl tracking-wider leading-none" style={{
          background: 'linear-gradient(180deg, #F0C040, #C9922A, #7A5C10)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>
          MENU
        </h1>
      </div>

      <div className="chain-divider mx-4 mb-3 flex-shrink-0" />

      {/* Category tabs */}
      <div className="flex-shrink-0 px-4 flex gap-2 overflow-x-auto pb-3">
        {categories.map((cat) => {
          const m = CATS[cat] || { icon: '🍽️', label: cat, color: '#C9922A' }
          const active = cat === activeCat
          return (
            <button
              key={cat}
              onClick={() => setActiveCat(cat)}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full
                font-display text-sm tracking-wide transition-all btn-press"
              style={active ? {
                background: `linear-gradient(135deg, ${m.color}, ${m.color}99)`,
                color: '#0B0A07',
                boxShadow: `0 2px 10px ${m.color}44`,
              } : {
                background: '#252218',
                color: '#7A6A50',
                border: '1px solid #3A3220',
              }}
            >
              <span>{m.icon}</span>
              <span>{m.label}</span>
            </button>
          )
        })}
      </div>

      {/* Items */}
      <div className="flex-1 scroll-area px-4 pb-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-3xl animate-spin">🐾</div>
          </div>
        ) : visible.length === 0 ? (
          <p className="text-muted text-sm font-body text-center py-12">Nothing here tonight</p>
        ) : (
          visible.map((item) => <MenuCard key={item.id} item={item} />)
        )}
      </div>
    </div>
  )
}

function MenuCard({ item }) {
  const isSpecial  = item.is_special || item.category === 'specials'
  const isFeatured = item.is_featured

  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: isSpecial
          ? 'linear-gradient(145deg, #2A2010, #1A1712)'
          : 'linear-gradient(145deg, #252218, #1A1712)',
        border: isSpecial ? '1px solid #C9922A55' : '1px solid #3A3220',
        boxShadow: isSpecial ? '0 4px 20px #C9922A11' : 'none',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg tracking-wide"
                style={{ color: isSpecial ? '#F0C040' : '#F5E0C0' }}>
              {item.name}
            </h3>
            {isSpecial && (
              <span className="text-[9px] font-display tracking-widest px-2 py-0.5 rounded-full uppercase"
                    style={{ background: '#C9922A22', color: '#F0C040', border: '1px solid #C9922A44' }}>
                Special
              </span>
            )}
            {isFeatured && !isSpecial && (
              <span className="text-[9px] font-display tracking-widest px-2 py-0.5 rounded-full uppercase"
                    style={{ background: '#CC220022', color: '#FF3B1A', border: '1px solid #CC220044' }}>
                Featured
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-muted text-xs font-body mt-1 leading-relaxed">{item.description}</p>
          )}

          {(item.available_from || item.available_until) && (
            <p className="text-xs font-body mt-1.5 italic" style={{ color: '#F0C04077' }}>
              {item.available_from && `From ${item.available_from}`}
              {item.available_from && item.available_until && ' – '}
              {item.available_until && `Until ${item.available_until}`}
            </p>
          )}
        </div>

        {item.price && (
          <div className="flex-shrink-0 score-font text-xl"
               style={{ color: isSpecial ? '#F0C040' : '#BFA882' }}>
            ${parseFloat(item.price).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  )
}
