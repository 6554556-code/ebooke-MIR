/* eslint-disable react-refresh/only-export-components */
const paths = {
  search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></>,
  pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></>,
  user: <><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.7-4 3-6 7-6s6.3 2 7 6"/></>,
  crown: <><path d="m3 7 4.5 4L12 4l4.5 7L21 7l-2 11H5L3 7Z"/></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
  map: <><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z"/><path d="M8 3v15M16 6v15"/></>,
  list: <><path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></>,
  star: <path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9L12 3Z"/>,
  home: <><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10M9 20v-6h6v6"/></>,
  car: <><path d="M3 15v-2.1c0-.8.6-1.5 1.4-1.6l2.1-.3 2.1-3.2c.4-.6 1-.9 1.7-.9h4.5c.7 0 1.3.3 1.7.9l2.1 3.2 1.2.2c.7.1 1.2.7 1.2 1.4V16H3v-1Z"/><path d="M7 11h11M11 7v4"/><circle cx="7" cy="16.5" r="2"/><circle cx="17" cy="16.5" r="2"/><path d="M3 14h2M19 14h2"/></>,
  clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,
  package: <><path d="m4 7 8-4 8 4-8 4-8-4Z"/><path d="M4 7v10l8 4 8-4V7M12 11v10"/></>,
  metro: <><path d="m5 18 5-13h4l5 13"/><path d="m3 20 4-3h10l4 3"/></>,
  verified: <><path d="m12 2 2.2 2 3-.2.8 2.8 2.5 1.6-1.2 2.8 1.2 2.8-2.5 1.6-.8 2.8-3-.2-2.2 2-2.2-2-3 .2-.8-2.8-2.5-1.6L4.7 11 3.5 8.2 6 6.6l.8-2.8 3 .2L12 2Z"/><path d="m8.5 11.5 2.2 2.2 4.8-5"/></>,
  sparkles: <><path d="M12 2c.5 3.8 2.2 5.5 6 6-3.8.5-5.5 2.2-6 6-.5-3.8-2.2-5.5-6-6 3.8-.5 5.5-2.2 6-6Z"/><path d="M19 14c.2 2 1 2.8 3 3-2 .2-2.8 1-3 3-.2-2-1-2.8-3-3 2-.2 2.8-1 3-3Z"/></>,
  broom: <><path d="m15 3-5 11"/><path d="M8.5 12.5c-3 1-5 3.5-5.5 7.5 4 .8 7.5-.2 9.5-3.5l-4-4Z"/></>,
  beauty: <><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3"/></>,
  tool: <path d="M14 6a5 5 0 0 0-6.4 6.4L3 17l4 4 4.6-4.6A5 5 0 0 0 18 10l-3 3-4-4 3-3Z"/>,
  heart: <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/>,
  camera: <><path d="M4 7h4l2-3h4l2 3h4v13H4V7Z"/><circle cx="12" cy="13" r="4"/></>,
  bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6V2Z"/>,
  activity: <><path d="M3 12h4l2-7 4 14 2-7h6"/></>,
  child: <><circle cx="12" cy="8" r="4"/><path d="M5 21c.8-4.7 3.1-7 7-7s6.2 2.3 7 7"/><path d="M8 5 6 3M16 5l2-2"/></>,
  paw: <><circle cx="7" cy="8" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="20" cy="13" r="2"/><path d="M8 20c-2-1.5-1-5 1-6.5 1.7-1.3 4.3-1.3 6 0 2 1.5 3 5 1 6.5-2 1.5-6 1.5-8 0Z"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  message: <><path d="M21 12a8 8 0 0 1-8 8H5l-3 2 1-5a9 9 0 1 1 18-5Z"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  telegram: <path d="m21 3-4 18-6-5-4 3 1-5 9-8-11 7-4-1L21 3Z"/>,
  expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  check: <path d="m5 12 4.2 4.2L19 6.5"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,
}

export const categoryIcon = (code = '') => {
  const key = String(code).toLowerCase()
  if (key.includes('clean')) return 'broom'
  if (key.includes('beaut') || key.includes('cosmet')) return 'beauty'
  if (key.includes('repair') || key.includes('master')) return 'tool'
  if (key.includes('mass')) return 'heart'
  if (key.includes('photo')) return 'camera'
  if (key.includes('electric')) return 'bolt'
  if (key.includes('train') || key.includes('sport')) return 'activity'
  if (key.includes('child') || key.includes('kid')) return 'child'
  if (key.includes('animal') || key.includes('pet')) return 'paw'
  return 'sparkles'
}

export default function UiIcon({ name, size = 20, strokeWidth = 1.8, className, style, title }) {
  return (
    <svg className={className} style={style} width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden={title ? undefined : true} role={title ? 'img' : undefined}>
      {title && <title>{title}</title>}
      {paths[name] || paths.sparkles}
    </svg>
  )
}

export function iconSvgString(name, { size = 22, color = '#D94FC3' } = {}) {
  const node = paths[name] || paths.sparkles
  // Leaflet needs a string. The path data is a fixed internal allow-list.
  const elements = Array.isArray(node.props?.children) ? node.props.children : [node]
  const markup = elements.filter(Boolean).map(el => {
    const p = el.props || {}
    const attrs = Object.entries(p).filter(([k]) => k !== 'children').map(([k, v]) => {
      const attr = k === 'strokeWidth' ? 'stroke-width' : k === 'strokeLinecap' ? 'stroke-linecap' : k === 'strokeLinejoin' ? 'stroke-linejoin' : k
      return `${attr}="${String(v)}"`
    }).join(' ')
    return `<${el.type} ${attrs}></${el.type}>`
  }).join('')
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`
}
