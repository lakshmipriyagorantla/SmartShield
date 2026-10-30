// src/services/messageDetectionService.js

const rules = [
  {
    name: 'OTP request',
    score: 30,
    pattern:
      /\b(send|share|give|provide|tell|enter|submit|forward)\b.{0,60}\b(otp|one[- ]time password|verification code|security code)\b/i,
    reason: 'The message asks you to share an OTP or verification code.',
  },
  {
    name: 'UPI PIN request',
    score: 35,
    pattern:
      /\b(send|share|give|provide|tell|enter|submit)\b.{0,60}\b(upi\s*pin|pin\s*(number|code)?)\b/i,
    reason: 'The message asks for a UPI PIN or PIN information.',
  },
  {
    name: 'Password request',
    score: 30,
    pattern:
      /\b(send|share|give|provide|tell|enter|submit)\b.{0,60}\b(password|passcode|login credentials)\b/i,
    reason: 'The message asks for a password or login credentials.',
  },
  {
    name: 'Banking information request',
    score: 28,
    pattern:
      /\b(send|share|give|provide|confirm|verify|enter)\b.{0,80}\b(bank account|account number|debit card|credit card|card number|cvv|ifsc)\b/i,
    reason: 'The message requests sensitive banking or card information.',
  },
  {
    name: 'Money request',
    score: 28,
    pattern:
      /\b(send money|transfer money|pay now|make payment|pay immediately|deposit|processing fee|refund fee|registration fee)\b/i,
    reason: 'The message asks for money or a payment.',
  },
  {
    name: 'Urgency',
    score: 15,
    pattern:
      /\b(urgent|urgently|immediately|act now|right now|within \d+\s*(minute|minutes|hour|hours)|today only|last chance|expires today|do not delay)\b/i,
    reason: 'The message uses urgency to pressure you into acting quickly.',
  },
  {
    name: 'Threat',
    score: 22,
    pattern:
      /\b(account will be blocked|account blocked|account suspended|legal action|police case|arrest|fine|penalty|warrant|service will be stopped)\b/i,
    reason: 'The message uses a threat or fear of consequences.',
  },
  {
    name: 'Prize or lottery',
    score: 25,
    pattern:
      /\b(you have won|you won|winner|lottery|lucky winner|free prize|cash prize|congratulations.*prize|claim your prize)\b/i,
    reason: 'The message claims an unexpected prize, lottery win, or reward.',
  },
  {
    name: 'KYC/account verification',
    score: 22,
    pattern:
      /\b(update|complete|verify|confirm).{0,30}\b(kyc|account verification|identity verification)\b/i,
    reason: 'The message asks for KYC or account verification.',
  },
  {
    name: 'Suspicious link instruction',
    score: 18,
    pattern:
      /\b(click|tap|open|visit|follow|login|sign in)\b.{0,50}\b(link|url|website|page)\b/i,
    reason: 'The message tells you to open or follow a link.',
  },
  {
    name: 'Remote access request',
    score: 35,
    pattern:
      /\b(install|download|use)\b.{0,50}\b(anydesk|teamviewer|remote desktop|remote access|screen sharing|screen share)\b/i,
    reason: 'The message requests remote-access software or screen sharing.',
  },
  {
    name: 'Impersonation',
    score: 18,
    pattern:
      /\b(bank|police|income tax|government|customs|courier|customer care|support team|security team|official)\b.{0,70}\b(verify|confirm|pay|send|share|click|login|update)\b/i,
    reason: 'The message may be impersonating an organization or official service.',
  },
  {
    name: 'Delivery scam',
    score: 22,
    pattern:
      /\b(parcel|package|delivery|courier|shipment|tracking)\b.{0,80}\b(pay|fee|click|link|verify|update address)\b/i,
    reason: 'The message resembles a delivery or parcel scam.',
  },
  {
    name: 'Job/income scam',
    score: 22,
    pattern:
      /\b(work from home|part[- ]time job|easy money|earn \₹?\$?\d+|daily income|guaranteed income|job offer)\b/i,
    reason: 'The message makes an unusually easy-money or job-related claim.',
  },
]

const suspiciousUrlPatterns = [
  {
    pattern: /bit\.ly|tinyurl\.com|t\.co|is\.gd|cutt\.ly|shorturl\.at/i,
    score: 20,
    reason: 'The message contains a shortened URL, which can hide the destination.',
  },
  {
    pattern: /https?:\/\/(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?/i,
    score: 25,
    reason: 'The link uses a raw IP address instead of a normal domain name.',
  },
  {
    pattern: /(?:login|verify|secure|update|account|bank|kyc).{0,20}(?:login|verify|secure|update|account|bank|kyc)/i,
    score: 15,
    reason: 'The URL contains multiple account/security-related terms.',
  },
]

function extractUrls(text) {
  return [
    ...text.matchAll(
      /(?:https?:\/\/|www\.)[^\s<>"']+/gi
    ),
  ].map((match) => match[0].replace(/[),.!?]+$/, ''))
}

function hasExplicitRequest(text, keywords) {
  const requestWords =
    '(send|share|give|provide|tell|enter|submit|forward|reply|confirm|verify)'

  const keywordGroup = keywords.join('|')

  return new RegExp(
    `\\b${requestWords}\\b.{0,80}\\b(?:${keywordGroup})\\b`,
    'i'
  ).test(text)
}

function calculateRisk(text) {
  let score = 0
  const reasons = []
  const matchedRules = []

  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      score += rule.score
      reasons.push(rule.reason)
      matchedRules.push(rule.name)
    }
  }

  const urls = extractUrls(text)

  for (const url of urls) {
    for (const rule of suspiciousUrlPatterns) {
      if (rule.pattern.test(url)) {
        score += rule.score
        reasons.push(rule.reason)
      }
    }
  }

  // A URL by itself is not automatically a scam.
  if (urls.length > 0) {
    if (
      /\b(click|tap|open|visit|login|sign in|verify|update)\b/i.test(text)
    ) {
      score += 12
      reasons.push(
        'The message combines a link with an instruction to take an action.'
      )
    }
  }

  // Strong combination: sensitive information + urgency.
  const asksForSensitiveInfo =
    hasExplicitRequest(text, [
      'otp',
      'one[- ]time password',
      'verification code',
      'upi\\s*pin',
      'password',
      'cvv',
      'card number',
      'bank account',
    ])

  const urgent =
    /\b(urgent|urgently|immediately|act now|right now|today only|do not delay)\b/i.test(
      text
    )

  if (asksForSensitiveInfo && urgent) {
    score += 20
    reasons.push(
      'The message combines a request for sensitive information with urgency.'
    )
  }

  // Multiple scam indicators together are more significant.
  if (matchedRules.length >= 3) {
    score += 15
    reasons.push(
      'Several independent scam indicators appear together in this message.'
    )
  }

  return {
    score: Math.min(100, score),
    reasons: [...new Set(reasons)],
    suspiciousLinks: urls,
    matchedRules,
  }
}

export function analyzeMessage(message) {
  const text = String(message || '').trim()

  if (!text) {
    return {
      status: 'safe',
      confidence: 0,
      riskScore: 0,
      riskLevel: 'No input',
      reasons: ['No message entered.'],
      recommendedAction: 'Please enter a message to check it.',
      suspiciousLinks: [],
      matchedRules: [],
    }
  }

  const result = calculateRisk(text)

  const score = result.score

  let status
  let riskLevel
  let recommendedAction

  if (score >= 75) {
    status = 'scam'
    riskLevel = 'Very high risk'

    recommendedAction =
      'Do not click links, send money, or share OTPs, passwords, PINs, or banking information. Verify the sender through an official channel.'
  } else if (score >= 50) {
    status = 'scam'
    riskLevel = 'High risk'

    recommendedAction =
      'Treat this message as potentially fraudulent. Do not respond or open links until you independently verify the sender.'
  } else if (score >= 25) {
    status = 'suspicious'
    riskLevel = 'Medium risk'

    recommendedAction =
      'Be careful. Do not share sensitive information or make payments until you verify the message using an official source.'
  } else {
    status = 'safe'
    riskLevel = 'Low risk'

    recommendedAction =
      'No major scam indicators were detected. However, this does not prove that the sender is legitimate.'
  }

  return {
    status,
    confidence: score,
    riskScore: score,
    riskLevel,
    reasons:
      result.reasons.length > 0
        ? result.reasons
        : ['No obvious scam indicators were detected.'],
    recommendedAction,
    suspiciousLinks: result.suspiciousLinks,
    matchedRules: result.matchedRules,
  }
}

export function reportMessage(message) {
  const result = analyzeMessage(message)

  return {
    ...result,
    reason: 'This message was added to the demo scam report list.',
  }
}