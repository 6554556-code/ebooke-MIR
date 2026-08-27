// Страница оформления заявки по честному адресу /master/:id/booking.
//
// Зачем отдельная обёртка: BookingPage ждёт готовый объект мастера в пропсах —
// раньше он всегда прилетал из памяти ClientPage (человек шёл с витрины).
// По прямой ссылке памяти нет, поэтому мастера и отзывы грузим здесь.
//
// Всё остальное (услуги, заказы, слоты, счётчик заказов) BookingPage тянет сам
// по executor.id — дублировать не нужно.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '../supabase'
import { loadReviewsByExecutors, calculateStats } from '../reviewsUtils'
import BookingPage from './BookingPage'

// Общий вид для «грузим» и «не нашли» — чтобы не плодить вёрстку.
function Screen({ children }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
      padding: 24,
      textAlign: 'center',
      color: '#888',
      fontSize: 14,
    }}>
      {children}
    </div>
  )
}

export default function BookingRoute() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const executorId = Number(id)

  const [executor, setExecutor] = useState(null)
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState(null)
  // 'loading' — ждём БД, 'ok' — мастер найден, 'notfound' — нет такого, 'error' — БД не ответила
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    // id из адреса может быть чем угодно (/master/abc/booking) — не ходим в БД зря
    if (!Number.isInteger(executorId) || executorId <= 0) {
      setStatus('notfound')
      return
    }

    let cancelled = false
    async function load() {
      setStatus('loading')
      // Тот же select, что на витрине мастера (ExecutorPage) — поля совпадают
      const [{ data, error }, reviewsMap] = await Promise.all([
        supabase.from('executors').select('*, users(full_name)').eq('id', executorId).maybeSingle(),
        loadReviewsByExecutors([executorId]),
      ])
      if (cancelled) return

      if (error) {
        console.error('[BookingRoute] executor load failed:', error.message, error)
        setStatus('error')
        return
      }
      if (!data) {
        setStatus('notfound')
        return
      }

      const list = reviewsMap[executorId] || []
      setExecutor(data)
      setReviews(list)
      setStats(calculateStats(list))
      setStatus('ok')
    }
    load()
    return () => { cancelled = true }
  }, [executorId])

  if (status === 'loading') {
    return <Screen>Открываем запись…</Screen>
  }

  if (status === 'error') {
    return (
      <Screen>
        <div>Не удалось загрузить мастера. Проверьте соединение.</div>
        <button onClick={() => window.location.reload()} className="eb-primary"
          style={{ border: 0, borderRadius: 11, padding: '10px 16px', cursor: 'pointer', fontWeight: 650 }}>
          Попробовать снова
        </button>
      </Screen>
    )
  }

  if (status === 'notfound') {
    return (
      <Screen>
        <div>Мастер не найден — возможно, он больше не принимает записи.</div>
        <button onClick={() => navigate('/')} className="eb-primary"
          style={{ border: 0, borderRadius: 11, padding: '10px 16px', cursor: 'pointer', fontWeight: 650 }}>
          На главную
        </button>
      </Screen>
    )
  }

  return (
    <BookingPage
      executor={executor}
      stats={stats}
      reviews={reviews}
      slot={null}
      onBack={() => {
        // Пришли по внутренней ссылке — честное «назад» по истории (вернёт на витрину/каталог,
        // откуда бы человек ни пришёл). По прямой ссылке истории нет (key === 'default') —
        // тогда ведём на витрину этого мастера.
        if (location.key !== 'default') navigate(-1)
        else navigate(`/master/${executorId}`)
      }}
      onSuccess={() => {
        alert('Заявка принята! Мы свяжемся с вами.')
        navigate('/cabinet')
      }}
    />
  )
}
