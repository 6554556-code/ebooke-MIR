import ClientPage from './pages/ClientPage'
import ExecutorPage from './pages/ExecutorPage'
import MapPage from './pages/MapPage'
import RegisterExecutorPage from './pages/RegisterExecutorPage'
import ClientCabinetPage from './pages/ClientCabinetPage'
import ExecutorSettingsPage from './pages/ExecutorSettingsPage'
import { useEffect, useState } from 'react'
import { Routes, Route, useParams, Navigate } from 'react-router-dom'
import { initTelegram, getTelegramUser, syncTelegramUsername, isWeb } from './telegram'
import { supabase } from './supabase'
import { getSession } from './session'
import LoginPage from './pages/LoginPage'
import LegalPage from './pages/LegalPage'
import { LEGAL_ROUTES } from './legalDocs'
import UiIcon from './components/UiIcon'

// Обёртка: достаёт :id из адреса /master/123 и отдаёт странице как раньше — числом.
function ExecutorRoute() {
  const { id } = useParams()
  return <ExecutorPage executorId={Number(id)} />
}

// Кабинет клиента: только для залогиненного. На вебе без Telegram и без сессии — сначала вход.
// id берём ИЗ СЕССИИ, а не из адреса — чтобы нельзя было подставить чужой кабинет.
function CabinetRoute() {
  const tgUser = getTelegramUser()
  const session = getSession()
  if (!tgUser?.telegram_id && !session?.id) {
    return <LoginPage title="Вход в кабинет" onSuccess={() => window.location.reload()} />
  }
  const clientId = (!tgUser?.telegram_id && session?.id) ? session.id : (tgUser?.id ?? session?.id)
  return <ClientCabinetPage clientId={clientId} />
}

// Настройки исполнителя: только для залогиненного исполнителя. Иначе — вход как исполнитель.
function SettingsRoute() {
  const tgUser = getTelegramUser()
  const session = getSession()
  if (!tgUser?.telegram_id && session?.role !== 'executor') {
    return <LoginPage title="Вход для исполнителей" role="executor" onSuccess={() => window.location.reload()} />
  }
  return <ExecutorSettingsPage />
}

function App() {
  // 'checking' пока ждём ответа БД, 'blocked' если в blocked_users, 'ok' во всех остальных случаях
  const [blockStatus, setBlockStatus] = useState('checking')

  useEffect(() => {
    initTelegram()
    // Синхронизируем username Telegram с базой (автоматически, если юзер из Telegram)
    syncTelegramUsername()
    // Логируем открытие приложения
    setTimeout(() => {
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user
      if (user) {
        supabase.from('app_opens').insert({
          tg_user_id: user.id,
          username: user.username ?? null,
        }).then(({ error }) => {
          if (error) {
            console.error('[app_opens] INSERT failed:', error.message, error)
          } else {
            console.log('[app_opens] insert ok for tg_user_id:', user.id)
          }
        })
      } else {
        console.warn('[app_opens] no Telegram user — skip insert (открыто не из Telegram?)')
      }
    }, 500)

    // Проверка блокировки по telegram_id
    const tgUser = getTelegramUser()
    const tgId = tgUser?.telegram_id
    if (!tgId) {
      setBlockStatus('ok')
      return
    }
    supabase
      .from('blocked_users')
      .select('telegram_id')
      .eq('telegram_id', tgId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error('Block check failed:', error)
          setBlockStatus('ok')
          return
        }
        setBlockStatus(data ? 'blocked' : 'ok')
      })
  }, [])

  // Пока идёт проверка — не рендерим ничего (мгновение)
  if (blockStatus === 'checking') {
    return null
  }

  // Заблокированному показываем маскировочный экран «технических работ»
  if (blockStatus === 'blocked') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        background: '#fafafa'
      }}>
        <div style={{ width: 64, height: 64, borderRadius: 22, marginBottom: 16, display: 'grid', placeItems: 'center', color: '#B13A9D', background: '#FFF1FA' }}><UiIcon name="tool" size={30}/></div>
        <h2 style={{ margin: '0 0 12px', fontSize: '20px', color: '#333' }}>
          Приложение временно недоступно
        </h2>
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: '#888', maxWidth: '300px', lineHeight: '1.5' }}>
          Попробуйте обновить страницу или зайти позже.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '12px 24px',
            background: '#2481cc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Перезагрузить
        </button>
      </div>
    )
  }

  // ── Маршруты ──
  return (
    <Routes>
      <Route path="/" element={<ClientPage />} />
      <Route path="/master/:id" element={<ExecutorRoute />} />
      <Route path="/cabinet" element={<CabinetRoute />} />
      <Route path="/register" element={<RegisterExecutorPage />} />
      <Route path="/settings" element={<SettingsRoute />} />
      <Route path="/map" element={isWeb() ? <ClientPage /> : <MapPage />} />

      {/* Правовые документы — по одному маршруту на каждый путь из LEGAL_ROUTES */}
      {Object.entries(LEGAL_ROUTES).map(([path, key]) => (
        <Route key={path} path={path} element={<LegalPage docKey={key} />} />
      ))}

      {/* Всё неизвестное — на главную */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App