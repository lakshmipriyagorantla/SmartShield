// src/services/spamDetectionService.js

const normalizePhone = (value = '') =>
  String(value).replace(/\D/g, '')

const formatPhone = (value = '') => {
  const digits = normalizePhone(value)

  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
  }

  if (digits.length === 12 && digits.startsWith('91')) {
    return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
  }

  return value
}

// Numbers used only for the local/demo detector.
// These should NOT be treated as a real-world database.
const knownScamNumbers = new Set([
  '919000011111',
  '917000000000',
  '919999999999',
])

const knownSuspiciousNumbers = new Set([
  '918000000000',
  '919000000000',
])

function isIndianMobileNumber(digits) {
  // 10-digit Indian mobile number
  if (digits.length === 10) {
    return /^[6-9]\d{9}$/.test(digits)
  }

  // +91XXXXXXXXXX
  if (digits.length === 12 && digits.startsWith('91')) {
    return /^91[6-9]\d{9}$/.test(digits)
  }

  return false
}

function getNationalNumber(digits) {
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2)
  }

  return digits
}

function hasRepeatedDigits(digits) {
  return /^(\d)\1+$/.test(digits)
}

function hasLongRepeatedSequence(digits) {
  return /(\d)\1{4,}/.test(digits)
}

function hasSequentialPattern(digits) {
  const numbers = digits.split('').map(Number)

  let increasing = true
  let decreasing = true

  for (let i = 1; i < numbers.length; i += 1) {
    if (numbers[i] !== numbers[i - 1] + 1) {
      increasing = false
    }

    if (numbers[i] !== numbers[i - 1] - 1) {
      decreasing = false
    }
  }

  return increasing || decreasing
}

function createResult({
  phoneNumber,
  status,
  riskScore,
  riskLabel,
  reasons,
  recommendedAction,
  whatHappened,
}) {
  return {
    phoneNumber,
    normalizedNumber: normalizePhone(phoneNumber),
    formattedNumber: formatPhone(phoneNumber),

    status,

    // Keep confidence because ScamDetector.jsx already expects it.
    confidence: riskScore,

    // New, clearer name.
    riskScore,

    riskLabel,
    reasons,
    recommendedAction,
    whatHappened,

    checkedAt: new Date().toISOString(),

    // Important: local analysis is not proof of identity.
    source: 'Smart Shield local analysis',
  }
}

export function checkPhoneNumber(phoneNumber) {
  const original = String(phoneNumber || '').trim()
  const digits = normalizePhone(original)

  // -----------------------------
  // 1. Empty input
  // -----------------------------

  if (!digits) {
    return createResult({
      phoneNumber: '',
      status: 'unknown',
      riskScore: 0,
      riskLabel: 'No number entered',
      reasons: ['Please enter a phone number before checking it.'],
      recommendedAction:
        'Enter the phone number you want Smart Shield to analyze.',
      whatHappened:
        'There is no phone number available to analyze.',
    })
  }

  // -----------------------------
  // 2. Basic format validation
  // -----------------------------

  if (digits.length < 10 || digits.length > 15) {
    return createResult({
      phoneNumber: original,
      status: 'unknown',
      riskScore: 20,
      riskLabel: 'Invalid / incomplete number',
      reasons: [
        'The number does not contain a normal number of digits.',
      ],
      recommendedAction:
        'Check the phone number and enter it again, including the country code if necessary.',
      whatHappened:
        'The number format could not be validated.',
    })
  }

  const nationalNumber = getNationalNumber(digits)

  // -----------------------------
  // 3. Obvious fake patterns
  // -----------------------------

  if (hasRepeatedDigits(nationalNumber)) {
    return createResult({
      phoneNumber: original,
      status: 'suspicious',
      riskScore: 88,
      riskLabel: 'Highly suspicious pattern',
      reasons: [
        'The number consists of the same digit repeated.',
        'This is commonly used as a test, placeholder, or demo number.',
      ],
      recommendedAction:
        'Do not treat this number as a verified caller. Confirm the caller through an independent trusted source.',
      whatHappened:
        'The number contains an obvious repeated-digit pattern.',
    })
  }

  if (hasLongRepeatedSequence(nationalNumber)) {
    return createResult({
      phoneNumber: original,
      status: 'suspicious',
      riskScore: 82,
      riskLabel: 'Suspicious pattern',
      reasons: [
        'The number contains a long repeated-digit sequence.',
        'This pattern can occur in placeholder or suspicious numbers.',
      ],
      recommendedAction:
        'Verify the caller independently before sharing personal, financial, or OTP information.',
      whatHappened:
        'The number contains an unusual repeated-digit pattern.',
    })
  }

  if (hasSequentialPattern(nationalNumber)) {
    return createResult({
      phoneNumber: original,
      status: 'suspicious',
      riskScore: 80,
      riskLabel: 'Suspicious pattern',
      reasons: [
        'The number contains a completely sequential digit pattern.',
        'Sequential numbers are commonly used for testing or placeholders.',
      ],
      recommendedAction:
        'Do not assume the caller is legitimate. Verify the number independently.',
      whatHappened:
        'The number follows an unusual sequential pattern.',
    })
  }

  // -----------------------------
  // 4. Local Smart Shield watchlist
  // -----------------------------

  if (knownScamNumbers.has(digits)) {
    return createResult({
      phoneNumber: original,
      status: 'scam',
      riskScore: 98,
      riskLabel: 'Reported / high risk',
      reasons: [
        'This number matches a number in the Smart Shield local scam watchlist.',
        'The number should not be trusted for sensitive requests.',
      ],
      recommendedAction:
        'Do not share OTPs, UPI PINs, passwords, banking information, or send money. Verify the organization using its official contact information.',
      whatHappened:
        'The number matched a locally stored high-risk entry.',
    })
  }

  if (knownSuspiciousNumbers.has(digits)) {
    return createResult({
      phoneNumber: original,
      status: 'suspicious',
      riskScore: 78,
      riskLabel: 'Suspicious',
      reasons: [
        'This number matches a number in the Smart Shield local suspicious-number list.',
      ],
      recommendedAction:
        'Be careful with calls from this number. Do not provide OTPs, PINs, passwords, or banking information.',
      whatHappened:
        'The number matched a locally stored suspicious entry.',
    })
  }

  // -----------------------------
  // 5. Indian mobile validation
  // -----------------------------

  const indianMobile = isIndianMobileNumber(digits)

  if (!indianMobile) {
    return createResult({
      phoneNumber: original,
      status: 'unknown',
      riskScore: 45,
      riskLabel: 'Unverified number',
      reasons: [
        'The number could not be confirmed as a normal Indian mobile number.',
        'A valid-looking number does not prove that the caller is trustworthy.',
      ],
      recommendedAction:
        'Verify the number through an official website, app, or other trusted source before sharing sensitive information.',
      whatHappened:
        'The number format is not a standard Indian mobile format.',
    })
  }

  // -----------------------------
  // 6. Normal-looking number
  // -----------------------------

  return createResult({
    phoneNumber: original,
    status: 'unknown',
    riskScore: 30,
    riskLabel: 'Unverified',
    reasons: [
      'The number has a valid-looking Indian mobile format.',
      'No local Smart Shield scam record was found for this number.',
      'A valid format does not prove that the caller is genuine.',
    ],
    recommendedAction:
      'Verify the caller independently before sharing OTPs, UPI PINs, passwords, banking information, or sending money.',
    whatHappened:
      'The number looks structurally valid, but Smart Shield does not have enough evidence to confirm the identity of the caller.',
  })
}

export function reportPhoneNumber(phoneNumber, reason = 'Scam') {
  const result = checkPhoneNumber(phoneNumber)

  return {
    ...result,
    reportReason: reason,
    reportSaved: true,

    note:
      'This report is currently stored locally for the website demo. Connect it to the backend database to make reports persistent.',
  }
}

export function getPhoneNumberReputation(phoneNumber) {
  return checkPhoneNumber(phoneNumber)
}