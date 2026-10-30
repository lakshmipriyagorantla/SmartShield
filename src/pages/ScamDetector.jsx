import { useMemo, useState } from 'react'
import { AlertTriangle, ShieldCheck, Link2, MessageSquareText, PhoneCall } from 'lucide-react'
import Button from '../components/Button'
import { analyzeMessage, analyzePhoneNumber, analyzeUrl } from '../services/riskEngine'
import { useSmartShield } from '../context/SmartShieldContext'
import { getTranslation } from '../utils/translations'

const tabStyles = {
  phone: 'bg-emerald-700 text-white',
  message: 'bg-sky-700 text-white',
  link: 'bg-violet-700 text-white',
}

const riskTone = {
  'low-risk': 'text-emerald-700 bg-emerald-50 border-emerald-200',
  unverified: 'text-amber-700 bg-amber-50 border-amber-200',
  suspicious: 'text-orange-700 bg-orange-50 border-orange-200',
  'high-risk': 'text-red-700 bg-red-50 border-red-200',
  'very-high-risk': 'text-red-800 bg-red-100 border-red-300',
}

export default function ScamDetector() {
  const { language } = useSmartShield()
  const [tab, setTab] = useState('phone')
  const [phoneNumber, setPhoneNumber] = useState('+91 90000 11111')
  const [message, setMessage] = useState('URGENT! Your account is blocked. Please share the OTP and click this link quickly.')
  const [url, setUrl] = useState('https://shorturl.example/secure-login')
  const [phoneResult, setPhoneResult] = useState(() => analyzePhoneNumber('+91 90000 11111'))
  const [messageResult, setMessageResult] = useState(() => analyzeMessage('URGENT! Your account is blocked. Please share the OTP and click this link quickly.'))
  const [urlResult, setUrlResult] = useState(() => analyzeUrl('https://shorturl.example/secure-login'))

  const activeResult = useMemo(() => {
    if (tab === 'phone') return phoneResult
    if (tab === 'message') return messageResult
    return urlResult
  }, [tab, phoneResult, messageResult, urlResult])

  const handlePhoneCheck = () => {
    setPhoneResult(analyzePhoneNumber(phoneNumber))
  }

  const handleMessageCheck = () => {
    setMessageResult(analyzeMessage(message))
  }

  const handleUrlCheck = () => {
    setUrlResult(analyzeUrl(url))
  }

  const getRiskLabel = (status) => {
    if (status === 'low-risk') return getTranslation(language, 'detector.labels.lowRisk')
    if (status === 'unverified') return getTranslation(language, 'detector.labels.unverified')
    if (status === 'suspicious') return getTranslation(language, 'detector.labels.suspicious')
    if (status === 'high-risk') return getTranslation(language, 'detector.labels.highRisk')
    return getTranslation(language, 'detector.labels.veryHighRisk')
  }

  const renderReason = (key) => getTranslation(language, `detector.reasons.${key}`) || key

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-red-600 to-amber-500 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">{getTranslation(language, 'detector.title')}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-red-50">{getTranslation(language, 'detector.subtitle')}</p>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex flex-wrap gap-3">
          {[
            { id: 'phone', label: getTranslation(language, 'detector.tabs.phone'), icon: PhoneCall },
            { id: 'message', label: getTranslation(language, 'detector.tabs.message'), icon: MessageSquareText },
            { id: 'link', label: getTranslation(language, 'detector.tabs.link'), icon: Link2 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-lg font-semibold ${tab === id ? tabStyles[id] : 'bg-slate-100 text-slate-700'}`} aria-label={label}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        {tab === 'phone' && (
          <div className="space-y-4">
            <label className="block text-lg font-bold text-slate-800" htmlFor="phone-check-input">
              {getTranslation(language, 'detector.phone.label')}
              <input id="phone-check-input" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder="+91 90000 11111" aria-label={getTranslation(language, 'detector.phone.label')} />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handlePhoneCheck}>{getTranslation(language, 'detector.actions.checkNumber')}</Button>
              <Button variant="ghost" onClick={() => setPhoneNumber('')}>{getTranslation(language, 'common.clear')}</Button>
            </div>
          </div>
        )}

        {tab === 'message' && (
          <div className="space-y-4">
            <label className="block text-lg font-bold text-slate-800" htmlFor="message-check-input">
              {getTranslation(language, 'detector.message.label')}
              <textarea id="message-check-input" value={message} onChange={(e) => setMessage(e.target.value)} rows={8} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder={getTranslation(language, 'detector.message.placeholder')} aria-label={getTranslation(language, 'detector.message.label')} />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleMessageCheck}>{getTranslation(language, 'detector.actions.checkMessage')}</Button>
              <Button variant="ghost" onClick={() => setMessage('')}>{getTranslation(language, 'common.clear')}</Button>
            </div>
          </div>
        )}

        {tab === 'link' && (
          <div className="space-y-4">
            <label className="block text-lg font-bold text-slate-800" htmlFor="link-check-input">
              {getTranslation(language, 'detector.link.label')}
              <input id="link-check-input" value={url} onChange={(e) => setUrl(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" placeholder="https://example.com" aria-label={getTranslation(language, 'detector.link.label')} />
            </label>
            <div className="flex flex-wrap gap-3">
              <Button onClick={handleUrlCheck}>{getTranslation(language, 'detector.actions.checkLink')}</Button>
              <Button variant="ghost" onClick={() => setUrl('')}>{getTranslation(language, 'common.clear')}</Button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className={`mb-4 flex items-center gap-3 rounded-2xl border p-4 ${riskTone[activeResult.status] || riskTone['low-risk']}`}>
          {activeResult.status === 'low-risk' ? <ShieldCheck className="text-emerald-600" size={28} /> : <AlertTriangle className="text-amber-500" size={28} />}
          <div className="text-3xl font-extrabold text-slate-900">{getRiskLabel(activeResult.status) || activeResult.riskLevel || getTranslation(language, 'detector.labels.lowRisk')}</div>
        </div>
        <div className="text-xl font-semibold text-slate-700">{getTranslation(language, 'detector.confidence')}: {activeResult.confidence || 0}%</div>
        <div className="mt-4 space-y-3 text-lg leading-8 text-slate-700">
          <div><strong>{getTranslation(language, 'detector.whatHappened')}</strong> {activeResult.reasons?.[0] ? renderReason(activeResult.reasons[0]) : getTranslation(language, 'detector.defaultFinding')}</div>
          <div><strong>{getTranslation(language, 'detector.riskDescription')}</strong> {activeResult.riskLevel || getTranslation(language, 'detector.labels.lowRisk')}</div>
          <div><strong>{getTranslation(language, 'detector.whatToDo')}</strong> {activeResult.recommendedAction || getTranslation(language, 'detector.defaultAction')}</div>
        </div>

        <div className="mt-5 rounded-2xl bg-slate-50 p-4">
          <div className="text-xl font-extrabold text-slate-900">{getTranslation(language, 'detector.details')}</div>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-lg text-slate-700">
            {(activeResult.reasons || []).map((reason) => <li key={reason}>{renderReason(reason)}</li>)}
          </ul>
        </div>
        <div className="mt-4 text-sm text-slate-600">{getTranslation(language, 'detector.source')}: {activeResult.source || 'local rules'}</div>
      </div>
    </div>
  )
}
