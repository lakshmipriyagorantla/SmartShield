import { useRef, useState } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import Button from '../components/Button'
import { parseUpiQrData, verifyUpiPayment } from '../services/qrVerificationService'
import { getTranslation } from '../utils/translations'
import { useSmartShield } from '../context/SmartShieldContext'

export default function UpiQrSafety() {
  const { language } = useSmartShield()
  const fileInputRef = useRef(null)
  const [upiId, setUpiId] = useState('')
  const [recipient, setRecipient] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentInfo, setPaymentInfo] = useState('')
  const [result, setResult] = useState(null)
  const [scanError, setScanError] = useState('')

  const handleVerify = () => {
    setResult(verifyUpiPayment({ upiId, amount, recipient, paymentInfo }))
  }

  const clearResult = (setter) => (event) => {
    setter(event.target.value)
    setResult(null)
    setScanError('')
  }

  const handleQrFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    setResult(null)
    setScanError('')
    if (!file) return

    if (typeof window.createImageBitmap !== 'function') {
      setScanError(getTranslation(language, 'upi.scanUnavailable'))
      return
    }

    let imageBitmap
    try {
      imageBitmap = await window.createImageBitmap(file)
      const maxDimension = 1600
      const scale = Math.min(1, maxDimension / imageBitmap.width, maxDimension / imageBitmap.height)
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(imageBitmap.width * scale)
      canvas.height = Math.round(imageBitmap.height * scale)
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) throw new Error('Canvas is not available')
      context.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height)
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const { default: decodeQr } = await import('jsqr')
      const decoded = decodeQr(imageData.data, imageData.width, imageData.height)
      if (!decoded?.data) {
        setScanError(getTranslation(language, 'upi.noQrFound'))
        return
      }

      const details = parseUpiQrData(decoded.data)
      if (!details?.upiId) {
        setScanError(getTranslation(language, 'upi.notUpiQr'))
        return
      }

      setUpiId(details.upiId)
      setRecipient(details.recipient || '')
      setAmount(details.amount || '')
      setPaymentInfo(details.paymentInfo || '')
      setResult(verifyUpiPayment(details))
    } catch {
      setScanError(getTranslation(language, 'upi.scanFailed'))
    } finally {
      imageBitmap?.close?.()
    }
  }

  const t = (key) => getTranslation(language, `upi.${key}`)
  const resultTone = result?.status === 'UNSAFE'
    ? 'text-red-700'
    : result?.status === 'WARNING'
      ? 'text-amber-700'
      : result?.status === 'NEEDS_REVIEW'
        ? 'text-sky-800'
        : 'text-slate-700'

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-emerald-700 to-teal-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">{t('title')}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-emerald-50">{t('subtitle')}</p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div>
              <label htmlFor="upi-recipient" className="mb-2 block text-lg font-bold text-slate-700">{t('recipient')}</label>
              <input id="upi-recipient" value={recipient} onChange={clearResult(setRecipient)} className="w-full rounded-2xl border border-slate-300 p-3 text-lg" />
            </div>
            <div>
              <label htmlFor="upi-id" className="mb-2 block text-lg font-bold text-slate-700">{t('upiId')}</label>
              <input id="upi-id" value={upiId} onChange={clearResult(setUpiId)} className="w-full rounded-2xl border border-slate-300 p-3 text-lg" />
            </div>
            <div>
              <label htmlFor="upi-amount" className="mb-2 block text-lg font-bold text-slate-700">{t('amount')}</label>
              <input id="upi-amount" inputMode="decimal" value={amount} onChange={clearResult(setAmount)} className="w-full rounded-2xl border border-slate-300 p-3 text-lg" />
            </div>
            <div>
              <label htmlFor="upi-info" className="mb-2 block text-lg font-bold text-slate-700">{t('paymentInfo')}</label>
              <textarea id="upi-info" value={paymentInfo} onChange={clearResult(setPaymentInfo)} rows={4} className="w-full rounded-2xl border border-slate-300 p-3 text-lg" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button onClick={handleVerify}>{t('verify')}</Button>
            <Button variant="ghost" onClick={() => fileInputRef.current?.click()}>{t('scanQr')}</Button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleQrFile} aria-label={t('scanQr')} />
          </div>
          {scanError && <p role="alert" className="mt-4 text-base font-semibold text-red-700">{scanError}</p>}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          {result ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                {result.status === 'NEEDS_REVIEW' ? <ShieldCheck className="text-sky-700" size={28} /> : <ShieldAlert className="text-amber-700" size={28} />}
                <div className={`text-2xl font-extrabold ${resultTone}`}>{t('status')}: {t(`statuses.${result.status}`)}</div>
              </div>
              <div className="space-y-3 text-lg text-slate-700">
                <div><strong>{t('recipient')}:</strong> {result.recipientName || t('notProvided')}</div>
                <div><strong>{t('upiId')}:</strong> {result.upiId || t('notProvided')}</div>
                <div><strong>{t('amount')}:</strong> {result.amount ? `₹${result.amount}` : t('notProvided')}</div>
              </div>
              <ul className="mt-5 space-y-2 text-base text-slate-700">
                {result.reasons.map((reason) => <li key={reason}>• {t(`reasons.${reason}`)}</li>)}
              </ul>
            </>
          ) : <p className="text-lg text-slate-700">{t('emptyResult')}</p>}
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-lg leading-8 text-amber-900">
            <strong>{t('important')}:</strong> {t('disclaimer')}
          </div>
        </div>
      </div>
    </div>
  )
}
