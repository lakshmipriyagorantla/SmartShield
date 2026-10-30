const SHORTENERS = new Set(['bit.ly', 'tinyurl.com', 'shorturl.at', 'is.gd', 'goo.gl', 't.co', 'cutt.ly', 'rb.gy']);
const SUSPICIOUS_TLDS = ['.xyz', '.top', '.click', '.shop', '.online', '.club', '.bid'];

export function clamp(value, minimum = 0, maximum = 100) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function scoreToLevel(score) {
  if (score >= 80) return { status: 'very-high-risk', riskLevel: 'Very High Risk / Possible Scam' };
  if (score >= 60) return { status: 'high-risk', riskLevel: 'High Risk' };
  if (score >= 40) return { status: 'suspicious', riskLevel: 'Suspicious' };
  if (score >= 20) return { status: 'unverified', riskLevel: 'Unverified' };
  return { status: 'low-risk', riskLevel: 'Low Risk' };
}

export function normalizePhoneNumber(value = '') {
  const text = String(value || '').trim();
  const digits = text.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 12 && digits.startsWith('91')) return digits;
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function getPhoneIndicators(number = '') {
  const digits = String(number || '').replace(/\D/g, '');
  const nationalDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  const indicators = [];
  if (digits.length < 10 || digits.length > 15) indicators.push('INVALID_LENGTH');
  if (nationalDigits && new Set(nationalDigits.split('')).size === 1) indicators.push('REPEATED_DIGITS');
  if (/(\d)\1{4,}/.test(nationalDigits)) indicators.push('LONG_REPEATED_SEQUENCE');
  if (['0123456789', '1234567890', '9876543210'].includes(nationalDigits)) indicators.push('SEQUENTIAL_DIGITS');
  if (!/^(?:91[6-9]\d{9}|[6-9]\d{9})$/.test(digits)) indicators.push('UNUSUAL_FORMAT');
  if (['919000011111', '917000000000', '919999999999'].includes(digits)) indicators.push('LOCAL_REPORT_MATCH');
  return [...new Set(indicators)];
}

export function analyzePhoneNumber(phoneNumber) {
  const raw = String(phoneNumber || '').trim();
  const digits = raw.replace(/\D/g, '');
  const normalized = normalizePhoneNumber(raw);

  if (!raw || !digits) {
    return {
      status: 'low-risk',
      riskScore: 0,
      riskLevel: 'Low Risk',
      confidence: 0,
      phoneNumber: raw,
      normalizedNumber: '',
      reasons: ['EMPTY_INPUT'],
      indicators: [],
      recommendedAction: 'Enter a phone number to check it.',
      source: 'local rules',
    };
  }

  if (digits.length < 10 || digits.length > 15) {
    return {
      status: 'unverified',
      riskScore: 25,
      riskLevel: 'Unverified',
      confidence: 25,
      phoneNumber: raw,
      normalizedNumber: digits,
      reasons: ['INVALID_LENGTH'],
      indicators: ['INVALID_LENGTH'],
      recommendedAction: 'Check the number format and verify it through an official source.',
      source: 'local rules',
    };
  }

  const nationalDigits = digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
  let score = 12;
  const reasons = [];
  const indicators = [];

  if (new Set(nationalDigits.split('')).size === 1) {
    score += 48; indicators.push('REPEATED_DIGITS'); reasons.push('REPEATED_DIGITS');
  }
  if (/(\d)\1{4,}/.test(nationalDigits)) {
    score += 22; indicators.push('LONG_REPEATED_SEQUENCE'); reasons.push('LONG_REPEATED_SEQUENCE');
  }
  if (['0123456789', '1234567890', '9876543210'].includes(nationalDigits)) {
    score += 28; indicators.push('SEQUENTIAL_DIGITS'); reasons.push('SEQUENTIAL_DIGITS');
  }
  if (!/^(?:91[6-9]\d{9}|[6-9]\d{9})$/.test(digits)) {
    score += 15; indicators.push('UNUSUAL_FORMAT'); reasons.push('UNUSUAL_FORMAT');
  }
  if (['919000011111', '917000000000', '919999999999'].includes(digits)) {
    score += 60; indicators.push('LOCAL_REPORT_MATCH'); reasons.push('LOCAL_REPORT_MATCH');
  }

  if (!reasons.length) {
    score = 18; reasons.push('VALID_FORMAT_NO_EVIDENCE'); indicators.push('VALID_FORMAT_NO_EVIDENCE');
  }

  const threshold = scoreToLevel(score);
  const riskScore = clamp(Math.round(score), 0, 100);

  return {
    status: threshold.status,
    riskScore,
    riskLevel: threshold.riskLevel,
    confidence: riskScore,
    phoneNumber: raw,
    normalizedNumber: normalized,
    reasons: [...new Set(reasons)],
    indicators: [...new Set(indicators)],
    recommendedAction: riskScore >= 40 ? 'Do not share OTPs, UPI PINs, passwords, or banking details until the caller is verified independently.' : 'Verify the caller through an official source before sharing personal or payment information.',
    source: 'local rules' + (riskScore >= 80 ? ' + database reports' : ''),
  };
}

function extractUrls(text = '') {
  if (!text) return [];
  const matches = [...text.matchAll(/https?:\/\/[^\s)\]>"']+|www\.[^\s)\]>"']+/gi)];
  return matches.map((match) => match[0].replace(/[),.!?]+$/, ''));
}

function normalizeUrl(value = '') {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^www\./i.test(raw)) return `https://${raw}`;
  return `https://${raw}`;
}

export function analyzeUrl(url) {
  const raw = String(url || '').trim();
  if (!raw) {
    return {
      status: 'low-risk',
      riskScore: 0,
      riskLevel: 'Low Risk',
      confidence: 0,
      url: '',
      normalizedUrl: '',
      hostname: '',
      reasons: ['EMPTY_INPUT'],
      indicators: [],
      recommendedAction: 'Enter a website or link to analyze it.',
      source: 'local rules',
    };
  }

  const normalized = normalizeUrl(raw);
  let hostname = '';
  try {
    hostname = new URL(normalized).hostname.toLowerCase();
  } catch {
    return {
      status: 'unverified',
      riskScore: 25,
      riskLevel: 'Unverified',
      confidence: 25,
      url: raw,
      normalizedUrl: normalized,
      hostname: '',
      reasons: ['INVALID_URL'],
      indicators: ['INVALID_URL'],
      recommendedAction: 'Check the URL for typos or a missing domain before opening it.',
      source: 'local rules',
    };
  }

  let score = 8;
  const reasons = [];
  const indicators = [];
  const hostnameNoWww = hostname.replace(/^www\./, '');
  const rootDomain = hostnameNoWww.includes('.') ? hostnameNoWww.split('.').slice(-2).join('.') : hostnameNoWww;
  const parsed = new URL(normalized);
  const path = parsed.pathname.toLowerCase();
  const full = `${normalized} ${path} ${parsed.search}`.toLowerCase();

  if (parsed.protocol.toLowerCase() !== 'https:') { score += 18; reasons.push('HTTP_INSTEAD_OF_HTTPS'); indicators.push('HTTP_INSTEAD_OF_HTTPS'); }
  if (/\b\d{1,3}(?:\.\d{1,3}){3}\b/.test(hostname)) { score += 28; reasons.push('IP_ADDRESS_INSTEAD_OF_DOMAIN'); indicators.push('IP_ADDRESS_INSTEAD_OF_DOMAIN'); }
  if (SHORTENERS.has(rootDomain) || [...SHORTENERS].some((domain) => hostname.includes(domain))) { score += 26; reasons.push('SHORTENED_URL'); indicators.push('SHORTENED_URL'); }
  if (SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld))) { score += 18; reasons.push('SUSPICIOUS_TLD'); indicators.push('SUSPICIOUS_TLD'); }
  if (hostname.length > 30 || normalized.length > 180) { score += 16; reasons.push('UNUSUALLY_LONG_URL'); indicators.push('UNUSUALLY_LONG_URL'); }
  if (normalized.includes('@')) { score += 18; reasons.push('URL_USERNAME_TRICK'); indicators.push('URL_USERNAME_TRICK'); }
  if (/(login|verify|otp|password|bank|payment|secure)/.test(hostname) || /(login|verify|otp|password|bank|payment|secure)/.test(path)) { score += 18; reasons.push('HIGH_RISK_PAGE_TYPE'); indicators.push('HIGH_RISK_PAGE_TYPE'); }
  if (/(login|verify|kyc|otp|password|bank|payment|secure)/.test(full)) { score += 8; reasons.push('SUSPICIOUS_KEYWORDS'); indicators.push('SUSPICIOUS_KEYWORDS'); }
  if (hostname.split('.').length >= 5 || hostname.includes('xn--')) { score += 16; reasons.push('LOOKALIKE_OR_EXCESSIVE_SUBDOMAINS'); indicators.push('LOOKALIKE_OR_EXCESSIVE_SUBDOMAINS'); }
  if (parsed.search.length > 60) { score += 10; reasons.push('LONG_QUERY_STRING'); indicators.push('LONG_QUERY_STRING'); }
  if (/(login|verify|otp|payment|secure|bank|kyc|account)/.test(path)) { score += 10; reasons.push('SENSITIVE_PATH_PATTERN'); indicators.push('SENSITIVE_PATH_PATTERN'); }
  if (!hostname.includes('localhost') && !/(google|microsoft|apple|amazon|paytm|phonepe|sbi|hdfc)/.test(hostname) && /(secure|bank|login|verify|account|payment)/.test(hostname)) { score += 22; reasons.push('BRAND_IMPERSONATION_RISK'); indicators.push('BRAND_IMPERSONATION_RISK'); }
  if ([...SHORTENERS].some((domain) => hostname.includes(domain))) { score += 36; reasons.push('LOCAL_REPORT_MATCH'); indicators.push('LOCAL_REPORT_MATCH'); }

  if (!reasons.length) {
    score = 10; reasons.push('NO_MAJOR_TECHNICAL_RED_FLAGS'); indicators.push('NO_MAJOR_TECHNICAL_RED_FLAGS');
  }

  const threshold = scoreToLevel(score);
  const riskScore = clamp(Math.round(score), 0, 100);

  return {
    status: threshold.status,
    riskScore,
    riskLevel: threshold.riskLevel,
    confidence: riskScore,
    url: raw,
    normalizedUrl: normalized,
    hostname,
    reasons: [...new Set(reasons)],
    indicators: [...new Set(indicators)],
    recommendedAction: riskScore >= 45 ? 'Do not open this link or submit personal or financial information. Verify the website through its official app or domain.' : 'Check the full URL carefully and verify it through an official source before opening it.',
    source: 'local rules' + (riskScore >= 80 ? ' + database reports' : ''),
  };
}

export function analyzeMessage(message) {
  const text = String(message || '').trim();
  if (!text) {
    return {
      status: 'low-risk',
      riskScore: 0,
      riskLevel: 'Low Risk',
      confidence: 0,
      message: '',
      reasons: ['EMPTY_INPUT'],
      indicators: [],
      suspiciousLinks: [],
      recommendedAction: 'Enter a message to analyze it.',
      source: 'local rules',
    };
  }

  const patterns = [
    ['OTP_REQUEST', 30, /\b(send|share|give|provide|forward|enter|submit|tell)\b.{0,60}\b(otp|one[- ]time password|verification code|security code)\b/i],
    ['UPI_PIN_REQUEST', 38, /\b(send|share|give|provide|enter|submit|verify)\b.{0,60}\b(upi\s*pin|pin\s*(number|code)?)\b/i],
    ['PASSWORD_REQUEST', 32, /\b(send|share|give|provide|enter|submit)\b.{0,60}\b(password|passcode|login credentials|account password)\b/i],
    ['BANK_INFO_REQUEST', 28, /\b(send|share|give|confirm|verify|enter)\b.{0,80}\b(bank account|account number|debit card|credit card|card number|cvv|ifsc)\b/i],
    ['PAYMENT_REQUEST', 28, /\b(send money|transfer money|pay now|make payment|pay immediately|deposit|processing fee|refund fee|registration fee|upi payment)\b/i],
    ['URGENT_LANGUAGE', 12, /\b(urgent|urgently|immediately|act now|right now|do not delay|today only|expires today|last chance|within \d+\s*(minute|minutes|hour|hours))\b/i],
    ['THREAT_LANGUAGE', 18, /\b(account will be blocked|account blocked|suspended|police case|legal action|fine|penalty|arrest|service will be stopped)\b/i],
    ['PRIZE_SCAM', 24, /\b(you have won|you won|lottery|lucky winner|cash prize|free prize|claim your prize|reward)\b/i],
    ['KYC_SCAM', 18, /\b(update|complete|verify|confirm)\b.{0,30}\b(kyc|identity verification|account verification)\b/i],
    ['DELIVERY_SCAM', 22, /\b(parcel|package|delivery|courier|shipment|tracking)\b.{0,80}\b(pay|fee|click|link|verify|update address)\b/i],
    ['REMOTE_ACCESS_REQUEST', 36, /\b(install|download|use|share)\b.{0,50}\b(anydesk|teamviewer|remote desktop|screen sharing|screen share|remote access)\b/i],
    ['IMPERSONATION', 18, /\b(bank|police|income tax|government|customs|courier|customer care|support team|security team|official)\b.{0,70}\b(verify|confirm|pay|send|share|click|login|update)\b/i],
    ['JOB_SCAM', 20, /\b(work from home|part[- ]time job|easy money|daily income|guaranteed income|job offer|earn\s*₹?\$?\d+)\b/i],
    ['SUSPICIOUS_LINK', 10, /\b(click|tap|open|visit|follow|login|sign in|verify|update)\b.{0,50}\b(link|url|website|page)\b/i],
  ];

  const urls = extractUrls(text);
  let score = 0;
  const indicators = [];
  const reasons = [];

  for (const [code, weight, pattern] of patterns) {
    if (pattern.test(text)) {
      score += weight;
      indicators.push(code);
      reasons.push(code);
    }
  }

  for (const url of urls) {
    const urlResult = analyzeUrl(url);
    if (urlResult.riskScore >= 40) {
      score += Math.min(25, Math.round(urlResult.riskScore / 2));
      indicators.push('SUSPICIOUS_LINK');
      reasons.push('SUSPICIOUS_LINK');
    }
    if (/bit\.ly|tinyurl|shorturl|is\.gd|goo\.gl|t\.co/i.test(url)) {
      score += 15; indicators.push('SHORTENED_URL'); reasons.push('SHORTENED_URL');
    }
  }

  if (/\b(send|share|give|provide|tell|enter|submit|forward|reply|confirm|verify)\b.{0,80}\b(otp|verification code|upi pin|password|cvv|bank account|card number|account number)\b/i.test(text) && /\b(urgent|immediately|act now|right now|today only|do not delay)\b/i.test(text)) {
    score += 16; indicators.push('SENSITIVE_INFO_WITH_URGENCY'); reasons.push('SENSITIVE_INFO_WITH_URGENCY');
  }

  if (indicators.length >= 3) score += 10;

  if (!reasons.length) {
    score = 8; reasons.push('NO_MAJOR_RISK_INDICATORS'); indicators.push('NO_MAJOR_RISK_INDICATORS');
  }

  const riskScore = clamp(Math.round(score), 0, 100);
  const threshold = scoreToLevel(riskScore);

  return {
    status: threshold.status,
    riskScore,
    riskLevel: threshold.riskLevel,
    confidence: riskScore,
    message: text,
    reasons: [...new Set(reasons)],
    indicators: [...new Set(indicators)],
    suspiciousLinks: urls,
    recommendedAction: riskScore >= 50 ? 'Do not share OTPs, passwords, UPI PINs, or payment details. Verify the sender through an official channel before responding.' : 'Pause before taking action. Verify the source independently and avoid sharing sensitive information.',
    source: 'local rules' + (riskScore >= 80 ? ' + url analysis' : ''),
  };
}

export function reportScam(reportType, value, reason = 'User report', riskLevel = 'Unverified', riskScore = 0) {
  return {
    reportType,
    value: String(value || '').trim(),
    normalizedValue: reportType === 'phone' ? normalizePhoneNumber(value) : String(value || '').trim(),
    reason,
    riskLevel,
    riskScore: Number(riskScore || 0),
    stored: true,
  };
}
