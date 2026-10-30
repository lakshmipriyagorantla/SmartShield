// src/services/urlDetectionService.js

const shortenedDomains = new Set([
  'bit.ly',
  'tinyurl.com',
  't.co',
  'goo.gl',
  'is.gd',
  'cutt.ly',
  'shorturl.at',
  'rb.gy',
])

const suspiciousTlds = new Set([
  '.xyz',
  '.top',
  '.click',
  '.buzz',
  '.shop',
  '.live',
  '.online',
])

const suspiciousKeywords = [
  'login',
  'signin',
  'sign-in',
  'verify',
  'verification',
  'update',
  'secure',
  'security',
  'account',
  'bank',
  'banking',
  'wallet',
  'kyc',
  'otp',
  'password',
  'payment',
  'refund',
  'claim',
  'prize',
  'reward',
  'support',
]

const trustedBrandNames = [
  'paypal',
  'google',
  'microsoft',
  'apple',
  'amazon',
  'sbi',
  'hdfc',
  'icici',
  'axis',
  'paytm',
  'phonepe',
  'flipkart',
]

function normalizeUrl(value = '') {
  const text = String(value).trim()

  if (!text) return ''

  if (/^https?:\/\//i.test(text)) {
    return text
  }

  return `https://${text}`
}

function extractHostname(url) {
  try {
    return new URL(url).hostname.toLowerCase()
  } catch {
    return ''
  }
}

function isIpAddress(hostname) {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)
}

function getRootDomain(hostname) {
  const parts = hostname.split('.')

  if (parts.length < 2) {
    return hostname
  }

  return parts.slice(-2).join('.')
}

function calculateRisk(raw, parsed, hostname) {
  let score = 0
  const reasons = []

  const protocol = parsed.protocol
  const pathname = parsed.pathname.toLowerCase()
  const fullUrl = raw.toLowerCase()

  // ---------------------------------------
  // HTTPS
  // ---------------------------------------

  if (protocol !== 'https:') {
    score += 20
    reasons.push(
      'The link does not use HTTPS encryption.'
    )
  }

  // ---------------------------------------
  // IP address instead of domain
  // ---------------------------------------

  if (isIpAddress(hostname)) {
    score += 30
    reasons.push(
      'The link uses an IP address instead of a normal website domain.'
    )
  }

  // ---------------------------------------
  // URL shortener
  // ---------------------------------------

  const rootDomain = getRootDomain(hostname)

  if (shortenedDomains.has(rootDomain)) {
    score += 25
    reasons.push(
      'This is a shortened URL, which hides the final destination.'
    )
  }

  // ---------------------------------------
  // Suspicious TLD
  // ---------------------------------------

  for (const tld of suspiciousTlds) {
    if (hostname.endsWith(tld)) {
      score += 12
      reasons.push(
        `The website uses the ${tld} domain ending, which requires extra caution.`
      )
      break
    }
  }

  // ---------------------------------------
  // Excessive subdomains
  // ---------------------------------------

  const subdomainCount = Math.max(0, hostname.split('.').length - 2)

  if (subdomainCount >= 3) {
    score += 15
    reasons.push(
      'The website uses an unusually large number of subdomains.'
    )
  }

  // ---------------------------------------
  // @ symbol
  // ---------------------------------------

  if (parsed.href.includes('@')) {
    score += 35
    reasons.push(
      'The URL contains an @ symbol, which can be used to disguise the actual destination.'
    )
  }

  // ---------------------------------------
  // Suspicious keywords
  // ---------------------------------------

  const matchedKeywords = suspiciousKeywords.filter(
    (keyword) =>
      hostname.includes(keyword) ||
      pathname.includes(keyword) ||
      fullUrl.includes(keyword)
  )

  if (matchedKeywords.length > 0) {
    const keywordScore = Math.min(
      20,
      matchedKeywords.length * 5
    )

    score += keywordScore

    reasons.push(
      `The URL contains security-related terms: ${matchedKeywords
        .slice(0, 5)
        .join(', ')}.`
    )
  }

  // ---------------------------------------
  // Brand impersonation
  // ---------------------------------------

  const matchedBrands = trustedBrandNames.filter(
    (brand) => hostname.includes(brand)
  )

  if (matchedBrands.length > 0) {
    const brand = matchedBrands[0]

    // If the hostname contains a brand name but the actual
    // root domain is not the official-looking brand domain,
    // treat it cautiously.
    const expectedDomains = {
      paypal: ['paypal.com'],
      google: ['google.com'],
      microsoft: ['microsoft.com'],
      apple: ['apple.com'],
      amazon: ['amazon.com', 'amazon.in'],
      sbi: ['sbi.co.in'],
      hdfc: ['hdfcbank.com'],
      icici: ['icicibank.com'],
      axis: ['axisbank.com'],
      paytm: ['paytm.com'],
      phonepe: ['phonepe.com'],
      flipkart: ['flipkart.com'],
    }

    const officialDomains = expectedDomains[brand] || []

    if (!officialDomains.includes(rootDomain)) {
      score += 35

      reasons.push(
        `The domain contains "${brand}" but does not match the expected official domain.`
      )
    }
  }

  // ---------------------------------------
  // Sensitive page + suspicious action
  // ---------------------------------------

  const sensitiveTerms =
    /(login|signin|verify|kyc|password|otp|bank|payment|wallet)/i

  if (
    sensitiveTerms.test(pathname) &&
    /(http:|short|bit\.ly|tinyurl|click|verify|login)/i.test(fullUrl)
  ) {
    score += 15

    reasons.push(
      'The link appears to lead to a sensitive login, verification, or payment page.'
    )
  }

  // ---------------------------------------
  // Very long URL
  // ---------------------------------------

  if (raw.length > 180) {
    score += 10

    reasons.push(
      'The URL is unusually long and contains a large amount of information.'
    )
  }

  return {
    score: Math.min(100, score),
    reasons: [...new Set(reasons)],
  }
}

export function checkUrl(url) {
  const raw = String(url || '').trim()

  if (!raw) {
    return {
      url: '',
      status: 'unknown',
      confidence: 0,
      riskScore: 0,
      riskLevel: 'No URL entered',
      reasons: ['Please enter a URL to check.'],
      recommendedAction:
        'Add a link before we review it.',
      suspiciousLinks: [],
    }
  }

  const normalized = normalizeUrl(raw)

  let parsed

  try {
    parsed = new URL(normalized)
  } catch {
    return {
      url: raw,
      status: 'unknown',
      confidence: 20,
      riskScore: 20,
      riskLevel: 'Invalid URL',
      reasons: [
        'This URL could not be parsed correctly.',
      ],
      recommendedAction:
        'Check the URL and make sure it is entered correctly.',
      suspiciousLinks: [raw],
    }
  }

  const hostname = extractHostname(normalized)

  if (!hostname) {
    return {
      url: raw,
      status: 'unknown',
      confidence: 20,
      riskScore: 20,
      riskLevel: 'Invalid URL',
      reasons: ['The website domain could not be identified.'],
      recommendedAction:
        'Check the URL before opening it.',
      suspiciousLinks: [raw],
    }
  }

  const result = calculateRisk(
    raw,
    parsed,
    hostname
  )

  const score = result.score

  let status
  let riskLevel
  let recommendedAction

  if (score >= 70) {
    status = 'scam'
    riskLevel = 'Very high risk'

    recommendedAction =
      'Do not open this link or enter information. Do not provide passwords, OTPs, PINs, or banking details. Verify the website through the organization’s official website or app.'
  } else if (score >= 45) {
    status = 'suspicious'
    riskLevel = 'High risk'

    recommendedAction =
      'Do not enter personal or financial information. Verify the domain independently before continuing.'
  } else if (score >= 20) {
    status = 'suspicious'
    riskLevel = 'Medium risk'

    recommendedAction =
      'Use caution. Check the domain carefully before opening the page or entering any information.'
  } else {
    status = 'safe'
    riskLevel = 'Low risk'

    recommendedAction =
      'No major technical red flags were detected. This does not guarantee that the website is legitimate.'
  }

  return {
    url: raw,
    normalizedUrl: normalized,
    hostname,

    status,

    // Keep compatibility with ScamDetector.jsx
    confidence: score,

    // More accurate name
    riskScore: score,

    riskLevel,

    reasons:
      result.reasons.length > 0
        ? result.reasons
        : ['No obvious technical red flags were detected.'],

    recommendedAction,

    suspiciousLinks: [raw],
  }
}

export function reportUrl(
  url,
  reason = 'User report'
) {
  const analysis = checkUrl(url)

  return {
    ...analysis,
    reportReason: reason,
    reportSaved: true,
    note:
      'This report is currently saved locally for the website prototype.',
  }
}