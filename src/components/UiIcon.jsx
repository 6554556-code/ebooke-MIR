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
  beauty: <><path d="M2.5 12s3.6-5.4 9.5-5.4 9.5 5.4 9.5 5.4-3.6 5.4-9.5 5.4S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="3.5"/><path d="M5 6 3.7 4.3M8.2 4.8 7.5 2.6M12 4.3V2M15.8 4.8l.7-2.2M19 6l1.3-1.7"/></>,
  tool: <><path d="M5 16v-3.2A7 7 0 0 1 9 6.5M15 6.5a7 7 0 0 1 4 6.3V16"/><path d="M9 12V6.2A1.2 1.2 0 0 1 10.2 5h3.6A1.2 1.2 0 0 1 15 6.2V12"/><path d="M4 16h16a2 2 0 0 1 0 4H4a2 2 0 0 1 0-4Z"/></>,
  heart: <path d="M20.8 5.8a5.5 5.5 0 0 0-7.8 0L12 6.9l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 22l8.8-8.4a5.5 5.5 0 0 0 0-7.8Z"/>,
  camera: <><path d="M4 7h4l2-3h4l2 3h4v13H4V7Z"/><circle cx="12" cy="13" r="4"/></>,
  bolt: <path d="m13 2-8 12h6l-1 8 9-13h-6V2Z"/>,
  activity: <><path d="M3 12h4l2-7 4 14 2-7h6"/></>,
  child: <><circle cx="12" cy="3.5" r="2"/><rect x="8.5" y="6.5" width="7" height="3.5" rx="1.75"/><rect x="7" y="10" width="10" height="4" rx="2"/><rect x="5.5" y="14" width="13" height="4" rx="2"/><rect x="4" y="18" width="16" height="4" rx="2"/></>,
  dog: <><ellipse cx="12" cy="12" rx="6" ry="8"/><path d="M6.5 7.2C4 6.4 2.5 8.1 2.5 11c0 3 1.6 4.8 4.1 4.2M17.5 7.2C20 6.4 21.5 8.1 21.5 11c0 3-1.6 4.8-4.1 4.2"/><circle cx="9.7" cy="10" r=".65" fill="currentColor" stroke="none"/><circle cx="14.3" cy="10" r=".65" fill="currentColor" stroke="none"/><path d="M10.3 13h3.4L12 14.5 10.3 13Z" fill="currentColor"/><path d="M12 14.5v1.2M12 15.7c-1.5 2-3.1 1.4-3.5.2M12 15.7c1.5 2 3.1 1.4 3.5.2"/></>,
  paw: <><circle cx="7" cy="8" r="2"/><circle cx="17" cy="8" r="2"/><circle cx="4" cy="13" r="2"/><circle cx="20" cy="13" r="2"/><path d="M8 20c-2-1.5-1-5 1-6.5 1.7-1.3 4.3-1.3 6 0 2 1.5 3 5 1 6.5-2 1.5-6 1.5-8 0Z"/></>,
  arrow: <path d="m9 18 6-6-6-6"/>,
  message: <><path d="M21 12a8 8 0 0 1-8 8H5l-3 2 1-5a9 9 0 1 1 18-5Z"/></>,
  phone: <path d="M7 3H4a2 2 0 0 0-2 2c0 9.4 7.6 17 17 17a2 2 0 0 0 2-2v-3l-4.2-1-1.2 2.4c-3.8-1.5-6.5-4.2-8-8L10 7.2 7 3Z"/>,
  clipboard: <><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8 10h8M8 14h8M8 18h5"/></>,
  wallet: <><path d="M4 6h14a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12"/><path d="M16 11h6v5h-6a2.5 2.5 0 0 1 0-5Z"/></>,
  refresh: <><path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8a7 7 0 0 1 11.5-1L20 12M4 12l2.4 5a7 7 0 0 0 11.5-1"/></>,
  help: <><circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.8 2c-1 .7-1.6 1.2-1.6 2.5M12 17h.01"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></>,
  logout: <><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/><path d="m10 17 5-5-5-5M15 12H3"/></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></>,
  eyeOff: <><path d="m3 3 18 18"/><path d="M10.6 6.2A11 11 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-2.2 2.8M6.3 6.3C3.5 8.1 2 12 2 12s3.5 6 10 6a10 10 0 0 0 4-.8"/></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m4 7 8 6 8-6"/></>,
  telegram: <path d="m21 3-4 18-6-5-4 3 1-5 9-8-11 7-4-1L21 3Z"/>,
  expand: <><path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/></>,
  close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  plus: <><path d="M12 5v14M5 12h14"/></>,
  check: <path d="m5 12 4.2 4.2L19 6.5"/>,
  chevronDown: <path d="m6 9 6 6 6-6"/>,  
  tutor: <><path d="M4 4h11a2 2 0 0 1 2 2v14H6a2 2 0 0 1-2-2V4Z"/><path d="M4 4a2 2 0 0 1 2-2h11v4"/><path d="M8 8h6M8 12h6"/></>,
}

export const categoryIcon = (code = '', label = '') => {
  const key = `${String(code)} ${String(label)}`.toLowerCase()
  if (key.includes('clean')) return 'broom'
  if (key.includes('beaut') || key.includes('cosmet') || key.includes('salon') || key.includes('makeup') || key.includes('nail') || key.includes('hair') || key.includes('krasot') || key.includes('красот')) return 'beauty'
  if (key.includes('repair') || key.includes('master') || key.includes('handyman') || key.includes('fix') || key.includes('build') || key.includes('мастер')) return 'tool'
  if (key.includes('tutor') || key.includes('repet')) return 'tutor'
  if (key.includes('mass')) return 'heart'
  if (key.includes('photo')) return 'camera'
  if (key.includes('electric')) return 'bolt'
  if (key.includes('train') || key.includes('sport')) return 'activity'
  if (key.includes('child') || key.includes('kid') || key.includes('baby') || key.includes('nanny') || key.includes('det') || key.includes('nyan') || key.includes('дет') || key.includes('реб')) return 'child'
  if (key.includes('animal') || key.includes('pet') || key.includes('dog') || key.includes('vet') || key.includes('groom') || key.includes('zhivot') || key.includes('sobak') || key.includes('живот') || key.includes('собак')) return 'dog'
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
