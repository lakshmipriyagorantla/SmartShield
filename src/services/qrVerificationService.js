const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/
const FRAUD_PATTERN = /\b(share|send|tell|enter|provide)\s+(?:me\s+)?(?:your\s+)?(?:otp|one[- ]time password|upi pin|pin)\b|\b(pay|send)\s+(?:a\s+)?(?:fee|tax|charge)\s+to\s+(?:release|receive|unlock)\b/i
const UNVERIFIED_PATTERN = /\b(unknown|new contact|unverified|not sure|stranger)\b/i

export function verifyUpiPayment({ upiId = '', amount = '', recipient = '', paymentInfo = '' } = {}) {
  const normalizedUpi = String(upiId ?? '').trim()
  const normalizedRecipient = String(recipient ?? '').trim()
  const normalizedAmount = String(amount ?? '').trim()
  const normalizedPaymentInfo = String(paymentInfo ?? '').trim()
  const reasons = []
  const missing = []

  if (!normalizedRecipient) missing.push('RECIPIENT_MISSING')
  else if (normalizedRecipient.length > 100 || !/[\p{L}\p{N}]/u.test(normalizedRecipient)) reasons.push('RECIPIENT_INVALID')
  if (!normalizedUpi) missing.push('UPI_ID_MISSING')
  else if (!UPI_ID_PATTERN.test(normalizedUpi)) reasons.push('UPI_ID_INVALID')
  if (!normalizedAmount) missing.push('AMOUNT_MISSING')
  else if (!/^\d+(?:\.\d{1,2})?$/.test(normalizedAmount) || !Number.isFinite(Number(normalizedAmount)) || Number(normalizedAmount) <= 0) reasons.push('AMOUNT_INVALID')

  const paymentText = `${normalizedRecipient} ${normalizedPaymentInfo}`
  if (FRAUD_PATTERN.test(paymentText)) reasons.push('SUSPICIOUS_PAYMENT_REQUEST')
  if (UNVERIFIED_PATTERN.test(paymentText)) reasons.push('RECIPIENT_UNVERIFIED')

  let status = 'NEEDS_REVIEW'
  if (reasons.includes('SUSPICIOUS_PAYMENT_REQUEST')) status = 'UNSAFE'
  else if (reasons.some((reason) => reason === 'RECIPIENT_INVALID' || reason === 'UPI_ID_INVALID' || reason === 'AMOUNT_INVALID' || reason === 'RECIPIENT_UNVERIFIED')) status = 'WARNING'
  else if (missing.length) status = 'UNKNOWN'
  else reasons.push('LOCAL_FORMAT_CHECKS_PASSED', 'RECIPIENT_NOT_VERIFIED')

  return {
    recipientName: normalizedRecipient,
    upiId: normalizedUpi,
    amount: normalizedAmount,
    status,
    reasons: [...missing, ...reasons],
    identityVerified: false,
  }
}

export function parseUpiQrData(decodedValue = '') {
  const value = String(decodedValue ?? '').trim()
  if (!value) return null

  try {
    const url = new URL(value)
    if (url.protocol.toLowerCase() !== 'upi:') return { rawData: value }
    const params = url.searchParams
    return {
      upiId: params.get('pa') || '',
      recipient: params.get('pn') || '',
      amount: params.get('am') || '',
      paymentInfo: params.get('tn') || params.get('tr') || '',
      rawData: value,
    }
  } catch {
    return { rawData: value }
  }
}
