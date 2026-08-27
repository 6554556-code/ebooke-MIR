import { useEffect, useRef, useState } from 'react'
import { WebBaseStyles } from './WebShell'
import UiIcon from './UiIcon'

export function CabinetSelect({ value, onChange, options, ariaLabel = 'Выберите значение' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const selected = options.find(option => String(option.value) === String(value)) || options[0]

  useEffect(() => {
    if (!open) return
    const close = event => { if (!ref.current?.contains(event.target)) setOpen(false) }
    const escape = event => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <div ref={ref} className="eb-cab-select">
      <button type="button" className="eb-cab-field eb-cab-select-trigger" aria-label={ariaLabel} aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}>
        <span>{selected?.label}</span><UiIcon name="chevronDown" size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .18s' }}/>
      </button>
      {open && <div className="eb-dropdown-menu eb-cab-select-menu" role="listbox" aria-label={ariaLabel}>
        {options.map(option => {
          const active = String(option.value) === String(value)
          return <button key={String(option.value)} type="button" role="option" aria-selected={active} className="eb-dropdown-option eb-cab-select-option" data-selected={active}
            onClick={() => { onChange({ target: { value: option.value } }); setOpen(false) }}>
            <span>{option.label}</span>{active && <UiIcon name="check" size={15}/>} 
          </button>
        })}
      </div>}
    </div>
  )
}

export default function CabinetBaseStyles() {
  return (
    <>
      <WebBaseStyles />
      <style>{`
        body:has(.eb-cabinet){background:#FCFAFC;overflow-x:hidden}
        .eb-cabinet{position:relative;isolation:isolate;min-height:100vh!important;width:100%;max-width:none!important;margin:0!important;padding:20px 24px 44px!important;background:linear-gradient(145deg,#FCFAFC 0%,#FFFDFC 52%,#FFF8FC 100%);color:#302934}
        .eb-cabinet::before,.eb-cabinet::after{content:'';position:fixed;z-index:-1;border-radius:50%;pointer-events:none}
        .eb-cabinet::before{width:440px;height:440px;left:-230px;top:-220px;background:radial-gradient(circle,rgba(233,87,197,.12),rgba(233,87,197,0) 68%)}
        .eb-cabinet::after{width:500px;height:500px;right:-260px;bottom:-280px;background:radial-gradient(circle,rgba(255,179,66,.13),rgba(255,179,66,0) 68%)}
        .eb-cabinet-inner{position:relative;width:100%;max-width:1120px;margin:0 auto}
        .eb-client-cabinet .eb-cabinet-inner{max-width:920px}
        .eb-cab-nav{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 22px;padding:10px 12px;background:rgba(255,255,255,.92);border:1px solid #EEE6ED;border-radius:20px;box-shadow:0 10px 34px rgba(72,34,64,.065);backdrop-filter:blur(14px)}
        .eb-cab-brand{display:inline-flex;align-items:center;gap:8px;color:#241E27;text-decoration:none;flex:none}
        .eb-cab-nav-actions{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0;flex-wrap:wrap}
        .eb-cab-nav-action{display:inline-flex!important;align-items:center!important;justify-content:center;gap:7px;min-height:40px;padding:0 13px!important;border:1px solid #E9DFE7!important;border-radius:13px!important;background:#fff!important;color:#665D68!important;text-decoration:none;font-size:13.5px!important;font-weight:400!important;cursor:pointer;box-shadow:0 4px 14px rgba(72,34,64,.035)}
        .eb-cab-nav-action:hover{border-color:#DEB4D5!important;background:#FFF7FC!important;color:#982D88!important;transform:translateY(-1px)}
        .eb-cab-nav-action[data-danger="true"]{border-color:#F3D7DD!important;color:#B9485B!important;background:#FFF9FA!important}
        .eb-cab-title-row{display:flex;align-items:center;gap:13px;margin:0 2px 18px}
        .eb-cab-title-icon{display:grid;place-items:center;width:46px;height:46px;border-radius:15px;color:#AB3698;background:linear-gradient(145deg,#FFEAF9,#FFF2E7);border:1px solid #F1D8E9;flex:none}
        .eb-cab-title{margin:0!important;font-size:28px!important;font-weight:550!important;letter-spacing:-.025em!important;line-height:1.15}
        .eb-cab-subtitle{margin:5px 0 0;color:#847B86;font-size:13.5px;line-height:1.4}
        .eb-cab-card{background:rgba(255,255,255,.96)!important;border:1px solid #EEE6ED!important;border-radius:20px!important;box-shadow:0 12px 36px rgba(72,34,64,.07)!important}
        .eb-cab-profile{padding:20px!important;margin-bottom:16px!important;text-align:left!important}
        .eb-cab-profile-main{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap}
        .eb-cab-profile h2{font-size:23px!important;font-weight:550!important;letter-spacing:-.02em;margin:0 0 5px!important}
        .eb-cab-profile p{color:#817883!important;font-size:13.5px!important}
        .eb-cab-profile-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .eb-cab-visibility{display:inline-flex;align-items:center;gap:7px;padding:9px 13px!important;border:1px solid #E9D7E5!important;border-radius:13px!important;background:#FFF7FC!important;color:#923182!important;font-size:13px!important;font-weight:450!important}
        .eb-cab-tabs{display:flex;gap:5px;margin:0 0 18px!important;padding:5px;background:#F2EDF1;border:1px solid #ECE5EA;border-radius:16px;overflow-x:auto;scrollbar-width:none}
        .eb-cab-tabs::-webkit-scrollbar{display:none}
        .eb-cab-tab{display:inline-flex;align-items:center;justify-content:center;gap:7px;flex:1;min-width:max-content;padding:10px 15px!important;border:0!important;border-radius:12px!important;background:transparent!important;color:#756D77!important;font-size:14px!important;font-weight:400!important;white-space:nowrap;box-shadow:none!important}
        .eb-cab-tab[data-active="true"]{background:#fff!important;color:#A33191!important;font-weight:500!important;box-shadow:0 5px 16px rgba(72,34,64,.08)!important}
        .eb-cab-primary{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;background:linear-gradient(100deg,#E651C5,#F268A8 48%,#FFB342)!important;color:#fff!important;border:0!important;border-radius:14px!important;box-shadow:0 10px 24px rgba(229,75,170,.20)!important;font-weight:500!important}
        .eb-cab-primary:hover{transform:translateY(-1px);box-shadow:0 13px 28px rgba(229,75,170,.27)!important}
        .eb-cab-primary:disabled{opacity:.55!important;cursor:not-allowed!important;transform:none!important;box-shadow:none!important}
        .eb-cab-primary:disabled svg{animation:eb-cab-spin .8s linear infinite}
        .eb-cab-secondary{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;background:#fff!important;color:#943184!important;border:1px solid #E5BDDA!important;border-radius:13px!important;font-weight:450!important}
        .eb-cab-secondary:hover{background:#FFF6FC!important;border-color:#D99ACD!important}
        .eb-cab-danger{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;background:#FFF9FA!important;color:#B9465A!important;border:1px solid #F0CBD3!important;border-radius:13px!important}
        .eb-cab-field{width:100%;border:1px solid #E8E0E6!important;border-radius:14px!important;background:#fff!important;color:#332D36!important;box-shadow:0 4px 16px rgba(72,34,64,.025);transition:border-color .18s,box-shadow .18s,background .18s}
        .eb-cab-field:focus,.eb-cab-field:focus-within{outline:none!important;border-color:#DCA3D1!important;box-shadow:0 0 0 3px rgba(233,87,197,.10)!important}
        .eb-cabinet select.eb-cab-field{appearance:none;padding-right:38px!important;background-image:linear-gradient(45deg,transparent 50%,#9A3A91 50%),linear-gradient(135deg,#9A3A91 50%,transparent 50%)!important;background-position:calc(100% - 17px) 50%,calc(100% - 12px) 50%!important;background-size:5px 5px,5px 5px!important;background-repeat:no-repeat!important}
        .eb-cab-select{position:relative;width:100%}
        .eb-cab-select-trigger{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px 13px!important;cursor:pointer;font-size:14px!important;text-align:left}
        .eb-cab-select-menu{position:absolute;left:0;right:0;top:calc(100% + 7px);z-index:40;padding:7px;background:rgba(255,255,255,.98);border:1px solid #E8DCE5;border-radius:16px;box-shadow:0 18px 44px rgba(72,34,64,.17);backdrop-filter:blur(14px)}
        .eb-cab-select-option{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;padding:10px 11px;border:0;border-radius:11px;background:#fff;color:#4C424E;text-align:left;cursor:pointer;font-size:13.5px!important}
        .eb-cab-select-option[data-selected="true"]{background:linear-gradient(100deg,#FCE8F8,#F1ECFF)!important;color:#7E2878!important}
        .eb-cab-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:220px;padding:32px 20px;text-align:center;background:linear-gradient(145deg,#fff,#FFF8FC);border:1px dashed #E5D4E1;border-radius:20px;color:#827A84}
        .eb-cab-empty-icon{display:grid;place-items:center;width:58px;height:58px;margin-bottom:14px;border-radius:18px;color:#B0399C;background:linear-gradient(145deg,#FFEAF9,#FFF1E7)}
        .eb-cab-order{padding:18px!important;margin-bottom:12px!important}
        .eb-cab-status{display:inline-flex;padding:5px 9px;border-radius:999px;font-size:11.5px;font-weight:450;border:1px solid transparent}
        .eb-cab-status[data-status="new"]{background:#FFF5E7!important;color:#A45F13!important;border-color:#F7DDBD!important}
        .eb-cab-status[data-status="confirmed_by_executor"],.eb-cab-status[data-status="confirmed_by_client"]{background:#F1EEFF!important;color:#6F53A9!important;border-color:#DED5F8!important}
        .eb-cab-status[data-status="awaiting_client_confirmation"]{background:#FFF0F7!important;color:#A0367B!important;border-color:#F0CEE1!important}
        .eb-cab-status[data-status="in_progress"]{background:#F5EEFF!important;color:#7B42A8!important;border-color:#E4D3F3!important}
        .eb-cab-status[data-status="done"]{background:#EDFAF3!important;color:#39795B!important;border-color:#CDEBD9!important}
        .eb-cab-status[data-status="cancelled"]{background:#FFF1F3!important;color:#AD4557!important;border-color:#F1D1D7!important}
        .eb-cab-meta{display:flex;align-items:flex-start;gap:8px;margin:7px 0;color:#5F5762;font-size:13.5px;line-height:1.45}
        .eb-cab-meta svg{color:#AB3998;flex:none;margin-top:1px}
        .eb-cab-modal-backdrop{background:rgba(48,30,45,.42)!important;backdrop-filter:blur(4px)}
        .eb-cab-modal{background:#fff!important;border:1px solid #EEE3EB!important;border-radius:22px!important;box-shadow:0 24px 70px rgba(57,28,51,.20)!important}
        .eb-schedule-card{padding:14px!important;overflow:hidden}
        .eb-schedule-toolbar{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px}
        .eb-schedule-toolbar button,.eb-schedule-quick button{border:1px solid #E7DDE5!important;border-radius:11px!important;background:#fff!important;color:#7B4673!important}
        .eb-schedule-toolbar button:hover,.eb-schedule-quick button:hover{background:#FFF5FB!important;border-color:#DDB0D2!important}
        .eb-schedule-grid{border-radius:14px;overflow:hidden}
        .eb-add-order .eb-cabinet-inner,.eb-settings-cabinet .eb-cabinet-inner{max-width:700px}
        .eb-cab-form-card{padding:22px!important}
        .eb-cab-section-title{display:flex;align-items:center;gap:8px;margin:0 0 9px!important;color:#5F5661;font-size:13px!important;font-weight:500!important;letter-spacing:.01em}
        .eb-cab-section-title svg{color:#AB3698}
        .eb-cab-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-bottom:18px}
        .eb-cab-form-grid .eb-cab-field,.eb-cab-form-card>.eb-cab-field{min-height:46px;padding:11px 13px!important;font:inherit}
        .eb-visit-options{display:flex;gap:9px;margin-bottom:18px}
        .eb-visit-choice,.eb-location-choice,.eb-day-choice{display:inline-flex!important;align-items:center;justify-content:center;gap:7px;border:1px solid #E8E0E6!important;background:#fff!important;color:#665D68!important;box-shadow:0 4px 14px rgba(72,34,64,.035);transition:.18s ease}
        .eb-visit-choice{min-height:42px;padding:0 16px!important;border-radius:13px!important}
        .eb-visit-choice[data-active="true"],.eb-location-choice[data-active="true"],.eb-day-choice[data-active="true"]{border-color:transparent!important;background:linear-gradient(100deg,#D953C4,#9A63DC)!important;color:#fff!important;box-shadow:0 8px 20px rgba(175,63,167,.18)!important}
        .eb-visit-choice:disabled{opacity:.42;cursor:not-allowed!important}
        .eb-service-choice{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px!important;margin-bottom:6px!important;border:1px solid #ECE3EA!important;border-radius:16px!important;background:#fff!important;cursor:pointer;transition:.18s ease}
        .eb-service-choice:hover{border-color:#DEB4D5!important;background:#FFF9FD!important}
        .eb-service-choice[data-active="true"]{border-color:#DDA7D3!important;background:linear-gradient(115deg,#FFF2FB,#FFF8F0)!important;box-shadow:0 8px 22px rgba(111,55,99,.07)}
        .eb-service-choice-price{color:#A33191!important;font-weight:550!important}
        .eb-extra-choice{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 13px 10px 24px!important;margin:0 0 5px 12px!important;border:1px solid #EEE6ED!important;border-radius:13px!important;background:#fff!important;cursor:pointer;transition:.18s ease}
        .eb-extra-choice[data-active="true"]{border-color:#D8B5E5!important;background:#F9F3FF!important}
        .eb-order-summary{padding:15px!important;margin:18px 0 12px!important;border:1px solid #EADFE8!important;border-radius:16px!important;background:linear-gradient(135deg,#FFF4FB,#FFF9F1)!important}
        .eb-order-summary-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:7px;color:#6F6671;font-size:13.5px}
        .eb-order-summary-label{display:flex;align-items:center;gap:7px}
        .eb-order-summary-label svg{color:#AB3698}
        .eb-order-summary-total{padding-top:10px;margin-top:9px!important;border-top:1px solid #E6D9E3!important;color:#3B323D!important;font-weight:550}
        .eb-cab-form-card .eb-cab-primary{width:100%;min-height:48px;padding:0 18px!important}
        .eb-settings-section{padding:20px!important;margin-top:14px!important}
        .eb-settings-section:first-of-type{margin-top:0!important}
        .eb-settings-section h3{display:flex;align-items:center;gap:9px;margin:0 0 17px!important;font-size:19px!important;font-weight:520!important;letter-spacing:-.015em;color:#3D3540}
        .eb-settings-section h3 svg{color:#A73594}
        .eb-settings-section label{display:block;margin:0 0 6px!important;color:#776E79!important;font-size:12.5px!important;font-weight:450!important}
        .eb-settings-section input:not([type="file"]),.eb-settings-section textarea,.eb-settings-section select{width:100%!important;min-width:0!important;box-sizing:border-box!important;padding:11px 13px!important;border:1px solid #E8E0E6!important;border-radius:14px!important;background:#fff!important;color:#332D36!important;font:inherit!important;box-shadow:0 4px 16px rgba(72,34,64,.025);transition:.18s}
        .eb-settings-section input:not([type="file"]):focus,.eb-settings-section textarea:focus,.eb-settings-section select:focus{outline:none!important;border-color:#DCA3D1!important;box-shadow:0 0 0 3px rgba(233,87,197,.10)!important}
        .eb-settings-section .eb-cab-primary{width:100%;min-height:46px;margin-top:16px!important;padding:0 15px!important}
        .eb-avatar-shell{display:grid!important;place-items:center;width:106px!important;height:106px!important;border:1px solid #E8D9E5!important;background:linear-gradient(145deg,#FFF0FA,#FFF5EB)!important;box-shadow:0 10px 24px rgba(97,48,86,.09);color:#AC3999}
        .eb-settings-toggle{display:flex!important;align-items:center;justify-content:space-between;width:100%!important;padding:10px 2px!important;background:transparent!important;border:0!important;color:#943184!important;font-size:13.5px!important;cursor:pointer}
        .eb-settings-collapsible{display:flex;align-items:center;justify-content:space-between;gap:12px;cursor:pointer}
        .eb-settings-collapsible h3{margin:0!important}
        .eb-settings-map-wrap{overflow:hidden;border-radius:16px;border:1px solid #E9E0E7}
        .eb-day-list{display:flex;gap:7px;flex-wrap:wrap}
        .eb-day-choice{min-width:44px;padding:8px 11px!important;border-radius:11px!important}
        .eb-service-editor{padding:15px!important;margin-bottom:12px!important;border:1px solid #E9DFE7!important;border-radius:17px!important;background:linear-gradient(145deg,#FFFDFE,#FFF8FC)!important}
        .eb-service-editor-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
        .eb-service-kicker{color:#A33191!important;font-size:11px!important;font-weight:550!important;letter-spacing:.055em;text-transform:uppercase}
        .eb-icon-button{display:inline-grid!important;place-items:center;width:34px;height:34px;padding:0!important;border:1px solid #EADFE7!important;border-radius:11px!important;background:#fff!important;color:#A74659!important;cursor:pointer}
        .eb-location-choice{padding:7px 12px!important;border-radius:999px!important;font-size:12.5px!important}
        .eb-service-sub{margin-top:11px!important;padding:12px!important;border-left:2px solid #DCA6D2!important;border-radius:0 13px 13px 0;background:rgba(249,242,250,.7)}
        .eb-settings-note{color:#8B828D!important;font-size:12px!important;line-height:1.5}
        .eb-loading-card{display:flex;align-items:center;justify-content:center;gap:10px;min-height:160px;margin:40px auto;padding:24px;max-width:500px;color:#847B86}
        .eb-loading-card::before{content:'';width:22px;height:22px;border:2px solid #F0DCEB;border-top-color:#D553BF;border-radius:50%;animation:eb-cab-spin .75s linear infinite}
        @keyframes eb-cab-spin{to{transform:rotate(360deg)}}
        @media(max-width:700px){
          .eb-cabinet{padding:12px 10px 28px!important}
          .eb-cabinet-inner{max-width:100%}
          .eb-cab-nav{margin-bottom:16px;padding:8px 9px;border-radius:17px}
          .eb-cab-brand .eb-brand-name{font-size:20px}
          .eb-cab-brand img{width:26px!important;height:26px!important}
          .eb-cab-nav-action{min-height:38px;padding:0 10px!important;font-size:12.5px!important}
          .eb-cab-nav-action .eb-cab-action-label{display:none}
          .eb-cab-title-row{margin-bottom:14px}
          .eb-cab-title-icon{width:42px;height:42px;border-radius:14px}
          .eb-cab-title{font-size:24px!important}
          .eb-cab-card{border-radius:18px!important}
          .eb-cab-profile{padding:16px!important}
          .eb-cab-tabs{border-radius:15px;margin-bottom:14px!important}
          .eb-cab-tab{padding:9px 12px!important;font-size:13px!important}
          .eb-cab-order{padding:15px!important}
          .eb-schedule-card{padding:10px!important}
          .eb-schedule-toolbar{align-items:stretch}
          .eb-schedule-toolbar>span{font-size:12px!important;text-align:center;align-self:center}
          .eb-schedule-toolbar button{padding:6px 8px!important;font-size:12px!important}
          .eb-cab-form-card,.eb-settings-section{padding:16px!important}
          .eb-cab-form-grid{gap:8px}
          .eb-service-choice{padding:12px!important}
          .eb-settings-section h3{font-size:18px!important}
        }
        @media(max-width:360px){
          .eb-cabinet{padding-left:8px!important;padding-right:8px!important}
          .eb-cab-brand .eb-brand-name{font-size:19px}
          .eb-cab-nav-actions{gap:5px}
          .eb-cab-nav-action{width:36px;min-height:36px;padding:0!important}
        }
      `}</style>
    </>
  )
}
