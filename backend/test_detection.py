import sqlite3
import tempfile
import unittest
import re
from pathlib import Path
from unittest.mock import patch

import backend.app as backend_app
from backend.app import app, ensure_database
from backend.ml.risk_engine import analyze_phone_number, analyze_message, analyze_url


class LearningApiRegressionTests(unittest.TestCase):
    def setUp(self):
        self.original_db_path = backend_app.DB_PATH
        self.original_database_initialized = backend_app._database_initialized
        self.temp_dir = tempfile.TemporaryDirectory()
        backend_app.DB_PATH = Path(self.temp_dir.name) / 'test_smart_shield.db'
        backend_app._database_initialized = False
        ensure_database()
        self.client = app.test_client()

    def tearDown(self):
        backend_app.DB_PATH = self.original_db_path
        backend_app._database_initialized = self.original_database_initialized
        self.temp_dir.cleanup()

    def test_database_initialization_creates_required_learning_tables(self):
        conn = sqlite3.connect(backend_app.DB_PATH)
        try:
            tables = {
                row[0]
                for row in conn.execute(
                    "SELECT name FROM sqlite_master WHERE type='table'"
                )
            }
        finally:
            conn.close()

        self.assertTrue(backend_app.REQUIRED_LEARNING_TABLES.issubset(tables))

    def test_lessons_include_translations_and_completion_progress(self):
        default_response = self.client.get('/api/lessons')
        self.assertEqual(default_response.status_code, 200)
        self.assertGreater(len(default_response.get_json()), 0)

        response = self.client.get('/api/lessons?language=hi')
        self.assertEqual(response.status_code, 200)
        lessons = response.get_json()
        self.assertGreater(len(lessons), 0)
        self.assertEqual(lessons[0]['language'], 'hi')
        self.assertTrue(lessons[0]['title'])
        self.assertTrue(lessons[0]['description'])

        detail = self.client.get(f"/api/lessons/{lessons[0]['id']}")
        self.assertEqual(detail.status_code, 200)

        completion = self.client.post(
            f"/api/lessons/{lessons[0]['id']}/complete",
            json={'user_id': 998877},
        )
        self.assertEqual(completion.status_code, 200, completion.get_json())
        self.assertTrue(completion.get_json()['persisted'])
        self.assertIn(
            lessons[0]['id'],
            completion.get_json()['progress']['completed_lesson_ids'],
        )
        progress = self.client.get('/api/users/998877/progress')
        self.assertEqual(progress.status_code, 200)
        self.assertIn(lessons[0]['id'], progress.get_json()['completed_lesson_ids'])

    def test_quiz_sets_include_descriptions_questions_options_and_explanations(self):
        response = self.client.get('/api/quiz?language=te')
        self.assertEqual(response.status_code, 200)
        quiz_sets = response.get_json()
        self.assertGreater(len(quiz_sets), 0)
        quiz = quiz_sets[0]
        self.assertTrue(quiz['title'])
        self.assertTrue(quiz['description'])
        self.assertGreater(len(quiz['questions']), 0)
        self.assertEqual(len(quiz['questions'][0]['options']), 4)
        self.assertIn(quiz['questions'][0]['correctOption'], {'A', 'B', 'C', 'D'})
        self.assertTrue(quiz['questions'][0]['explanation'])

    def test_every_quiz_category_is_fully_localized_and_switching_preserves_ids(self):
        responses = {
            language: self.client.get(f'/api/quiz?language={language}')
            for language in ('en', 'hi', 'te')
        }
        for response in responses.values():
            self.assertEqual(response.status_code, 200, response.get_json())
        localized_sets = {
            language: {quiz['id']: quiz for quiz in response.get_json()}
            for language, response in responses.items()
        }
        english_sets = localized_sets['en']
        telugu_sets = localized_sets['te']
        self.assertEqual(set(english_sets), set(telugu_sets))
        self.assertEqual(len(english_sets), 10)
        conn = sqlite3.connect(backend_app.DB_PATH)
        try:
            stored_answers = {
                quiz_id: conn.execute(
                    '''
                    SELECT id, correct_option FROM quiz_set_questions
                    WHERE quiz_set_id = ? ORDER BY id
                    ''',
                    (quiz_id,),
                ).fetchall()
                for quiz_id in english_sets
            }
        finally:
            conn.close()

        for quiz_id, english_quiz in english_sets.items():
            telugu_quiz = telugu_sets[quiz_id]
            self.assertEqual(len(english_quiz['questions']), 10)
            self.assertEqual(len(telugu_quiz['questions']), 10)
            self.assertEqual(len(telugu_quiz['questions']), len(english_quiz['questions']))
            self.assertNotEqual(telugu_quiz['title'], english_quiz['title'])
            self.assertNotEqual(telugu_quiz['description'], english_quiz['description'])
            self.assertEqual(telugu_quiz['title_te'], telugu_quiz['title'])
            self.assertEqual(telugu_quiz['description_te'], telugu_quiz['description'])
            for language in ('en', 'hi', 'te'):
                localized_quiz = localized_sets[language][quiz_id]
                self.assertEqual(len(localized_quiz['questions']), 10)
                self.assertTrue(localized_quiz['title'])
                self.assertTrue(localized_quiz['description'])
                self.assertEqual(localized_quiz['language'], language)
                self.assertEqual(localized_quiz['title'], localized_quiz[f'title_{language}'])
                self.assertEqual(
                    localized_quiz['description'],
                    localized_quiz[f'description_{language}'],
                )
                for question in localized_quiz['questions']:
                    self.assertTrue(question[f'question_{language}'])
                    self.assertTrue(question[f'explanation_{language}'])
                    self.assertEqual(len(question['options']), 4)
                    self.assertEqual(question['question'], question[f'question_{language}'])
                    self.assertEqual(
                        question['explanation'],
                        question[f'explanation_{language}'],
                    )
                    self.assertEqual(
                        question['options'],
                        [
                            question[f'option_{option}_{language}']
                            for option in ('A', 'B', 'C', 'D')
                        ],
                    )
                    for option_key in ('A', 'B', 'C', 'D'):
                        self.assertTrue(question[f'option_{option_key}_{language}'])
                    if language == 'hi':
                        localized_text = [
                            localized_quiz['title'],
                            localized_quiz['description'],
                            question['question'],
                            *question['options'],
                            question['explanation'],
                        ]
                        for text in localized_text:
                            self.assertRegex(text, r'[\u0900-\u097f]')
                            text_without_allowed_terms = re.sub(
                                r'\b(?:OTP|UPI|PIN|SMS|Wi-?Fi|QR|SIM|GPS|USB|URL|HTTPS|'
                                r'Android|iPhone|Google|WhatsApp|Facebook|Instagram|'
                                r'YouTube|Bluetooth|PDF|Aadhaar|NFC|ATM|GooglePay|Paytm)\b',
                                '',
                                text,
                                flags=re.IGNORECASE,
                            )
                            self.assertIsNone(
                                re.search(r'[A-Za-z]', text_without_allowed_terms),
                                text,
                            )
            for question_index, (english_question, telugu_question) in enumerate(zip(
                english_quiz['questions'],
                telugu_quiz['questions'],
            )):
                self.assertEqual(telugu_question['id'], english_question['id'])
                stored_question_id, stored_correct_option = stored_answers[quiz_id][question_index]
                self.assertEqual(english_question['id'], stored_question_id)
                self.assertEqual(english_question['correctOption'], stored_correct_option)
                self.assertEqual(
                    telugu_question['question_te'],
                    telugu_question['question'],
                )
                self.assertEqual(
                    telugu_question['explanation_te'],
                    telugu_question['explanation'],
                )
                self.assertEqual(
                    telugu_question['correctOption'],
                    english_question['correctOption'],
                )
                self.assertEqual(len(telugu_question['options']), 4)
                localized_text = [
                    telugu_quiz['title'],
                    telugu_quiz['description'],
                    telugu_question['question'],
                    *telugu_question['options'],
                    telugu_question['explanation'],
                ]
                for text in localized_text:
                    self.assertRegex(text, r'[\u0c00-\u0c7f]')
                    self.assertIsNone(re.search(r'[A-Za-z]', text), text)
                for option_index, option_key in enumerate(('A', 'B', 'C', 'D')):
                    self.assertEqual(
                        telugu_question[f'option_{option_key}_te'],
                        telugu_question['options'][option_index],
                    )

    def test_missing_telugu_quiz_translations_return_an_explicit_error(self):
        with patch('backend.app.TELUGU_QUIZ_TEXT', {}):
            response = self.client.get('/api/quiz?language=te')

        self.assertEqual(response.status_code, 500)
        self.assertIn('incomplete', response.get_json()['error'].lower())

    def test_missing_hindi_quiz_translations_return_an_explicit_error(self):
        with patch('backend.app.HINDI_QUIZ_TEXT', {}):
            response = self.client.get('/api/quiz?language=hi')

        self.assertEqual(response.status_code, 500)
        self.assertIn('incomplete', response.get_json()['error'].lower())

    def test_quiz_submission_returns_score_and_percentage(self):
        quiz_response = self.client.get('/api/quiz')
        self.assertEqual(quiz_response.status_code, 200)
        quiz = quiz_response.get_json()[0]
        answers = [
            {'question_id': question['id'], 'answer': question['correctOption']}
            for question in quiz['questions']
        ]

        response = self.client.post('/api/quiz/submit', json={
            'user_id': 998876,
            'quiz_set_id': quiz['id'],
            'answers': answers,
        })

        self.assertEqual(response.status_code, 200, response.get_json())
        result = response.get_json()
        self.assertEqual(result['score'], len(answers))
        self.assertEqual(result['total'], len(answers))
        self.assertEqual(result['percentage'], 100)
        self.assertTrue(result['persisted'])

        answers[0]['answer'] = (
            'A' if answers[0]['answer'] != 'A' else 'B'
        )
        response = self.client.post('/api/quiz/submit', json={
            'user_id': 998876,
            'quiz_set_id': quiz['id'],
            'answers': answers,
        })
        self.assertEqual(response.status_code, 200, response.get_json())
        result = response.get_json()
        self.assertEqual(result['score'], len(answers) - 1)
        self.assertEqual(result['total'], len(answers))
        self.assertEqual(result['percentage'], 90)

    def test_quiz_submission_flow_works_for_every_category_in_both_languages(self):
        for language in ('en', 'te'):
            response = self.client.get(f'/api/quiz?language={language}')
            self.assertEqual(response.status_code, 200, response.get_json())
            quiz_sets = response.get_json()
            self.assertEqual(len(quiz_sets), 10)

            for quiz in quiz_sets:
                self.assertEqual(quiz['language'], language)
                self.assertEqual(len(quiz['questions']), 10)
                first_question = quiz['questions'][0]
                self.assertEqual(len(first_question['options']), 4)
                completion_answers = [
                    {'question_id': question['id'], 'answer': question['correctOption']}
                    for question in quiz['questions']
                ]
                result_response = self.client.post('/api/quiz/submit', json={
                    'user_id': 998874,
                    'quiz_set_id': quiz['id'],
                    'answers': completion_answers,
                })
                self.assertEqual(
                    result_response.status_code,
                    200,
                    result_response.get_json(),
                )
                result = result_response.get_json()
                self.assertEqual(result['score'], 10)
                self.assertEqual(result['total'], 10)
                self.assertEqual(result['percentage'], 100)

    def test_content_migration_preserves_existing_lesson_records(self):
        conn = sqlite3.connect(backend_app.DB_PATH)
        try:
            conn.execute(
                'UPDATE lessons SET title_en = ? WHERE id = ?',
                ('Preserve this existing lesson', 'unlock-phone'),
            )
            conn.commit()
        finally:
            conn.close()

        backend_app._database_initialized = False
        ensure_database()

        conn = sqlite3.connect(backend_app.DB_PATH)
        try:
            lesson = conn.execute(
                'SELECT title_en FROM lessons WHERE id = ?',
                ('unlock-phone',),
            ).fetchone()
        finally:
            conn.close()
        self.assertEqual(lesson[0], 'Preserve this existing lesson')

    def test_learning_content_fallback_keeps_lessons_and_quizzes_available(self):
        with patch(
            'backend.app.get_db_connection',
            side_effect=sqlite3.OperationalError('database unavailable'),
        ):
            lessons = self.client.get('/api/lessons?language=en')
            self.assertEqual(lessons.status_code, 200)
            self.assertEqual(
                lessons.headers['X-SmartShield-Content-Source'],
                'backend.learning_content',
            )
            self.assertEqual(lessons.headers['X-SmartShield-Storage'], 'unavailable')
            self.assertGreater(len(lessons.get_json()), 0)

            completion = self.client.post(
                '/api/lessons/intro-smartphone/complete',
                json={'user_id': 998875},
            )
            self.assertEqual(completion.status_code, 200)
            self.assertFalse(completion.get_json()['persisted'])

            quiz_response = self.client.get('/api/quiz?language=en')
            self.assertEqual(quiz_response.status_code, 200)
            quiz = quiz_response.get_json()[0]
            answers = [
                {'question_id': question['id'] + 500, 'answer': question['correctOption']}
                for question in quiz['questions']
            ]
            result = self.client.post('/api/quiz/submit', json={
                'quiz_set_id': quiz['id'],
                'answers': answers,
            })

        self.assertEqual(result.status_code, 200, result.get_json())
        self.assertEqual(result.get_json()['percentage'], 100)
        self.assertFalse(result.get_json()['persisted'])

    def test_quiz_submission_creates_missing_user(self):
        response = self.client.get('/api/quiz?language=en')
        self.assertEqual(response.status_code, 200)
        quiz_sets = response.get_json()
        quiz_set = quiz_sets[0]
        answers = [
            {'question_id': question['id'], 'answer': question['correctOption']}
            for question in quiz_set['questions']
        ]

        response = self.client.post('/api/quiz/submit', json={
            'user_id': 999999,
            'quiz_set_id': quiz_set['id'],
            'answers': answers,
        })

        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(response.get_json()['score'], len(answers))

    def test_video_completion_creates_missing_user(self):
        response = self.client.post(
            '/api/video-tutorials/youtube-online-scams/complete',
            json={'user_id': 999998},
        )

        self.assertEqual(response.status_code, 200, response.get_json())


class DetectionRegressionTests(unittest.TestCase):
    def test_benign_message_is_low_risk(self):
        result = analyze_message('Hi, are we still meeting tomorrow at 6 PM?')
        self.assertLessEqual(result['risk_score'], 35)
        self.assertNotEqual(result['risk_level'], 'Very high risk')

    def test_otp_scam_message_is_high_risk(self):
        result = analyze_message('URGENT! Your bank account will be blocked. Send your OTP immediately.')
        self.assertGreaterEqual(result['risk_score'], 60)
        self.assertIn('OTP_REQUEST', result['indicators'])

    def test_phone_number_has_structured_result(self):
        result = analyze_phone_number('+91 90000 11111')
        self.assertIn('status', result)
        self.assertIn('riskScore', result)
        self.assertIn('reasonKeys', result)

    def test_url_with_shortener_is_risky(self):
        result = analyze_url('https://bit.ly/secure-login')
        self.assertGreaterEqual(result['risk_score'], 45)
        self.assertIn('SHORTENED_URL', result['indicators'])


if __name__ == '__main__':
    unittest.main()
