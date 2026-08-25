// ─────────────────────────────────────────────────────────────────
//  НАСТРОЙКИ ВЕБ-ВЕРСИИ
//  Логотип, реквизиты подвала, палитра и формат цен. Правится здесь —
//  меняется на всех веб-экранах (витрина, бронь и все следующие).
// ─────────────────────────────────────────────────────────────────

import { OPERATOR } from './legalDocs'

// ─── ЛОГОТИП ────────────────────────────────────────────────────
// Файл лежит в public/. Если не найден или строка пустая — нарисуется
// встроенная иконка, сайт не сломается.
export const LOGO_SRC = '/logo.png'

// ─── ПОДВАЛ: контакты и ссылки ──────────────────────────────────
// Реквизиты (название, ИНН, ОГРН, адрес, почта) берутся из src/legalDocs.js —
// там же они подставляются в тексты документов. Правь их только там.
// Любую строку ниже можно оставить пустой ('') — она просто не отобразится.
export const FOOTER = {
  company: OPERATOR.name,
  inn: OPERATOR.inn,
  ogrn: OPERATOR.ogrn,
  address: OPERATOR.address,
  phone: '',
  email: OPERATOR.email,
  legal: [
    { label: 'Пользовательское соглашение', href: '/terms' },
    { label: 'Политика конфиденциальности', href: '/privacy' },
    { label: 'Публичная оферта', href: '/offer' },
  ],
  socials: [
    { label: 'Telegram', href: OPERATOR.telegram },
  ],
}

// ─── ПАЛИТРА ВЕБА ───────────────────────────────────────────────
export const Y = '#E957C5'
export const YP = '#D947B6'
export const Y_SOFT = '#FBEAF8'
export const Y_TINT = '#FFF8FC'
export const Y_DARK = '#A83293'
export const GRADIENT = 'linear-gradient(100deg, #E651C5 0%, #F268A8 48%, #FFB342 100%)'
export const GRADIENT_SOFT = 'linear-gradient(100deg, rgba(230,81,197,.10), rgba(255,179,66,.15))'
export const INK = '#17131D'
export const MUTED = '#85808B'
export const LINE = '#EEE8ED'
export const LINE_2 = '#F2EDF1'
export const BG = '#FCFAFC'

export const ROLE_BTN = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '0 18px', height: 50,
  borderRadius: 13, fontSize: 15, fontWeight: 600,
  background: '#fff', color: '#332A3B', textDecoration: 'none', whiteSpace: 'nowrap',
  border: '1px solid #EEE6ED', boxShadow: '0 5px 18px rgba(55,25,52,.05)',
}

// Цена в едином виде: 2 500 ₽ (как на витрине)
export function rub(n) {
  return `${Number(n || 0).toLocaleString('ru-RU')} ₽`
}
