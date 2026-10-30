from __future__ import annotations

import math
import re
from typing import Dict, List, Tuple

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline
except Exception:  # pragma: no cover
    TfidfVectorizer = None
    LogisticRegression = None
    Pipeline = None


def extract_url_features(url: str) -> Dict[str, object]:
    value = (url or '').strip()
    if not value:
        return {
            'url_length': 0,
            'domain_length': 0,
            'dot_count': 0,
            'subdomain_count': 0,
            'has_https': False,
            'has_ip': False,
            'has_at': False,
            'has_shortener': False,
            'special_char_count': 0,
            'hyphen_count': 0,
            'keyword_hits': [],
            'path_length': 0,
            'query_length': 0,
        }

    parsed = value.lower()
    domain_match = re.search(r'https?://([^/]+)', parsed)
    domain = domain_match.group(1) if domain_match else parsed
    path = parsed.split('/', 3)
    path_string = '/' + '/'.join(path[3:]) if len(path) > 3 else ''
    query = re.search(r'\?(.+)', parsed)
    dots = parsed.count('.')
    subdomains = len(re.findall(r'\.', domain))
    special_chars = sum(ch in value for ch in ['@', '%', '_', '~', '=', '&', '?'])
    hyphen_count = value.count('-')
    suspicious_keywords = [
        'login', 'verify', 'update', 'secure', 'bank', 'otp', 'confirm', 'urgent', 'claim',
        'reward', 'lottery', 'win', 'free', 'click', 'suspend', 'account'
    ]
    keyword_hits = [kw for kw in suspicious_keywords if kw in parsed]
    has_https = parsed.startswith('https://')
    has_ip = bool(re.search(r'\b\d{1,3}(?:\.\d{1,3}){3}\b', parsed))
    has_shortener = any(token in parsed for token in ['bit.ly', 'tinyurl', 'goo.gl', 'shorturl', 't.co'])
    has_at = '@' in value
    return {
        'url_length': len(value),
        'domain_length': len(domain),
        'dot_count': dots,
        'subdomain_count': subdomains,
        'has_https': has_https,
        'has_ip': has_ip,
        'has_at': has_at,
        'has_shortener': has_shortener,
        'special_char_count': special_chars,
        'hyphen_count': hyphen_count,
        'keyword_hits': keyword_hits,
        'path_length': len(path_string),
        'query_length': len(query.group(1)) if query else 0,
    }


TRAINING_URLS: List[Tuple[str, int]] = [
    ('https://bankofindia.com/login', 0),
    ('https://www.example.com/products', 0),
    ('https://secure-payments.example.org/confirm', 1),
    ('https://shorturl.at/abc123', 1),
    ('http://125.32.45.11/login', 1),
    ('https://banksecure-login.net/verify', 1),
    ('https://www.google.com', 0),
    ('https://official-service.example.com/account', 0),
    ('https://bit.ly/free-reward', 1),
    ('https://claim-your-prize-now.xyz', 1),
]


def train_model():
    if TfidfVectorizer is None or LogisticRegression is None or Pipeline is None:
        return None

    texts = [url for url, _ in TRAINING_URLS]
    labels = [label for _, label in TRAINING_URLS]
    pipeline = Pipeline([
        ('tfidf', TfidfVectorizer(analyzer='char', ngram_range=(2, 4))),
        ('clf', LogisticRegression(max_iter=1000, solver='liblinear')),
    ])
    pipeline.fit(texts, labels)
    return pipeline


MODEL = train_model()


def analyze_url(url: str) -> Dict[str, object]:
    value = (url or '').strip()
    if not value:
        return {
            'risk_level': 'Unable to determine',
            'risk_score': 0,
            'is_suspicious': False,
            'reasons': ['Please enter a website address.'],
        }

    try:
        features = extract_url_features(value)
        reasons: List[str] = []
        score = 0

        if not value.startswith('http://') and not value.startswith('https://'):
            reasons.append('The address is missing an http or https prefix.')
            score += 25
        if not features['has_https']:
            reasons.append('This URL does not use HTTPS.')
            score += 18
        if features['url_length'] > 80:
            reasons.append('The URL is unusually long.')
            score += 16
        if features['dot_count'] > 4:
            reasons.append('The URL contains too many dots and may be misleading.')
            score += 14
        if features['has_ip']:
            reasons.append('The URL uses an IP address instead of a normal domain name.')
            score += 22
        if features['has_at']:
            reasons.append('The URL contains an @ symbol, which is often used for misleading links.')
            score += 20
        if features['has_shortener']:
            reasons.append('The URL looks like a shortened link.')
            score += 18
        if features['hyphen_count'] > 3:
            reasons.append('The URL has an unusual number of hyphens.')
            score += 12
        if features['keyword_hits']:
            reasons.append('The URL contains suspicious keywords such as login, secure, or verify.')
            score += 18
        if features['query_length'] > 50:
            reasons.append('The URL has a long query string, which can be used to hide tracking or phishing content.')
            score += 10
        if features['special_char_count'] > 2:
            reasons.append('The URL includes several unusual symbols.')
            score += 12

        if not reasons:
            reasons = ['No obvious phishing indicators detected.']
            score = 15
        else:
            score = min(100, max(0, score))

        if MODEL is not None:
            prediction = MODEL.predict([value])[0]
            if prediction == 1:
                score = min(100, score + 20)
                reasons.insert(0, 'The URL pattern matches common phishing behavior.')

        if score >= 75:
            risk_level = 'High'
            suspicious = True
        elif score >= 40:
            risk_level = 'Medium'
            suspicious = True
        elif score >= 20:
            risk_level = 'Low'
            suspicious = False
        else:
            risk_level = 'Low'
            suspicious = False

        if score < 25 and not reasons:
            reasons = ['No obvious phishing indicators detected.']

        # Avoid claiming certainty when evidence is weak.
        if score <= 30 and 'No obvious phishing indicators detected.' in reasons:
            risk_level = 'Low'
            suspicious = False

        return {
            'risk_level': risk_level,
            'risk_score': int(score),
            'is_suspicious': bool(suspicious),
            'reasons': reasons[:5],
        }
    except Exception:
        return {
            'risk_level': 'Unable to determine',
            'risk_score': 0,
            'is_suspicious': False,
            'reasons': ['The system could not analyze this address. Please verify it manually.'],
        }

