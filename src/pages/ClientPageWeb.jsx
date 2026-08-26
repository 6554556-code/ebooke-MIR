import { useState, useMemo, useRef, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Avatar from '../components/Avatar'
import ExecutorCard from '../components/ExecutorCard'
import { BrandMark, WebFooter, WebBaseStyles } from '../components/WebShell'
import useIsMobile from '../hooks/useIsMobile'
import UiIcon, { categoryIcon, iconSvgString } from '../components/UiIcon'
import { Y, GRADIENT, GRADIENT_SOFT } from '../webTheme'

const MOSCOW_CENTER = [55.7558, 37.6173]
const ROLE_BTN = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', height: 50,
  borderRadius: 13, fontSize: 16, fontWeight: 600,
  background: '#fff', color: '#332A3B', textDecoration: 'none', whiteSpace: 'nowrap',
  border: '1px solid #EEE6ED', boxShadow: '0 5px 18px rgba(55,25,52,.05)',
}

// ─── РЕКЛАМНЫЕ БАННЕРЫ (левая колонка) ──────────────────────────
// Как добавить: положи картинку в public/banners/ и допиши объект:
//   { image: '/banners/promo.jpg', link: 'https://...', alt: 'Скидка 20%' }
// link можно не указывать — тогда баннер просто картинка без клика.
// Пока список пуст — на его месте серая заглушка «рекламные баннеры».
const BANNERS = [
]

// Логотип и подвал с реквизитами переехали в src/components/WebShell.jsx —
// они общие для всех веб-экранов, правятся там в одном месте.

// Пин с иконкой категории (белый кружок + «хвостик»).
// Иконка берётся из professions.icon; когда будут свои картинки —
// достаточно подменить содержимое .eb-pin-head на <img src=...>.
// Стили жёлтого пина — общие для десктопной и мобильной раскладки
const PIN_CSS = `
  .eb-pin-head{width:42px;height:42px;background:#fff;border:2px solid rgba(233,87,197,.24);border-radius:50%;display:flex;align-items:center;justify-content:center;line-height:1;color:${Y};box-shadow:0 7px 18px rgba(105,37,89,.22);position:relative;transition:.18s ease}
  .eb-pin-head img{width:22px;height:22px;object-fit:contain}
  .eb-pin-head::after{content:"";position:absolute;bottom:-5px;left:50%;transform:translateX(-50%) rotate(45deg);width:12px;height:12px;background:#fff;border-right:2px solid rgba(233,87,197,.24);border-bottom:2px solid rgba(233,87,197,.24);border-radius:0 0 3px 0}
  .eb-pin-selected .eb-pin-head{width:52px;height:52px;background:linear-gradient(135deg,#E651C5,#FF9A67);border:3px solid #fff;box-shadow:0 10px 28px rgba(218,67,171,.42);transform:translateY(-3px)}
  .eb-pin-selected .eb-pin-head svg{stroke:#fff;color:#fff}
  .eb-pin-selected .eb-pin-head::after{background:#F174A2;border-color:#fff}
`

// Компактные кнопки ролей в мобильной шапке
const ROLE_M = {
  display: 'flex', alignItems: 'center', gap: 5, padding: '0 11px', height: 38,
  borderRadius: 11, fontSize: 14, fontWeight: 700, background: '#fff', border: '1px solid #EEE6ED',
  color: '#3E3E3E', textDecoration: 'none', whiteSpace: 'nowrap',
}

// Тап по пустому месту карты — закрыть нижнюю карточку
function MapTapCatcher({ onTap }) {
  useMapEvents({ click: onTap })
  return null
}


const pinCache = new Map()
function pinIcon(serviceCode, selected = false) {
  const iconName = categoryIcon(serviceCode)
  const key = `${iconName}-${selected ? 'selected' : 'idle'}`
  if (!pinCache.has(key)) {
    pinCache.set(key, L.divIcon({
      className: selected ? 'eb-pin eb-pin-selected' : 'eb-pin',
      html: `<div class="eb-pin-head">${iconSvgString(iconName, { size: 21 })}</div>`,
      iconSize: selected ? [52, 52] : [42, 42],
      iconAnchor: selected ? [26, 52] : [21, 42],
      popupAnchor: [0, selected ? -50 : -40],
    }))
  }
  return pinCache.get(key)
}

// Подводит карту к текущей выборке: выбран город — центрируемся на его исполнителях.
// Координаты берём из самих исполнителей, поэтому работает для любого города из базы.
function MapFocus({ pointsKey, points }) {
  const map = useMap()
  useEffect(() => {
    if (!points.length) return
    if (points.length === 1) {
      map.flyTo(points[0], 13, { duration: 0.8 })
    } else {
      map.flyToBounds(L.latLngBounds(points), { padding: [60, 60], maxZoom: 14, duration: 0.8 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, map])
  return null
}

// Обязательная атрибуция OSM без флага/«Leaflet»
function AttributionNoFlag() {
  const map = useMap()
  useEffect(() => {
    map.attributionControl?.remove()
    const ctrl = L.control.attribution({ prefix: false }).addAttribution('© OpenStreetMap').addTo(map)
    return () => ctrl.remove()
  }, [map])
  return null
}

function minPrice(services) {
  const prices = (services || []).filter(s => !s.is_archived && s.price != null).map(s => s.price)
  return prices.length ? Math.min(...prices) : null
}

// Что умеет исполнитель по типу визита (из его услуг):
//   inc — принимает у себя (🏠), out — выезжает (🚗).
function visitCaps(services) {
  const active = (services || []).filter(s => !s.is_archived)
  return {
    inc: active.some(s => s.location_type === 'incall' || s.location_type === 'both'),
    out: active.some(s => s.location_type === 'outcall' || s.location_type === 'both'),
  }
}

// Свободен ли исполнитель ближайшие 2 дня — тот же критерий, что у freeSoon-карусели.
function isFreeSoon(ex) {
  return (ex.todaySlots?.length > 0) || (ex.tomorrowSlots?.length > 0)
}

// Зелёный «неоновый» огонёк «свободен сегодня/завтра».
// Постоянный мягкий glow + расходящееся пульсирующее кольцо.
// На десктопе (>900px) при hover показывает подпись; на мобиле — только точка.
// Стили инлайном через React 19 <style precedence> — дедуплицируется автоматически,
// в мини-апп не утекает (класс уникальный, используется только тут).
function FreeDot() {
  return (
    <span
      className="eb-freedot-wrap"
      data-label="Свободен сегодня/завтра"
      aria-label="Свободен сегодня или завтра"
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flex: 'none', marginLeft: 5 }}
    >
      <style precedence="default" href="eb-freedot">{`
        .eb-freedot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #22C55E;
          box-shadow: 0 0 5px rgba(34,197,94,.65), 0 0 0 0 rgba(34,197,94,.7);
          animation: eb-freedot-pulse 1.8s ease-out infinite;
        }
        @keyframes eb-freedot-pulse {
          0%   { box-shadow: 0 0 5px rgba(34,197,94,.65), 0 0 0 0 rgba(34,197,94,.7); }
          70%  { box-shadow: 0 0 5px rgba(34,197,94,.65), 0 0 0 4.5px rgba(34,197,94,0); }
          100% { box-shadow: 0 0 5px rgba(34,197,94,.65), 0 0 0 0 rgba(34,197,94,0); }
        }
        @media (min-width: 901px) {
          .eb-freedot-wrap[data-label]:hover::after {
            content: attr(data-label);
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-8px);
            background: #1A1A1A;
            color: #fff;
            padding: 5px 9px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            white-space: nowrap;
            pointer-events: none;
            z-index: 10;
            box-shadow: 0 2px 8px rgba(0,0,0,.15);
          }
          .eb-freedot-wrap[data-label]:hover::before {
            content: '';
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%) translateY(-2px);
            border: 4px solid transparent;
            border-top-color: #1A1A1A;
            pointer-events: none;
            z-index: 10;
          }
        }
      `}</style>
      <span className="eb-freedot" />
    </span>
  )
}

// ─── ФИЛЬТРЫ ────────────────────────────────────────────────────
// Значения храним строками; рейтинг приводим к числу при чтении.
const RATING_OPTS = [
  { v: '0', label: 'Любая оценка' },
  { v: '4.5', label: 'Оценка 4,5+' },
  { v: '4.8', label: 'Оценка 4,8+' },
]
const VISIT_OPTS = [
  { v: 'any', label: 'Везде' },
  { v: 'outcall', label: 'Выезд' },
  { v: 'incall', label: 'Приём' },
]

// Компактный фильтр рейтинга: одна кнопка-звезда. Тап циклит порог:
// любой → 4,5+ → 4,8+ → любой. Когда включён — лёгкая жёлтая подсветка.
function RatingButton({ value, onChange, style }) {
  const next = value === 0 ? 4.5 : value === 4.5 ? 4.8 : 0
  const label = value === 0 ? null : `${String(value).replace('.', ',')}+`
  return (
    <button onClick={() => onChange(next)} aria-label="Фильтр по рейтингу"
      style={{
        height: 46, borderRadius: 13, border: '1px solid #E7E3DA',
        background: value ? '#FFF1FA' : '#fff', padding: '0 13px', fontSize: 14, fontWeight: 650,
        color: '#1A1A1A', cursor: 'pointer', whiteSpace: 'nowrap', flex: 'none',
        display: 'inline-flex', alignItems: 'center', ...style,
      }}>
      <UiIcon name="star" size={17} style={{ color: value ? '#C63AAB' : '#756A77', marginRight: label ? 6 : 0 }} />{label}
    </button>
  )
}

function DropdownFilter({ value, onValueChange, options, style, height = 46, borderRadius = 13,
  fontSize = 14, ariaLabel, triggerIcon, renderIcon, triggerStyle, compact = false, menuWidth }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const triggerRef = useRef(null)
  const selected = options.find(option => String(option.v) === String(value)) || options[0]

  useEffect(() => {
    if (!open) return
    const closeOutside = event => { if (!ref.current?.contains(event.target)) setOpen(false) }
    const closeOnEscape = event => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', closeOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  const choose = option => {
    onValueChange(option.v)
    setOpen(false)
    requestAnimationFrame(() => triggerRef.current?.focus())
  }

  return (
    <div ref={ref} className="eb-dropdown" style={{ position: 'relative', flex: 'none', minWidth: 168, ...style }}>
      <button ref={triggerRef} className="eb-field eb-dropdown-trigger" type="button" aria-label={ariaLabel}
        aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}
        style={{ width: '100%', height, padding: compact ? '0 7px' : '0 13px', borderRadius, border: open ? '1px solid #D99AD0' : '1px solid #E7E3DA', background: '#fff', color: '#332A3B', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: compact ? 4 : 8, fontSize: compact ? 13.5 : fontSize, boxShadow: open ? '0 0 0 3px rgba(155,86,210,.10)' : 'none', ...triggerStyle }}>
        {(triggerIcon || renderIcon) && <span style={{ color: '#A83293', display: 'inline-flex', alignItems: 'center', flex: 'none' }}>{triggerIcon || renderIcon(selected)}</span>}
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'left' }}>{selected?.label}</span>
        <UiIcon name="chevronDown" size={15} style={{ color: open ? '#9A3A9B' : '#756E77', flex: 'none', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s,color .18s' }}/>
      </button>
      {open && <div className="eb-dropdown-menu" role="listbox" aria-label={ariaLabel}
        style={{ position: 'absolute', top: height + 7, left: menuWidth ? 'auto' : 0, right: 0, width: menuWidth, zIndex: 1400, maxHeight: 270, overflowY: 'auto', padding: 7, borderRadius: 17, background: 'rgba(255,255,255,.98)', border: '1px solid #EBDCE8', boxShadow: '0 18px 44px rgba(72,34,64,.17)', backdropFilter: 'blur(14px)' }}>
        {options.map(option => {
          const isSelected = String(value) === String(option.v)
          return <button key={String(option.v)} className="eb-dropdown-option" data-selected={isSelected} type="button"
            role="option" aria-selected={isSelected} onClick={() => choose(option)}
            style={{ width: '100%', minHeight: 40, padding: compact ? '8px' : '9px 9px 9px 10px', border: 0, borderRadius: 12, background: '#fff', color: '#453D47', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: compact ? 7 : 9, textAlign: 'left', fontSize: compact ? 13 : fontSize }}>
            {renderIcon && <span style={{ color: isSelected ? '#9A3390' : '#766E78', display: 'inline-flex', alignItems: 'center', minWidth: compact ? 30 : 36 }}>{renderIcon(option)}</span>}
            <span style={{ flex: 1, minWidth: 0, lineHeight: 1.3 }}>{option.label}</span>
            <span className="eb-dropdown-check" style={{ display: 'grid', placeItems: 'center', width: 18, height: 18, flex: 'none', transition: '.15s ease' }}>
              <UiIcon name="check" size={14} strokeWidth={2.2}/>
            </span>
          </button>
        })}
      </div>}
    </div>
  )
}

function FilterSelect({ value, onChange, options, style, compact = false }) {
  const icon = options === RATING_OPTS ? 'star' : 'sparkles'
  return <DropdownFilter value={value} options={options} style={style}
    fontSize={15}
    ariaLabel={options === RATING_OPTS ? 'Выберите оценку' : 'Выберите услугу'}
    compact={compact} triggerIcon={<UiIcon name={icon} size={compact ? 14 : 17}/>} onValueChange={next => onChange({ target: { value: next } })}/>
}

function VisitGlyphs({ value, size = 17 }) {
  if (value === 'outcall') return <UiIcon name="car" size={size} />
  if (value === 'incall') return <UiIcon name="home" size={size} />
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}><UiIcon name="car" size={size}/><UiIcon name="home" size={size}/></span>
}

function VisitFilter({ value, onChange, style, compact = false }) {
  return <DropdownFilter value={value} onValueChange={onChange} options={VISIT_OPTS} style={style}
    compact={compact} fontSize={15} menuWidth={compact ? 170 : undefined} ariaLabel="Место оказания услуги" renderIcon={option => <VisitGlyphs value={option.v} size={compact ? 14 : 16}/>}/>
}

function CityFilter({ cities, value, onChange, mobile = false }) {
  const options = [{ v: 'all', label: 'Все города' }, ...cities.map(city => ({ v: city, label: city }))]
  return <DropdownFilter value={value} options={options} ariaLabel="Выберите город"
    style={{ width: mobile ? 165 : 220, maxWidth: mobile ? 165 : 220, minWidth: mobile ? 165 : 220 }}
    height={mobile ? 46 : 50} borderRadius={mobile ? 13 : 999} fontSize={mobile ? 14 : 14.5}
    triggerIcon={<UiIcon name="pin" size={16}/>} triggerStyle={{ boxShadow: mobile ? 'none' : '0 5px 18px rgba(55,25,52,.035)' }}
    onValueChange={next => onChange({ target: { value: next } })}/>
}

// ─── БОГАТАЯ КАРТОЧКА ПО ТАПУ НА ПИН ────────────────────────────
// Общая для обычной мобильной шторки и для полноэкранной карты.
// Показывает: аватар, имя, статус ✅, рейтинг, метро/город, плашки
// (профессия, тип визита, «всегда вовремя»), описание, цену и «Записаться».
function SheetCard({ ex, prof, stats, onBook, onClose }) {
  const caps = visitCaps(ex.services)
  const price = minPrice(ex.services)
  const rated = stats && stats.count > 0
  const bio = (ex.bio || '').trim()
  return (
    <div>
      <div style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
        <Avatar url={ex.avatar_url} name={ex.users?.full_name} size={56} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 17, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ex.users?.full_name || 'Исполнитель'}
            </span>
            {ex.is_verified && <UiIcon name="verified" size={18} title="Проверенный исполнитель" style={{ flex: 'none', color: '#3FD064' }} />}
            {isFreeSoon(ex) && <FreeDot />}
          </div>
          <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, flexWrap: 'wrap' }}>
            {rated
              ? <span><span style={{ color: '#E8A200', fontWeight: 800 }}>★ {stats.avgRating}</span> <span style={{ color: '#8C8C8C' }}>· {stats.count} отз.</span></span>
              : <span style={{ color: '#8C8C8C' }}>Новый исполнитель</span>}
            {(ex.subway_station || ex.city) && (
              <span style={{ color: '#8C8C8C', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 170 }}>
                {ex.subway_station || ex.city}
              </span>
            )}
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Закрыть"
            style={{ flex: 'none', width: 30, height: 30, borderRadius: 15, border: 'none', background: '#F4F2ED', color: '#6B6B6B', fontSize: 16, cursor: 'pointer', lineHeight: 1 }}>×</button>
        )}
      </div>

      {/* Плашки: профессия · тип визита · статус */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 11 }}>
        {prof && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#FFF1FA', color: '#A83293', borderRadius: 99, fontSize: 12, fontWeight: 650 }}>
            <UiIcon name={categoryIcon(prof.code)} size={14} />{prof.name}
          </span>
        )}
        {(caps.inc || caps.out) && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: '#FFF7F0', color: '#A95F22', borderRadius: 99, fontSize: 12, fontWeight: 650 }}>
            <UiIcon name={caps.out ? 'car' : 'home'} size={14} />{caps.inc && caps.out ? 'выезд · приём' : caps.out ? 'выезд' : 'приём'}
          </span>
        )}
        {rated && stats.alwaysOnTime && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: '#EAF7EE', color: '#1B7F3B', borderRadius: 11, fontSize: 12, fontWeight: 700 }}>✓ Всегда вовремя</span>
        )}
      </div>

      {/* Описание — не больше трёх строк */}
      {bio && (
        <p style={{ margin: '11px 0 0', fontSize: 13, color: '#5E5E5E', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {bio}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
        {price != null && (
          <div style={{ flex: 'none' }}>
            <div style={{ fontSize: 12, color: '#8C8C8C', lineHeight: 1.2 }}>Услуги</div>
            <div style={{ fontSize: 18, fontWeight: 800, whiteSpace: 'nowrap' }}>от {price} ₽</div>
          </div>
        )}
        <button onClick={onBook} className="eb-book eb-primary"
          style={{ flex: 1, height: 48, borderRadius: 13, border: 'none', background: GRADIENT, color: '#fff', fontSize: 16, fontWeight: 750, cursor: 'pointer' }}>
          Записаться
        </button>
      </div>
    </div>
  )
}

// Небольшая карточка исполнителя для карусели «Свободны сегодня и завтра»
function MiniCard({ ex, prof, stats, onBook, width = 340 }) {
  const price = minPrice(ex.services)
  return (
    <div style={{
      position: 'relative', flex: `0 0 ${width}px`, background: '#fff', border: '1px solid #F0EDE6',
      borderRadius: 20, boxShadow: '0 10px 35px rgba(72,34,64,.065)', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', padding: 16,
    }}>
      {/* мягкий жёлтый узор в углу */}
      <svg width="150" height="120" viewBox="0 0 150 120" style={{ position: 'absolute', right: 0, bottom: 0, pointerEvents: 'none' }}>
        <path d="M20 120C40 70 90 96 120 52c18-26 14-44 14-52h16v120H20Z" fill="#E957C5" opacity=".10" />
        <path d="M62 120c14-30 44-24 62-52 10-16 12-30 12-38h14v90H62Z" fill="#FFB342" opacity=".11" />
      </svg>

      {/* верхний ряд: аватар + инфо (профессия, рейтинг, город, метро) */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
        <div style={{ flex: 'none' }}>
          <Avatar url={ex.avatar_url} name={ex.users?.full_name} size={76} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* профессия слева, рейтинг справа */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            {prof ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: '#FFF1FA', color: '#A83293', borderRadius: '99px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                <UiIcon name={categoryIcon(prof.code)} size={13}/>{prof.name}
              </span>
            ) : <span />}
            <span style={{ whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
              {stats && stats.count > 0
                ? <>
                    <span style={{ color: '#f5a623', fontSize: '18px' }}>★</span>
                    <span style={{ color: '#1A1A1A', fontWeight: 800, fontSize: '22px' }}>{stats.avgRating}</span>
                    <span style={{ color: '#9A9A9A', fontSize: '13px' }}>({stats.count})</span>
                  </>
                : <span style={{ color: '#9A9A9A', fontSize: '13px' }}>Новый</span>}
            </span>
          </div>

          {/* город и метро */}
          {ex.city && <div style={{ fontSize: '13px', color: '#666', marginTop: 8, display: 'flex', gap: 5, alignItems: 'center' }}><UiIcon name="pin" size={14}/>{ex.city}</div>}
          {ex.subway_station && <div style={{ fontSize: '13px', color: '#666', marginTop: 3, display: 'flex', gap: 5, alignItems: 'center' }}><UiIcon name="metro" size={14}/>{ex.subway_station}</div>}
        </div>
      </div>

      {/* низ на всю ширину карточки, прижат к нижнему краю (уровень совпадает у всех карточек) */}
      <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
        {/* имя (у левого края карточки) + цена (у правого) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, margin: '14px 0 12px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#1A1A1A', display: 'flex', alignItems: 'center', gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.users?.full_name || 'Исполнитель'}</span>
            {ex.is_verified && <UiIcon name="verified" size={18} title="Проверенный исполнитель" style={{ color: '#3FD064' }}/>} 
            {isFreeSoon(ex) && <FreeDot />}
          </h3>
          {price != null && (
            <span style={{ whiteSpace: 'nowrap', flexShrink: 0, display: 'inline-flex', alignItems: 'baseline', gap: 3 }}>
              <span style={{ fontSize: '12px', color: '#8C8C8C', fontWeight: 500 }}>от</span>
              <span style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A' }}>{price.toLocaleString('ru-RU')}</span>
              <span style={{ fontSize: '12px', color: '#8C8C8C', fontWeight: 500 }}>₽</span>
            </span>
          )}
        </div>

        <button onClick={onBook} className="eb-book eb-primary" style={{ width: '100%', padding: '12px', borderRadius: 12, background: GRADIENT, fontWeight: 700, fontSize: '15px', color: '#fff', border: 'none', cursor: 'pointer', textAlign: 'center' }}>
          Записаться
        </button>
      </div>
    </div>
  )
}

function LoadingCards({ count = 3 }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16 }} aria-label="Загрузка исполнителей">
    {Array.from({ length: count }, (_, i) => <div key={i} className="eb-card-surface" style={{ background: '#fff', padding: 18 }}>
      <div style={{ display: 'flex', gap: 14 }}><div className="eb-skeleton" style={{ width: 76, height: 76, borderRadius: '50%' }}/><div style={{ flex: 1 }}><div className="eb-skeleton" style={{ height: 14, width: '48%', margin: '5px 0 13px' }}/><div className="eb-skeleton" style={{ height: 20, width: '72%', marginBottom: 10 }}/><div className="eb-skeleton" style={{ height: 12, width: '56%' }}/></div></div>
      <div className="eb-skeleton" style={{ height: 12, width: '100%', marginTop: 18 }}/><div className="eb-skeleton" style={{ height: 12, width: '78%', marginTop: 8 }}/><div className="eb-skeleton" style={{ height: 46, width: '100%', marginTop: 18 }}/>
    </div>)}
  </div>
}

function ResultState({ error = false }) {
  return <div className="eb-state" role={error ? 'alert' : 'status'}>
    <div style={{ width: 48, height: 48, borderRadius: 16, margin: '0 auto 12px', display: 'grid', placeItems: 'center', background: error ? '#FFF0F2' : '#FFF1FA', color: error ? '#C94A59' : '#B13A9D' }}><UiIcon name={error ? 'close' : 'search'} size={23}/></div>
    <strong style={{ display: 'block', color: '#342D37', fontSize: 16 }}>{error ? 'Не получилось загрузить данные' : 'Ничего не найдено'}</strong>
    <span style={{ display: 'block', marginTop: 6, fontSize: 13.5 }}>{error ? 'Проверьте интернет-соединение и повторите попытку.' : 'Измените запрос, город или ослабьте фильтры.'}</span>
    {error && <button onClick={() => window.location.reload()} className="eb-primary" style={{ border: 0, borderRadius: 11, padding: '10px 16px', marginTop: 14, cursor: 'pointer', fontWeight: 650 }}>Попробовать снова</button>}
  </div>
}

export default function ClientPageWeb({
  selectedService, setSelectedService,
  professions, cities, selectedCity, setSelectedCity,
  search, setSearch, loading, loadError,
  visibleExecutors, reviewStats, ordersCountByExecutor,
  expandedServices, setExpandedServices, expandedBios, setExpandedBios,
  onBook, myUserId,view, setView, minRating, setMinRating, visitType, setVisitType,
  mapFull, setMapFull,
}) {
  const [selectedId, setSelectedId] = useState(null)
  // view, minRating, visitType — приходят из ClientPage через пропсы (чтобы не слетать при уходе в бронь и обратно)
  const trackRef = useRef(null)
  const rafRef = useRef(null)
  const dirRef = useRef(0)
  const framesRef = useRef(0)

  // Пока кнопка зажата — лента едет непрерывно (кадр за кадром), а не прыгает на карточку.
  const startScroll = dir => {
    stopScroll()
    dirRef.current = dir
    framesRef.current = 0
    let speed = 5
    const step = () => {
      framesRef.current += 1
      speed = Math.min(speed + 0.55, 18)          // мягкий разгон: чем дольше держишь, тем быстрее
      if (trackRef.current) trackRef.current.scrollLeft += dir * speed
      rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
  }
  const stopScroll = () => {
    if (!rafRef.current) return
    cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    // короткий клик (не удержание) — доводим ровно на одну карточку
    if (framesRef.current <= 5) {
      trackRef.current?.scrollBy({ left: dirRef.current * 356, behavior: 'smooth' })
    }
    framesRef.current = 0
  }
  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  // ФИЛЬТРЫ КАРТЫ: рейтинг + тип визита. Применяем поверх visibleExecutors
  // (там уже отработали город, категория и поиск). Всё, что видно на карте,
  // в списке и в карусели, идёт из filtered.
  const filtered = useMemo(() => visibleExecutors.filter(ex => {
    if (minRating > 0) {
      const st = reviewStats[ex.id]
      const r = st && st.count > 0 ? parseFloat(st.avgRating) : 0
      if (r < minRating) return false        // «новые» (без отзывов) при фильтре по рейтингу прячем
    }
    if (visitType !== 'any') {
      const { inc, out } = visitCaps(ex.services)
      if (visitType === 'outcall' && !out) return false
      if (visitType === 'incall' && !inc) return false
    }
    return true
  }), [visibleExecutors, reviewStats, minRating, visitType])

  // Выбранный исполнитель для правой колонки: явно выбранный либо первый в списке
  const selected = useMemo(
    () => filtered.find(e => e.id === selectedId) || filtered[0] || null,
    [filtered, selectedId]
  )
  const profOf = ex => professions.find(p => p.code === ex.service_type)

  // Опции для выпадашки услуг (мобилка): «Все услуги» + категории
  const serviceOpts = [{ v: 'all', label: 'Все услуги' }, ...professions.map(p => ({ v: p.code, label: p.name }))]

  // Свободные сегодня/завтра — для карусели
  const freeSoon = filtered.filter(
    e => (e.todaySlots && e.todaySlots.length) || (e.tomorrowSlots && e.tomorrowSlots.length)
  )
  const withCoords = filtered.filter(e => e.latitude != null && e.longitude != null)
  // точки для авто-центрирования карты (город/категория/фильтр поменялись → подлетаем к выборке)
  const points = useMemo(() => withCoords.map(e => [e.latitude, e.longitude]), [withCoords])
  const pointsKey = `${selectedCity}|${selectedService}|${minRating}|${visitType}|${points.length}|${points[0] || ''}`

  const cardProps = ex => ({
    executor: ex,
    professions,
    reviewStats,
    ordersCountByExecutor,
    expandedServices, setExpandedServices,
    expandedBios, setExpandedBios,
    web: true,
    onBook: () => onBook(ex),
  })

  const isListMode = view === 'list'
  const isMobile = useIsMobile()

  // Тап по пину на телефоне открывает нижнюю карточку (шторку).
  // Скроллить к карточке в списке нельзя: при подгрузке порциями нужного
  // исполнителя в отрисованном списке может просто не оказаться.
  const [sheetId, setSheetId] = useState(null)
  // mapFull — приходит из ClientPage через пропсы (чтобы не слетал при уходе в бронь и обратно)
    const sheetEx = useMemo(() => visibleExecutors.find(e => e.id === sheetId) || null, [visibleExecutors, sheetId])


  // ─────────────────────────────────────────────────────────────
  //  МОБИЛЬНАЯ РАСКЛАДКА ВЕБА
  //  Тот же код и те же данные, другая подача: одна колонка,
  //  низкая карта, категории чипами, карточки на всю ширину.
  //  В Telegram сюда не попадаем — там работает мини-апп.
  // ─────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="eb-web eb-m" style={{ background: '#FBFAF7', minHeight: '100vh', color: '#1A1A1A', colorScheme: 'light', textAlign: 'left' }}>
        <WebBaseStyles />
        <style>{`
          body{overflow-x:hidden}
          ${PIN_CSS}
          .eb-m{width:100%;max-width:100vw;overflow-x:hidden}
          .eb-m-header,.eb-m-header-row{width:100%;max-width:100%}
          .eb-m-header-row{min-width:0}
          .eb-m-header-brand{min-width:0}
          .eb-m-chip{display:inline-flex;align-items:center;gap:5px;padding:7px 12px;border-radius:16px;font-size:13px;font-weight:600;border:none;background:#EFECE6;color:#1A1A1A;cursor:pointer;line-height:1.15}
          .eb-m-chip .eb-m-ico{font-size:14px}
          .eb-m-chip[data-on="1"]{background:${Y};color:#1A1A1A}
          .eb-m-track{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;padding:2px 12px 12px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
          .eb-m-track::-webkit-scrollbar{display:none}
          .eb-m-track > *{scroll-snap-align:start}
          .eb-m input,.eb-m select{font-size:16px}
          .leaflet-container{border-radius:14px}
          .eb-m-sheet{animation:eb-up .18s ease-out}
          @keyframes eb-up{from{transform:translateY(100%)}to{transform:translateY(0)}}
          @media(max-width:520px){
            .eb-m-header-row{gap:7px!important;padding:9px 10px!important}
            .eb-m-header-row .eb-role{width:40px!important;min-width:40px!important;height:40px!important;padding:0!important;justify-content:center;flex:none}
            .eb-m-role-text{display:none}
            .eb-map-full-filters{top:calc(68px + env(safe-area-inset-top))!important;left:10px!important;right:10px!important;padding:0!important;display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.12fr) 44px;gap:7px!important}
            .eb-m-filter-row{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1.12fr) 44px;gap:7px!important}
          }
          @media(max-width:350px){
            .eb-m-header-brand .eb-brand-name{font-size:21px}
            .eb-m-search-row{display:grid!important;grid-template-columns:1fr!important}
            .eb-m-search-row>.eb-dropdown{width:100%!important;max-width:none!important;min-width:0!important}
          }
        `}</style>

        {/* ─── ШАПКА ─── */}
        <header className="eb-m-header" style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#fff', borderBottom: '1px solid #ECECEC', overflow: 'hidden' }}>
          <div className="eb-m-header-row" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px' }}>
            <a href="/" className="eb-m-header-brand" style={{ display: 'flex', alignItems: 'center', gap: 7, textDecoration: 'none', color: '#1A1A1A', flex: 'none' }}>
              <BrandMark size={30} />
              <span className="eb-brand-name">ebookee</span>
            </a>
            <div style={{ flex: 1 }} />
            <a href="?executor=1" className="eb-role" style={ROLE_M} aria-label="Кабинет исполнителя"><UiIcon name="user" size={16}/><span className="eb-m-role-text">Исполнитель</span></a>
            <a href={myUserId ? `?client=${myUserId}` : '?client=0'} className="eb-role" style={{ ...ROLE_M, color: '#A83293', borderColor: '#EDC9E5' }} aria-label="Кабинет клиента"><UiIcon name="crown" size={16}/><span className="eb-m-role-text">Клиент</span></a>
          </div>
        </header>

        <div style={{ padding: '12px 12px 0' }}>
          {/* ─── КАРТА ─── */}
          {/* Обычная карта 170px (как было). Кнопка «во весь экран» разворачивает
              её в полноэкранный оверлей — там удобно двигать и зумить. */}
          <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate', height: 170, borderRadius: 14, overflow: 'hidden', border: '1px solid #E6E1D6' }}>
            <MapContainer center={MOSCOW_CENTER} zoom={11} style={{ height: '100%' }} attributionControl={false}>
              <AttributionNoFlag />
              <MapFocus points={points} pointsKey={pointsKey} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapTapCatcher onTap={() => setSheetId(null)} />
              {withCoords.map(ex => (
                <Marker key={ex.id} position={[ex.latitude, ex.longitude]} icon={pinIcon(ex.service_type, sheetId === ex.id)}
                  eventHandlers={{ click: () => setSheetId(ex.id) }} />
              ))}
            </MapContainer>

            <button onClick={() => setMapFull(true)} aria-label="Открыть карту на весь экран"
              style={{
                position: 'absolute', right: 10, bottom: 10, zIndex: 500, height: 34, padding: '0 13px',
                borderRadius: 17, border: 'none', background: '#fff', color: '#1A1A1A', fontSize: 13, fontWeight: 700,
                boxShadow: '0 2px 8px rgba(30,25,10,.22)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}>
              <UiIcon name="expand" size={16}/>На весь экран
            </button>
          </div>

          {/* ─── ПОИСК + ГОРОД ─── */}
          <div className="eb-m-search-row" style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <div className="eb-field" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: '1px solid #EDEAE2', borderRadius: 13, padding: '0 13px', height: 46 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flex: 'none', opacity: .5 }}><circle cx="11" cy="11" r="7" stroke="#8C8C8C" strokeWidth="2"/><path d="m20 20-3.2-3.2" stroke="#8C8C8C" strokeWidth="2" strokeLinecap="round"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск…"
                style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', color: '#1A1A1A' }} />
            </div>
            <CityFilter mobile cities={cities} value={selectedCity} onChange={e => { setSelectedCity(e.target.value); localStorage.setItem('selectedCity', e.target.value) }}/>
          </div>

          {/* ─── ФИЛЬТРЫ: услуги + место + компактный рейтинг ─── */}
          <div className="eb-m-filter-row" style={{ display: 'flex', gap: 8, padding: '4px 0 0' }}>
            <FilterSelect compact style={{ flex: 1, minWidth: 0 }} options={serviceOpts}
              value={selectedService} onChange={e => setSelectedService(e.target.value)} />
            <VisitFilter compact style={{ flex: 1.12, minWidth: 0 }} value={visitType} onChange={setVisitType}/>
            <RatingButton value={minRating} onChange={setMinRating} />
          </div>
        </div>

        {/* ─── СВОБОДНЫ СЕГОДНЯ И ЗАВТРА ─── */}
        {!loading && freeSoon.length > 0 && (
          <section style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 12px 12px' }}>Свободны сегодня и завтра</h3>
            <div className="eb-m-track">
              {freeSoon.map(ex => (
                <MiniCard key={ex.id} ex={ex} prof={profOf(ex)} stats={reviewStats[ex.id]} width={288} onBook={() => onBook(ex)} />
              ))}
            </div>
          </section>
        )}

        {/* ─── СПИСОК ИСПОЛНИТЕЛЕЙ ─── */}
        <section style={{ padding: '8px 12px 0' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 12px' }}>
            Специалисты {!loading && filtered.length > 0 && <span style={{ color: '#8C8C8C' }}>{filtered.length}</span>}
          </h3>
          {loading ? (
            <LoadingCards count={2}/>
          ) : loadError ? (
            <ResultState error />
          ) : filtered.length === 0 ? (
            <ResultState />
          ) : (
            filtered.map(ex => <ExecutorCard key={ex.id} {...cardProps(ex)} />)
          )}
        </section>

        {/* ─── КАРТА ВО ВЕСЬ ЭКРАН ─── */}
        {mapFull && (
          <div className="eb-map-full" style={{ position: 'fixed', inset: 0, width: '100%', maxWidth: '100vw', overflow: 'hidden', zIndex: 2000, background: '#fff' }}>
            <MapContainer center={MOSCOW_CENTER} zoom={11} style={{ height: '100%', width: '100%' }} attributionControl={false}>
              <AttributionNoFlag />
              <MapFocus points={points} pointsKey={pointsKey} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapTapCatcher onTap={() => setSheetId(null)} />
              {withCoords.map(ex => (
                <Marker key={ex.id} position={[ex.latitude, ex.longitude]} icon={pinIcon(ex.service_type, sheetId === ex.id)}
                  eventHandlers={{ click: () => setSheetId(ex.id) }} />
              ))}
            </MapContainer>

            {/* Верхняя панель: выпадашки услуги + оценка + место
                (слева отступ под зум +/-, справа — под крестик) */}
            <div className="eb-map-full-filters" style={{ position: 'absolute', top: 'calc(12px + env(safe-area-inset-top))', left: 0, right: 0, zIndex: 520, display: 'flex', gap: 8, paddingLeft: 54, paddingRight: 66 }}>
              <FilterSelect compact style={{ flex: 1, minWidth: 0 }} options={serviceOpts}
                value={selectedService} onChange={e => setSelectedService(e.target.value)} />
              <VisitFilter compact style={{ flex: 1.12, minWidth: 0 }} value={visitType} onChange={setVisitType}/>
              <RatingButton value={minRating} onChange={setMinRating} />
            </div>

            <button onClick={() => setMapFull(false)} aria-label="Закрыть карту"
              style={{
                position: 'absolute', right: 14, top: 'calc(12px + env(safe-area-inset-top))', zIndex: 540,
                width: 44, height: 44, borderRadius: '50%', border: 'none', background: '#fff', color: '#1A1A1A',
                fontSize: 18, fontWeight: 800, boxShadow: '0 3px 12px rgba(30,25,10,.28)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              ✕
            </button>

            {/* Богатая карточка по тапу на пин — работает и на полном экране */}
            {sheetEx && (
              <div style={{ position: 'absolute', left: 12, right: 12, bottom: 'calc(16px + env(safe-area-inset-bottom))', zIndex: 510 }}>
                <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 8px 30px rgba(30,25,10,.3)', padding: '14px 16px' }}>
                  <SheetCard ex={sheetEx} prof={profOf(sheetEx)} stats={reviewStats[sheetEx.id]}
                    onClose={() => setSheetId(null)}
                    onBook={() => onBook(sheetEx)} />
                </div>
              </div>
            )}
          </div>
        )}

        <WebFooter />

        {/* ─── НИЖНЯЯ КАРТОЧКА ПО ТАПУ НА ПИН ─── */}
        {sheetEx && (
          <>
            <div onClick={() => setSheetId(null)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(20,17,10,.28)', zIndex: 1190 }} />
            <div className="eb-m-sheet" style={{
              position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 1200, background: '#fff',
              borderRadius: '20px 20px 0 0', boxShadow: '0 -8px 30px rgba(30,25,10,.25)',
              padding: '10px 16px calc(16px + env(safe-area-inset-bottom))',
            }}>
              <div style={{ width: 40, height: 4, borderRadius: 4, background: '#E4E0D6', margin: '0 auto 14px' }} />

              <SheetCard ex={sheetEx} prof={profOf(sheetEx)} stats={reviewStats[sheetEx.id]}
                onClose={() => setSheetId(null)}
                onBook={() => { setSheetId(null); onBook(sheetEx) }} />
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="eb-web" style={{ background: '#FBFAF7', minHeight: '100vh', color: '#1A1A1A', colorScheme: 'light', textAlign: 'left' }}>
      <WebBaseStyles />
      <style>{`
        /* Веб открыт вне Telegram: снимаем ограничения шаблонного #root (max-width:500px, центрирование),
           которые нужны мини-аппу, но ломают широкую вёрстку. Действует только пока смонтирован ClientPageWeb. */
        #root{max-width:none !important;width:100% !important;margin:0 !important;padding:0 !important;text-align:left !important;word-break:normal !important;font-size:15px}
        body{overflow-x:auto}
        .eb-web *{overflow-wrap:normal;word-break:normal}
        ${PIN_CSS}
        .eb-cat:hover{background:#F4F2ED}
        .eb-role:hover{background:#EEEBE4 !important}
        .eb-chip:hover{transform:translateY(-1px)}
        .eb-book:hover{background:${GRADIENT} !important}
        .eb-track::-webkit-scrollbar{display:none}
        .eb-arrow:hover{background:#F7F5F0 !important}
        .eb-arrow{user-select:none}
        .eb-track{scroll-behavior:auto}
        .leaflet-container{border-radius:16px;font-family:inherit}
        .eb-header-search:focus-within{border-color:#DEA7D1!important;box-shadow:0 0 0 3px rgba(233,87,197,.10)!important}
        .eb-side{background:#fff;border:1px solid #EEE8ED;border-radius:20px;padding:18px;box-shadow:0 10px 35px rgba(72,34,64,.045)}
        .eb-cat[data-active="true"]{background:${GRADIENT_SOFT}!important;border-color:#F0C7E5!important;color:#5D294F!important}
        .eb-view-btn[data-active="true"]{background:#fff!important;color:#B13A9D!important;box-shadow:0 4px 14px rgba(80,35,72,.08)!important}
        @media(max-width:1240px) and (min-width:901px){
          .eb-layout{grid-template-columns:220px minmax(0,1fr)!important;padding:18px!important}
          .eb-selected,.eb-banners{display:none!important}
          .eb-header-inner{padding-left:18px!important;padding-right:18px!important}
          .eb-role-label{display:none}
          .eb-role{width:50px;padding:0!important;justify-content:center}
        }
      `}</style>

      {/* ─── HEADER ─── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#fff', borderBottom: '1px solid #ECECEC' }}>
        <div className="eb-header-inner" style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 24px', maxWidth: 1560, margin: '0 auto' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 11, textDecoration: 'none', color: '#1A1A1A', flex: 'none' }}>
            <BrandMark size={40} />
            <span className="eb-brand-name">ebookee</span>
          </a>

          <div className="eb-header-search eb-field" style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: '1px solid #EEE7EC', borderRadius: 999, padding: '0 18px', height: 50, boxShadow: '0 6px 22px rgba(60,26,54,.035)', transition: '.18s ease' }}>
            <UiIcon name="search" size={19} style={{ flex: 'none', color: '#8C848E' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Поиск услуг и исполнителей"
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: '#1A1A1A' }} />
          </div>

          <CityFilter cities={cities} value={selectedCity} onChange={e => { setSelectedCity(e.target.value); localStorage.setItem('selectedCity', e.target.value) }}/>

          <div style={{ display: 'flex', gap: 10, flex: 'none' }}>
            <a href="?executor=1" className="eb-role" style={ROLE_BTN}><UiIcon name="user" size={19} style={{ color: '#B13A9D' }}/><span className="eb-role-label">Я исполнитель</span></a>
            <a href={myUserId ? `?client=${myUserId}` : '?client=0'} className="eb-role" style={{ ...ROLE_BTN, borderColor: '#F0D4E9' }}><UiIcon name="crown" size={19} style={{ color: '#F39A28' }}/><span className="eb-role-label">Я клиент</span></a>
          </div>
        </div>
      </header>

      {/* ─── LAYOUT ─── */}
      <div className="eb-layout" style={{ display: 'grid', gridTemplateColumns: isListMode ? '248px minmax(0,1fr)' : '248px minmax(0,1fr) 380px', gap: 20, padding: '20px 24px', alignItems: 'start', maxWidth: 1560, margin: '0 auto', boxSizing: 'border-box' }}>

        {/* LEFT: categories + banners */}
        <aside className="eb-side">
          <h2 style={{ fontSize: 21, fontWeight: 800, margin: '6px 2px 16px' }}>Выберите услугу</h2>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <button className="eb-cat" data-active={selectedService === 'all'} onClick={() => setSelectedService('all')}
              style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', padding: '13px 15px', borderRadius: 14, fontSize: 14.5, fontWeight: 650, color: '#2E2731', border: '1px solid transparent', cursor: 'pointer', background: 'transparent' }}>
              <UiIcon name="grid" size={20} style={{ width: 23 }}/><span>Все категории</span>
            </button>
            {professions.map(p => {
              const active = selectedService === p.code
              return (
                <button key={p.code} className="eb-cat" data-active={active} onClick={() => setSelectedService(p.code)}
                  style={{ display: 'flex', alignItems: 'center', gap: 13, width: '100%', textAlign: 'left', padding: '13px 15px', borderRadius: 14, fontSize: 14.5, fontWeight: 550, color: '#2E2731', border: '1px solid transparent', cursor: 'pointer', background: 'transparent' }}>
                  <UiIcon name={categoryIcon(p.code)} size={20} style={{ width: 23 }}/><span>{p.name}</span>
                </button>
              )
            })}
          </nav>
          {/* Рекламные баннеры — список BANNERS в начале файла */}
          <div className="eb-banners" style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {BANNERS.length === 0 ? (
              <a href="https://t.me/Ebookee777_bot/Ebookee" target="_blank" rel="noopener noreferrer" style={{ position: 'relative', overflow: 'hidden', display: 'block', minHeight: 210, padding: 18, borderRadius: 18, textDecoration: 'none', color: '#332A3B', background: 'linear-gradient(145deg,#F8ECFF 0%,#FADFF0 58%,#FFD8C4 100%)', border: '1px solid #F0D3E8' }}>
                <span aria-hidden="true" style={{ position: 'absolute', width: 130, height: 130, right: -36, bottom: -32, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(233,87,197,.4),rgba(255,179,66,.52))' }}/>
                <span style={{ position: 'relative', display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 14, color: '#B13A9D', background: 'rgba(255,255,255,.72)', marginBottom: 14 }}><UiIcon name="user" size={22}/></span>
                <strong style={{ position: 'relative', display: 'block', fontSize: 16, lineHeight: 1.25 }}>Станьте исполнителем</strong>
                <span style={{ position: 'relative', display: 'block', maxWidth: 165, marginTop: 7, color: '#6F6070', fontSize: 12.5, lineHeight: 1.45 }}>Начните зарабатывать с ebookee уже сегодня</span>
                <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 16, padding: '8px 12px', borderRadius: 10, background: '#fff', color: '#A83293', boxShadow: '0 5px 16px rgba(105,37,89,.1)', fontSize: 12.5, fontWeight: 700 }}>Подробнее <UiIcon name="arrow" size={14}/></span>
              </a>
            ) : (
              BANNERS.map((b, i) => {
                const img = (
                  <img src={b.image} alt={b.alt || ''} loading="lazy"
                    style={{ display: 'block', width: '100%', borderRadius: 16, border: '1px solid #F0EDE6' }} />
                )
                return b.link
                  ? <a key={i} href={b.link} target="_blank" rel="noopener noreferrer sponsored">{img}</a>
                  : <div key={i}>{img}</div>
              })
            )}
          </div>
        </aside>

        {/* CENTER */}
        <section className="eb-center">
          {/* view switch + фильтры (оценка, место) в одну строку */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'inline-flex', background: '#F0EDE6', borderRadius: 13, padding: 4, gap: 4 }}>
              {[['map', 'Карта'], ['list', 'Список']].map(([v, label]) => (
                <button key={v} className="eb-view-btn" data-active={view === v} onClick={() => setView(v)}
                  style={{ padding: '10px 18px', borderRadius: 11, fontSize: 14, fontWeight: 650, border: 'none', cursor: 'pointer', color: '#756E77', background: 'transparent', display: 'inline-flex', alignItems: 'center', gap: 8 }}><UiIcon name={v} size={18}/>{label}</button>
              ))}
            </div>
            <FilterSelect style={{ flex: 'none', minWidth: 168 }} options={RATING_OPTS}
              value={String(minRating)} onChange={e => setMinRating(Number(e.target.value))} />
            <VisitFilter style={{ flex: 'none', minWidth: 168 }} value={visitType} onChange={setVisitType}/>
          </div>

          {(
            <>
              {!isListMode && (
                <>
                  {/* MAP */}
                  <div style={{ position: 'relative', zIndex: 0, isolation: 'isolate', height: 560, borderRadius: 16, overflow: 'hidden', border: '1px solid #E6E1D6', boxShadow: '0 1px 2px rgba(30,25,10,.05)' }}>
                    <MapContainer center={MOSCOW_CENTER} zoom={11} style={{ height: '100%' }} attributionControl={false}>
                      <AttributionNoFlag />
                      <MapFocus points={points} pointsKey={pointsKey} />
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      {withCoords.map(ex => (
                        <Marker key={ex.id} position={[ex.latitude, ex.longitude]} icon={pinIcon(ex.service_type, selected?.id === ex.id)}
                          eventHandlers={{ click: () => setSelectedId(ex.id) }}>
                          <Popup>
                            <div style={{ minWidth: 130, textAlign: 'center' }}>
                              <b>{ex.users?.full_name || 'Исполнитель'}</b>
                              <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{profOf(ex)?.name}</div>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </MapContainer>
                  </div>

                  {/* CAROUSEL: свободны сегодня и завтра */}
                  {!loading && freeSoon.length > 0 && (
                    <section style={{ marginTop: 22 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '0 4px 14px' }}>
                        <h3 style={{ fontSize: 20, fontWeight: 800 }}>Свободны сегодня и завтра</h3>
                        <span onClick={() => setView('list')} style={{ color: '#E39A00', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Смотреть все</span>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button className="eb-arrow" aria-label="Назад"
                          onMouseDown={() => startScroll(-1)} onMouseUp={stopScroll} onMouseLeave={stopScroll}
                          onTouchStart={() => startScroll(-1)} onTouchEnd={stopScroll}
                          style={{ position: 'absolute', left: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 6, width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1px solid #ECECEC', boxShadow: '0 6px 22px rgba(40,34,12,.12)', cursor: 'pointer', fontSize: 18, color: '#3E3E3E' }}>‹</button>
                        <div ref={trackRef} className="eb-track" style={{ display: 'flex', gap: 16, overflowX: 'auto', padding: '4px 2px 8px', scrollbarWidth: 'none' }}>
                          {freeSoon.map(ex => (
                            <MiniCard key={ex.id} ex={ex} prof={profOf(ex)} stats={reviewStats[ex.id]} onBook={() => onBook(ex)} />
                          ))}
                        </div>
                        <button className="eb-arrow" aria-label="Вперёд"
                          onMouseDown={() => startScroll(1)} onMouseUp={stopScroll} onMouseLeave={stopScroll}
                          onTouchStart={() => startScroll(1)} onTouchEnd={stopScroll}
                          style={{ position: 'absolute', right: -14, top: '50%', transform: 'translateY(-50%)', zIndex: 6, width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1px solid #ECECEC', boxShadow: '0 6px 22px rgba(40,34,12,.12)', cursor: 'pointer', fontSize: 18, color: '#3E3E3E' }}>›</button>
                      </div>
                    </section>
                  )}
                </>
              )}

              {/* LIST of full cards (в списочном режиме — на всю ширину, 3 в ряд) */}
              <section style={{ marginTop: isListMode ? 0 : 22 }}>
                {!isListMode && <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 4px 14px' }}>Специалисты на карте</h3>}
                {loading ? (
                  <LoadingCards />
                ) : loadError ? (
                  <ResultState error />
                ) : filtered.length === 0 ? (
                  <ResultState />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(332px,1fr))', gap: 20, alignItems: 'start' }}>
                    {filtered.map(ex => (
                      <div key={ex.id} onClick={() => setSelectedId(ex.id)} style={{ cursor: 'pointer' }}>
                        <ExecutorCard {...cardProps(ex)} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </section>

        {/* RIGHT: selected specialist */}
        {!isListMode && (
          <aside className="eb-selected">
            {selected ? (
              <ExecutorCard {...cardProps(selected)} onMessage={() => window.alert('Написать исполнителю — скоро')} />
            ) : (
              <div style={{ background: '#fff', border: '1px solid #ECECEC', borderRadius: 16, padding: 22, color: '#888', textAlign: 'center' }}>
                Выберите исполнителя на карте
              </div>
            )}
          </aside>
        )}
      </div>

      <WebFooter />
    </div>
  )
}
