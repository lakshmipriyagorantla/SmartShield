import unittest

from backend.app import app, ensure_database, migrate_learning_content
from backend.ml.risk_engine import analyze_phone_number, analyze_message, analyze_url


class LearningApiRegressionTests(unittest.TestCase):
    def setUp(self):
        ensure_database()
        migrate_learning_content()
        self.client = app.test_client()

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
