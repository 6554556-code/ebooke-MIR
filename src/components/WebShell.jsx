import { useState } from 'react'
import { LOGO_SRC, FOOTER, Y, LINE, LINE_2 } from '../webTheme'
import UiIcon from './UiIcon'

// Общие блоки веб-версии: логотип, подвал, базовые стили.
// Настройки (реквизиты, палитра, путь к логотипу) — в src/webTheme.js

// Логотип: картинка из public/, при ошибке загрузки — встроенная иконка.
export function BrandMark({ size = 40 }) {
  const [failed, setFailed] = useState(false)
  if (LOGO_SRC && !failed) {
    return (
      <img
        src={LOGO_SRC}
        alt="ebookee"
        onError={() => setFailed(true)}
        style={{ display: 'block', width: size, height: size, objectFit: 'contain', flex: 'none' }}
      />
    )
  }
  return (
    <span style={{ width: size, height: size, background: Y, borderRadius: size * 0.22, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24"><path d="M6 13.4c0-3.7 2.6-6.4 6.1-6.4 3.4 0 5.6 2.4 5.6 5.7 0 .6-.05 1-.13 1.5H9.1c.3 1.9 1.7 3 3.7 3 1.4 0 2.5-.5 3.4-1.4l1.8 1.9C16.6 18.6 14.8 19.4 12.6 19.4 8.8 19.4 6 16.9 6 13.4Zm3.2-1.3h5.6c-.15-1.6-1.2-2.6-2.7-2.6-1.5 0-2.6 1-2.9 2.6Z" fill="#1A1A1A"/></svg>
    </span>
  )
}

// Подвал сайта. Данные — из FOOTER выше.
// Компактный подвал. Две колонки (Документы / Контакты) со строками-ссылками,
// под ними тонкий разделитель и строка с логотипом и реквизитами.
// На узких экранах колонки сужаются, реквизиты уезжают под логотип — всё
// управляется классами в WebBaseStyles, отдельной мобильной вёрстки не нужно.
export function WebFooter() {
  const linkRow = { display: 'flex', alignItems: 'center', color: '#2E2E2E', textDecoration: 'none', fontSize: 14, padding: '7px 0' }
  const head = { fontSize: 15, fontWeight: 800, marginBottom: 6 }
  return (
    <footer style={{ borderTop: `1px solid ${LINE}`, background: '#fff', marginTop: 32 }}>
      <div className="eb-foot" style={{ maxWidth: 1120, margin: '0 auto', padding: '28px 20px 22px' }}>

        <div className="eb-foot-cols" style={{ display: 'flex', gap: 64 }}>
          {FOOTER.legal?.length > 0 && (
            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <div style={head}>Документы</div>
              {FOOTER.legal.map((l, i) => (
                <a key={i} href={l.href} className="eb-foot-link" style={{ ...linkRow, justifyContent: 'space-between' }}>
                  <span>{l.label}</span>
                  <span style={{ color: '#C9C4B8', flex: 'none', marginLeft: 12 }}>›</span>
                </a>
              ))}
            </div>
          )}

          <div style={{ flex: '1 1 0', minWidth: 0 }}>
            <div style={head}>Контакты</div>
            {FOOTER.phone && FOOTER.phone.trim() && (
              <a href={`tel:${FOOTER.phone.replace(/[^+\d]/g, '')}`} className="eb-foot-link" style={{ ...linkRow, gap: 10 }}>
                <UiIcon name="message" size={17} style={{ flex: 'none', opacity: .55 }} />{FOOTER.phone}
              </a>
            )}
            {FOOTER.email && (
              <a href={`mailto:${FOOTER.email}`} className="eb-foot-link" style={{ ...linkRow, gap: 10 }}>
                <UiIcon name="mail" size={17} style={{ flex: 'none', opacity: .55 }} />{FOOTER.email}
              </a>
            )}
            {FOOTER.socials?.map((sc, i) => (
              <a key={i} href={sc.href} target="_blank" rel="noopener noreferrer" className="eb-foot-link" style={{ ...linkRow, gap: 10 }}>
                <UiIcon name="telegram" size={17} style={{ flex: 'none', opacity: .55 }} />{sc.label}
              </a>
            ))}
            <a href="/about/" className="eb-foot-link" style={{ ...linkRow, ...head, marginBottom: 0, justifyContent: 'space-between' }}>
              <span>О нас</span>
              <span style={{ color: '#C9C4B8', flex: 'none', marginLeft: 12 }}>›</span>
            </a>
            <a href="/blog/" className="eb-foot-link" style={{ ...linkRow, ...head, marginBottom: 0, justifyContent: 'space-between' }}>
              <span>Блог</span>
              <span style={{ color: '#C9C4B8', flex: 'none', marginLeft: 12 }}>›</span>
            </a>
          </div>
        </div>

        <div className="eb-foot-req" style={{ borderTop: `1px solid ${LINE_2}`, marginTop: 20, paddingTop: 18, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 'none' }}>
            <BrandMark size={30} />
            <span className="eb-brand-name">ebookee</span>
          </div>
          <div style={{ fontSize: 12, color: '#9A958C', lineHeight: 1.6 }}>
            {[FOOTER.company, FOOTER.inn && `ИНН ${FOOTER.inn}`].filter(Boolean).join('  •  ')}
            {(FOOTER.ogrn || FOOTER.address) && <br />}
            {[FOOTER.ogrn && `ОГРНИП ${FOOTER.ogrn}`, FOOTER.address].filter(Boolean).join('  •  ')}
          </div>
        </div>
      </div>
    </footer>
  )
}

// Снимает ограничения шаблонного #root (max-width:500px, центрирование) —
// они нужны мини-аппу, но ломают широкую вёрстку. Действует, только пока
// смонтирован веб-экран.
export function WebBaseStyles() {
  return (
    <style>{`
      #root{max-width:none !important;width:100% !important;margin:0 !important;padding:0 !important;text-align:left !important;word-break:normal !important;font-size:15px}
      body{overflow-x:auto}
      .eb-web,.eb-web *{box-sizing:border-box}
      .eb-web *{overflow-wrap:normal;word-break:normal}
      .eb-web{--eb-pink:#E957C5;--eb-pink-strong:#D947B6;--eb-orange:#FFB342;--eb-ink:#17131D;--eb-muted:#85808B;--eb-line:#EEE8ED;--eb-gradient:linear-gradient(100deg,#E651C5 0%,#F268A8 48%,#FFB342 100%);font-family:'Raleway Variable','Century Gothic',system-ui,sans-serif;font-weight:350;letter-spacing:.004em}
      .eb-web h1,.eb-web h2,.eb-web h3{font-weight:550!important;letter-spacing:-.018em}
      .eb-web strong,.eb-web b{font-weight:550!important}
      .eb-web button,.eb-web input,.eb-web select,.eb-web textarea{font-family:inherit;font-weight:350;letter-spacing:.002em}
      .eb-web button,.eb-web select{font-weight:450!important}
      .eb-web .eb-brand-name{font-size:23px;font-weight:550!important;letter-spacing:-.025em;line-height:1}
      .eb-web .eb-role{font-weight:350!important}
      .eb-web .eb-primary{font-weight:500!important}
      .eb-web .eb-cat{font-weight:400!important}
      .eb-web .eb-cat[data-active="true"],.eb-web .eb-view-btn[data-active="true"]{font-weight:500!important}
      .eb-web button,.eb-web a,.eb-web select{transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease,background .18s ease,color .18s ease}
      .eb-web button:focus-visible,.eb-web a:focus-visible,.eb-web input:focus-visible,.eb-web select:focus-visible,.eb-web textarea:focus-visible{outline:3px solid rgba(233,87,197,.22)!important;outline-offset:2px}
      .eb-web .eb-field{transition:border-color .18s ease,box-shadow .18s ease,background .18s ease}
      .eb-web .eb-field:focus-within{border-color:#DEA7D1!important;background:#fff!important;box-shadow:0 0 0 3px rgba(233,87,197,.10)!important}
      .eb-web .eb-field:focus-visible,.eb-web .eb-field input:focus-visible,.eb-web .eb-field select:focus-visible{outline:none!important}
      .eb-dropdown-menu{animation:eb-dropdown-in .16s ease-out;transform-origin:top center}
      .eb-dropdown-option{transition:background .15s ease,color .15s ease,transform .15s ease}
      .eb-dropdown-check{color:transparent}
      .eb-dropdown-option:hover,.eb-dropdown-option:focus-visible{background:#FFF3FB!important;color:#8E2B83!important;outline:none!important}
      .eb-dropdown-option[data-selected="true"]{background:linear-gradient(100deg,#FCE8F8 0%,#F1ECFF 100%)!important;color:#7E2878!important}
      .eb-dropdown-option[data-selected="true"] .eb-dropdown-check{background:transparent;color:#A33A9B;box-shadow:none}
      @keyframes eb-dropdown-in{from{opacity:0;transform:translateY(-5px) scale(.985)}to{opacity:1;transform:translateY(0) scale(1)}}
      .eb-role:hover{background:#FFF7FC !important;border-color:#E9B9DD !important;transform:translateY(-1px)}
      .eb-foot-link:hover{color:#A83293 !important}
      .eb-primary{background:var(--eb-gradient)!important;color:#fff!important;box-shadow:0 10px 24px rgba(229,75,170,.20)!important}
      .eb-primary:hover{transform:translateY(-1px);box-shadow:0 13px 28px rgba(229,75,170,.28)!important}
      .eb-card-surface{border:1px solid var(--eb-line)!important;border-radius:20px!important;box-shadow:0 10px 35px rgba(72,34,64,.065)!important}
      .eb-state{border:1px dashed #E7D7E3;border-radius:18px;padding:30px 20px;text-align:center;background:linear-gradient(135deg,#fff,#FFF8FC);color:var(--eb-muted)}
      .eb-skeleton{position:relative;overflow:hidden;background:#F3EEF2;border-radius:14px}
      .eb-skeleton::after{content:'';position:absolute;inset:0;transform:translateX(-100%);background:linear-gradient(90deg,transparent,rgba(255,255,255,.85),transparent);animation:eb-shimmer 1.35s infinite}
      @keyframes eb-shimmer{100%{transform:translateX(100%)}}
      .leaflet-container{border-radius:18px;font-family:inherit;background:#F9F0F5}
      .leaflet-tile-pane{filter:grayscale(.12) saturate(.88) sepia(.08) hue-rotate(-4deg) brightness(1.08) contrast(.92)}
      .leaflet-container::after{content:'';position:absolute;inset:0;z-index:450;pointer-events:none;background:radial-gradient(circle at 12% 22%,rgba(153,119,226,.22) 0,rgba(153,119,226,0) 34%),radial-gradient(circle at 82% 18%,rgba(255,179,66,.24) 0,rgba(255,179,66,0) 36%),radial-gradient(circle at 72% 84%,rgba(89,190,221,.20) 0,rgba(89,190,221,0) 38%),linear-gradient(135deg,rgba(233,87,197,.17),rgba(255,255,255,0) 46%,rgba(255,142,107,.16));mix-blend-mode:color;opacity:.9}
      .leaflet-control-zoom{border:1px solid rgba(232,218,228,.9)!important;border-radius:14px!important;overflow:hidden;box-shadow:0 9px 26px rgba(72,34,64,.16)!important;background:rgba(255,255,255,.96)!important}
      .leaflet-control-zoom a{position:relative;width:38px!important;height:38px!important;line-height:38px!important;border:0!important;background:#fff!important;color:transparent!important;font-size:0!important;transition:background .18s ease!important}
      .leaflet-control-zoom a:first-child{border-bottom:1px solid #F0E8EE!important}
      .leaflet-control-zoom a::before,.leaflet-control-zoom a::after{content:'';position:absolute;left:50%;top:50%;width:13px;height:1.5px;border-radius:2px;background:#554A56;transform:translate(-50%,-50%);transition:background .18s ease,transform .18s ease}
      .leaflet-control-zoom-in::after{transform:translate(-50%,-50%) rotate(90deg)!important}
      .leaflet-control-zoom-out::after{display:none}
      .leaflet-control-zoom a:hover{background:#FFF2FA!important}
      .leaflet-control-zoom a:hover::before,.leaflet-control-zoom a:hover::after{background:#B13A9D;transform:translate(-50%,-50%) scale(1.08)}
      .leaflet-control-zoom-in:hover::after{transform:translate(-50%,-50%) rotate(90deg) scale(1.08)!important}
      .leaflet-control-zoom a:focus-visible{z-index:2;outline:3px solid rgba(233,87,197,.22)!important;outline-offset:-3px}
      @media(max-width:640px){
        .eb-foot{padding:22px 14px 18px !important}
        .eb-foot-cols{gap:28px !important}
        .eb-foot-req{flex-direction:column;align-items:flex-start !important;gap:12px !important}
      }
    `}</style>
  )
}
