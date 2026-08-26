import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { saveSession } from '../session'
import { BrandMark, WebBaseStyles } from '../components/WebShell'
import UiIcon from '../components/UiIcon'

const TG_BOT = 'slotis_bot' // @slotis_bot, домен привязан в BotFather -> ebooke-mir.vercel.app

const CSS = `
.eblogin-screen{position:fixed;inset:0;z-index:1000;overflow:auto;background:#FCFAFC;color:#2E2731;
  display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px 20px;
  font-family:'Raleway Variable','Century Gothic',system-ui,sans-serif;font-weight:350;letter-spacing:.004em}
.eblogin-screen::before,.eblogin-screen::after{content:"";position:fixed;border-radius:50%;pointer-events:none;filter:blur(2px)}
.eblogin-screen::before{width:520px;height:520px;left:-210px;top:-230px;background:radial-gradient(circle,rgba(235,94,198,.16),rgba(235,94,198,0) 68%)}
.eblogin-screen::after{width:560px;height:560px;right:-220px;bottom:-270px;background:radial-gradient(circle,rgba(255,175,75,.17),rgba(255,175,75,0) 68%)}
.eblogin-shell{position:relative;z-index:1;width:100%;max-width:430px}
.eblogin-brand{display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:28px;color:#211B23;text-decoration:none}
.eblogin-brand span{font-size:23px;font-weight:550;letter-spacing:-.025em}
.eblogin-card{position:relative;overflow:hidden;width:100%;background:rgba(255,255,255,.94);border:1px solid #EEE5EC;border-radius:26px;
  padding:30px 30px 26px;box-shadow:0 22px 70px rgba(72,34,64,.10);backdrop-filter:blur(14px)}
.eblogin-card::after{content:"";position:absolute;width:180px;height:180px;right:-100px;top:-105px;border-radius:50%;background:linear-gradient(145deg,rgba(233,87,197,.13),rgba(255,179,66,.14));pointer-events:none}
.eblogin-role{position:relative;display:grid;place-items:center;width:48px;height:48px;margin:0 0 18px;border-radius:16px;color:#AF389A;background:linear-gradient(145deg,#FFF0FA,#FFF5EC);border:1px solid #F2D8E9}
.eblogin-h1{position:relative;font-size:27px;font-weight:550!important;letter-spacing:-.025em;margin:0 0 8px;line-height:1.2}
.eblogin-rolelead{position:relative;font-size:13.5px;color:#7A727C;line-height:1.55;margin:0 0 22px;max-width:330px}
.eblogin-lead{font-size:13.5px;color:#6F6872;line-height:1.55;margin:0 0 22px}
.eblogin-lead b{color:#2E2731;font-weight:500!important}
.eblogin-label{display:block;font-size:12px;font-weight:450!important;color:#68606A;margin:0 0 8px;letter-spacing:.02em}
.eblogin-phone{display:flex;align-items:center;background:#FCFAFC;border:1px solid #EAE2E8;
  border-radius:15px;padding:0 15px;transition:border-color .18s,background .18s,box-shadow .18s}
.eblogin-phone:focus-within{border-color:#DEA7D1;background:#fff;box-shadow:0 0 0 3px rgba(233,87,197,.10)}
.eblogin-cc{font-size:16px;font-weight:400;color:#3D3540;padding-right:8px}
.eblogin-phone input{flex:1;border:0;background:transparent;outline:0;font-size:16px;font-weight:350!important;
  letter-spacing:.04em;padding:15px 0;color:#2E2731;min-width:0}
.eblogin-phone input::placeholder{color:#AAA3AC}
.eblogin-otp{display:flex;gap:10px;justify-content:space-between;margin-bottom:6px}
.eblogin-otp input{width:100%;aspect-ratio:1/1;text-align:center;font-size:25px;font-weight:450!important;
  border:1px solid #EAE2E8;background:#FCFAFC;border-radius:15px;outline:0;color:#2E2731;
  transition:border-color .15s,background .15s,box-shadow .15s}
.eblogin-otp input:focus{border-color:#E19ACF;background:#fff;box-shadow:0 0 0 4px rgba(233,87,197,.10)}
.eblogin-btn{width:100%;margin-top:20px;padding:15px;font-size:15px;font-weight:500!important;background:linear-gradient(100deg,#E651C5,#F268A8 48%,#FFB342);
  color:#fff;border:0;border-radius:15px;cursor:pointer;box-shadow:0 10px 24px rgba(229,75,170,.20);transition:transform .18s,box-shadow .18s}
.eblogin-btn:hover{transform:translateY(-1px);box-shadow:0 13px 29px rgba(229,75,170,.28)}
.eblogin-btn:active{transform:translateY(0)}
.eblogin-btn:disabled{opacity:.5;cursor:default;transform:none;box-shadow:none}
.eblogin-sub{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:18px;font-size:12.5px}
.eblogin-link{color:#9E318C;background:0;border:0;font-size:12.5px;font-weight:400!important;cursor:pointer;padding:4px 0;text-decoration:none}
.eblogin-link:hover{color:#752468}
.eblogin-timer{color:#827B84;font-size:12.5px}
.eblogin-msg{margin-top:16px;font-size:13px;line-height:1.45;padding:12px 14px;border-radius:12px}
.eblogin-msg.err{background:#FFF0F2;color:#B93D50;border:1px solid #F7D9DF}
.eblogin-fine{margin:18px 4px 0;font-size:11px;color:#A49DA6;text-align:center;line-height:1.55}
.eblogin-tg{display:flex;justify-content:center;min-height:46px;margin:18px 0 0}
.eblogin-tghint{display:flex;align-items:flex-start;gap:9px;margin:16px 0 0;padding:12px 13px;border-radius:13px;background:#FFF8FC;color:#817781;font-size:12px;line-height:1.45;border:1px solid #F2E5EF;text-align:left}
.eblogin-or{display:flex;align-items:center;gap:12px;margin:20px 0;color:#AAA3AC;font-size:12px;font-weight:350!important}
.eblogin-or::before,.eblogin-or::after{content:"";flex:1;height:1px;background:#EEE7EC}
.eblogin-secondary{display:flex;align-items:center;justify-content:center;gap:7px;width:100%;margin-top:12px;padding:13px;border:1px solid #E9C9E2;border-radius:14px;color:#A83293;text-decoration:none;font-size:13.5px;font-weight:450}
.eblogin-secondary:hover{background:#FFF8FC;border-color:#DEA7D1}
@media(max-width:520px){.eblogin-screen{justify-content:flex-start;padding:24px 14px}.eblogin-brand{margin-bottom:20px}.eblogin-card{padding:24px 20px 22px;border-radius:22px}.eblogin-h1{font-size:24px}}
`

function fmt(v) {
  const d = v.replace(/\D/g, '').slice(0, 10)
  let o = d
  if (d.length > 3) o = d.slice(0, 3) + ' ' + d.slice(3)
  if (d.length > 6) o = d.slice(0, 3) + ' ' + d.slice(3, 6) + '-' + d.slice(6)
  if (d.length > 8) o = d.slice(0, 3) + ' ' + d.slice(3, 6) + '-' + d.slice(6, 8) + '-' + d.slice(8)
  return { d, o }
}

// Вызов Edge Function через клиент (он сам идёт через прокси /supabase и ставит ключ).
// При не-2xx ответ нашей функции лежит в error.context — достаём оттуда {ok,error}.
async function invoke(fn, body) {
  const { data, error } = await supabase.functions.invoke(fn, { body })
  if (error && error.context && typeof error.context.json === 'function') {
    try { return await error.context.json() } catch { return { ok: false, error: 'server' } }
  }
  return data || { ok: false, error: 'server' }
}

export default function LoginPage({ onSuccess, onBack, title = 'Вход по телефону', role = 'client' }) {
  const [step, setStep] = useState('phone')
  const [raw, setRaw] = useState('')
  const [display, setDisplay] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [left, setLeft] = useState(0)
  const cells = useRef([])
  const timer = useRef(null)
  const tgBox = useRef(null)

  const onTgAuth = useCallback(async (user) => {
    setBusy(true); setErr('')
    const r = await invoke('verify-tg', user)
    if (r.ok) {
      if (role === 'executor') {
        const exec = (r.profiles || []).find(p => p.role === 'executor')
        if (exec) { saveSession(exec); onSuccess?.(exec); return }
        // Новый работник — как в мини-аппе: запоминаем личность (с ником из виджета) и ведём на регистрацию
        const base = r.user || {}
        saveSession({ ...base, telegram_username: base.telegram_username || (user.username ? user.username.toLowerCase() : null) })
        window.location.href = '/register'
        return
      }
      saveSession(r.user); onSuccess?.(r.user); return
    }
    setBusy(false)
    setErr(role === 'executor'
      ? 'Не удалось войти через Telegram.'
      : 'Не удалось войти через Telegram. Попробуйте по номеру.')
  }, [onSuccess, role])

  useEffect(() => () => clearInterval(timer.current), [])

  // Telegram Login Widget: рисуется только на домене, привязанном в BotFather.
  // Поэтому вне ebookee.app скрипт не вставляем — телефон остаётся рабочим.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.hostname !== 'ebooke-mir.vercel.app') return
    const box = tgBox.current
    if (!box) return
    window.onTelegramAuth = (user) => onTgAuth(user)
    const s = document.createElement('script')
    s.src = 'https://telegram.org/js/telegram-widget.js?22'
    s.async = true
    s.setAttribute('data-telegram-login', TG_BOT)
    s.setAttribute('data-size', 'large')
    s.setAttribute('data-radius', '12')
    s.setAttribute('data-request-access', 'write')
    s.setAttribute('data-onauth', 'onTelegramAuth(user)')
    box.appendChild(s)
    return () => { box.innerHTML = ''; Reflect.deleteProperty(window, 'onTelegramAuth') }
  }, [onTgAuth])

  function onPhone(e) {
    const { d, o } = fmt(e.target.value)
    setRaw(d); setDisplay(o); setErr('')
  }

  function startTimer() {
    setLeft(60)
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setLeft(v => { if (v <= 1) { clearInterval(timer.current); return 0 } return v - 1 })
    }, 1000)
  }

  async function sendCode() {
    if (raw.length !== 10) { setErr('Введите номер полностью.'); return }
    setBusy(true); setErr('')
    const r = await invoke('send-code', { phone: '7' + raw })
    setBusy(false)
    if (r.ok) { setStep('code'); startTimer(); setTimeout(() => cells.current[0]?.focus(), 50) }
    else if (r.error === 'too_soon') setErr('Код уже отправлен. Подождите минуту.')
    else if (r.error === 'too_many' || r.error === 'service_busy') setErr('Слишком много запросов. Попробуйте позже.')
    else setErr('Не удалось отправить код. Попробуйте ещё раз.')
  }

  async function verify() {
    const code = cells.current.map(c => c?.value || '').join('')
    if (code.length !== 4) return
    setBusy(true); setErr('')
    const r = await invoke('verify-code', { phone: '7' + raw, code })
    if (r.ok) { saveSession(r.user); onSuccess?.(r.user); return }
    setBusy(false)
    setErr(
      r.error === 'wrong_code' ? 'Неверный код.' :
      r.error === 'expired' ? 'Код истёк. Запросите новый.' :
      r.error === 'too_many_attempts' ? 'Много попыток. Запросите новый код.' :
      'Не получилось войти. Попробуйте ещё раз.'
    )
    cells.current.forEach(c => { if (c) c.value = '' })
    cells.current[0]?.focus()
  }

  function onCell(i, e) {
    const v = e.target.value.replace(/\D/g, '')
    e.target.value = v.slice(-1)
    setErr('')
    if (v && i < 3) cells.current[i + 1]?.focus()
    if (cells.current.every(c => c?.value)) verify()
  }
  function onCellKey(i, e) {
    if (e.key === 'Backspace' && !e.target.value && i > 0) {
      cells.current[i - 1]?.focus()
      if (cells.current[i - 1]) cells.current[i - 1].value = ''
    }
  }
  function onPaste(e) {
    e.preventDefault()
    const d = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 4)
    d.split('').forEach((n, k) => { if (cells.current[k]) cells.current[k].value = n })
    if (d.length === 4) verify()
  }

  return (
    <>
      <WebBaseStyles />
      <style>{CSS}</style>
      <div className="eb-web eblogin-screen">
        <div className="eblogin-shell">
        <a href="/" className="eblogin-brand" aria-label="На главную ebookee">
          <BrandMark size={34} />
          <span className="eb-brand-name">ebookee</span>
        </a>

        {step === 'phone' && (
          <div className="eblogin-card">
            <div className="eblogin-role"><UiIcon name={role === 'executor' ? 'user' : 'crown'} size={23}/></div>
            <h1 className="eblogin-h1">{title}</h1>
            <p className="eblogin-rolelead">{role === 'executor'
              ? 'Управляйте расписанием, заявками и услугами в одном спокойном рабочем пространстве.'
              : 'Ваши записи, статусы заказов и связь с исполнителями — в одном месте.'}</p>
            {typeof window !== 'undefined' && window.location.hostname === 'ebooke-mir.vercel.app'
              ? <div className="eblogin-tg" ref={tgBox} />
              : <div className="eblogin-tghint"><UiIcon name="telegram" size={17} style={{ flex: 'none', color: '#B23B9E' }}/>Вход через Telegram будет доступен на основном домене ebookee.app</div>}
            {role !== 'executor' && (<>
              <div className="eblogin-or">или по номеру телефона</div>
              <p className="eblogin-lead">Введите номер — пришлём код в SMS. Пароль не нужен.</p>
              <label className="eblogin-label">Номер телефона</label>
              <div className="eblogin-phone eb-field">
                <span className="eblogin-cc">+7</span>
                <input value={display} onChange={onPhone} type="tel" inputMode="numeric"
                  placeholder="900 000-00-00" maxLength={15} autoComplete="tel"
                  onKeyDown={e => { if (e.key === 'Enter') sendCode() }} />
              </div>
              <button className="eblogin-btn" onClick={sendCode} disabled={busy}>
                {busy ? 'Отправляю…' : 'Получить код'}
              </button>
            </>)}
            {role === 'executor' && <a href="?register=executor" className="eblogin-secondary"><UiIcon name="plus" size={16}/>Стать исполнителем</a>}
            {err && <div className="eblogin-msg err">{err}</div>}
            {onBack && <button className="eblogin-link" style={{ marginTop: 14 }} onClick={onBack}>← Назад</button>}
            <p className="eblogin-fine">Продолжая, вы соглашаетесь с условиями сервиса и политикой обработки данных.</p>
          </div>
        )}

        {step === 'code' && (
          <div className="eblogin-card">
            <div className="eblogin-role"><UiIcon name="message" size={23}/></div>
            <h1 className="eblogin-h1">Введите код</h1>
            <p className="eblogin-lead">Отправили на <b>+7 {display}</b></p>
            <div className="eblogin-otp" onPaste={onPaste}>
              {[0, 1, 2, 3].map(i => (
                <input key={i} ref={el => (cells.current[i] = el)} type="tel" inputMode="numeric"
                  maxLength={1} onChange={e => onCell(i, e)} onKeyDown={e => onCellKey(i, e)} />
              ))}
            </div>
            {err && <div className="eblogin-msg err">{err}</div>}
            <button className="eblogin-btn" onClick={verify} disabled={busy}>
              {busy ? 'Проверяю…' : 'Войти'}
            </button>
            <div className="eblogin-sub">
              <button className="eblogin-link" onClick={() => { setStep('phone'); setErr(''); clearInterval(timer.current) }}>← Изменить номер</button>
              <span className="eblogin-timer">
                {left > 0
                  ? `Повторить через 0:${String(left).padStart(2, '0')}`
                  : <button className="eblogin-link" style={{ color: '#161616' }} onClick={sendCode}>Отправить заново</button>}
              </span>
            </div>
          </div>
        )}
        </div>
      </div>
    </>
  )
}
