const scamSignals = {
  urgent: /urgent|immediately|today only|act now|within 1 hour|limited time/i,
  otp: /otp|one time password|verification code|bank code|pin/i,
  payment: /pay|upi|bank transfer|send money|qr code|gift card|refund fee/i,
  link: /click link|tap here|open this link|https?:\/\//i,
  prize: /winner|lottery|congratulations|claim prize|free gift/i,
}

export function analyzeScamMessage(input = '') {
  const text = String(input || '').trim()

  if (!text) {
    return {
      risk: 'SAFE',
      score: 8,
      reasons: ['No message entered'],
      suspiciousKeywords: [],
      recommendedAction: 'Please add the message to check if it looks safe.',
      tips: ['Never share your OTP.', 'Never send money without checking the number.'],
      summary: 'This message does not show obvious scam indicators.',
    }
  }

  const reasons = []
  const suspiciousKeywords = []

  Object.entries(scamSignals).forEach(([key, pattern]) => {
    if (pattern.test(text)) {
      const labelMap = {
        urgent: 'Creates urgency',
        otp: 'Requests OTP',
        payment: 'Requests payment',
        link: 'Contains suspicious link',
        prize: 'Prize or refund claim',
      }
      reasons.push(labelMap[key])
      suspiciousKeywords.push(...(text.match(pattern) || []).map((match) => match.toString().trim()))
    }
  })

  const score = Math.min(97, 20 + reasons.length * 16 + (text.length > 150 ? 10 : 0))

  let risk = 'SAFE'
  if (score >= 70) risk = 'HIGH RISK'
  else if (score >= 40) risk = 'SUSPICIOUS'

  const summary =
    risk === 'HIGH RISK'
      ? 'Do not click links, share OTPs, or send money. This message appears highly suspicious.'
      : risk === 'SUSPICIOUS'
        ? 'Be careful. This message contains signs commonly associated with scams.'
        : 'This message does not show obvious scam indicators.'

  const recommendedAction =
    risk === 'HIGH RISK'
      ? 'Do not share your OTP or banking information. Do not click the link.'
      : risk === 'SUSPICIOUS'
        ? 'Pause and verify the sender before replying or clicking anything.'
        : 'You can safely keep this message, but remain alert for unusual requests.'

  const tips = [
    'Never share your OTP or UPI PIN.',
    'Check the sender name and phone number carefully.',
    'If you are unsure, call the company using a trusted number only.',
  ]

  return {
    risk,
    score,
    reasons: reasons.length ? reasons : ['No obvious scam pattern found'],
    suspiciousKeywords: [...new Set(suspiciousKeywords)].slice(0, 6),
    recommendedAction,
    tips,
    summary,
  }
}
