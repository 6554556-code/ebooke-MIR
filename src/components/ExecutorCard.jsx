import Avatar from './Avatar'
import { getLocationIcon } from '../utils/locationIcon'
import UiIcon, { categoryIcon } from './UiIcon'
import { GRADIENT } from '../webTheme'

function WebExecutorCard({
  executor, professions, reviewStats, ordersCountByExecutor, expandedServices,
  setExpandedServices, expandedBios, setExpandedBios, onBook, onMessage,
}) {
  const prof = professions.find(p => p.code === executor.service_type)
  const stats = reviewStats[executor.id]
  const orders = ordersCountByExecutor[executor.id]?.fromApp || 0
  const isBioOpen = expandedBios.includes(executor.id)
  const isServicesOpen = expandedServices.includes(executor.id)
  const bio = executor.bio || ''
  const visibleBio = isBioOpen || bio.length <= 150 ? bio : `${bio.slice(0, 150).trimEnd()}…`
  const mains = (executor.services || []).filter(s => s.is_main)
  const shownMains = isServicesOpen ? mains : mains.slice(0, 2)
  const hasSlots = executor.todaySlots?.length || executor.tomorrowSlots?.length

  return (
    <article id={`executor-card-${executor.id}`} className="eb-executor-card eb-card-surface" style={{
      background: '#fff', padding: 20, width: '100%', boxSizing: 'border-box', overflow: 'hidden', position: 'relative',
    }}>
      <div aria-hidden="true" style={{ position: 'absolute', width: 190, height: 190, right: -95, top: -105, borderRadius: '50%', background: 'linear-gradient(135deg,rgba(233,87,197,.12),rgba(255,179,66,.13))' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, position: 'relative' }}>
        <div style={{ padding: 3, borderRadius: '50%', background: 'linear-gradient(145deg,#EF70D0,#FFB342)', boxShadow: '0 7px 18px rgba(202,67,157,.18)' }}>
          <div style={{ background: '#fff', borderRadius: '50%', padding: 2 }}>
            <Avatar url={executor.avatar_url} name={executor.users?.full_name} size={82} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
            {prof ? <span className="eb-prof-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px', borderRadius: 999, background: '#FFF1FA', color: '#A83293', fontSize: 12, fontWeight: 650 }}>
              <UiIcon name={categoryIcon(prof.code, prof.name)} size={14} />{prof.name}
            </span> : <span />}
            {stats?.count > 0 ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
              <UiIcon name="star" size={17} style={{ color: '#F6A623', fill: '#F6A623' }} />
              <strong style={{ fontSize: 17 }}>{stats.avgRating}</strong>
              <span style={{ color: '#96909A', fontSize: 12 }}>({stats.count})</span>
            </span> : <span style={{ color: '#96909A', fontSize: 12 }}>Новый</span>}
          </div>
          <h3 style={{ margin: '11px 0 7px', fontSize: 20, lineHeight: 1.2, letterSpacing: '-.015em', fontWeight: 750, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{executor.users?.full_name || 'Исполнитель'}</span>
            {executor.is_verified && <UiIcon name="verified" size={19} title="Проверенный исполнитель" style={{ color: '#3FD064', flex: 'none' }} />}
          </h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', color: '#85808B', fontSize: 13 }}>
            {executor.city && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><UiIcon name="pin" size={14}/>{executor.city}</span>}
            {executor.subway_station && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><UiIcon name="metro" size={14}/>{executor.subway_station}</span>}
          </div>
          {(orders > 0 || stats?.alwaysOnTime) && <div style={{ display: 'flex', gap: 10, marginTop: 8, color: '#85808B', fontSize: 12 }}>
            {orders > 0 && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><UiIcon name="package" size={13}/>{orders} заказов</span>}
            {stats?.alwaysOnTime && <span style={{ color: '#238D4A' }}>Вовремя</span>}
          </div>}
        </div>
      </div>

      {bio && <p style={{ margin: '14px 0 0', color: '#6E6872', fontSize: 13.5, lineHeight: 1.55 }}>
        {visibleBio}
        {bio.length > 150 && <button onClick={e => { e.stopPropagation(); setExpandedBios(prev => isBioOpen ? prev.filter(id => id !== executor.id) : [...prev, executor.id]) }}
          style={{ border: 0, background: 'none', color: '#B13A9D', cursor: 'pointer', padding: '0 0 0 5px', fontWeight: 650 }}>
          {isBioOpen ? 'Свернуть' : 'Подробнее'}
        </button>}
      </p>}

      {shownMains.length > 0 && <div style={{ marginTop: 14, borderTop: '1px solid #F1ECF0' }}>
        {shownMains.map(service => <div key={service.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid #F1ECF0', fontSize: 13.5 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
            <UiIcon name={service.location_type === 'incall' ? 'home' : 'broom'} size={15} style={{ color: '#B13A9D', flex: 'none' }}/>
            <span>{service.name} <span style={{ color: '#99929B' }}>· {service.duration} мин</span></span>
          </span>
          <strong style={{ whiteSpace: 'nowrap', fontSize: 14 }}>{Number(service.price).toLocaleString('ru-RU')} ₽</strong>
        </div>)}
        {mains.length > 2 && <button onClick={e => { e.stopPropagation(); setExpandedServices(prev => isServicesOpen ? prev.filter(id => id !== executor.id) : [...prev, executor.id]) }} style={{ border: 0, background: 'none', color: '#B13A9D', padding: '9px 0 0', fontSize: 13, fontWeight: 650, cursor: 'pointer' }}>
          {isServicesOpen ? 'Свернуть услуги' : `Все услуги (${mains.length})`}
        </button>}
      </div>}

      {hasSlots ? <div style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#736C76', fontSize: 12.5, marginBottom: 8 }}><UiIcon name="clock" size={15}/>Ближайшие слоты</div>
        {[['Сегодня', executor.todaySlots], ['Завтра', executor.tomorrowSlots]].map(([day, slots]) => slots?.length > 0 && <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
          <span style={{ width: 58, color: '#918A94', fontSize: 12 }}>{day}</span>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{slots.map(slot => <span key={slot.start.toString()} className="eb-slot-chip" style={{ padding: '6px 10px', border: '1px solid #E8CCE2', borderRadius: 9, color: '#734068', background: '#FFFBFE', fontSize: 12.5 }}>{slot.label}</span>)}</div>
        </div>) }
      </div> : null}

      <button onClick={e => { e.stopPropagation(); onBook() }} className="eb-book eb-primary" style={{ marginTop: 16, width: '100%', height: 46, border: 0, borderRadius: 13, background: GRADIENT, color: '#fff', cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>Записаться</button>
      {onMessage && <button onClick={e => { e.stopPropagation(); onMessage() }} style={{ marginTop: 9, width: '100%', height: 42, border: '1px solid #E9C8E1', borderRadius: 12, background: '#fff', color: '#B13A9D', cursor: 'pointer', fontSize: 14, fontWeight: 650, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}><UiIcon name="message" size={17}/>Написать</button>}
    </article>
  )
}

// Презентационная карточка исполнителя. Логика/данные — снаружи (ClientPage),
// сюда прилетают готовые пропсы. Разметка и стили 1:1 как были в списке —
// чтобы мини-апп выглядел идентично. Веб-оформление добавим отдельным пропсом позже.
export default function ExecutorCard({
  executor,
  professions,
  reviewStats,
  ordersCountByExecutor,
  expandedServices,
  setExpandedServices,
  expandedBios,
  setExpandedBios,
  onBook,
  web = false,        // веб-оформление (жёлтый акцент). По умолчанию false → мини-апп 1:1 как был.
  onMessage,          // если передан (веб) — показываем кнопку «Написать»
}) {
  if (web) {
    return <WebExecutorCard {...{ executor, professions, reviewStats, ordersCountByExecutor, expandedServices, setExpandedServices, expandedBios, setExpandedBios, onBook, onMessage }} />
  }
  // Палитра: дефолт = точь-в-точь прежние синие значения мини-аппа.
  const P = web
    ? { soft:'#FBF0D2', pill:'#7A5A0A', price:'#1A1A1A', link:'#8a6a1a',
        slotBorder:'#FDB813', slotBg:'#FFFDF6', slotText:'#1A1A1A',
        btnBg:'#FDB813', btnText:'#1A1A1A' }
    : { soft:'#f0f7ff', pill:'#2481cc', price:'#2481cc', link:'#2481cc',
        slotBorder:'#2481cc', slotBg:'#f0f7ff', slotText:'#2481cc',
        btnBg:'#2481cc', btnText:'white' }
  return (
    <div key={executor.id} id={`executor-card-${executor.id}`} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            width: '100%',
            maxWidth: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}>
            {/* Верхняя строка: профессия слева, статы справа */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
              {(() => {
                const prof = professions.find(p => p.code === executor.service_type)
                if (!prof) return <span />
                return (
                  <span style={{ display: 'inline-block', padding: '3px 10px', background: P.soft, color: P.pill, borderRadius: '12px', fontSize: '11px', flexShrink: 0 }}>
                    {prof.icon} {prof.name}
                  </span>
                )
              })()}
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
              {(() => {
                  const stats = reviewStats[executor.id]
                  const count = ordersCountByExecutor[executor.id]?.fromApp || 0
                  const ordersLine = count > 0 ? (
                    <span style={{ color: '#666', fontSize: '11px', display: 'block', marginTop: '4px' }}>
                      📦 {count} {count === 1 ? 'заказ' : count < 5 ? 'заказа' : 'заказов'}
                    </span>
                  ) : null
                  if (!stats || stats.count === 0) {
                    return (
                      <>
                        <span style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: P.soft,
                          color: P.pill,
                          borderRadius: '8px',
                          fontSize: '11px',
                          lineHeight: '1.3',
                          textAlign: 'center'
                        }}>
                          Новый<br />исполнитель
                        </span>
                        {ordersLine}
                      </>
                    )
                  }
                  return (
                    <>
                      <span style={{ color: '#f5a623', fontWeight: 'bold', fontSize: '18px', display: 'block' }}>
                        ⭐ {stats.avgRating}
                      </span>
                      {ordersLine}
                      {stats.alwaysOnTime && (
                        <span title="Не опаздывает на встречи" style={{ color: '#2ecc71', fontSize: '11px', fontWeight: 'bold', display: 'block', marginTop: '2px' }}>
                          ✓ Всегда вовремя
                        </span>
                      )}
                    </>
                  )
                })()}
              </div>
            </div>

            {/* Средняя строка: аватар + город/метро */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
              <Avatar url={executor.avatar_url} name={executor.users?.full_name} size={92} />
              {(executor.city || executor.subway_station) ? (
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: executor.subway_station ? 'center' : 'flex-start', gap: '14px', minHeight: '92px', color: '#666', fontSize: '13px', textAlign: 'center', paddingRight: '104px' }}>
                {executor.city && (
                  <div style={{ wordBreak: 'break-word' }}>
                    {executor.city.length <= 9 && '📍\u00A0'}{executor.city}
                  </div>
                )}
                {executor.subway_station && (
                  <div style={{ wordBreak: 'break-word' }}>🚇&nbsp;{executor.subway_station}</div>
                )}
              </div>
              ) : <div style={{ flex: 1 }} />}
            </div>

            {/* Имя одной строкой по центру под аватаром */}
            <h3 style={{ margin: '0 0 8px', fontSize: '17px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
              <span>{executor.users?.full_name}</span>
              {executor.is_verified && <span title="Проверенный исполнитель">✅</span>}
            </h3>
            
            {executor.bio && (() => {
              const LIMIT = 200
              const isOpen = expandedBios.includes(executor.id)
              const isLong = executor.bio.length > LIMIT
              const shown = isOpen || !isLong ? executor.bio : executor.bio.slice(0, LIMIT).trimEnd() + '…'
              return (
                <p style={{ color: '#666', margin: '8px 0', fontSize: '14px', whiteSpace: 'pre-wrap' }}>
                  {shown}
                  {isLong && (
                    <span
                    onClick={(e) => {
                      e.stopPropagation()
                      const pEl = e.currentTarget.parentElement
                      const wasOpen = isOpen
                      setExpandedBios(prev =>
                        wasOpen ? prev.filter(id => id !== executor.id) : [...prev, executor.id]
                      )
                      if (wasOpen && pEl) {
                        setTimeout(() => {
                          pEl.scrollIntoView({ block: 'start', behavior: 'smooth' })
                        }, 0)
                      }
                    }}
                      style={{ color: '#5b8def', cursor: 'pointer', marginLeft: 4 }}
                    >
                      {isOpen ? ' Свернуть ▴' : ' Развернуть ▾'}
                    </span>
                  )}
                </p>
              )
            })()}
            {executor.services && executor.services.length > 0 && (() => {
  const isExpanded = expandedServices.includes(executor.id)
  const allMain = executor.services.filter(s => s.is_main)
  const mainToShow = isExpanded ? allMain : allMain.slice(0, 3)
  return (
  <div style={{ marginTop: '10px' }}>
    {mainToShow.map(mainService => {
      const allExtras = executor.services.filter(s => !s.is_main && s.parent_service_id === mainService.id)
      const extrasToShow = isExpanded ? allExtras : allExtras.slice(0, 2)
      return (
      <div key={mainService.id}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: '10px',
          padding: '6px 0',
          borderBottom: '1px solid #f0f0f0',
          fontSize: '14px'
        }}>
          <span style={{ flex: 1, minWidth: 0 }}>⭐ {mainService.name} {getLocationIcon(mainService.location_type)} {mainService.duration ? `· ${mainService.duration} мин` : ''}</span>
          <span style={{ color: P.price, fontWeight: 'bold', whiteSpace: 'nowrap', flexShrink: 0 }}>{mainService.price} руб</span>
        </div>
        {extrasToShow.map(extra => (
          <div key={extra.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: '10px',
            padding: '4px 0 4px 12px',
            fontSize: '12px',
            color: '#888'
          }}>
            <span style={{ flex: 1, minWidth: 0 }}>➕ {extra.name} {extra.duration ? `· ${extra.duration} мин` : ''}</span>
            <span style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>+{extra.price} руб</span>
          </div>
        ))}
      </div>
      )
    })}
    {(allMain.length > 3 || allMain.some(m => executor.services.filter(s => !s.is_main && s.parent_service_id === m.id).length > 2)) && (
      <button
      onClick={() => {
        const wasExpanded = expandedServices.includes(executor.id)
        setExpandedServices(prev =>
          wasExpanded
            ? prev.filter(id => id !== executor.id)
            : [...prev, executor.id]
        )
        // Если сворачиваем — возвращаем карточку в поле зрения
        if (wasExpanded) {
          setTimeout(() => {
            const card = document.getElementById(`executor-card-${executor.id}`)
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 50)
        }
      }}
        style={{ marginTop: '6px', background: 'none', border: 'none', color: P.link, cursor: 'pointer', fontSize: '13px', padding: 0 }}
      >
        {isExpanded ? '▲ Свернуть' : '▼ Показать все услуги'}
      </button>
    )}
  </div>
  )
})()}
            
            {((executor.todaySlots && executor.todaySlots.length > 0) || (executor.tomorrowSlots && executor.tomorrowSlots.length > 0)) && (
              <div style={{ marginTop: '12px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '13px', color: '#666' }}>📅 Ближайшие слоты:</p>

                {executor.todaySlots && executor.todaySlots.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: '#888', minWidth: '52px' }}>Сегодня</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {executor.todaySlots.map(slot => (
                        <span key={slot.start.toString()} style={{ padding: '5px 10px', borderRadius: '8px', border: `1px solid ${P.slotBorder}`, background: P.slotBg, color: P.slotText, fontSize: '13px' }}>
                          {slot.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {executor.tomorrowSlots && executor.tomorrowSlots.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', color: '#888', minWidth: '52px' }}>Завтра</span>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {executor.tomorrowSlots.map(slot => (
                        <span key={slot.start.toString()} style={{ padding: '5px 10px', borderRadius: '8px', border: `1px solid ${P.slotBorder}`, background: P.slotBg, color: P.slotText, fontSize: '13px' }}>
                          {slot.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={onBook}
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '10px',
                background: P.btnBg,
                color: P.btnText,
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Записаться
            </button>
            {web && onMessage && (
              <button
                onClick={onMessage}
                style={{
                  marginTop: '8px', width: '100%', padding: '10px',
                  background: 'white', color: '#2A2A2A',
                  border: '1.5px solid #E4E0D6', borderRadius: '10px',
                  cursor: 'pointer', fontSize: '15px', fontWeight: 600,
                }}
              >
                Написать
              </button>
            )}
          </div>
  )
}
