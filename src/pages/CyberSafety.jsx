import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, ShieldCheck, X } from 'lucide-react'
import { safetyTips } from '../data/safetyTips'
import { useSmartShield } from '../context/SmartShieldContext'
import { getTranslation } from '../utils/translations'

export default function CyberSafety() {
  const { language } = useSmartShield()
  const [selectedTipId, setSelectedTipId] = useState(null)
  const dialogRef = useRef(null)
  const closeButtonRef = useRef(null)
  const selectedTip = safetyTips.find((tip) => tip.id === selectedTipId)
  const localizedSelectedTip = selectedTip?.languages?.[language] || selectedTip?.languages?.en
  const localizedTipOfTheDay = safetyTips[0]?.languages?.[language] || safetyTips[0]?.languages?.en
  const t = (key) => getTranslation(language, `cyberSafety.${key}`)

  useEffect(() => {
    if (!selectedTip) return undefined
    const previouslyFocused = document.activeElement
    closeButtonRef.current?.focus()
    return () => {
      previouslyFocused?.focus?.()
    }
  }, [selectedTip])

  const handleDialogKeyDown = (event) => {
    if (event.key === 'Escape') {
      setSelectedTipId(null)
      return
    }
    if (event.key !== 'Tab') return

    const focusable = dialogRef.current?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])')
    if (!focusable?.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">{t('title')}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-emerald-50">{t('subtitle')}</p>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-amber-50 p-6 shadow-sm">
        <div className="flex items-center gap-3 text-2xl font-extrabold text-amber-900">
          <AlertTriangle /> {t('tipOfTheDay')}
        </div>
        <p className="mt-3 text-xl leading-8 text-amber-900">{localizedTipOfTheDay.text}</p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {safetyTips.map((tip) => {
          const content = tip.languages[language] || tip.languages.en
          return (
          <div key={tip.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 text-4xl">{tip.icon}</div>
            <h2 className="text-2xl font-extrabold text-slate-900">{content.title}</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">{content.text}</p>
            <button type="button" onClick={() => setSelectedTipId(tip.id)} aria-haspopup="dialog" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-emerald-100 px-4 py-2 text-lg font-semibold text-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-200">
              <ShieldCheck size={18} /> {t('learnMore')}
            </button>
          </div>
          )
        })}
      </div>

      {selectedTip && localizedSelectedTip && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/60 p-0 sm:items-center sm:p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedTipId(null) }}>
          <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="tip-dialog-title" onKeyDown={handleDialogKeyDown} className="max-h-[90vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:max-w-2xl sm:rounded-3xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 text-4xl" aria-hidden="true">{selectedTip.icon}</div>
                <h2 id="tip-dialog-title" className="text-2xl font-extrabold text-slate-900">{localizedSelectedTip.title}</h2>
              </div>
              <button ref={closeButtonRef} type="button" onClick={() => setSelectedTipId(null)} aria-label={t('close')} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-4 focus:ring-emerald-200">
                <X size={22} />
              </button>
            </div>
            <p className="mt-5 text-lg leading-8 text-slate-700">{localizedSelectedTip.explanation}</p>
            <h3 className="mt-6 text-lg font-bold text-slate-900">{t('practicalSteps')}</h3>
            <ul className="mt-3 list-disc space-y-3 pl-6 text-base leading-7 text-slate-700">
              {localizedSelectedTip.steps.map((step) => <li key={step}>{step}</li>)}
            </ul>
            <button type="button" onClick={() => setSelectedTipId(null)} className="mt-7 rounded-2xl bg-emerald-700 px-5 py-3 text-base font-semibold text-white focus:outline-none focus:ring-4 focus:ring-emerald-200">
              {t('close')}
            </button>
          </section>
        </div>
      )}
    </div>
  )
}
