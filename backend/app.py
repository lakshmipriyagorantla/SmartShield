from __future__ import annotations

import json
import os
import re
import sqlite3
from threading import Lock
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List
from urllib import error as urllib_error
from urllib import parse as urllib_parse
from urllib import request as urllib_request

from flask import Flask, jsonify, request
from flask_cors import CORS

from backend.learning_content import LESSONS, QUIZZES, VIDEO_RECORDS, LOCAL_VIDEO_MAPPINGS
from backend.hindi_quiz_translations import HINDI_QUIZ_TEXT
from backend.telugu_quiz_translations import TELUGU_QUIZ_TEXT
from backend.ml.risk_engine import analyze_message, analyze_phone_number, analyze_url, report_scam


def load_local_env() -> None:
    env_path = Path(__file__).resolve().parent.parent / '.env'
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding='utf-8').splitlines():
        line = line.strip()
        if not line or line.startswith('#') or '=' not in line:
            continue
        key, value = line.split('=', 1)
        os.environ.setdefault(key.strip(), value.strip().strip("'\"").strip())


load_local_env()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = Path(
    os.environ.get('SMARTSHIELD_DB_PATH')
    or (
        Path('/tmp') / 'smart_shield.db'
        if os.environ.get('VERCEL') == '1'
        else BASE_DIR / 'smart_shield.db'
    )
)
_database_initialization_lock = Lock()
_database_initialized = False
REQUIRED_LEARNING_TABLES = {
    'users',
    'lessons',
    'lesson_progress',
    'quiz_sets',
    'quiz_set_questions',
    'quiz_attempts',
    'quiz_results',
}
SUPPORTED_LANGUAGES = {'en', 'hi', 'te'}

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def ensure_database() -> None:
    global _database_initialized
    if _database_initialized:
        return

    with _database_initialization_lock:
        if _database_initialized:
            return
        if not DB_PATH.exists():
            init_db()
        else:
            conn = sqlite3.connect(DB_PATH, timeout=30)
            try:
                tables = {
                    row[0] for row in conn.execute(
                        "SELECT name FROM sqlite_master WHERE type='table'"
                    ).fetchall()
                }
            finally:
                conn.close()
            if not REQUIRED_LEARNING_TABLES.issubset(tables) or 'video_tutorials' not in tables:
                init_db()

        migrate_learning_content()
        _database_initialized = True


def migrate_learning_content() -> None:
    conn = get_db_connection()
    try:
        conn.execute('PRAGMA foreign_keys = ON')
        existing_tables = {
            row[0] for row in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")
        }
        if 'lessons' not in existing_tables:
            conn.execute(
                '''
                CREATE TABLE lessons (
                    id TEXT PRIMARY KEY,
                    category TEXT NOT NULL,
                    difficulty TEXT,
                    title_en TEXT NOT NULL,
                    title_hi TEXT NOT NULL,
                    title_te TEXT NOT NULL,
                    description_en TEXT NOT NULL,
                    description_hi TEXT NOT NULL,
                    description_te TEXT NOT NULL,
                    video_url TEXT,
                    video_type TEXT,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                '''
            )
        if 'quiz_sets' not in existing_tables:
            conn.execute(
                '''
                CREATE TABLE quiz_sets (
                    id TEXT PRIMARY KEY,
                    title_en TEXT NOT NULL,
                    title_hi TEXT NOT NULL,
                    title_te TEXT NOT NULL,
                    description_en TEXT NOT NULL,
                    description_hi TEXT NOT NULL,
                    description_te TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );
                '''
            )
        if 'video_tutorials' not in existing_tables:
            conn.execute(
                '''
                CREATE TABLE video_tutorials (
                    id TEXT PRIMARY KEY,
                    category TEXT NOT NULL,
                    category_key TEXT NOT NULL,
                    title_en TEXT NOT NULL,
                    title_hi TEXT NOT NULL,
                    title_te TEXT NOT NULL,
                    description_en TEXT NOT NULL,
                    description_hi TEXT NOT NULL,
                    description_te TEXT NOT NULL,
                    video_url_en TEXT NOT NULL,
                    video_url_hi TEXT NOT NULL,
                    video_url_te TEXT NOT NULL,
                    thumbnail_url TEXT,
                    duration TEXT,
                    is_placeholder INTEGER NOT NULL DEFAULT 1,
                    related_quiz_set_id TEXT,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(related_quiz_set_id) REFERENCES quiz_sets(id)
                );
                '''
            )

        quiz_results_columns = {
            row[1] for row in conn.execute('PRAGMA table_info(quiz_results)')
        }
        if quiz_results_columns:
            foreign_keys = conn.execute(
                'PRAGMA foreign_key_list(quiz_results)'
            ).fetchall()
            uses_legacy_questions = any(
                row[2] == 'quiz_questions' and row[3] == 'question_id'
                for row in foreign_keys
            )
            if uses_legacy_questions:
                valid_results = conn.execute(
                    '''
                    SELECT qr.id, qr.user_id, qq.id, qr.answer, qr.correct, qr.submitted_at
                    FROM quiz_results qr
                    INNER JOIN quiz_set_questions qq
                      ON qq.id = qr.question_id
                    '''
                ).fetchall()
                conn.execute('ALTER TABLE quiz_results RENAME TO quiz_results_legacy')
                conn.execute(
                    '''
                    CREATE TABLE quiz_results (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id INTEGER NOT NULL,
                        question_id INTEGER NOT NULL,
                        answer TEXT NOT NULL,
                        correct INTEGER NOT NULL,
                        submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                        FOREIGN KEY(user_id) REFERENCES users(id),
                        FOREIGN KEY(question_id) REFERENCES quiz_set_questions(id)
                    )
                    '''
                )
                conn.executemany(
                    'INSERT INTO quiz_results (id, user_id, question_id, answer, correct, submitted_at) VALUES (?, ?, ?, ?, ?, ?)',
                    valid_results,
                )

        conn.executescript(
            '''
            CREATE TABLE IF NOT EXISTS quiz_sets (
                id TEXT PRIMARY KEY,
                title_en TEXT NOT NULL,
                title_hi TEXT NOT NULL,
                title_te TEXT NOT NULL,
                description_en TEXT NOT NULL,
                description_hi TEXT NOT NULL,
                description_te TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS quiz_set_questions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                quiz_set_id TEXT NOT NULL,
                question_en TEXT NOT NULL,
                question_hi TEXT NOT NULL,
                question_te TEXT NOT NULL,
                option_a_en TEXT NOT NULL,
                option_a_hi TEXT NOT NULL,
                option_a_te TEXT NOT NULL,
                option_b_en TEXT NOT NULL,
                option_b_hi TEXT NOT NULL,
                option_b_te TEXT NOT NULL,
                option_c_en TEXT NOT NULL,
                option_c_hi TEXT NOT NULL,
                option_c_te TEXT NOT NULL,
                option_d_en TEXT NOT NULL,
                option_d_hi TEXT NOT NULL,
                option_d_te TEXT NOT NULL,
                correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
                explanation_en TEXT NOT NULL,
                explanation_hi TEXT NOT NULL,
                explanation_te TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(quiz_set_id) REFERENCES quiz_sets(id)
            );

            CREATE TABLE IF NOT EXISTS quiz_attempts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                quiz_set_id TEXT NOT NULL,
                score INTEGER NOT NULL DEFAULT 0,
                total INTEGER NOT NULL DEFAULT 0,
                percentage INTEGER NOT NULL DEFAULT 0,
                completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(quiz_set_id) REFERENCES quiz_sets(id)
            );

            CREATE TABLE IF NOT EXISTS video_progress (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                video_id TEXT NOT NULL,
                watched INTEGER NOT NULL DEFAULT 0,
                completed_at TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES users(id),
                FOREIGN KEY(video_id) REFERENCES video_tutorials(id),
                UNIQUE(user_id, video_id)
            );

            CREATE TABLE IF NOT EXISTS video_tutorials (
                id TEXT PRIMARY KEY,
                category TEXT NOT NULL,
                category_key TEXT NOT NULL,
                title_en TEXT NOT NULL,
                title_hi TEXT NOT NULL,
                title_te TEXT NOT NULL,
                description_en TEXT NOT NULL,
                description_hi TEXT NOT NULL,
                description_te TEXT NOT NULL,
                video_url_en TEXT NOT NULL,
                video_url_hi TEXT NOT NULL,
                video_url_te TEXT NOT NULL,
                thumbnail_url TEXT,
                duration TEXT,
                is_placeholder INTEGER NOT NULL DEFAULT 1,
                related_quiz_set_id TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(related_quiz_set_id) REFERENCES quiz_sets(id)
            );
            '''
        )

        columns = {row[1] for row in conn.execute('PRAGMA table_info(lessons)')}
        for column in ('title_hi', 'description_hi'):
            if column not in columns:
                conn.execute(f'ALTER TABLE lessons ADD COLUMN {column} TEXT')

        existing_lessons = {row[0] for row in conn.execute('SELECT id FROM lessons')}
        new_lessons = [lesson for lesson in LESSONS if lesson[0] not in existing_lessons]
        conn.executemany(
            'INSERT INTO lessons (id, category, difficulty, title_en, title_hi, title_te, description_en, description_hi, description_te, video_url, video_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                (lesson_id, category, difficulty, title_en, title_hi, title_te, description_en, description_hi, description_te, '', 'none')
                for lesson_id, category, difficulty, title_en, title_hi, title_te, description_en, description_hi, description_te in new_lessons
            ],
        )

        existing_quiz_sets = {row[0] for row in conn.execute('SELECT id FROM quiz_sets')}
        for quiz in QUIZZES:
            set_id = quiz['slug']
            if set_id not in existing_quiz_sets:
                conn.execute(
                    'INSERT INTO quiz_sets (id, title_en, title_hi, title_te, description_en, description_hi, description_te) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    (set_id, quiz['title']['en'], quiz['title']['hi'], quiz['title']['te'], quiz['description']['en'], quiz['description']['hi'], quiz['description']['te']),
                )

        for quiz in QUIZZES:
            existing_question_count = conn.execute(
                'SELECT COUNT(*) FROM quiz_set_questions WHERE quiz_set_id = ?',
                (quiz['slug'],),
            ).fetchone()[0]
            if existing_question_count:
                continue

            questions = []
            for question in quiz['questions']:
                option_keys = ('A', 'B', 'C', 'D')
                options = question['options']
                row = [quiz['slug'], question['question']['en'], question['question']['hi'], question['question']['te']]
                for key in option_keys:
                    row.extend([options['en'][option_keys.index(key)], options['hi'][option_keys.index(key)], options['te'][option_keys.index(key)]])
                row.extend([question['correct'], question['explanation']['en'], question['explanation']['hi'], question['explanation']['te']])
                questions.append(row)
            conn.executemany(
                '''
                INSERT INTO quiz_set_questions (
                    quiz_set_id, question_en, question_hi, question_te,
                    option_a_en, option_a_hi, option_a_te,
                    option_b_en, option_b_hi, option_b_te,
                    option_c_en, option_c_hi, option_c_te,
                    option_d_en, option_d_hi, option_d_te,
                    correct_option, explanation_en, explanation_hi, explanation_te
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''',
                questions,
            )

        video_columns = {row[1] for row in conn.execute('PRAGMA table_info(video_tutorials)')}
        if 'related_quiz_set_id' not in video_columns:
            conn.execute('ALTER TABLE video_tutorials ADD COLUMN related_quiz_set_id TEXT')

        video_catalog = []
        seen = set()
        for record in VIDEO_RECORDS:
            if record[0] in seen:
                continue
            seen.add(record[0])
            video_catalog.append(record)

        catalog_rows = []
        for video in video_catalog:
            row = list(video)
            while len(row) < 15:
                row.append(None)
            video_id = row[0]
            if len(row) == 15:
                row.append('scams-phishing' if video_id in {'youtube-online-scams', 'youtube-online-scams-telugu'} else None)
            elif len(row) > 15:
                row[15] = 'scams-phishing' if video_id in {'youtube-online-scams', 'youtube-online-scams-telugu'} else row[15]
            catalog_rows.append(tuple(row[:16]))

        conn.executemany(
            '''
            INSERT INTO video_tutorials (
                id, category, category_key, title_en, title_hi, title_te,
                description_en, description_hi, description_te,
                video_url_en, video_url_hi, video_url_te, thumbnail_url,
                duration, is_placeholder, related_quiz_set_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                category = excluded.category,
                category_key = excluded.category_key,
                title_en = excluded.title_en,
                title_hi = excluded.title_hi,
                title_te = excluded.title_te,
                description_en = excluded.description_en,
                description_hi = excluded.description_hi,
                description_te = excluded.description_te,
                video_url_en = excluded.video_url_en,
                video_url_hi = excluded.video_url_hi,
                video_url_te = excluded.video_url_te,
                thumbnail_url = excluded.thumbnail_url,
                duration = excluded.duration,
                is_placeholder = excluded.is_placeholder,
                related_quiz_set_id = excluded.related_quiz_set_id,
                updated_at = CURRENT_TIMESTAMP
            ''',
            catalog_rows,
        )

        conn.execute(
            'UPDATE video_tutorials SET related_quiz_set_id = ? WHERE id = ?',
            ('scams-phishing', 'youtube-online-scams'),
        )
        conn.execute(
            'UPDATE video_tutorials SET related_quiz_set_id = ? WHERE id = ?',
            ('scams-phishing', 'youtube-online-scams-telugu'),
        )
        conn.execute(
            'CREATE UNIQUE INDEX IF NOT EXISTS idx_video_progress_user_video ON video_progress(user_id, video_id)'
        )
        conn.commit()
    finally:
        conn.close()


def get_db_connection() -> sqlite3.Connection:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH, timeout=30)
    conn.row_factory = sqlite3.Row
    conn.execute('PRAGMA foreign_keys = ON')
    return conn


def selected_language(language: str) -> str:
    normalized = str(language or 'en').lower()
    return normalized if normalized in SUPPORTED_LANGUAGES else 'en'


def lessons_from_content(language: str) -> List[Dict[str, Any]]:
    selected = selected_language(language)
    lessons = []
    for lesson in LESSONS:
        (
            lesson_id,
            category,
            difficulty,
            title_en,
            title_hi,
            title_te,
            description_en,
            description_hi,
            description_te,
        ) = lesson
        titles = {'en': title_en, 'hi': title_hi, 'te': title_te}
        descriptions = {
            'en': description_en,
            'hi': description_hi,
            'te': description_te,
        }
        lessons.append({
            'id': lesson_id,
            'category': category,
            'difficulty': difficulty,
            'title': titles[selected],
            'description': descriptions[selected],
            'language': selected,
            'videoUrl': '',
            'videoType': 'none',
            'createdAt': None,
        })
    return lessons


def quizzes_from_content(language: str) -> List[Dict[str, Any]]:
    selected = selected_language(language)
    question_id = 0
    quizzes = []
    for quiz in QUIZZES:
        hindi_translation = HINDI_QUIZ_TEXT.get(quiz['slug'])
        telugu_translation = TELUGU_QUIZ_TEXT.get(quiz['slug'])
        for translation_language, translation in (
            ('hi', hindi_translation),
            ('te', telugu_translation),
        ):
            if selected == translation_language and (
                translation is None
                or len(translation['questions']) != len(quiz['questions'])
            ):
                raise ValueError(
                    f"{translation_language.upper()} quiz translations are incomplete "
                    f"for '{quiz['slug']}'."
                )
        if selected == 'hi' and hindi_translation:
            hindi_values = [
                hindi_translation['title'],
                hindi_translation['description'],
                *[
                    text
                    for question in hindi_translation['questions']
                    for text in (question[0], *question[1], question[2])
                ],
            ]
            if not all(is_complete_hindi_text(value) for value in hindi_values):
                raise ValueError(
                    f"Hindi quiz translations are incomplete for '{quiz['slug']}'."
                )
        questions = []
        for index, question in enumerate(quiz['questions']):
            question_id += 1
            hindi_question = (
                hindi_translation['questions'][index]
                if hindi_translation
                else None
            )
            telugu_question = (
                telugu_translation['questions'][index]
                if telugu_translation
                else None
            )
            translated_question = {
                'hi': hindi_question,
                'te': telugu_question,
            }.get(selected)
            localized_question = (
                translated_question[0]
                if translated_question
                else question['question'][selected]
            )
            localized_options = (
                translated_question[1]
                if translated_question
                else question['options'][selected]
            )
            localized_explanation = (
                translated_question[2]
                if translated_question
                else question['explanation'][selected]
            )
            question_languages = {
                'en': question['question']['en'],
                'hi': hindi_question[0] if hindi_question else question['question']['hi'],
                'te': telugu_question[0] if telugu_question else question['question']['te'],
            }
            option_languages = {
                'en': question['options']['en'],
                'hi': hindi_question[1] if hindi_question else question['options']['hi'],
                'te': telugu_question[1] if telugu_question else question['options']['te'],
            }
            explanation_languages = {
                'en': question['explanation']['en'],
                'hi': hindi_question[2] if hindi_question else question['explanation']['hi'],
                'te': telugu_question[2] if telugu_question else question['explanation']['te'],
            }
            localized_questions = {
                'id': question_id,
                'question': localized_question,
                'options': localized_options,
                'correctOption': question['correct'],
                'explanation': localized_explanation,
            }
            for language in ('en', 'hi', 'te'):
                localized_questions[f'question_{language}'] = question_languages[language]
                localized_questions[f'explanation_{language}'] = explanation_languages[language]
                for option_index, option_key in enumerate(('A', 'B', 'C', 'D')):
                    localized_questions[f'option_{option_key}_{language}'] = option_languages[language][option_index]
            questions.append(localized_questions)
        quizzes.append({
            'id': quiz['slug'],
            'title': (
                hindi_translation['title']
                if selected == 'hi' and hindi_translation
                else telugu_translation['title']
                if selected == 'te' and telugu_translation
                else quiz['title'][selected]
            ),
            'description': (
                hindi_translation['description']
                if selected == 'hi' and hindi_translation
                else telugu_translation['description']
                if selected == 'te' and telugu_translation
                else quiz['description'][selected]
            ),
            'title_en': quiz['title']['en'],
            'title_hi': hindi_translation['title'] if hindi_translation else quiz['title']['hi'],
            'title_te': telugu_translation['title'] if telugu_translation else quiz['title']['te'],
            'description_en': quiz['description']['en'],
            'description_hi': hindi_translation['description'] if hindi_translation else quiz['description']['hi'],
            'description_te': telugu_translation['description'] if telugu_translation else quiz['description']['te'],
            'language': selected,
            'questions': questions,
        })
    return quizzes


def is_complete_telugu_text(value: Any) -> bool:
    text = str(value or '')
    text_without_allowed_abbreviations = re.sub(r'\b(?:OTP|UPI)\b', '', text)
    return bool(re.search(r'[\u0c00-\u0c7f]', text)) and not re.search(
        r'[A-Za-z]',
        text_without_allowed_abbreviations,
    )


def is_complete_hindi_text(value: Any) -> bool:
    text = str(value or '')
    text_without_allowed_terms = re.sub(
        r'\b(?:OTP|UPI|PIN|SMS|Wi-?Fi|QR|SIM|GPS|USB|URL|HTTPS|Android|'
        r'iPhone|Google|WhatsApp|Facebook|Instagram|YouTube|Bluetooth|PDF|'
        r'Aadhaar|NFC|ATM|GooglePay|Paytm)\b',
        '',
        text,
        flags=re.IGNORECASE,
    )
    return bool(re.search(r'[\u0900-\u097f]', text)) and not re.search(
        r'[A-Za-z]',
        text_without_allowed_terms,
    )


def content_fallback_response(payload: Any):
    response = jsonify(payload)
    response.headers['X-SmartShield-Content-Source'] = 'backend.learning_content'
    response.headers['X-SmartShield-Storage'] = 'unavailable'
    return response


def database_storage_status() -> Dict[str, Any]:
    is_vercel = os.environ.get('VERCEL') == '1'
    return {
        'storage': 'temporary-sqlite' if is_vercel else 'sqlite',
        'durable': not is_vercel,
    }


def report_database_fallback(endpoint: str, error: sqlite3.Error) -> None:
    app.logger.warning(
        'SQLite unavailable for %s; serving learning_content fallback: %s',
        endpoint,
        error,
    )


def ensure_user(conn: sqlite3.Connection, user_id: int) -> None:
    existing = conn.execute('SELECT 1 FROM users WHERE id = ?', (user_id,)).fetchone()
    if existing is None:
        conn.execute(
            'INSERT INTO users (id, name) VALUES (?, ?)',
            (user_id, 'Anonymous learner'),
        )


def init_db() -> None:
    conn = get_db_connection()
    conn.executescript(
        '''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lessons (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            difficulty TEXT,
            title_en TEXT NOT NULL,
            title_hi TEXT NOT NULL,
            title_te TEXT NOT NULL,
            description_en TEXT NOT NULL,
            description_hi TEXT NOT NULL,
            description_te TEXT NOT NULL,
            video_url TEXT,
            video_type TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS lesson_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            lesson_id TEXT NOT NULL,
            completed INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(lesson_id) REFERENCES lessons(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_sets (
            id TEXT PRIMARY KEY,
            title_en TEXT NOT NULL,
            title_hi TEXT NOT NULL,
            title_te TEXT NOT NULL,
            description_en TEXT NOT NULL,
            description_hi TEXT NOT NULL,
            description_te TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS quiz_set_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            quiz_set_id TEXT NOT NULL,
            question_en TEXT NOT NULL,
            question_hi TEXT NOT NULL,
            question_te TEXT NOT NULL,
            option_a_en TEXT NOT NULL,
            option_a_hi TEXT NOT NULL,
            option_a_te TEXT NOT NULL,
            option_b_en TEXT NOT NULL,
            option_b_hi TEXT NOT NULL,
            option_b_te TEXT NOT NULL,
            option_c_en TEXT NOT NULL,
            option_c_hi TEXT NOT NULL,
            option_c_te TEXT NOT NULL,
            option_d_en TEXT NOT NULL,
            option_d_hi TEXT NOT NULL,
            option_d_te TEXT NOT NULL,
            correct_option TEXT NOT NULL CHECK(correct_option IN ('A', 'B', 'C', 'D')),
            explanation_en TEXT NOT NULL,
            explanation_hi TEXT NOT NULL,
            explanation_te TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(quiz_set_id) REFERENCES quiz_sets(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            quiz_set_id TEXT NOT NULL,
            score INTEGER NOT NULL DEFAULT 0,
            total INTEGER NOT NULL DEFAULT 0,
            percentage INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(quiz_set_id) REFERENCES quiz_sets(id)
        );

        CREATE TABLE IF NOT EXISTS quiz_questions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            option_a TEXT NOT NULL,
            option_b TEXT NOT NULL,
            option_c TEXT NOT NULL,
            option_d TEXT NOT NULL,
            correct_option TEXT NOT NULL,
            topic TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS quiz_results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            question_id INTEGER NOT NULL,
            answer TEXT NOT NULL,
            correct INTEGER NOT NULL,
            submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(question_id) REFERENCES quiz_set_questions(id)
        );

        CREATE TABLE IF NOT EXISTS video_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            video_id TEXT NOT NULL,
            watched INTEGER NOT NULL DEFAULT 0,
            completed_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, video_id),
            FOREIGN KEY(user_id) REFERENCES users(id),
            FOREIGN KEY(video_id) REFERENCES video_tutorials(id)
        );

        CREATE TABLE IF NOT EXISTS safety_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            title_te TEXT NOT NULL,
            summary_en TEXT NOT NULL,
            summary_te TEXT NOT NULL,
            example_en TEXT,
            example_te TEXT,
            what_not_to_do_en TEXT,
            what_not_to_do_te TEXT,
            what_to_do_en TEXT,
            what_to_do_te TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            age_group TEXT,
            difficult_lesson TEXT,
            telugu_support INTEGER,
            video_support INTEGER,
            voice_support INTEGER,
            website_checking_easy INTEGER,
            suggestions TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS video_tutorials (
            id TEXT PRIMARY KEY,
            category TEXT NOT NULL,
            category_key TEXT NOT NULL,
            title_en TEXT NOT NULL,
            title_hi TEXT NOT NULL,
            title_te TEXT NOT NULL,
            description_en TEXT NOT NULL,
            description_hi TEXT NOT NULL,
            description_te TEXT NOT NULL,
            video_url_en TEXT NOT NULL,
            video_url_hi TEXT NOT NULL,
            video_url_te TEXT NOT NULL,
            thumbnail_url TEXT,
            duration TEXT,
            is_placeholder INTEGER NOT NULL DEFAULT 1,
            related_quiz_set_id TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(related_quiz_set_id) REFERENCES quiz_sets(id)
        );

        CREATE TABLE IF NOT EXISTS scam_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            report_type TEXT NOT NULL,
            value TEXT NOT NULL,
            normalized_value TEXT,
            reason TEXT,
            risk_level TEXT,
            risk_score INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        '''
    )

    seed_data(conn)
    conn.commit()
    conn.close()


def seed_data(conn: sqlite3.Connection) -> None:
    existing_lessons = conn.execute('SELECT COUNT(*) FROM lessons').fetchone()[0]
    if existing_lessons == 0:
        lessons = [
            ('unlock-phone', 'Smartphone Basics', 'Easy', 'How to unlock a smartphone', 'స్మార్ట్ఫోన్‌ను ఎలా అన్‌లాక్ చేయాలి', 'స్మార్ట్ఫోన్‌ను ఎలా అన్‌లాక్ చేయాలి', 'Use the fingerprint, face unlock, or PIN carefully.', 'ఫింగర్‌ప్రింట్, ఫేస్ అన్‌లాక్ లేదా పిన్‌ను జాగ్రత్తగా ఉపయోగించండి.', 'వ్రేల్లను, ముఖం ద్వారా అన్‌లాక్ చేయడం లేదా పిన్‌ను జాగ్రత్తగా ఉపయోగించండి.', '', 'none'),
            ('make-phone-call', 'Smartphone Basics', 'Easy', 'How to make a phone call', 'ఫోన్ కాల్ చేయడం ఎలా?', 'ఫోన్ కాల్ చేయడం ఎలా?', 'Open the Phone app, select a contact, and tap the green call button.', 'ఫోన్ యాప్‌ను తెరవండి, కాంటాక్ట్‌ను ఎంచుకుని ఆకుపచ్చ కాల్ బటన్‌ను నొక్కండి.', 'ఫోన్ యాప్‌ను తెరవండి, కాంటాక్ట్‌ను ఎంచుకుని ఆకుపచ్చ కాల్ బటన్‌ను నొక్కండి.', '', 'none'),
            ('receive-phone-call', 'Smartphone Basics', 'Easy', 'How to receive a phone call', 'కాల్‌కు ఎలా సమాధానం ఇవ్వాలి', 'కాల్‌కు ఎలా సమాధానం ఇవ్వాలి', 'Tap Answer or swipe to answer an incoming call.', 'ఇన్‌కమింగ్ కాల్ వచ్చినప్పుడు Answerను నొక్కండి లేదా swipe చేయండి.', 'ఇన్‌కమింగ్ కాల్ వచ్చినప్పుడు Answerను నొక్కండి లేదా swipe చేయండి.', '', 'none'),
            ('save-contact', 'Smartphone Basics', 'Easy', 'How to save a contact', 'కాంటాక్ట్‌ను ఎలా సేవ్ చేయాలి', 'కాంటాక్ట్‌ను ఎలా సేవ్ చేయాలి', 'Open Contacts, tap Add Contact, and save the phone number.', 'కాంటాక్ట్స్ తెరవండి, Add Contact నొక్కండి, నంబర్‌ను సేవ్ చేయండి.', 'కాంటాక్ట్స్ తెరవండి, Add Contact నొక్కండి, నంబర్‌ను సేవ్ చేయండి.', '', 'none'),
            ('send-sms', 'Smartphone Basics', 'Easy', 'How to send an SMS', 'SMS ఎలా పంపాలి', 'SMS ఎలా పంపాలి', 'Open Messages, write the message, and tap Send.', 'Messages యాప్‌ను తెరవండి, సందేశాన్ని రాయండి, Send నొక్కండి.', 'Messages యాప్‌ను తెరవండి, సందేశాన్ని రాయండి, Send నొక్కండి.', '', 'none'),
            ('send-whatsapp-message', 'WhatsApp', 'Easy', 'How to send a WhatsApp message', 'WhatsApp సందేశం ఎలా పంపాలి', 'WhatsApp సందేశం ఎలా పంపాలి', 'Open WhatsApp, choose a contact, and send a message.', 'WhatsAppను తెరవండి, కాంటాక్ట్‌ను ఎంచుకుని సందేశం పంపండి.', 'WhatsAppను తెరవండి, కాంటాక్ట్‌ను ఎంచుకుని సందేశం పంపండి.', '', 'none'),
            ('whatsapp-video-call', 'WhatsApp', 'Medium', 'How to make a WhatsApp video call', 'WhatsApp వీడియో కాల్ చేయడం ఎలా?', 'WhatsApp వీడియో కాల్ చేయడం ఎలా?', 'Open a chat, tap the video call icon, and wait for the call to connect.', 'చాట్‌ను తెరవండి, వీడియో కాల్ ఐకాన్‌ను నొక్కండి, కాల్ కనెక్ట్ అయ్యే వరకు వేచి ఉండండి.', 'చాట్‌ను తెరవండి, వీడియో కాల్ ఐకాన్‌ను నొక్కండి, కాల్ కనెక్ట్ అయ్యే వరకు వేచి ఉండండి.', '', 'none'),
            ('take-photo', 'Camera', 'Easy', 'How to take a photo', 'ఫోటో ఎలా తీయాలి', 'ఫోటో ఎలా తీయాలి', 'Open Camera, point it at the subject, and tap the shutter button.', 'కెమెరా యాప్‌ను తెరవండి, предметం వైపు ఉంచి షట్టర్ బటన్‌ను నొక్కండి.', 'కెమెరా యాప్‌ను తెరవండి, предметం వైపు ఉంచి షట్టర్ బటన్‌ను నొక్కండి.', '', 'none'),
            ('connect-wifi', 'Connectivity', 'Easy', 'How to connect to Wi-Fi', 'Wi‑Fiకు ఎలా కనెక్ట్ చేయాలి', 'Wi‑Fiకు ఎలా కనెక్ట్ చేయాలి', 'Open Settings, tap Wi‑Fi, choose the network, and connect.', 'సెట్టింగ్స్ తెరవండి, Wi‑Fiను ఎంచుకుని నెట్వర్క్‌ను సెలెక్ట్ చేసి కనెక్ట్ చేయండి.', 'సెట్టింగ్స్ తెరవండి, Wi‑Fiను ఎంచుకుని నెట్వర్క్‌ను సెలెక్ట్ చేసి కనెక్ట్ చేయండి.', '', 'none'),
            ('upi-safety', 'UPI', 'Medium', 'How to use UPI safely', 'UPIని సురక్షితంగా ఎలా ఉపయోగించాలి', 'UPIని సురక్షితంగా ఎలా ఉపయోగించాలి', 'Check the receiver name, enter the correct amount, and never share your UPI PIN.', 'గ్రహీత పేరును పరిశీలించండి, సరైన మొత్తం నమోదు చేయండి, UPI PINను ఎప్పటికీ పంచకండి.', 'గ్రహీత పేరును పరిశీలించండి, సరైన మొత్తం నమోదు చేయండి, UPI PINను ఎప్పటికీ పంచకండి.', '', 'none'),
        ]
        conn.executemany(
            'INSERT INTO lessons (id, category, difficulty, title_en, title_hi, title_te, description_en, description_hi, description_te, video_url, video_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            lessons,
        )

    existing_questions = conn.execute('SELECT COUNT(*) FROM quiz_questions').fetchone()[0]
    if existing_questions == 0:
        qa = [
            ('If someone asks for your OTP, what should you do?', 'Tell them the OTP', 'Share part of the OTP', 'Do not share the OTP', 'Give your bank PIN', 'C', 'OTP Safety'),
            ('What is a safe sign before sending money through UPI?', 'Check the receiver name', 'Share your PIN in chat', 'Send money without checking', 'Press Pay immediately', 'A', 'UPI Safety'),
            ('A message says you won a prize and asks for a payment. What should you do?', 'Pay the fee quickly', 'Ignore and verify through official contact', 'Share your OTP', 'Reply with your bank account', 'B', 'Fraud Awareness'),
            ('What should you do if a website asks for your password and looks strange?', 'Enter it and trust it', 'Close it and verify the official website', 'Share the password with the sender', 'Click all links on the page', 'B', 'Website Safety'),
            ('Which action is safer before clicking a link?', 'Click immediately', 'Check the URL and source', 'Share the link with family', 'Enter the OTP on the link', 'B', 'Link Safety'),
        ]
        conn.executemany(
            'INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_option, topic) VALUES (?, ?, ?, ?, ?, ?, ?)',
            qa,
        )

    quiz_set_exists = conn.execute('SELECT 1 FROM quiz_sets WHERE id = ?', ('scams-phishing',)).fetchone()
    if quiz_set_exists is None:
        conn.execute(
            'INSERT INTO quiz_sets (id, title_en, title_hi, title_te, description_en, description_hi, description_te) VALUES (?, ?, ?, ?, ?, ?, ?)',
            (
                'scams-phishing',
                'Scam, Phishing and Cyber Safety',
                'स्कैम, फिशिंग और साइबर सुरक्षा',
                'స్కామ్, ఫిషింగ్ మరియు.cyber భద్రత',
                'Learn to recognize scams, phishing attempts, and unsafe requests.',
                'स्कैम, फिशिंग प्रयास और असुरक्षित अनुरोध पहचानने का तरीका सीखें।',
                'స్కామ్, ఫిషింగ్ ప్రయత్నాలు మరియు అజ్ఞానంగా కాదు ఆరోపణలు గుర్తించండి.',
            ),
        )

    existing_videos = conn.execute('SELECT COUNT(*) FROM video_tutorials').fetchone()[0]
    if existing_videos == 0:
        seed_videos = []
        for record in VIDEO_RECORDS:
            row = list(record)
            while len(row) < 15:
                row.append(None)
            if len(row) == 15:
                row.append('scams-phishing' if row[0] in {'youtube-online-scams', 'youtube-online-scams-telugu'} else None)
            elif len(row) > 15:
                row[15] = 'scams-phishing' if row[0] in {'youtube-online-scams', 'youtube-online-scams-telugu'} else row[15]
            seed_videos.append(tuple(row[:16]))
        conn.executemany(
            'INSERT INTO video_tutorials (id, category, category_key, title_en, title_hi, title_te, description_en, description_hi, description_te, video_url_en, video_url_hi, video_url_te, thumbnail_url, duration, is_placeholder, related_quiz_set_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            seed_videos,
        )

    existing_topics = conn.execute('SELECT COUNT(*) FROM safety_topics').fetchone()[0]
    if existing_topics == 0:
        topics = [
            ('OTP Safety', 'OTP సురక్షితత్వం', 'Never share your OTP with anyone.', 'మీ OTPను ఎవరికీ చెప్పకండి.', 'A caller says they are from the bank and asks for the OTP.', 'బ్యాంక్ నుంచి కాల్ వస్తుందని చెప్పి OTP అడిగారు.', 'Do not share OTP in a call or message.', 'కాల్ లేదా మెసేజ్‌లో OTP ఇవ్వవద్దు.', 'Use the official app or customer care number.', 'అధికారిక యాప్ లేదా కస్టమర్ కేర్ నంబర్‌ను ఉపయోగించండి.'),
            ('UPI Scams', 'UPI స్కామ్స్', 'Check the receiver name and amount before paying.', 'చెల్లించే ముందు గ్రహీత పేరు మరియు మొత్తం చూసి ధ్రువీకరించండి.', 'A fake UPI payment request comes with urgency.', 'నకిలీ UPI చెల్లింపు అభ్యర్థన అత్యవసరంగా వచ్చింది.', 'Do not share your UPI PIN or payment code.', 'UPI PIN లేదా పేమెంట్ కోడ్ ఇవ్వకండి.', 'Verify the person using a trusted contact or app.', 'విశ్వసనీయ సంప్రదింపు లేదా యాప్ ద్వారా వ్యక్తిని ధ్రువీకరించండి.'),
            ('Fake Bank Messages', 'నకిలీ బ్యాంక్ సందేశాలు', 'Banks do not ask for OTP or passwords through messages.', 'బ్యాంకులు మెసేజ్ ద్వారా OTP లేదా పాస్‌వర్డ్ అడగవు.', 'A message says your account is blocked and asks for a quick OTP.', 'మీ అకౌంట్ బ్లాక్ అయిందని మెసేజ్ వచ్చి OTP అడుగుతోంది.', 'Do not reply to suspicious bank messages.', 'అనుమానమైన బ్యాంక్ మెసేజ్‌కు సమాధానం ఇవ్వకండి.', 'Use the official bank website or app to check.', 'అధికారిక బ్యాంక్ వెబ్‌సైట్ లేదా యాప్ ద్వారా చూసుకోండి.'),
        ]
        conn.executemany(
            'INSERT INTO safety_topics (title, title_te, summary_en, summary_te, example_en, example_te, what_not_to_do_en, what_not_to_do_te, what_to_do_en, what_to_do_te) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            topics,
        )

    default_user = conn.execute('SELECT id FROM users WHERE id = 1').fetchone()
    if default_user is None:
        conn.execute('INSERT INTO users (id, name) VALUES (1, "Community User")')

    conn.commit()


@app.before_request
def ensure_db_ready():
    try:
        ensure_database()
    except sqlite3.Error:
        app.logger.exception('Unable to initialize the SQLite database for this request.')


@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    response.headers.setdefault('X-SmartShield-Storage', database_storage_status()['storage'])
    return response


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'database': str(DB_PATH),
        **database_storage_status(),
    })


@app.route('/api/users', methods=['POST'])
def create_user():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'error': 'Please enter a name.'}), 400

    conn = get_db_connection()
    cursor = conn.execute('INSERT INTO users (name) VALUES (?)', (name,))
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'id': user_id, 'name': name}), 201


@app.route('/api/lessons', methods=['GET'])
def get_lessons():
    language = selected_language(request.args.get('language', 'en'))
    conn = None
    try:
        conn = get_db_connection()
        rows = conn.execute('SELECT * FROM lessons ORDER BY id').fetchall()
    except sqlite3.Error as error:
        report_database_fallback('/api/lessons', error)
        return content_fallback_response(lessons_from_content(language))
    finally:
        if conn is not None:
            conn.close()
    if not rows:
        app.logger.warning('No lessons are present in SQLite; serving backend.learning_content.')
        return content_fallback_response(lessons_from_content(language))
    return jsonify([serialize_lesson(row, language) for row in rows])


def serialize_lesson(row: sqlite3.Row, language: str = 'en') -> Dict[str, Any]:
    selected = selected_language(language)
    title_key = f'title_{selected}'
    description_key = f'description_{selected}'
    return {
        'id': row['id'],
        'category': row['category'],
        'difficulty': row['difficulty'],
        'title': row[title_key] or row['title_en'],
        'description': row[description_key] or row['description_en'],
        'language': selected,
        'videoUrl': row['video_url'] or '',
        'videoType': row['video_type'] or 'none',
        'createdAt': row['created_at'],
    }


@app.route('/api/lessons/<lesson_id>', methods=['GET'])
def get_lesson(lesson_id):
    conn = None
    try:
        conn = get_db_connection()
        row = conn.execute('SELECT * FROM lessons WHERE id = ?', (lesson_id,)).fetchone()
    except sqlite3.Error as error:
        lesson = next((item for item in lessons_from_content('en') if item['id'] == lesson_id), None)
        if lesson is None:
            return jsonify({'error': 'Lesson was not found.'}), 404
        report_database_fallback('/api/lessons/<lesson_id>', error)
        return content_fallback_response(lesson)
    finally:
        if conn is not None:
            conn.close()
    if row is None:
        lesson = next((item for item in lessons_from_content('en') if item['id'] == lesson_id), None)
        if lesson is None:
            return jsonify({'error': 'Lesson was not found.'}), 404
        return content_fallback_response(lesson)
    return jsonify(dict(row))


@app.route('/api/lessons/<lesson_id>/complete', methods=['POST'])
def complete_lesson(lesson_id):
    data = request.get_json(silent=True) or {}
    if not isinstance(data, dict):
        return jsonify({'error': 'The request body must be a JSON object.'}), 400
    try:
        user_id = int(data.get('user_id') or 1)
    except (TypeError, ValueError):
        return jsonify({'error': 'Please provide a valid user id.'}), 400
    if user_id < 1:
        return jsonify({'error': 'Please provide a valid user id.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        lesson_exists = conn.execute('SELECT 1 FROM lessons WHERE id = ?', (lesson_id,)).fetchone()
    except sqlite3.Error as error:
        if conn is not None:
            conn.close()
        if not any(item['id'] == lesson_id for item in lessons_from_content('en')):
            return jsonify({'error': 'Lesson not found.'}), 404
        report_database_fallback('/api/lessons/<lesson_id>/complete', error)
        return content_fallback_response({
            'message': 'Lesson marked complete for this browser session; database progress was not saved.',
            'persisted': False,
            'storage': 'unavailable',
            'durable': False,
            'progress': {
                'user_id': user_id,
                'total_lessons': len(LESSONS),
                'completed_lessons': 1,
                'lessonPercentage': round(100 / len(LESSONS)) if LESSONS else 0,
                'percentage': round(100 / len(LESSONS)) if LESSONS else 0,
                'totalQuizSets': len(QUIZZES),
                'completedQuizSets': 0,
                'quizPercentage': 0,
                'totalQuizQuestions': sum(len(quiz['questions']) for quiz in QUIZZES),
                'completed_lesson_ids': [lesson_id],
                'persistenceAvailable': False,
            },
        })
    if lesson_exists is None:
        conn.close()
        if not any(item['id'] == lesson_id for item in lessons_from_content('en')):
            return jsonify({'error': 'Lesson not found.'}), 404
        return content_fallback_response({
            'message': 'Lesson is available from the learning content but not stored in SQLite.',
            'persisted': False,
            'storage': 'unavailable',
            'durable': False,
            'progress': {
                'user_id': user_id,
                'total_lessons': len(LESSONS),
                'completed_lessons': 0,
                'lessonPercentage': 0,
                'percentage': 0,
                'completed_lesson_ids': [],
                'persistenceAvailable': False,
            },
        })

    try:
        ensure_user(conn, user_id)
        existing = conn.execute(
            'SELECT id FROM lesson_progress WHERE user_id = ? AND lesson_id = ?',
            (user_id, lesson_id),
        ).fetchone()
        if existing is None:
            conn.execute(
                'INSERT INTO lesson_progress (user_id, lesson_id, completed, completed_at) VALUES (?, ?, 1, ?)',
                (user_id, lesson_id, datetime.utcnow().isoformat(timespec='seconds')),
            )
        else:
            conn.execute(
                'UPDATE lesson_progress SET completed = 1, completed_at = ? WHERE user_id = ? AND lesson_id = ?',
                (datetime.utcnow().isoformat(timespec='seconds'), user_id, lesson_id),
            )
        conn.commit()
        progress = get_user_progress(conn, user_id)
    except sqlite3.Error as error:
        conn.rollback()
        report_database_fallback('/api/lessons/<lesson_id>/complete', error)
        response = jsonify({
            'error': 'The lesson was not saved to SQLite. Your browser can still keep local progress.',
            'persisted': False,
            'storage': 'unavailable',
            'durable': False,
        })
        response.headers['X-SmartShield-Storage'] = 'unavailable'
        return response, 503
    finally:
        conn.close()
    return jsonify({
        'message': 'Lesson marked as complete.',
        'persisted': True,
        **database_storage_status(),
        'progress': progress,
    })


def serialize_video_tutorial(row: sqlite3.Row, language: str = 'en') -> Dict[str, Any]:
    selected_language = language if language in {'en', 'hi', 'te'} else 'en'
    title_map = {
        'en': row['title_en'],
        'hi': row['title_hi'],
        'te': row['title_te'],
    }
    description_map = {
        'en': row['description_en'],
        'hi': row['description_hi'],
        'te': row['description_te'],
    }
    video_url_map = {
        'en': row['video_url_en'],
        'hi': row['video_url_hi'],
        'te': row['video_url_te'],
    }

    def resolve_video_url(language_key: str) -> str:
        raw_value = video_url_map.get(language_key) or video_url_map.get('en') or ''
        if raw_value and raw_value not in {'VIDEO_URL_TO_BE_CONFIGURED', 'VIDEO_URL_TO_BE_CONFIGURED '}:
            return raw_value
        local_url = LOCAL_VIDEO_MAPPINGS.get(row['id'])
        if local_url:
            return local_url
        return raw_value

    fallback_language = 'en' if selected_language not in {'en', 'hi', 'te'} else selected_language
    selected_title = title_map.get(selected_language, title_map.get(fallback_language, row['title_en']))
    selected_description = description_map.get(selected_language, description_map.get(fallback_language, row['description_en']))
    selected_video_url = resolve_video_url(selected_language)
    return {
        'id': row['id'],
        'category': row['category'],
        'categoryKey': row['category_key'],
        'title': selected_title,
        'description': selected_description,
        'videoUrl': selected_video_url,
        'videoType': 'youtube' if 'youtube.com' in selected_video_url or 'youtu.be' in selected_video_url else 'mp4',
        'thumbnailUrl': row['thumbnail_url'],
        'duration': row['duration'] or '00:00',
        'isPlaceholder': bool(row['is_placeholder']),
        'relatedQuizSetId': row['related_quiz_set_id'],
        'language': selected_language,
        'availableLanguages': [
            {
                'language': 'en',
                'title': row['title_en'],
                'description': row['description_en'],
                'videoUrl': resolve_video_url('en'),
            },
            {
                'language': 'hi',
                'title': row['title_hi'],
                'description': row['description_hi'],
                'videoUrl': resolve_video_url('hi'),
            },
            {
                'language': 'te',
                'title': row['title_te'],
                'description': row['description_te'],
                'videoUrl': resolve_video_url('te'),
            },
        ],
        'createdAt': row['created_at'],
        'updatedAt': row['updated_at'],
    }


@app.route('/api/video-tutorials', methods=['GET'])
def get_video_tutorials():
    language = request.args.get('language', 'en').lower()
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM video_tutorials ORDER BY id').fetchall()
    conn.close()
    payload = [serialize_video_tutorial(row, language) for row in rows]
    return jsonify(payload)


@app.route('/api/video-tutorials/<video_id>', methods=['GET'])
def get_video_tutorial(video_id):
    language = request.args.get('language', 'en').lower()
    conn = get_db_connection()
    row = conn.execute('SELECT * FROM video_tutorials WHERE id = ?', (video_id,)).fetchone()
    conn.close()
    if row is None:
        return jsonify({'error': 'Video tutorial not found.'}), 404
    return jsonify(serialize_video_tutorial(row, language))


@app.route('/api/video-tutorials/<video_id>/complete', methods=['POST'])
def complete_video(video_id):
    payload = request.get_json(silent=True) or {}
    user_id = payload.get('user_id') or 1
    conn = get_db_connection()
    video_exists = conn.execute('SELECT 1 FROM video_tutorials WHERE id = ?', (video_id,)).fetchone()
    if video_exists is None:
        conn.close()
        return jsonify({'error': 'Video tutorial not found.'}), 404
    ensure_user(conn, user_id)
    conn.execute(
        '''
        INSERT INTO video_progress (user_id, video_id, watched, completed_at)
        VALUES (?, ?, 1, ?)
        ON CONFLICT(user_id, video_id) DO UPDATE SET
            watched = excluded.watched,
            completed_at = excluded.completed_at
        ''',
        (user_id, video_id, datetime.utcnow().isoformat(timespec='seconds')),
    )
    conn.commit()
    watched = conn.execute(
        'SELECT COUNT(*) FROM video_progress WHERE user_id = ? AND watched = 1',
        (user_id,),
    ).fetchone()[0]
    conn.close()
    return jsonify({'message': 'Video marked as complete.', 'watchedVideos': watched})


@app.route('/api/users/<int:user_id>/progress', methods=['GET'])
def user_progress(user_id):
    conn = None
    fallback = False
    try:
        conn = get_db_connection()
        payload = get_user_progress(conn, user_id)
    except sqlite3.Error as error:
        report_database_fallback('/api/users/<user_id>/progress', error)
        fallback = True
        total_questions = sum(len(quiz['questions']) for quiz in QUIZZES)
        payload = {
            'user_id': user_id,
            'total_lessons': len(LESSONS),
            'completed_lessons': 0,
            'lessonPercentage': 0,
            'percentage': 0,
            'totalQuizSets': len(QUIZZES),
            'completedQuizSets': 0,
            'quizPercentage': 0,
            'totalQuizQuestions': total_questions,
            'completed_lesson_ids': [],
            'persistenceAvailable': False,
        }
    finally:
        if conn is not None:
            conn.close()
    if fallback:
        return content_fallback_response(payload)
    return jsonify(payload)


def get_user_progress(conn: sqlite3.Connection, user_id: int) -> Dict[str, Any]:
    total_lessons = conn.execute('SELECT COUNT(*) FROM lessons').fetchone()[0]
    completed_lessons = conn.execute(
        'SELECT COUNT(*) FROM lesson_progress WHERE user_id = ? AND completed = 1',
        (user_id,),
    ).fetchone()[0]
    total_quiz_sets = conn.execute('SELECT COUNT(*) FROM quiz_sets').fetchone()[0]
    completed_quiz_sets = conn.execute(
        'SELECT COUNT(DISTINCT quiz_set_id) FROM quiz_attempts WHERE user_id = ?',
        (user_id,),
    ).fetchone()[0]
    quiz_questions = conn.execute('SELECT COUNT(*) FROM quiz_set_questions').fetchone()[0]
    lesson_percent = round((completed_lessons / total_lessons) * 100) if total_lessons else 0
    quiz_percent = round((completed_quiz_sets / total_quiz_sets) * 100) if total_quiz_sets else 0
    return {
        'user_id': user_id,
        'total_lessons': total_lessons,
        'completed_lessons': completed_lessons,
        'lessonPercentage': lesson_percent,
        'percentage': lesson_percent,
        'totalQuizSets': total_quiz_sets,
        'completedQuizSets': completed_quiz_sets,
        'quizPercentage': quiz_percent,
        'totalQuizQuestions': quiz_questions,
        'completed_lesson_ids': [
            row['lesson_id']
            for row in conn.execute(
                'SELECT lesson_id FROM lesson_progress WHERE user_id = ? AND completed = 1 ORDER BY completed_at',
                (user_id,),
            ).fetchall()
        ],
        **database_storage_status(),
    }


@app.route('/api/check-website', methods=['POST'])
def check_website():
    payload = request.get_json(silent=True) or {}
    url = str(payload.get('url') or '').strip()
    if not url:
        return jsonify({'error': 'Please enter a website address.'}), 400
    try:
        local_result = analyze_url(url)
        vt_result = _fetch_virustotal_url_report(url)
        if vt_result.get('source') == 'VirusTotal':
            risk_score = max(int(local_result.get('riskScore') or 0), int(vt_result.get('riskScore') or 0))
            level = 'Very High Risk / Possible Scam' if risk_score >= 80 else 'High Risk' if risk_score >= 60 else 'Suspicious' if risk_score >= 40 else 'Low Risk'
            local_result['riskScore'] = risk_score
            local_result['risk_score'] = risk_score
            local_result['riskLevel'] = level
            local_result['risk_level'] = level
            local_result['status'] = 'very-high-risk' if risk_score >= 80 else 'high-risk' if risk_score >= 60 else 'suspicious' if risk_score >= 40 else 'low-risk'
            local_result['source'] = 'VirusTotal + local rules'
            local_result.setdefault('reasons', [])
            if 'VIRUSTOTAL' not in local_result['reasons']:
                local_result['reasons'].append('VIRUSTOTAL')
            local_result.setdefault('reasonKeys', [])
            if 'VIRUSTOTAL' not in local_result['reasonKeys']:
                local_result['reasonKeys'].append('VIRUSTOTAL')
            local_result.setdefault('indicators', [])
            if 'VIRUSTOTAL' not in local_result['indicators']:
                local_result['indicators'].append('VIRUSTOTAL')
        return jsonify(local_result)
    except Exception:
        return jsonify({'error': 'The website could not be checked right now. Please try again later.', 'status': 'unverified', 'riskScore': 0, 'riskLevel': 'Unverified', 'source': 'backend error'})


@app.route('/api/check-message', methods=['POST'])
def check_message():
    payload = request.get_json(silent=True) or {}
    message = str(payload.get('message') or payload.get('text') or '').strip()
    if not message:
        return jsonify({'error': 'Please enter a message to check.'}), 400
    try:
        return jsonify(analyze_message(message))
    except Exception:
        return jsonify({'error': 'The message could not be checked right now. Please try again later.', 'status': 'unverified', 'riskScore': 0, 'riskLevel': 'Unverified', 'source': 'backend error'})


@app.route('/api/check-number', methods=['POST'])
def check_number():
    payload = request.get_json(silent=True) or {}
    number = str(payload.get('number') or payload.get('phoneNumber') or '').strip()
    if not number:
        return jsonify({'error': 'Please enter a phone number.'}), 400

    try:
        return jsonify(analyze_phone_number(number))
    except Exception:
        return jsonify({'error': 'The phone number could not be checked right now. Please try again later.', 'status': 'unverified', 'riskScore': 0, 'riskLevel': 'Unverified', 'source': 'backend error'})


@app.route('/api/report', methods=['POST'])
def save_report():
    payload = request.get_json(silent=True) or {}
    report_type = str(payload.get('reportType') or payload.get('type') or '').strip().lower()
    value = str(payload.get('value') or payload.get('number') or payload.get('message') or payload.get('url') or '').strip()
    reason = str(payload.get('reason') or 'User report').strip()

    if not report_type or not value:
        return jsonify({'error': 'Please provide a report value and type.'}), 400
    if report_type not in {'phone', 'message', 'url'}:
        return jsonify({'error': 'Unsupported report type.'}), 400

    try:
        analysis = {
            'phone': analyze_phone_number,
            'message': analyze_message,
            'url': analyze_url,
        }[report_type](value)
        normalized = analysis.get('normalizedNumber') or analysis.get('normalizedUrl') or value
        risk_level = analysis.get('riskLevel') or 'Unverified'
        risk_score = int(analysis.get('riskScore') or 0)
        conn = get_db_connection()
        conn.execute(
            'INSERT INTO scam_reports (report_type, value, normalized_value, reason, risk_level, risk_score) VALUES (?, ?, ?, ?, ?, ?)',
            (report_type, value, normalized, reason, risk_level, risk_score),
        )
        conn.commit()
        conn.close()
        return jsonify(report_scam(report_type, value, reason, risk_level, risk_score))
    except Exception:
        return jsonify({'error': 'The report could not be saved right now. Please try again later.'}), 500


def _get_virustotal_api_key() -> str:
    return str(os.getenv('VIRUSTOTAL_API_KEY') or '').strip()


def _fetch_virustotal_url_report(url: str) -> Dict[str, Any]:
    api_key = _get_virustotal_api_key()
    if not api_key:
        return {'status': 'unverified', 'riskScore': 0, 'riskLevel': 'Unverified', 'source': 'local rules'}

    endpoint = 'https://www.virustotal.com/api/v3/urls'
    data = {'url': url}
    params = urllib_parse.urlencode(data)
    req = urllib_request.Request(
        endpoint,
        data=params.encode('utf-8'),
        headers={
            'x-apikey': api_key,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'SmartShield/1.0',
        },
        method='POST',
    )
    try:
        with urllib_request.urlopen(req, timeout=10) as response:
            payload = json.loads(response.read().decode('utf-8'))
    except (urllib_error.HTTPError, urllib_error.URLError, ValueError, TimeoutError):
        return {'status': 'unverified', 'riskScore': 0, 'riskLevel': 'Unverified', 'source': 'local rules'}

    analysis = payload.get('data', {})
    attributes = analysis.get('attributes', {})
    stats = attributes.get('last_analysis_stats', {})
    malicious = int(stats.get('malicious', 0) or 0)
    suspicious = int(stats.get('suspicious', 0) or 0)
    harmless = int(stats.get('harmless', 0) or 0)
    total = max(1, malicious + suspicious + harmless)
    score = int(round((malicious * 100 + suspicious * 45) / total))
    return {
        'status': 'very-high-risk' if score >= 80 else 'high-risk' if score >= 60 else 'suspicious' if score >= 40 else 'low-risk',
        'riskScore': score,
        'riskLevel': 'Very High Risk / Possible Scam' if score >= 80 else 'High Risk' if score >= 60 else 'Suspicious' if score >= 40 else 'Low Risk',
        'source': 'VirusTotal',
        'malicious': malicious,
        'suspicious': suspicious,
        'harmless': harmless,
        'total': total,
    }


def analyze_number(number: str) -> Dict[str, Any]:
    original = str(number or '').strip()
    cleaned = reformat_number(original)

    if not cleaned:
        return {
            'phone_number': original,
            'status': 'unknown',
            'risk_score': 0,
            'confidence': 0,
            'risk_level': 'No number entered',
            'summary': 'Please enter a phone number.',
            'reasons': [
                'No phone number was provided.'
            ],
            'recommended_action':
                'Enter a phone number to analyze it.'
        }

    digits = ''.join(
        ch for ch in cleaned
        if ch.isdigit()
    )

    if len(digits) < 10 or len(digits) > 15:
        return {
            'phone_number': original,
            'status': 'unknown',
            'risk_score': 20,
            'confidence': 20,
            'risk_level': 'Invalid or incomplete number',
            'summary':
                'The phone number does not have a normal length.',
            'reasons': [
                'The number contains too few or too many digits.'
            ],
            'recommended_action':
                'Check the number and enter it again.'
        }

    # Remove Indian country code for pattern checking.
    national_digits = digits

    if digits.startswith('91') and len(digits) == 12:
        national_digits = digits[2:]

    reasons = []
    score = 0

    # --------------------------------
    # Indian mobile format
    # --------------------------------

    is_indian_mobile = (
        len(national_digits) == 10
        and national_digits[0] in '6789'
    )

    if not is_indian_mobile:
        score += 20
        reasons.append(
            'The number does not match a normal Indian mobile format.'
        )

    # --------------------------------
    # Repeated digits
    # --------------------------------

    if len(set(national_digits)) == 1:
        score += 70
        reasons.append(
            'The number consists entirely of repeated digits.'
        )

    # --------------------------------
    # Long repeated sequence
    # --------------------------------

    if re.search(r'(\d)\1{4,}', national_digits):
        score += 35
        reasons.append(
            'The number contains a long repeated-digit sequence.'
        )

    # --------------------------------
    # Sequential numbers
    # --------------------------------

    if national_digits in (
        '0123456789',
        '1234567890',
        '9876543210',
    ):
        score += 50
        reasons.append(
            'The number follows an obvious sequential pattern.'
        )

    # --------------------------------
    # Local demo/watchlist numbers
    # --------------------------------

    known_scam_numbers = {
        '919000011111',
        '917000000000',
        '919999999999',
    }

    known_suspicious_numbers = {
        '918000000000',
        '919000000000',
    }

    if digits in known_scam_numbers:
        score += 90
        reasons.append(
            'This number matches the Smart Shield local scam watchlist.'
        )

    elif digits in known_suspicious_numbers:
        score += 55
        reasons.append(
            'This number matches the Smart Shield local suspicious-number list.'
        )

    score = min(score, 100)

    # --------------------------------
    # Classification
    # --------------------------------

    if score >= 75:
        status = 'scam'
        risk_level = 'Very high risk'

        summary = (
            'This number has several strong suspicious indicators.'
        )

        recommended_action = (
            'Do not share OTPs, UPI PINs, passwords, '
            'banking information, or send money. '
            'Verify the caller using an official contact method.'
        )

    elif score >= 45:
        status = 'suspicious'
        risk_level = 'High risk'

        summary = (
            'This number has suspicious characteristics '
            'that require caution.'
        )

        recommended_action = (
            'Do not provide sensitive information. '
            'Verify the caller independently before taking action.'
        )

    elif score >= 20:
        status = 'unknown'
        risk_level = 'Unverified'

        summary = (
            'The number could not be confirmed as trustworthy.'
        )

        recommended_action = (
            'Verify the caller through an official source '
            'before sharing personal or financial information.'
        )

    else:
        status = 'unknown'
        risk_level = 'Low evidence of risk'

        summary = (
            'The number has a normal-looking format, '
            'but Smart Shield cannot prove that the caller is genuine.'
        )

        recommended_action = (
            'Verify the caller before sharing OTPs, passwords, '
            'UPI PINs, or banking information.'
        )

    if not reasons:
        reasons.append(
            'No known local scam indicators were detected.'
        )

    return {
        'phone_number': original,
        'normalized_number': digits,
        'status': status,
        'risk_score': score,
        'confidence': score,
        'risk_level': risk_level,
        'summary': summary,
        'reasons': reasons,
        'recommended_action': recommended_action,
        'source': 'Smart Shield local analysis',
    }


def reformat_number(number: str) -> str:
    return ''.join(
        ch
        for ch in str(number or '')
        if ch.isdigit() or ch in ('+', ' ')
    ).strip()
@app.route('/api/safety-topics', methods=['GET'])
def safety_topics():
    conn = get_db_connection()
    rows = conn.execute('SELECT * FROM safety_topics ORDER BY id').fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route('/api/quiz', methods=['GET'])
def quiz_questions():
    language = selected_language(request.args.get('language', 'en'))
    conn = None
    payload = []
    try:
        authored_quizzes = {quiz['id']: quiz for quiz in quizzes_from_content(language)}
    except ValueError as error:
        app.logger.error('Quiz localization data is incomplete: %s', error)
        return jsonify({'error': 'Quiz translations are incomplete.', 'details': str(error)}), 500
    try:
        conn = get_db_connection()
        sets = conn.execute(
            'SELECT * FROM quiz_sets ORDER BY title_en'
        ).fetchall()
        for quiz_set in sets:
            questions = conn.execute(
                '''
                SELECT * FROM quiz_set_questions
                WHERE quiz_set_id = ? ORDER BY id
                ''',
                (quiz_set['id'],),
            ).fetchall()
            authored_quiz = authored_quizzes.get(quiz_set['id'])
            if authored_quiz and not questions:
                payload.append(authored_quiz)
                continue
            if authored_quiz and len(authored_quiz['questions']) != len(questions):
                app.logger.error(
                    'Quiz question count mismatch for %s: database=%s content=%s',
                    quiz_set['id'],
                    len(questions),
                    len(authored_quiz['questions']),
                )
                return jsonify({
                    'error': 'Quiz database records do not match the published learning content.',
                    'quiz_set_id': quiz_set['id'],
                }), 500
            if authored_quiz:
                payload.append({
                    **authored_quiz,
                    'questions': [
                        {
                            **authored_question,
                            'id': question['id'],
                            'correctOption': question['correct_option'],
                        }
                        for authored_question, question in zip(authored_quiz['questions'], questions)
                    ],
                })
                continue
            title = quiz_set[f'title_{language}']
            description = quiz_set[f'description_{language}']
            if (
                not title
                or not description
                or (language == 'te' and not all(
                    is_complete_telugu_text(value)
                    for value in (title, description)
                ))
                or (language == 'hi' and not all(
                    is_complete_hindi_text(value)
                    for value in (title, description)
                ))
            ):
                return jsonify({
                    'error': f'{language.upper()} quiz set translation is missing.',
                    'quiz_set_id': quiz_set['id'],
                }), 500
            localized_questions = []
            for question in questions:
                translated_values = {
                    'question': question[f'question_{language}'],
                    'explanation': question[f'explanation_{language}'],
                    **{
                        f'option_{key}': question[f'option_{key.lower()}_{language}']
                        for key in ('A', 'B', 'C', 'D')
                    },
                }
                missing_fields = [field for field, value in translated_values.items() if not value]
                if language in {'hi', 'te'}:
                    is_complete_translation = (
                        is_complete_hindi_text
                        if language == 'hi'
                        else is_complete_telugu_text
                    )
                    missing_fields.extend(
                        field
                        for field, value in translated_values.items()
                        if field not in missing_fields and not is_complete_translation(value)
                    )
                if missing_fields:
                    return jsonify({
                        'error': f'{language.upper()} quiz question translation is missing.',
                        'quiz_set_id': quiz_set['id'],
                        'question_id': question['id'],
                        'missing_fields': missing_fields,
                    }), 500
                localized_questions.append({
                    'id': question['id'],
                    'question': translated_values['question'],
                    'question_en': question['question_en'],
                    'question_hi': question['question_hi'],
                    'question_te': question['question_te'],
                    'options': [translated_values[f'option_{key}'] for key in ('A', 'B', 'C', 'D')],
                    'correctOption': question['correct_option'],
                    'explanation': translated_values['explanation'],
                    'explanation_en': question['explanation_en'],
                    'explanation_hi': question['explanation_hi'],
                    'explanation_te': question['explanation_te'],
                    **{
                        f'option_{key}_{language_key}': question[f'option_{key.lower()}_{language_key}']
                        for key in ('A', 'B', 'C', 'D')
                        for language_key in ('en', 'hi', 'te')
                    },
                })
            payload.append({
                'id': quiz_set['id'],
                'title': title,
                'description': description,
                'title_en': quiz_set['title_en'],
                'title_hi': quiz_set['title_hi'],
                'title_te': quiz_set['title_te'],
                'description_en': quiz_set['description_en'],
                'description_hi': quiz_set['description_hi'],
                'description_te': quiz_set['description_te'],
                'language': language,
                'questions': localized_questions,
            })
    except sqlite3.Error as error:
        report_database_fallback('/api/quiz', error)
        return content_fallback_response(quizzes_from_content(language))
    finally:
        if conn is not None:
            conn.close()
    if not payload or any(not quiz['questions'] for quiz in payload):
        app.logger.warning('Quiz sets or questions are missing from SQLite; serving backend.learning_content.')
        return content_fallback_response(quizzes_from_content(language))
    return jsonify(payload)


def score_quiz_from_content(quiz_set_id: str, answers: List[Dict[str, Any]]):
    quiz = next((item for item in quizzes_from_content('en') if item['id'] == quiz_set_id), None)
    if quiz is None:
        return jsonify({'error': 'Quiz set was not found.'}), 404

    answer_ids = [str(item.get('question_id') or '') for item in answers]
    if any(not question_id for question_id in answer_ids):
        return jsonify({'error': 'Each answer must include a question id.'}), 400
    if len(answer_ids) != len(set(answer_ids)):
        return jsonify({'error': 'Each question can be answered only once.'}), 400
    if len(answer_ids) != len(quiz['questions']):
        return jsonify({'error': f"Please answer all {len(quiz['questions'])} questions."}), 400

    if any(str(item.get('answer') or '').strip().upper() not in {'A', 'B', 'C', 'D'} for item in answers):
        return jsonify({'error': 'Each answer must be A, B, C, or D.'}), 400

    correct_answers = {
        str(question['id']): question['correctOption']
        for question in quiz['questions']
    }
    if set(answer_ids) == set(correct_answers):
        score = sum(
            str(item.get('answer')).strip().upper()
            == correct_answers[str(item['question_id'])]
            for item in answers
        )
    else:
        score = sum(
            str(item.get('answer')).strip().upper() == question['correctOption']
            for item, question in zip(answers, quiz['questions'])
        )
    total = len(answers)
    return content_fallback_response({
        'attemptId': None,
        'quizSetId': quiz_set_id,
        'score': score,
        'total': total,
        'percentage': round((score / total) * 100) if total else 0,
        'progress': None,
        'persisted': False,
        'storage': 'unavailable',
        'durable': False,
        'message': 'The score was calculated from learning content; database progress was not saved.',
    })


@app.route('/api/quiz/submit', methods=['POST'])
def submit_quiz():
    payload = request.get_json(silent=True) or {}
    if not isinstance(payload, dict):
        return jsonify({'error': 'The request body must be a JSON object.'}), 400
    try:
        user_id = int(payload.get('user_id') or 1)
    except (TypeError, ValueError):
        return jsonify({'error': 'Please provide a valid user id.'}), 400
    if user_id < 1:
        return jsonify({'error': 'Please provide a valid user id.'}), 400
    quiz_set_id = str(payload.get('quiz_set_id') or '').strip()
    answers = payload.get('answers') or []
    if not quiz_set_id:
        return jsonify({'error': 'Please provide a quiz set id.'}), 400
    if not isinstance(answers, list) or not answers:
        return jsonify({'error': 'Please provide quiz answers.'}), 400
    if any(not isinstance(item, dict) for item in answers):
        return jsonify({'error': 'Each quiz answer must be a JSON object.'}), 400

    conn = None
    try:
        conn = get_db_connection()
        quiz_exists = conn.execute(
            'SELECT 1 FROM quiz_sets WHERE id = ?',
            (quiz_set_id,),
        ).fetchone()
        if quiz_exists is None:
            return score_quiz_from_content(quiz_set_id, answers)

        question_ids = [item.get('question_id') for item in answers]
        if any(question_id is None for question_id in question_ids):
            return jsonify({'error': 'Each answer must include a question id.'}), 400
        if any(
            isinstance(question_id, bool)
            or not isinstance(question_id, (int, str))
            for question_id in question_ids
        ):
            return jsonify({'error': 'Quiz question ids must be numbers or numeric strings.'}), 400
        question_ids = [str(question_id) for question_id in question_ids]
        if len(question_ids) != len(set(question_ids)):
            return jsonify({'error': 'Each question can be answered only once.'}), 400

        expected_count = conn.execute(
            'SELECT COUNT(*) FROM quiz_set_questions WHERE quiz_set_id = ?',
            (quiz_set_id,),
        ).fetchone()[0]
        if expected_count == 0:
            return score_quiz_from_content(quiz_set_id, answers)
        if len(question_ids) != expected_count:
            return jsonify({'error': f'Please answer all {expected_count} questions.'}), 400

        ensure_user(conn, user_id)
        score = 0
        for item in answers:
            question_id = str(item.get('question_id'))
            answer = str(item.get('answer') or '').strip().upper()
            row = conn.execute(
                'SELECT correct_option FROM quiz_set_questions WHERE id = ? AND quiz_set_id = ?',
                (question_id, quiz_set_id),
            ).fetchone()
            if row is None:
                return jsonify({'error': 'One or more quiz questions are invalid.'}), 400
            correct = 1 if answer == row['correct_option'] else 0
            score += correct
            conn.execute(
                'INSERT INTO quiz_results (user_id, question_id, answer, correct) VALUES (?, ?, ?, ?)',
                (user_id, question_id, answer, correct),
            )

        total = len(question_ids)
        percentage = round((score / total) * 100) if total else 0
        cursor = conn.execute(
            'INSERT INTO quiz_attempts (user_id, quiz_set_id, score, total, percentage) VALUES (?, ?, ?, ?, ?)',
            (user_id, quiz_set_id, score, total, percentage),
        )
        attempt_id = cursor.lastrowid
        progress = get_user_progress(conn, user_id)
        conn.commit()
        return jsonify({
            'attemptId': attempt_id,
            'quizSetId': quiz_set_id,
            'score': score,
            'total': total,
            'percentage': percentage,
            'persisted': True,
            **database_storage_status(),
            'progress': progress,
        })
    except sqlite3.Error as error:
        if conn is not None:
            conn.rollback()
        report_database_fallback('/api/quiz/submit', error)
        return score_quiz_from_content(quiz_set_id, answers)
    except Exception:
        if conn is not None:
            conn.rollback()
        raise
    finally:
        if conn is not None:
            conn.close()


@app.route('/api/users/<int:user_id>/quiz-results', methods=['GET'])
def user_quiz_results(user_id):
    conn = get_db_connection()
    rows = conn.execute(
        '''
        SELECT qr.id, qr.question_id, qq.question_en AS question, qr.answer, qr.correct, qr.submitted_at
        FROM quiz_results qr
        INNER JOIN quiz_set_questions qq ON qq.id = qr.question_id
        WHERE qr.user_id = ?
        ORDER BY qr.submitted_at DESC
        ''',
        (user_id,),
    ).fetchall()
    conn.close()
    return jsonify([dict(row) for row in rows])


@app.route('/api/feedback', methods=['POST'])
def save_feedback():
    payload = request.get_json(silent=True) or {}
    required = ['age_group', 'difficult_lesson', 'suggestions']
    for field in required:
        if not payload.get(field):
            return jsonify({'error': 'Please complete the required feedback fields.'}), 400

    conn = get_db_connection()
    conn.execute(
        '''
        INSERT INTO feedback (name, age_group, difficult_lesson, telugu_support, video_support, voice_support, website_checking_easy, suggestions)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (
            payload.get('name') or '',
            payload.get('age_group'),
            payload.get('difficult_lesson'),
            1 if payload.get('telugu_support') in (True, 'yes', 'Yes', 'true', 'True') else 0,
            1 if payload.get('video_support') in (True, 'yes', 'Yes', 'true', 'True') else 0,
            1 if payload.get('voice_support') in (True, 'yes', 'Yes', 'true', 'True') else 0,
            1 if payload.get('website_checking_easy') in (True, 'yes', 'Yes', 'true', 'True') else 0,
            payload.get('suggestions'),
        ),
    )
    conn.commit()
    conn.close()
    return jsonify({'message': 'Feedback saved successfully.'}), 201


@app.cli.command('init-db')
def init_db_cli():
    init_db()
    print('Database initialized.')


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5001, debug=True)
