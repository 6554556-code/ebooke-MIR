import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { hasOverlap, findNearestSlot } from '../utils/slotGenerator'
import CabinetBaseStyles from '../components/CabinetShell'
import { BrandMark } from '../components/WebShell'
import UiIcon from '../components/UiIcon'

function AddOrderPage({ executor, initialDay, initialHour, initialMinute, onBack, onSuccess }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [overlapModal, setOverlapModal] = useState(null)
  const [clientTgUsername, setClientTgUsername] = useState('')
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedExtras, setSelectedExtras] = useState([])
  // Если из расписания пришёл клик с днём — превращаем в строку YYYY-MM-DD
  const initialDateStr = initialDay
    ? `${initialDay.getFullYear()}-${String(initialDay.getMonth() + 1).padStart(2, '0')}-${String(initialDay.getDate()).padStart(2, '0')}`
    : ''
  // Если пришли час и минута — превращаем в строку HH:MM
  const initialTimeStr = (initialHour !== null && initialHour !== undefined && initialMinute !== null && initialMinute !== undefined)
    ? `${String(initialHour).padStart(2, '0')}:${String(initialMinute).padStart(2, '0')}`
    : ''
  const [selectedDate, setSelectedDate] = useState(initialDateStr)
  const [selectedTime, setSelectedTime] = useState(initialTimeStr)
  const [locationType, setLocationType] = useState('outcall')

  useEffect(() => {
    async function loadServices() {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('executor_id', executor.id)
        .eq('is_archived', false)
        .order('is_main', { ascending: false })
        .order('name', { ascending: true })
      setServices(data || [])
      const main = data?.find(s => s.is_main)
      if (main) setSelectedService(main)
      if (main) {
        if (main.location_type === 'incall') setLocationType('incall')
        else setLocationType('outcall')
      }
    }
    loadServices()
  }, [executor.id])

  function toggleExtra(extra) {
    if (selectedService?.id !== extra.parent_service_id) {
      const parent = services.find(s => s.id === extra.parent_service_id)
      if (parent) handleServiceSelect(parent)
      setSelectedExtras([extra])
      return
    }
    setSelectedExtras(prev =>
      prev.find(s => s.id === extra.id)
        ? prev.filter(s => s.id !== extra.id)
        : [...prev, extra]
    )
  }
  function handleServiceSelect(service) {
    setSelectedService(service)
    setSelectedExtras([])
    if (service.location_type === 'outcall') setLocationType('outcall')
    if (service.location_type === 'incall') setLocationType('incall')
  }
  function calcTotal() {
    const base = selectedService?.price || 0
    const extras = selectedExtras.reduce((sum, s) => sum + s.price, 0)
    return base + extras
  }

  function calcDuration() {
    const base = selectedService?.duration || 0
    const extras = selectedExtras.reduce((sum, s) => sum + (s.duration || 0), 0)
    return base + extras
  }
  // Создаёт заказ и связанные блоки на заданное время
  async function createOrder(clientName, clientPhone, fullServiceName, scheduledAt) {
    // Чистим username от @ и пробелов, приводим к нижнему регистру
    const cleanUsername = clientTgUsername.trim().replace(/^@/, '').toLowerCase()

    // Если username введён — пробуем найти существующего юзера в БД
    let foundClientId = null
    if (cleanUsername) {
      // Берём первого юзера с этим username (устойчиво к дублям).
      // maybeSingle() падал на дублях → заказ не привязывался к клиенту.
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('telegram_username', cleanUsername)
        .order('id', { ascending: true })
      if (existingUsers && existingUsers.length > 0) foundClientId = existingUsers[0].id
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        client_id: foundClientId,
        client_name: clientName,
        client_phone: clientPhone,
        executor_id: executor.id,
        address: address || 'Не указан',
        incall_address: locationType === 'incall' ? (executor.address || '') : null,
        comment: comment,
        cleaning_type: fullServiceName,
        scheduled_at: scheduledAt.toISOString(),
        status: 'new',
        service_type: executor.service_type,
        total_price: calcTotal(),
        total_duration: calcDuration(),
        location_type: locationType,
        source: 'manual',
        client_telegram_username: cleanUsername || null
      }])
      .select()
      .single()

    if (orderError) {
      alert('Ошибка при создании заявки')
      setLoading(false)
      return
    }

    // Блоки: дорога до, дорога после, буфер
    const travelTime = executor.travel_time || 0
    const bufferTime = executor.buffer_time || 0
    const isOutcall = locationType === 'outcall'
    const duration = calcDuration()
    const blocksToCreate = []

    if (isOutcall && travelTime > 0) {
      const travelBefore = new Date(scheduledAt.getTime() - travelTime * 60000)
      blocksToCreate.push({
        executor_id: executor.id,
        start_at: travelBefore.toISOString(),
        duration: travelTime,
        reason: 'Дорога к клиенту',
        type: 'auto_travel',
        order_id: orderData.id
      })
    }

    const endTime = new Date(scheduledAt.getTime() + duration * 60000)

    if (isOutcall && travelTime > 0) {
      blocksToCreate.push({
        executor_id: executor.id,
        start_at: endTime.toISOString(),
        duration: travelTime,
        reason: 'Дорога обратно',
        type: 'auto_travel',
        order_id: orderData.id
      })
    }

    if (bufferTime > 0) {
      const bufferStart = isOutcall ? new Date(endTime.getTime() + travelTime * 60000) : endTime
      blocksToCreate.push({
        executor_id: executor.id,
        start_at: bufferStart.toISOString(),
        duration: bufferTime,
        reason: 'Перерыв',
        type: 'auto_buffer',
        order_id: orderData.id
      })
    }

    if (blocksToCreate.length > 0) {
      await supabase.from('blocks').insert(blocksToCreate)
    }

    setLoading(false)
    setOverlapModal(null)
    onSuccess()
  }
  async function handleSubmit() {
    if (!name || !phone || !selectedService || !selectedDate || !selectedTime) {
      alert('Пожалуйста заполните все обязательные поля')
      return
    }

    setLoading(true)
    // НЕ создаём фейкового юзера в users.
    // Имя и телефон клиента живут на самом заказе (orders.client_name / client_phone).

    const extrasNames = selectedExtras.map(s => s.name).join(', ')
    const fullServiceName = extrasNames
      ? `${selectedService.name} + ${extrasNames}`
      : selectedService.name

      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`)

      // Проверяем пересечение с существующими заказами и блоками
      const { data: existingOrders } = await supabase
        .from('orders')
        .select('scheduled_at, total_duration, location_type')
        .eq('executor_id', executor.id)
        .neq('status', 'cancelled')
        .neq('is_deleted', true)
  
      const { data: existingBlocks } = await supabase
        .from('blocks')
        .select('start_at, duration')
        .eq('executor_id', executor.id)
  
        const overlap = hasOverlap(
          executor,
          existingOrders || [],
          existingBlocks || [],
          scheduledAt,
          calcDuration(),
          locationType
        )
    
        if (overlap) {
          // Ищем ближайшее свободное время
          const nearest = findNearestSlot(
            executor,
            existingOrders || [],
            existingBlocks || [],
            scheduledAt,
            calcDuration(),
            locationType
          )
          // Показываем модалку выбора
          setOverlapModal({ nearest, scheduledAt })
      setLoading(false)
      return
        }
  
        await createOrder(name, phone, fullServiceName, scheduledAt)
      }
      return (
        <div className="eb-web eb-cabinet eb-add-order">
          <CabinetBaseStyles />
          <div className="eb-cabinet-inner">
            <nav className="eb-cab-nav">
              <span className="eb-cab-brand"><BrandMark size={31}/><span className="eb-brand-name">ebookee</span></span>
              <button type="button" onClick={onBack} className="eb-cab-nav-action"><UiIcon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }}/><span className="eb-cab-action-label">Назад в кабинет</span></button>
            </nav>
    
          {/* Модалка пересечения */}
          {overlapModal && (
            <div className="eb-cab-modal-backdrop" style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}>
              <div className="eb-cab-modal" style={{ padding: '22px', maxWidth: '360px', width: '100%' }}>
                <h3 style={{ margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 8 }}><UiIcon name="clock" size={20}/> Время занято</h3>
                <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#666' }}>
                  Это время пересекается с другим заказом или перерывом.
                </p>
    
                {overlapModal.nearest ? (
                  <button
                    onClick={async () => {
                      setLoading(true)
                      const extrasNames = selectedExtras.map(s => s.name).join(', ')
                      const fullServiceName = extrasNames
                        ? `${selectedService.name} + ${extrasNames}`
                        : selectedService.name
                        await createOrder(name, phone, fullServiceName, new Date(overlapModal.nearest.start))
                    }}
                    className="eb-cab-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '14px', cursor: 'pointer', marginBottom: '8px' }}
                  >
                    <UiIcon name="check" size={16}/> Забронировать на {overlapModal.nearest.label}
                  </button>
                ) : (
                  <p style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Свободного времени в этот день нет</p>
                )}
    
                <button
                  onClick={async () => {
                    setLoading(true)
                    const extrasNames = selectedExtras.map(s => s.name).join(', ')
                    const fullServiceName = extrasNames
                      ? `${selectedService.name} + ${extrasNames}`
                      : selectedService.name
                      await createOrder(name, phone, fullServiceName, overlapModal.scheduledAt)
                  }}
                  className="eb-cab-danger"
                  style={{ width: '100%', padding: '12px', fontSize: '14px', cursor: 'pointer', marginBottom: '8px' }}
                >
                  Всё равно создать на это время
                </button>
    
                <button
                  onClick={() => setOverlapModal(null)}
                  className="eb-cab-secondary"
                  style={{ width: '100%', padding: '12px', fontSize: '14px', cursor: 'pointer' }}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
      <div className="eb-cab-title-row">
        <span className="eb-cab-title-icon"><UiIcon name="clipboard" size={23}/></span>
        <div><h2 className="eb-cab-title">Новая заявка</h2><p className="eb-cab-subtitle">Добавьте клиента в расписание вручную</p></div>
      </div>
      <main className="eb-cab-card eb-cab-form-card">

      {/* Дата и время */}
      <p className="eb-cab-section-title"><UiIcon name="calendar" size={16}/>Дата и время</p>
      <div className="eb-cab-form-grid">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="eb-cab-field"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
        <input
          type="time"
          value={selectedTime}
          onChange={e => setSelectedTime(e.target.value)}
          className="eb-cab-field"
          style={{
            flex: 1,
            minWidth: 0,
            padding: '10px',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '16px',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Тип визита */}
      <p className="eb-cab-section-title">Тип визита</p>
      <div className="eb-visit-options">
      {[
          { id: 'outcall', label: 'Выезд', icon: 'car' },
          { id: 'incall', label: 'Приём', icon: 'home' },
        ].map(t => {
          const disabled =
            t.id === 'outcall' && selectedService?.location_type === 'incall' ||
            t.id === 'incall' && selectedService?.location_type === 'outcall'
          return (
            <button
              key={t.id}
              onClick={() => !disabled && setLocationType(t.id)}
              disabled={disabled}
              className="eb-visit-choice"
              data-active={locationType === t.id}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: locationType === t.id ? '#2481cc' : '#f0f0f0',
                color: locationType === t.id ? 'white' : disabled ? '#aaa' : 'black',
                cursor: disabled ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                opacity: disabled ? 0.5 : 1
              }}
            >
              <UiIcon name={t.icon} size={17}/>{t.label}
            </button>
          )
        })}
      </div>

      {/* Основная услуга */}
      <p className="eb-cab-section-title"><UiIcon name="sparkles" size={16}/>Основная услуга</p>
      <div style={{ marginBottom: '16px' }}>
        {services.filter(s => s.is_main).map(service => (
          <div key={service.id}>
            <div
              onClick={() => handleServiceSelect(service)}
              className="eb-service-choice"
              data-active={selectedService?.id === service.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '4px',
                border: selectedService?.id === service.id ? '2px solid #2481cc' : '2px solid #f0f0f0',
                background: selectedService?.id === service.id ? '#f0f7ff' : 'white',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><UiIcon name="star" size={17}/>{service.name}</span>
                <span style={{ fontSize: 12, color: '#888', display: 'flex', alignItems: 'center', gap: 5 }}>
                  {service.location_type !== 'incall' && <UiIcon name="car" size={14}/>} {service.location_type !== 'outcall' && <UiIcon name="home" size={14}/>} · {service.duration} мин
                </span>
              </div>
              <span className="eb-service-choice-price" style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>{service.price} руб</span>
            </div>

            {/* Допы под своей основной */}
            {services.filter(s => !s.is_main && s.parent_service_id === service.id).map(extra => (
                <div
                  key={extra.id}
                  onClick={() => toggleExtra(extra)}
                  className="eb-extra-choice"
                  data-active={Boolean(selectedExtras.find(s => s.id === extra.id))}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px 8px 24px',
                    borderRadius: '8px',
                    marginBottom: '4px',
                    border: selectedExtras.find(s => s.id === extra.id) ? '2px solid #16a34a' : '2px solid #f0f0f0',
                    background: selectedExtras.find(s => s.id === extra.id) ? '#f0fdf4' : 'white',
                    cursor: 'pointer',
                    fontSize: '13px'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><UiIcon name="plus" size={14}/>{extra.name} {extra.duration ? `· ${extra.duration} мин` : ''}</span>
                  <span className="eb-service-choice-price">+{extra.price} руб</span>
                </div>
              ))
            }
          </div>
        ))}
      </div>

      
      
      {[
        { label: 'Имя клиента *', value: name, setter: setName, placeholder: 'Как зовут клиента' },
        { label: 'Телефон *', value: phone, setter: setPhone, placeholder: '+7 999 123 45 67' },
        { label: 'Telegram-ник клиента (без @, необязательно)', value: clientTgUsername, setter: setClientTgUsername, placeholder: 'username' },
        ...(locationType !== 'incall' ? [{ label: 'Адрес', value: address, setter: setAddress, placeholder: 'Улица, дом, квартира' }] : []),
        { label: 'Комментарий', value: comment, setter: setComment, placeholder: 'Важные детали...' },
      ].map(field => (
        <div key={field.label} style={{ marginBottom: '12px' }}>
          <p className="eb-cab-section-title" style={{ marginBottom: 6 }}>{field.label}</p>
          <input
            className="eb-cab-field"
            value={field.value}
            onChange={e => field.setter(e.target.value)}
            placeholder={field.placeholder}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      ))}

<div className="eb-order-summary" style={{
  background: '#f0f7ff',
  borderRadius: '8px',
  padding: '12px',
  marginBottom: '12px',
}}>
  <div className="eb-order-summary-row">
    <span className="eb-order-summary-label"><UiIcon name="clock" size={16}/>Длительность:</span>
    <span>{calcDuration()} мин</span>
  </div>
  {locationType === 'outcall' && executor.travel_time > 0 && (
    <>
      <div className="eb-order-summary-row">
        <span className="eb-order-summary-label"><UiIcon name="car" size={16}/>Дорога до клиента:</span>
        <span style={{ color: '#f5a623' }}>+{executor.travel_time} мин</span>
      </div>
      <div className="eb-order-summary-row">
        <span className="eb-order-summary-label"><UiIcon name="car" size={16}/>Дорога после заказа:</span>
        <span style={{ color: '#f5a623' }}>+{executor.travel_time} мин</span>
      </div>
    </>
  )}
  {executor.buffer_time > 0 && (
    <div className="eb-order-summary-row">
      <span className="eb-order-summary-label"><UiIcon name="clock" size={16}/>Перерыв после заказа:</span>
      <span style={{ color: '#16a34a' }}>+{executor.buffer_time} мин</span>
    </div>
  )}
 
  <div className="eb-order-summary-row eb-order-summary-total" style={{
    borderTop: '1px solid #ddd',
    marginTop: '8px',
    paddingTop: '8px',
    display: 'flex',
    justifyContent: 'space-between'
  }}>
    <span className="eb-order-summary-label"><UiIcon name="wallet" size={16}/>Итого:</span>
    <span className="eb-service-choice-price">{calcTotal()} руб</span>
  </div>
</div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="eb-cab-primary"
        style={{
          width: '100%',
          padding: '14px',
          background: loading ? '#ccc' : '#2481cc',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px'
        }}
      >
        <UiIcon name={loading ? 'refresh' : 'plus'} size={18}/>{loading ? 'Сохраняем...' : `Добавить заявку · ${calcTotal()} руб`}
      </button>
      </main>
      </div>
    </div>
  )
}

export default AddOrderPage
