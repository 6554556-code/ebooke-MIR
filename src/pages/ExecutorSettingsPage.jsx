import { useState, useEffect } from 'react'
import { supabase } from '../supabase'
import { getLocationFromCoords, getSubwayFromCoords } from "../geocoding.js";
import { getTelegramUser } from '../telegram'
import { getSession } from '../session'
import LocationPicker from '../components/LocationPicker'
import { Link } from 'react-router-dom'
import CabinetBaseStyles, { CabinetSelect } from '../components/CabinetShell'
import { BrandMark } from '../components/WebShell'
import UiIcon from '../components/UiIcon'

const TIMEZONE_OPTIONS = [
  ['Europe/Kaliningrad', 'Калининград (МСК-1)'], ['Europe/Moscow', 'Москва (МСК)'],
  ['Europe/Samara', 'Самара (МСК+1)'], ['Asia/Yekaterinburg', 'Екатеринбург (МСК+2)'],
  ['Asia/Omsk', 'Омск (МСК+3)'], ['Asia/Krasnoyarsk', 'Красноярск (МСК+4)'],
  ['Asia/Irkutsk', 'Иркутск (МСК+5)'], ['Asia/Yakutsk', 'Якутск (МСК+6)'],
  ['Asia/Vladivostok', 'Владивосток (МСК+7)'], ['Asia/Magadan', 'Магадан (МСК+8)'],
  ['Asia/Kamchatka', 'Камчатка (МСК+9)'],
].map(([value, label]) => ({ value, label }))
function ExecutorSettingsPage() {
  const [executor, setExecutor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [savingAbout, setSavingAbout] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [savingBreaks, setSavingBreaks] = useState(false)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [workStart, setWorkStart] = useState('09:00')
  const [workEnd, setWorkEnd] = useState('18:00')
  const [workDays, setWorkDays] = useState([])
  const [bufferTime, setBufferTime] = useState(0)
  const [travelTime, setTravelTime] = useState(0)
  const [services, setServices] = useState([])
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [mapOpen, setMapOpen] = useState(false)
  const [savingLocation, setSavingLocation] = useState(false)
  const [bio, setBio] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [timezone, setTimezone] = useState('Europe/Moscow')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarBlob, setAvatarBlob] = useState(null)      // ужатое фото, ждёт кнопки "Сохранить"
  const [avatarPreview, setAvatarPreview] = useState('')  // временный URL для превью
  useEffect(() => {
    async function loadProfile() {
      setLoading(true)
      const tgUser = getTelegramUser()

      // Находим профиль исполнителя по telegram_id
      let exec = null

      if (tgUser?.telegram_id) {
        // Боевой вход — по telegram_id
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('telegram_id', tgUser.telegram_id)
          .eq('role', 'executor')
          .maybeSingle()

          if (user) {
            const { data } = await supabase
              .from('executors')
              .select('*, users(full_name, phone)')
              .eq('user_id', user.id)
              .maybeSingle()
            exec = data
          }
        } else {
          // Веб: свой профиль по сессии-исполнителю (session.id = users.id),
          // не хардкод id=1 — иначе открываются чужие настройки.
          const session = getSession()
          if (session?.id) {
            const { data } = await supabase
              .from('executors')
              .select('*, users(full_name, phone)')
              .eq('user_id', session.id)
              .maybeSingle()
            exec = data
          }
        }

      setExecutor(exec)
      if (exec) {
        setFullName(exec.users?.full_name || '')
        setPhone(exec.users?.phone || '')
        setAddress(exec.address || '')
        setWorkStart(exec.work_start || '09:00')
        setWorkEnd(exec.work_end || '18:00')
        setWorkDays(exec.work_days ? exec.work_days.split(',').map(Number) : [])
        setBufferTime(exec.buffer_time || 0)
        setTravelTime(exec.travel_time || 0)
        setBio(exec.bio || '')
        setAvatarUrl(exec.avatar_url || '')
        setLatitude(exec.latitude ?? '')
        setLongitude(exec.longitude ?? '')
        setTimezone(exec.timezone || 'Europe/Moscow')
        // Загружаем услуги этого исполнителя
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('executor_id', exec.id)
          .order('id', { ascending: true })
        setServices(servicesData || [])
      }
      setLoading(false)
    }
    loadProfile()
  }, [])
  function toggleLocation(service, which) {
    let incall = service.location_type === 'incall' || service.location_type === 'both'
    let outcall = service.location_type === 'outcall' || service.location_type === 'both'

    if (which === 'incall') incall = !incall
    if (which === 'outcall') outcall = !outcall

    let newType = null
    if (incall && outcall) newType = 'both'
    else if (incall) newType = 'incall'
    else if (outcall) newType = 'outcall'

    if (!newType) return  // нельзя выключить обе — хотя бы одна должна быть

    updateServiceField(service.id, 'location_type', newType)
  }
  function updateServiceField(serviceId, field, value) {
    setServices(services.map(s =>
      s.id === serviceId ? { ...s, [field]: value } : s
    ))
  }
  const [savingServiceId, setSavingServiceId] = useState(null)
  async function restoreService(service) {
    const { error } = await supabase
      .from('services')
      .update({ is_archived: false })
      .eq('id', service.id)

    if (error) {
      alert('Ошибка восстановления: ' + error.message)
      return
    }

    setServices(services.map(s =>
      s.id === service.id ? { ...s, is_archived: false } : s
    ))
  }
  async function deleteService(service) {
    const isMain = service.is_main
    const subs = services.filter(s => s.parent_service_id === service.id)
    const idsToArchive = isMain ? [service.id, ...subs.map(s => s.id)] : [service.id]

    let confirmText
    if (isMain && subs.length > 0) {
      confirmText = `Скрыть «${service.name || 'без названия'}» и её допы (${subs.length} шт.)? Их можно будет восстановить из архива.`
    } else {
      confirmText = `Скрыть «${service.name || 'без названия'}»? Её можно будет восстановить из архива.`
    }

    if (!confirm(confirmText)) return

    const { error } = await supabase
      .from('services')
      .update({ is_archived: true })
      .in('id', idsToArchive)

    if (error) {
      alert('Ошибка: ' + error.message)
      return
    }

    setServices(services.map(s =>
      idsToArchive.includes(s.id) ? { ...s, is_archived: true } : s
    ))
  }
  async function addMainService() {
    
    const { data, error } = await supabase
      .from('services')
      .insert({
        executor_id: executor.id,
        parent_service_id: null,
        is_main: true,
        name: '',
        price: 0,
        duration: 60,
        location_type: 'outcall',
      })
      .select()
      .single()

    if (error) {
      alert('Не получилось добавить: ' + error.message)
      return
    }

    setServices([...services, data])
  }
  async function addSubService(main) {
    const { data, error } = await supabase
      .from('services')
      .insert({
        executor_id: executor.id,
        parent_service_id: main.id,
        is_main: false,
        name: '',
        price: 0,
        duration: 0,
        location_type: main.location_type,
      })
      .select()
      .single()

    if (error) {
      alert('Не получилось добавить: ' + error.message)
      return
    }

    // Добавляем новую услугу в список на экране
    setServices([...services, data])
  }
  async function saveServiceGroup(main) {
    setSavingServiceId(main.id)

    // Собираем основную услугу и все её допы в один список
    const group = services.filter(s => s.id === main.id || s.parent_service_id === main.id)
// Проверки перед сохранением
for (const s of group) {
    const name = (s.name || '').trim()
    const price = Number(s.price)
    const duration = Number(s.duration)

    if (!name) {
      setSavingServiceId(null)
      alert(s.is_main
        ? 'У основной услуги пустое название'
        : 'У одной из допуслуг пустое название')
      return
    }

    if (isNaN(price) || price < 0) {
      setSavingServiceId(null)
      alert(`Неверная цена у «${name}»`)
      return
    }

    if (isNaN(duration) || duration < 0) {
      setSavingServiceId(null)
      alert(`Неверная длительность у «${name}»`)
      return
    }

    // Для основной — длительность должна быть больше нуля
    if (s.is_main && duration === 0) {
      setSavingServiceId(null)
      alert(`У основной услуги «${name}» нужна длительность больше 0 минут`)
      return
    }
  }
    // Сохраняем каждую — одна за другой
    for (const s of group) {
      const { error } = await supabase
        .from('services')
        .update({
          name: s.name,
          price: Number(s.price),
          duration: Number(s.duration),
          location_type: s.location_type,
        })
        .eq('id', s.id)

      if (error) {
        setSavingServiceId(null)
        alert('Ошибка сохранения услуги: ' + error.message)
        return
      }
    }

    setSavingServiceId(null)
    alert('Услуга сохранена ✅')
  }
  // Ужимаем картинку прямо в браузере: уменьшаем до 512px по большей стороне
  // и пересохраняем в JPEG. Это убивает разом две проблемы:
  // большой размер (ошибка 413) и HEIC с айфона (нормализуем в обычный JPEG).
  function resizeImageToJpeg(file, maxSize = 512, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(objectUrl)
        let { width, height } = img
        if (width >= height && width > maxSize) {
          height = Math.round(height * (maxSize / width))
          width = maxSize
        } else if (height > maxSize) {
          width = Math.round(width * (maxSize / height))
          height = maxSize
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
          'image/jpeg',
          quality
        )
      }
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('decode failed'))
      }
      img.src = objectUrl
    })
  }

  // Шаг 1 — выбор файла. Ужимаем и показываем ТОЛЬКО превью.
  // В storage и в базу ничего не пишем, пока не нажата "Сохранить фото".
  async function handleAvatarPick(e) {
    const file = e.target.files?.[0]
    e.target.value = '' // сброс, чтобы можно было выбрать тот же файл ещё раз
    if (!file) return
    try {
      const blob = await resizeImageToJpeg(file)
      if (avatarPreview) URL.revokeObjectURL(avatarPreview)
      setAvatarBlob(blob)
      setAvatarPreview(URL.createObjectURL(blob))
    } catch {
      alert('Не удалось прочитать изображение. Выберите фото в формате JPG или PNG.')
    }
  }

  // Шаг 2 — подтверждение. Грузим ужатый JPEG в storage и пишем ссылку в профиль.
  async function handleAvatarConfirm() {
    if (!avatarBlob || !executor) return
    setUploadingAvatar(true)

    const fileName = `executor_${executor.id}_${Date.now()}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarBlob, { upsert: true, contentType: 'image/jpeg' })

    if (uploadError) {
      setUploadingAvatar(false)
      const tooBig = uploadError.statusCode === '413'
        || /exceeded the maximum/i.test(uploadError.message || '')
      alert(tooBig
        ? 'Файл слишком большой. Попробуйте фото поменьше.'
        : 'Не удалось загрузить фото. Попробуйте ещё раз.')
      return
    }

    const { data: publicData } = supabase.storage.from('avatars').getPublicUrl(fileName)
    const url = publicData?.publicUrl

    const { error: dbError } = await supabase
      .from('executors')
      .update({ avatar_url: url })
      .eq('id', executor.id)

    setUploadingAvatar(false)
    if (dbError) {
      alert('Фото загрузилось, но не сохранилось в профиль. Попробуйте ещё раз.')
      return
    }

    // Успех: фиксируем новое фото, чистим превью
    setAvatarUrl(url)
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview('')
    setAvatarBlob(null)
  }

  // Отмена выбора — возвращаем старое фото, в базе ничего не трогаем.
  function handleAvatarCancel() {
    if (avatarPreview) URL.revokeObjectURL(avatarPreview)
    setAvatarPreview('')
    setAvatarBlob(null)
  }
  // Сохранение блока "О себе": имя, телефон, адрес, био, часовой пояс.
  async function handleSaveAbout() {
    setSavingAbout(true)

    const { error: userError } = await supabase
      .from('users')
      .update({ full_name: fullName, phone: phone })
      .eq('id', executor.user_id)

    const { error: execError } = await supabase
      .from('executors')
      .update({ address: address, bio: bio, timezone: timezone })
      .eq('id', executor.id)

    setSavingAbout(false)

    if (userError || execError) {
      alert('Ошибка сохранения: ' + (userError?.message || execError?.message))
      return
    }
    alert('Сохранено ✅')
  }

  // Сохранение блока "График работы": часы и рабочие дни (с проверкой времени).
  async function handleSaveSchedule() {
    const [startH, startM] = workStart.split(':').map(Number)
    const [endH, endM] = workEnd.split(':').map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    if (endMinutes < startMinutes) {
      setWorkStart(executor.work_start)
      setWorkEnd(executor.work_end)
      alert('Время окончания раньше времени начала — мастер станет невидимым для клиентов.\n\n🌙 Работаете по ночному графику с переходом через полночь? Укажите 00:00–23:59, а нерабочие часы закройте перерывом в расписании.')
      return
    }
    if (endMinutes === startMinutes) {
      setWorkStart(executor.work_start)
      setWorkEnd(executor.work_end)
      alert('Время начала и окончания совпадают — мастер станет невидимым для клиентов.\n\n🕐 Для круглосуточной работы укажите 00:00–23:59.')
      return
    }

    setSavingSchedule(true)
    const { error } = await supabase
      .from('executors')
      .update({
        work_start: workStart,
        work_end: workEnd,
        work_days: workDays.sort((a, b) => a - b).join(','),
      })
      .eq('id', executor.id)
    setSavingSchedule(false)

    if (error) {
      alert('Ошибка сохранения: ' + error.message)
      return
    }
    alert('Сохранено ✅')
  }

  // Сохранение блока "Перерывы и дорога": буфер и время на дорогу.
  async function handleSaveBreaks() {
    setSavingBreaks(true)
    const { error } = await supabase
      .from('executors')
      .update({
        buffer_time: Number(bufferTime) || 0,
        travel_time: Number(travelTime) || 0,
      })
      .eq('id', executor.id)
    setSavingBreaks(false)

    if (error) {
      alert('Ошибка сохранения: ' + error.message)
      return
    }
    alert('Сохранено ✅')
  }

  // Отдельное сохранение точки на карте. Тяжёлое (геокодинг + поиск метро),
  // поэтому вынесено из основного "Сохранить" — пин меняют редко.
  async function handleSaveLocation() {
    if (latitude === '' || longitude === '') {
      alert('Сначала поставьте точку на карте')
      return
    }
    setSavingLocation(true)

    // Проверка страны + город (быстрый Nominatim)
    const loc = await getLocationFromCoords(Number(latitude), Number(longitude))
    if (!loc.isSupported) {
      setSavingLocation(false)
      alert('🌍 В этом месте мы пока не работаем\n\nПередвиньте метку на карте в Россию или страны СНГ.')
      return
    }

    // Метро ищем с щедрым таймаутом (20 сек) — здесь важно, чтобы нашлось
    const subway = await getSubwayFromCoords(Number(latitude), Number(longitude), 20000)

    const { error } = await supabase
      .from('executors')
      .update({
        latitude: Number(latitude),
        longitude: Number(longitude),
        city: loc.city,
        subway_station: subway,
      })
      .eq('id', executor.id)

    setSavingLocation(false)

    if (error) {
      alert('Ошибка сохранения точки: ' + error.message)
      return
    }

    const parts = [loc.city, subway].filter(Boolean).join(' · ')
    alert('Точка сохранена ✅' + (parts ? '\n' + parts : ''))
  }
  if (loading) return <div className="eb-web eb-cabinet"><CabinetBaseStyles/><div className="eb-cab-card eb-loading-card">Загружаем настройки…</div></div>
  if (!executor) return <div className="eb-web eb-cabinet"><CabinetBaseStyles/><div className="eb-cab-card eb-cab-empty" style={{ maxWidth: 500, margin: '40px auto' }}><span className="eb-cab-empty-icon"><UiIcon name="user" size={25}/></span><strong>Профиль исполнителя не найден</strong><Link to="/executor/schedule" className="eb-cab-secondary" style={{ marginTop: 16, padding: '10px 16px', textDecoration: 'none' }}>Вернуться в кабинет</Link></div></div>

  return (
    <div className="eb-web eb-cabinet eb-settings-cabinet">
      <CabinetBaseStyles />
      <div className="eb-cabinet-inner">
        <nav className="eb-cab-nav">
          <span className="eb-cab-brand"><BrandMark size={31}/><span className="eb-brand-name">ebookee</span></span>
          <Link to="/executor/schedule" className="eb-cab-nav-action"><UiIcon name="arrow" size={16} style={{ transform: 'rotate(180deg)' }}/><span className="eb-cab-action-label">Назад в кабинет</span></Link>
        </nav>
        <div className="eb-cab-title-row">
          <span className="eb-cab-title-icon"><UiIcon name="settings" size={23}/></span>
          <div><h2 className="eb-cab-title">Настройки профиля</h2><p className="eb-cab-subtitle">Профиль, график работы и услуги</p></div>
        </div>
      <div className="eb-cab-card eb-settings-section">
      <h3><UiIcon name="user" size={20}/>О себе</h3>

{/* Аватар: круглое фото + превью с подтверждением */}
<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
  <div className="eb-avatar-shell" style={{
    width: '96px', height: '96px', borderRadius: '50%', overflow: 'hidden',
    background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #e0e0e0', marginBottom: '8px'
  }}>
    {(avatarPreview || avatarUrl) ? (
      <img src={avatarPreview || avatarUrl} alt="Фото" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    ) : (
      <UiIcon name="camera" size={34}/>
    )}
  </div>

  {avatarPreview ? (
    // Выбрано новое фото, но ещё не сохранено — Сохранить/Отмена прямо здесь
    <div style={{ display: 'flex', gap: '8px' }}>
      <button
        onClick={handleAvatarConfirm}
        disabled={uploadingAvatar}
        className="eb-cab-primary"
        style={{
          cursor: uploadingAvatar ? 'wait' : 'pointer', fontSize: '13px',
          padding: '6px 14px', borderRadius: '8px', border: 'none',
          background: '#16a34a', color: 'white'
        }}
      >
        <UiIcon name="check" size={15}/>{uploadingAvatar ? 'Сохраняю...' : 'Сохранить фото'}
      </button>
      <button
        onClick={handleAvatarCancel}
        disabled={uploadingAvatar}
        className="eb-cab-secondary"
        style={{
          cursor: 'pointer', fontSize: '13px',
          padding: '6px 14px', borderRadius: '8px',
          border: '1px solid #ddd', background: 'white', color: '#666'
        }}
      >
        Отмена
      </button>
    </div>
  ) : (
    <label className="eb-cab-secondary" style={{
      cursor: 'pointer', fontSize: '13px', color: '#2481cc',
      padding: '6px 12px', border: '1px solid #2481cc', borderRadius: '8px'
    }}>
      {avatarUrl ? 'Заменить фото' : 'Загрузить фото'}
      <input
        type="file"
        accept="image/*"
        onChange={handleAvatarPick}
        style={{ display: 'none' }}
      />
    </label>
  )}
</div>

        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Имя</label>
        <input
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px', boxSizing: 'border-box' }}
        />

        <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Телефон</label>
        <input
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '12px', boxSizing: 'border-box' }}
        />

<label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Адрес</label>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
        />

        <button
          onClick={() => setAdvancedOpen(!advancedOpen)}
          className="eb-settings-toggle"
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            background: 'transparent',
            color: '#2481cc',
            fontSize: '14px',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span>Подробнее</span><UiIcon name="chevronDown" size={16} style={{ transform: advancedOpen ? 'rotate(180deg)' : 'none' }}/>
        </button>

        {advancedOpen && (
          <div style={{ marginTop: '8px' }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>О себе</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Несколько слов о себе для клиентов"
              rows={3}
              maxLength={1500}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid ' + (bio.length > 1500 ? '#ef4444' : '#ddd'), marginBottom: '4px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
            />
            <div
              style={{
                fontSize: '12px',
                textAlign: 'right',
                marginBottom: '12px',
                color: bio.length > 1500 ? '#ef4444' : bio.length > 1400 ? '#f59e0b' : '#999',
              }}
            >
              {bio.length} / 1500
              {bio.length > 1500 && ' — сократите описание'}
            </div>

            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Часовой пояс</label>
            <CabinetSelect value={timezone} onChange={e => setTimezone(e.target.value)} options={TIMEZONE_OPTIONS} ariaLabel="Часовой пояс" />
          </div>
        )}

        <button
          onClick={handleSaveAbout}
          disabled={savingAbout}
          className="eb-cab-primary"
          style={{
            width: '100%', marginTop: '16px', padding: '12px', borderRadius: '8px', border: 'none',
            background: savingAbout ? '#9ca3af' : '#2481cc', color: 'white', fontSize: '15px',
            cursor: savingAbout ? 'default' : 'pointer',
          }}
        >
          {savingAbout ? 'Сохраняю...' : 'Сохранить'}
        </button>
      </div>

      {/* Отдельный блок: точка на карте. Меняется редко, сохраняется отдельной кнопкой. */}
      <div className="eb-cab-card eb-settings-section">
        <div
          onClick={() => setMapOpen(!mapOpen)}
          className="eb-settings-collapsible"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
        >
          <h3><UiIcon name="pin" size={20}/>Вы на карте</h3>
          <span style={{ color: '#943184', fontSize: '13px', display: 'flex', alignItems: 'center', gap: 5 }}>{mapOpen ? 'Свернуть' : 'Открыть'}<UiIcon name="chevronDown" size={15} style={{ transform: mapOpen ? 'rotate(180deg)' : 'none' }}/></span>
        </div>

        {mapOpen && (
          <div style={{ marginTop: '12px' }}>
            <p style={{ fontSize: '13px', color: '#666', margin: '0 0 12px' }}>
              Это место, откуда вы выезжаете или принимаете клиентов. По нему мы определяем ваш город и ближайшее метро.
              Меняйте только при переезде.
            </p>
            <div className="eb-settings-map-wrap"><LocationPicker
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => {
                  setLatitude(lat)
                  setLongitude(lng)
                }}
              /></div>
            <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
              {(latitude !== '' && longitude !== '' && latitude != null && longitude != null)
                ? `Координаты: ${Number(latitude).toFixed(5)}, ${Number(longitude).toFixed(5)}`
                : 'Кликните по карте, чтобы поставить маркер'}
            </div>

            {savingLocation && (
              <p style={{ fontSize: '13px', color: '#2481cc', margin: '12px 0 0', textAlign: 'center' }}>
                Определяю город и метро… это может занять до 20 секунд, не закрывайте страницу
              </p>
            )}

            <button
              onClick={handleSaveLocation}
              disabled={savingLocation}
              className="eb-cab-primary"
              style={{
                marginTop: '12px',
                width: '100%',
                padding: '10px',
                background: savingLocation ? '#9bc4e8' : '#2481cc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: savingLocation ? 'default' : 'pointer',
                fontSize: '16px'
              }}
            >
              {savingLocation ? 'Сохраняю точку…' : 'Сохранить точку'}
            </button>
          </div>
        )}
      </div>

      <div className="eb-cab-card eb-settings-section">
        <h3><UiIcon name="calendar" size={20}/>График работы</h3>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Начало</label>
            <input
              type="time"
              value={workStart}
              onChange={e => setWorkStart(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>Конец</label>
            <input
              type="time"
              value={workEnd}
              onChange={e => setWorkEnd(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
          </div>
        </div>

        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', color: '#666' }}>Рабочие дни</label>
        <div className="eb-day-list">
          {[
            { num: 1, label: 'Пн' },
            { num: 2, label: 'Вт' },
            { num: 3, label: 'Ср' },
            { num: 4, label: 'Чт' },
            { num: 5, label: 'Пт' },
            { num: 6, label: 'Сб' },
            { num: 7, label: 'Вс' },
          ].map(day => (
            <button
              key={day.num}
              className="eb-day-choice"
              data-active={workDays.includes(day.num)}
              onClick={() => {
                if (workDays.includes(day.num)) {
                  setWorkDays(workDays.filter(d => d !== day.num))
                } else {
                  setWorkDays([...workDays, day.num])
                }
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid ' + (workDays.includes(day.num) ? '#2481cc' : '#ddd'),
                background: workDays.includes(day.num) ? '#2481cc' : 'white',
                color: workDays.includes(day.num) ? 'white' : '#333',
                cursor: 'pointer',
              }}
            >
              {day.label}
              </button>
          ))}
        </div>

        <button
          onClick={handleSaveSchedule}
          disabled={savingSchedule}
          className="eb-cab-primary"
          style={{
            width: '100%', marginTop: '16px', padding: '12px', borderRadius: '8px', border: 'none',
            background: savingSchedule ? '#9ca3af' : '#2481cc', color: 'white', fontSize: '15px',
            cursor: savingSchedule ? 'default' : 'pointer',
          }}
        >
          {savingSchedule ? 'Сохраняю...' : 'Сохранить'}
        </button>
      </div>

      <div className="eb-cab-card eb-settings-section">
        <h3><UiIcon name="clock" size={20}/>Перерывы и дорога</h3>

        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>
              Буфер после заказа, мин
            </label>
            <input
              type="number"
              min="0"
              value={bufferTime}
              onChange={e => setBufferTime(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
            <div className="eb-settings-note" style={{ marginTop: '4px' }}>
              Передышка между заказами
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', color: '#666' }}>
              Время на дорогу, мин
            </label>
            <input
              type="number"
              min="0"
              value={travelTime}
              onChange={e => setTravelTime(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' }}
            />
            <div className="eb-settings-note" style={{ marginTop: '4px' }}>
              Учитывается только для выездных заказов
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveBreaks}
          disabled={savingBreaks}
          className="eb-cab-primary"
          style={{
            width: '100%', marginTop: '16px', padding: '12px', borderRadius: '8px', border: 'none',
            background: savingBreaks ? '#9ca3af' : '#2481cc', color: 'white', fontSize: '15px',
            cursor: savingBreaks ? 'default' : 'pointer',
          }}
        >
          {savingBreaks ? 'Сохраняю...' : 'Сохранить'}
        </button>
      </div>

      <div className="eb-cab-card eb-settings-section">
        <h3><UiIcon name="sparkles" size={20}/>Услуги</h3>

        {services.filter(s => s.is_main && !s.is_archived).length === 0 && (
          <p style={{ color: '#666' }}>Услуг пока нет</p>
        )}

{services.filter(s => s.is_main && !s.is_archived).map((main, mainIndex) => (
          <div key={main.id} className="eb-service-editor" style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '12px', marginBottom: '12px', background: '#f7f9fc' }}>
            
            <div className="eb-service-editor-head">
              <div className="eb-service-kicker">
                {mainIndex + 1}. Основная услуга
              </div>
              <button
                onClick={() => deleteService(main)}
                className="eb-icon-button"
                aria-label="Удалить услугу"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 4px',
                }}
              >
                <UiIcon name="close" size={16}/>
              </button>
            </div>
            <input
              value={main.name}
              onChange={e => updateServiceField(main.id, 'name', e.target.value)}
              placeholder="Название услуги"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', fontWeight: 'bold', marginBottom: '8px', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Цена, ₽</label>
                <input
                  type="number"
                  value={main.price}
                  onChange={e => updateServiceField(main.id, 'price', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '12px', color: '#666' }}>Длительность, мин</label>
                <input
                  type="number"
                  value={main.duration}
                  onChange={e => updateServiceField(main.id, 'duration', e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => toggleLocation(main, 'incall')}
                className="eb-location-choice"
                data-active={main.location_type === 'incall' || main.location_type === 'both'}
                style={{
                  padding: '5px 14px',
                  fontSize: '13px',
                  borderRadius: '999px',
                  border: '1px solid ' + ((main.location_type === 'incall' || main.location_type === 'both') ? '#2481cc' : '#ddd'),
                  background: (main.location_type === 'incall' || main.location_type === 'both') ? '#2481cc' : 'white',
                  color: (main.location_type === 'incall' || main.location_type === 'both') ? 'white' : '#333',
                  cursor: 'pointer',
                }}
              >
                <UiIcon name="home" size={15}/>У меня
              </button>
              <button
                onClick={() => toggleLocation(main, 'outcall')}
                className="eb-location-choice"
                data-active={main.location_type === 'outcall' || main.location_type === 'both'}
                style={{
                  padding: '5px 14px',
                  fontSize: '13px',
                  borderRadius: '999px',
                  border: '1px solid ' + ((main.location_type === 'outcall' || main.location_type === 'both') ? '#2481cc' : '#ddd'),
                  background: (main.location_type === 'outcall' || main.location_type === 'both') ? '#2481cc' : 'white',
                  color: (main.location_type === 'outcall' || main.location_type === 'both') ? 'white' : '#333',
                  cursor: 'pointer',
                }}
              >
                <UiIcon name="car" size={15}/>Выезд
              </button>
            </div>
                  
            {/* Допуслуги, привязанные к этой основной */}
            {services.filter(s => s.parent_service_id === main.id && !s.is_archived).map((sub, subIndex) => (
              <div key={sub.id} className="eb-service-sub" style={{ marginTop: '10px', paddingLeft: '12px', borderLeft: '2px solid #ddd' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#888', textTransform: 'uppercase' }}>
                    Дополнительная услуга {subIndex + 1}
                  </div>
                  <button
                    onClick={() => deleteService(sub)}
                    className="eb-icon-button"
                    aria-label="Удалить дополнительную услугу"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0 4px',
                    }}
                  >
                    <UiIcon name="close" size={15}/>
                  </button>
                </div>
                <input
                  value={sub.name}
                  onChange={e => updateServiceField(sub.id, 'name', e.target.value)}
                  placeholder="Название допуслуги"
                  style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ddd', marginBottom: '6px', boxSizing: 'border-box' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#666' }}>Цена, ₽</label>
                    <input
                      type="number"
                      value={sub.price}
                      onChange={e => updateServiceField(sub.id, 'price', e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '12px', color: '#666' }}>Длительность, мин</label>
                    <input
                      type="number"
                      value={sub.duration}
                      onChange={e => updateServiceField(sub.id, 'duration', e.target.value)}
                      style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                  </div>
                  </div>
              </div>
            ))}

            <button
              onClick={() => addSubService(main)}
              className="eb-cab-secondary"
              style={{
                width: '100%',
                marginTop: '10px',
                padding: '8px',
                borderRadius: '8px',
                border: '1px dashed #2481cc',
                background: 'white',
                color: '#2481cc',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <UiIcon name="plus" size={15}/>Добавить дополнительную услугу
            </button>

            <button
              onClick={() => saveServiceGroup(main)}
              disabled={savingServiceId === main.id}
              className="eb-cab-primary"
              style={{
                width: '100%',
                marginTop: '12px',
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: savingServiceId === main.id ? '#9ca3af' : '#16a34a',
                color: 'white',
                fontSize: '14px',
                cursor: savingServiceId === main.id ? 'default' : 'pointer',
              }}
            >
              <UiIcon name={savingServiceId === main.id ? 'refresh' : 'check'} size={16}/>{savingServiceId === main.id ? 'Сохраняю...' : 'Сохранить услугу'}
            </button>
          </div>
        ))}

        <button
          onClick={addMainService}
          className="eb-cab-secondary"
          style={{
            width: '100%',
            marginTop: '12px',
            padding: '12px',
            borderRadius: '10px',
            border: '2px dashed #2481cc',
            background: 'white',
            color: '#2481cc',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          <UiIcon name="plus" size={16}/>Добавить основную услугу
        </button>
      </div>
      {/* Архив */}
      {services.some(s => s.is_archived) && (
        <div className="eb-cab-card eb-settings-section">
          <button
            onClick={() => setArchiveOpen(!archiveOpen)}
            className="eb-settings-toggle"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: '1px solid #ddd',
              background: 'white',
              color: '#666',
              fontSize: '14px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span>Архив ({services.filter(s => s.is_archived).length})</span><UiIcon name="chevronDown" size={16} style={{ transform: archiveOpen ? 'rotate(180deg)' : 'none' }}/>
          </button>

          {archiveOpen && (
            <div style={{ background: '#f3f4f6', borderRadius: '10px', padding: '12px', marginTop: '8px' }}>
              {services.filter(s => s.is_archived).map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e5e7eb' }}>
                  <div>
                    <div style={{ fontSize: '14px', color: '#333' }}>{s.name || 'без названия'}</div>
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      {s.is_main ? 'Основная' : 'Доп'} · {s.price} ₽ · {s.duration} мин
                    </div>
                  </div>
                  <button
                    onClick={() => restoreService(s)}
                    className="eb-cab-secondary"
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      border: '1px solid #2481cc',
                      background: 'white',
                      color: '#2481cc',
                      fontSize: '13px',
                      cursor: 'pointer',
                    }}
                  >
                    <UiIcon name="refresh" size={14}/>Восстановить
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  )
}

export default ExecutorSettingsPage
