import re
from typing import Any, Dict, Iterable, List, Tuple
from urllib.parse import urlparse

LOCAL_REPORTS = {
    'phone': {'919000011111', '917000000000', '919999999999'},
    'message': {'bank', 'otp', 'upi', 'login'},
    'url': {'bit.ly', 'tinyurl.com', 'shorturl.at', 'is.gd', 'goo.gl', 't.co'},
}

SUSPICIOUS_TLDS = {'.xyz', '.top', '.click', '.shop', '.online', '.club', '.bid'}
SHORTENERS = {'bit.ly', 'tinyurl.com', 'shorturl.at', 'is.gd', 'goo.gl', 't.co', 'cutt.ly', 'rb.gy'}
SUSPICIOUS_KEYWORDS = {
    'login', 'verify', 'secure', 'update', 'account', 'bank', 'kyc', 'otp', 'password', 'payment',
    'wallet', 'refund', 'claim', 'prize', 'reward', 'support', 'delivery', 'courier', 'tax', 'police'
}


def clamp(value: int, minimum: int = 0, maximum: int = 100) -> int:
    return max(minimum, min(maximum, value))


def score_to_level(score: int) -> Dict[str, Any]:
    if score >= 80:
        return {'status': 'very-high-risk', 'riskLevel': 'Very High Risk / Possible Scam'}
    if score >= 60:
        return {'status': 'high-risk', 'riskLevel': 'High Risk'}
    if score >= 40:
        return {'status': 'suspicious', 'riskLevel': 'Suspicious'}
    if score >= 20:
        return {'status': 'unverified', 'riskLevel': 'Unverified'}
    return {'status': 'low-risk', 'riskLevel': 'Low Risk'}


def normalize_phone_number(value: str) -> str:
    text = str(value or '').strip()
    digits = ''.join(ch for ch in text if ch.isdigit())
    if not digits:
        return ''
    if len(digits) == 12 and digits.startswith('91'):
        return digits
    if len(digits) == 10:
        return f'91{digits}'
    return digits


def get_phone_indicators(number: str) -> List[str]:
    digits = ''.join(ch for ch in number if ch.isdigit())
    national_digits = digits[2:] if len(digits) == 12 and digits.startswith('91') else digits
    indicators: List[str] = []
    if len(digits) < 10 or len(digits) > 15:
        indicators.append('INVALID_LENGTH')
    if len(set(national_digits)) == 1:
        indicators.append('REPEATED_DIGITS')
    if re.search(r'(\d)\1{4,}', national_digits):
        indicators.append('LONG_REPEATED_SEQUENCE')
    if national_digits in {'0123456789', '1234567890', '9876543210'}:
        indicators.append('SEQUENTIAL_DIGITS')
    if not re.fullmatch(r'91[6-9]\d{9}|[6-9]\d{9}', digits):
        indicators.append('UNUSUAL_FORMAT')
    if any(d in digits for d in ('0000000000', '1111111111', '9999999999')):
        indicators.append('DEMO_OR_PLACEHOLDER_NUMBER')
    if digits in LOCAL_REPORTS['phone']:
        indicators.append('LOCAL_REPORT_MATCH')
    return list(dict.fromkeys(indicators))


def analyze_phone_number(number: str) -> Dict[str, Any]:
    raw = str(number or '').strip()
    digits = ''.join(ch for ch in raw if ch.isdigit())
    normalized_number = normalize_phone_number(raw)

    if not raw or not digits:
        result = {
            'status': 'low-risk',
            'riskScore': 0,
            'risk_score': 0,
            'riskLevel': 'Low Risk',
            'risk_level': 'Low Risk',
            'confidence': 0,
            'phoneNumber': raw,
            'normalizedNumber': '',
            'reasons': ['EMPTY_INPUT'],
            'reasonKeys': ['EMPTY_INPUT'],
            'indicators': [],
            'recommendedAction': 'Enter a phone number to check it.',
            'source': 'local rules',
        }
        return result

    if len(digits) < 10 or len(digits) > 15:
        score = 25
        result = {
            'status': 'unverified',
            'riskScore': score,
            'risk_score': score,
            'riskLevel': 'Unverified',
            'risk_level': 'Unverified',
            'confidence': score,
            'phoneNumber': raw,
            'normalizedNumber': digits,
            'reasons': ['INVALID_LENGTH'],
            'reasonKeys': ['INVALID_LENGTH'],
            'indicators': ['INVALID_LENGTH'],
            'recommendedAction': 'Check the number format and verify it through an official source.',
            'source': 'local rules',
        }
        return result

    score = 12
    indicators = []
    reasons: List[str] = []
    national_digits = digits[2:] if len(digits) == 12 and digits.startswith('91') else digits

    if len(set(national_digits)) == 1:
        score += 48
        indicators.append('REPEATED_DIGITS')
        reasons.append('REPEATED_DIGITS')
    if re.search(r'(\d)\1{4,}', national_digits):
        score += 22
        indicators.append('LONG_REPEATED_SEQUENCE')
        reasons.append('LONG_REPEATED_SEQUENCE')
    if national_digits in {'0123456789', '1234567890', '9876543210'}:
        score += 28
        indicators.append('SEQUENTIAL_DIGITS')
        reasons.append('SEQUENTIAL_DIGITS')
    if not re.fullmatch(r'91[6-9]\d{9}|[6-9]\d{9}', digits):
        score += 15
        indicators.append('UNUSUAL_FORMAT')
        reasons.append('UNUSUAL_FORMAT')
    if digits in LOCAL_REPORTS['phone']:
        score += 60
        indicators.append('LOCAL_REPORT_MATCH')
        reasons.append('LOCAL_REPORT_MATCH')

    if not reasons:
        score = 18
        reasons = ['VALID_FORMAT_NO_EVIDENCE']
        indicators = ['VALID_FORMAT_NO_EVIDENCE']

    level = score_to_level(score)
    score = clamp(int(score), 0, 100)

    reason_keys = list(dict.fromkeys(reasons))
    result = {
        'status': level['status'],
        'riskScore': score,
        'risk_score': score,
        'riskLevel': level['riskLevel'],
        'risk_level': level['riskLevel'],
        'confidence': score,
        'phoneNumber': raw,
        'normalizedNumber': normalized_number,
        'reasons': reason_keys,
        'reasonKeys': reason_keys,
        'indicators': list(dict.fromkeys(indicators)),
        'recommendedAction': (
            'Do not share OTPs, UPI PINs, passwords, or banking details until the caller is verified independently.'
            if score >= 40 else 'Verify the caller through an official source before sharing personal or payment information.'
        ),
        'source': 'local rules' if score < 80 else 'local rules + database reports',
    }
    return result


def extract_urls(text: str) -> List[str]:
    if not text:
        return []
    matches = re.findall(r'https?://[^\s)\]>"\']+|www\.[^\s)\]>"\']+', text, flags=re.IGNORECASE)
    cleaned = []
    for url in matches:
        while url and url[-1] in '.,;!?)]}>':
            url = url[:-1]
        cleaned.append(url)
    return cleaned


def normalize_url(value: str) -> str:
    text = str(value or '').strip()
    if not text:
        return ''
    if re.match(r'^https?://', text, flags=re.IGNORECASE):
        return text
    if text.startswith('www.'):
        return f'https://{text}'
    return f'https://{text}'


def analyze_url(url: str) -> Dict[str, Any]:
    raw = str(url or '').strip()
    if not raw:
        return {
            'status': 'low-risk',
            'riskScore': 0,
            'risk_score': 0,
            'riskLevel': 'Low Risk',
            'risk_level': 'Low Risk',
            'confidence': 0,
            'url': '',
            'normalizedUrl': '',
            'hostname': '',
            'reasons': ['EMPTY_INPUT'],
            'reasonKeys': ['EMPTY_INPUT'],
            'indicators': [],
            'recommendedAction': 'Enter a website or link to analyze it.',
            'source': 'local rules',
        }

    normalized = normalize_url(raw)
    try:
        parsed = urlparse(normalized)
        hostname = (parsed.hostname or '').lower()
    except Exception:
        hostname = ''

    if not hostname:
        score = 25
        return {
            'status': 'unverified',
            'riskScore': score,
            'risk_score': score,
            'riskLevel': 'Unverified',
            'risk_level': 'Unverified',
            'confidence': score,
            'url': raw,
            'normalizedUrl': normalized,
            'hostname': hostname,
            'reasons': ['INVALID_URL'],
            'reasonKeys': ['INVALID_URL'],
            'indicators': ['INVALID_URL'],
            'recommendedAction': 'Check the URL for typos or a missing domain before opening it.',
            'source': 'local rules',
        }

    score = 8
    reasons: List[str] = []
    indicators: List[str] = []
    hostname_for_check = hostname.replace('www.', '')
    root_domain = '.'.join(hostname_for_check.split('.')[-2:]) if '.' in hostname_for_check else hostname_for_check
    path = parsed.path.lower()
    query = parsed.query.lower()
    full = f'{normalized} {path} {query}'.lower()

    if parsed.scheme.lower() != 'https':
        score += 18
        reasons.append('HTTP_INSTEAD_OF_HTTPS')
        indicators.append('HTTP_INSTEAD_OF_HTTPS')
    if re.search(r'\b\d{1,3}(?:\.\d{1,3}){3}\b', hostname):
        score += 28
        reasons.append('IP_ADDRESS_INSTEAD_OF_DOMAIN')
        indicators.append('IP_ADDRESS_INSTEAD_OF_DOMAIN')
    if root_domain in SHORTENERS or any(domain in hostname for domain in SHORTENERS):
        score += 26
        reasons.append('SHORTENED_URL')
        indicators.append('SHORTENED_URL')
    if any(hostname.endswith(tld) for tld in SUSPICIOUS_TLDS):
        score += 18
        reasons.append('SUSPICIOUS_TLD')
        indicators.append('SUSPICIOUS_TLD')
    if len(hostname) > 30 or len(normalized) > 180:
        score += 16
        reasons.append('UNUSUALLY_LONG_URL')
        indicators.append('UNUSUALLY_LONG_URL')
    if '://' in normalized and '@' in normalized:
        score += 18
        reasons.append('URL_USERNAME_TRICK')
        indicators.append('URL_USERNAME_TRICK')
    if 'login' in hostname or 'login' in path or 'verify' in hostname or 'verify' in path or 'otp' in hostname or 'otp' in path:
        score += 18
        reasons.append('HIGH_RISK_PAGE_TYPE')
        indicators.append('HIGH_RISK_PAGE_TYPE')
    if any(keyword in full for keyword in ('login', 'verify', 'kyc', 'otp', 'password', 'bank', 'payment', 'secure')):
        score += 8
        reasons.append('SUSPICIOUS_KEYWORDS')
        indicators.append('SUSPICIOUS_KEYWORDS')
    if hostname.count('.') >= 4 or 'xn--' in hostname:
        score += 16
        reasons.append('LOOKALIKE_OR_EXCESSIVE_SUBDOMAINS')
        indicators.append('LOOKALIKE_OR_EXCESSIVE_SUBDOMAINS')
    if len(parsed.query) > 60:
        score += 10
        reasons.append('LONG_QUERY_STRING')
        indicators.append('LONG_QUERY_STRING')
    if re.search(r'(?:\b(?:login|verify|otp|payment|secure|bank|kyc|account)\b)', path):
        score += 10
        reasons.append('SENSITIVE_PATH_PATTERN')
        indicators.append('SENSITIVE_PATH_PATTERN')
    if 'localhost' not in hostname and not any(brand in hostname for brand in ('google', 'microsoft', 'apple', 'amazon', 'paytm', 'phonepe', 'sbi', 'hdfc')) and any(word in hostname for word in ('secure', 'bank', 'login', 'verify', 'account', 'payment')):
        score += 22
        reasons.append('BRAND_IMPERSONATION_RISK')
        indicators.append('BRAND_IMPERSONATION_RISK')

    if any(domain in hostname for domain in LOCAL_REPORTS['url']):
        score += 36
        reasons.append('LOCAL_REPORT_MATCH')
        indicators.append('LOCAL_REPORT_MATCH')

    if not reasons:
        score = 10
        reasons = ['NO_MAJOR_TECHNICAL_RED_FLAGS']
        indicators = ['NO_MAJOR_TECHNICAL_RED_FLAGS']

    score = clamp(int(score), 0, 100)
    level = score_to_level(score)

    reason_keys = list(dict.fromkeys(reasons))
    return {
        'status': level['status'],
        'riskScore': score,
        'risk_score': score,
        'riskLevel': level['riskLevel'],
        'risk_level': level['riskLevel'],
        'confidence': score,
        'url': raw,
        'normalizedUrl': normalized,
        'hostname': hostname,
        'reasons': reason_keys,
        'reasonKeys': reason_keys,
        'indicators': list(dict.fromkeys(indicators)),
        'recommendedAction': (
            'Do not open this link or submit personal or financial information. Verify the website through its official app or domain.'
            if score >= 45 else 'Check the full URL carefully and verify it through an official source before opening it.'
        ),
        'source': 'local rules' if score < 80 else 'local rules + database reports',
    }


def analyze_message(message: str) -> Dict[str, Any]:
    text = str(message or '').strip()
    if not text:
        return {
            'status': 'low-risk',
            'riskScore': 0,
            'risk_score': 0,
            'riskLevel': 'Low Risk',
            'risk_level': 'Low Risk',
            'confidence': 0,
            'message': '',
            'reasons': ['EMPTY_INPUT'],
            'reasonKeys': ['EMPTY_INPUT'],
            'indicators': [],
            'suspiciousLinks': [],
            'recommendedAction': 'Enter a message to analyze it.',
            'source': 'local rules',
        }

    normalized = text.lower()
    urls = extract_urls(text)
    rules: List[Tuple[str, int, re.Pattern[str]]] = [
        ('OTP_REQUEST', 30, re.compile(r'\b(send|share|give|provide|forward|enter|submit|tell)\b.{0,60}\b(otp|one[- ]time password|verification code|security code)\b', re.I)),
        ('UPI_PIN_REQUEST', 38, re.compile(r'\b(send|share|give|provide|enter|submit|verify)\b.{0,60}\b(upi\s*pin|pin\s*(number|code)?)\b', re.I)),
        ('PASSWORD_REQUEST', 32, re.compile(r'\b(send|share|give|provide|enter|submit)\b.{0,60}\b(password|passcode|login credentials|account password)\b', re.I)),
        ('BANK_INFO_REQUEST', 28, re.compile(r'\b(send|share|give|confirm|verify|enter)\b.{0,80}\b(bank account|account number|debit card|credit card|card number|cvv|ifsc)\b', re.I)),
        ('PAYMENT_REQUEST', 28, re.compile(r'\b(send money|transfer money|pay now|make payment|pay immediately|deposit|processing fee|refund fee|registration fee|upi payment)\b', re.I)),
        ('URGENT_LANGUAGE', 12, re.compile(r'\b(urgent|urgently|immediately|act now|right now|do not delay|today only|expires today|last chance|within \d+\s*(minute|minutes|hour|hours))\b', re.I)),
        ('THREAT_LANGUAGE', 18, re.compile(r'\b(account will be blocked|account blocked|suspended|police case|legal action|fine|penalty|arrest|service will be stopped)\b', re.I)),
        ('PRIZE_SCAM', 24, re.compile(r'\b(you have won|you won|lottery|lucky winner|cash prize|free prize|claim your prize|reward)\b', re.I)),
        ('KYC_SCAM', 18, re.compile(r'\b(update|complete|verify|confirm)\b.{0,30}\b(kyc|identity verification|account verification)\b', re.I)),
        ('DELIVERY_SCAM', 22, re.compile(r'\b(parcel|package|delivery|courier|shipment|tracking)\b.{0,80}\b(pay|fee|click|link|verify|update address)\b', re.I)),
        ('REMOTE_ACCESS_REQUEST', 36, re.compile(r'\b(install|download|use|share)\b.{0,50}\b(anydesk|teamviewer|remote desktop|screen sharing|screen share|remote access)\b', re.I)),
        ('IMPERSONATION', 18, re.compile(r'\b(bank|police|income tax|government|customs|courier|customer care|support team|security team|official)\b.{0,70}\b(verify|confirm|pay|send|share|click|login|update)\b', re.I)),
        ('JOB_SCAM', 20, re.compile(r'\b(work from home|part[- ]time job|easy money|daily income|guaranteed income|job offer|earn\s*₹?\$?\d+)\b', re.I)),
        ('SUSPICIOUS_LINK', 10, re.compile(r'\b(click|tap|open|visit|follow|login|sign in|verify|update)\b.{0,50}\b(link|url|website|page)\b', re.I)),
    ]

    score = 0
    indicators: List[str] = []
    reasons: List[str] = []
    for code, weight, pattern in rules:
        if pattern.search(text):
            score += weight
            indicators.append(code)
            reasons.append(code)

    if urls:
        for url in urls:
            url_result = analyze_url(url)
            if url_result['riskScore'] >= 40:
                score += min(25, url_result['riskScore'] // 2)
                indicators.append('SUSPICIOUS_LINK')
                reasons.append('SUSPICIOUS_LINK')
            if 'bit.ly' in url.lower() or 'tinyurl' in url.lower() or 'shorturl' in url.lower():
                score += 15
                indicators.append('SHORTENED_URL')
                reasons.append('SHORTENED_URL')

    sensitive_info_request = bool(re.search(r'\b(send|share|give|provide|tell|enter|submit|forward|reply|confirm|verify)\b.{0,80}\b(otp|verification code|upi pin|password|cvv|bank account|card number|account number)\b', text, re.I))
    if sensitive_info_request and re.search(r'\b(urgent|immediately|act now|right now|today only|do not delay)\b', text, re.I):
        score += 16
        indicators.append('SENSITIVE_INFO_WITH_URGENCY')
        reasons.append('SENSITIVE_INFO_WITH_URGENCY')

    if len(indicators) >= 3:
        score += 10

    score = clamp(int(score), 0, 100)
    level = score_to_level(score)

    if not reasons:
        reasons = ['NO_MAJOR_RISK_INDICATORS']
        indicators = ['NO_MAJOR_RISK_INDICATORS']

    reason_keys = list(dict.fromkeys(reasons))
    return {
        'status': level['status'],
        'riskScore': score,
        'risk_score': score,
        'riskLevel': level['riskLevel'],
        'risk_level': level['riskLevel'],
        'confidence': score,
        'message': text,
        'reasons': reason_keys,
        'reasonKeys': reason_keys,
        'indicators': list(dict.fromkeys(indicators)),
        'suspiciousLinks': urls,
        'recommendedAction': (
            'Do not share OTPs, passwords, UPI PINs, or payment details. Verify the sender through an official channel before responding.'
            if score >= 50 else 'Pause before taking action. Verify the source independently and avoid sharing sensitive information.'
        ),
        'source': 'local rules' if score < 80 else 'local rules + url analysis',
    }


def report_scam(report_type: str, value: str, reason: str = '', risk_level: str = '', risk_score: int = 0) -> Dict[str, Any]:
    item = str(value or '').strip()
    normalized = normalize_phone_number(item) if report_type == 'phone' else item
    return {
        'reportType': report_type,
        'value': item,
        'normalizedValue': normalized,
        'reason': reason or 'User report',
        'riskLevel': risk_level or 'Unverified',
        'riskScore': int(risk_score),
        'stored': True,
    }
