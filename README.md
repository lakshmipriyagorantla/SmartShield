# SmartShield

SmartShield is a senior-friendly web application designed to help older adults learn smartphone basics, identify scams, verify payments safely, and access emergency support through a simple and trusted interface.

## Features

- Senior-friendly dashboard and large, readable UI
- Scam detection for SMS, WhatsApp, email, and suspicious messages
- Beginner smartphone tutorials with simple step-by-step instructions
- Call and SMS safety monitoring page with demo alerts
- Safe UPI and QR verification flow
- Voice assistant with speech recognition support when available
- Emergency SOS demo with emergency settings
- Cyber safety tips and a rotating tip of the day
- Multi-language support for English, Hindi, and Telugu
- Accessibility settings for text size and high contrast
- LocalStorage-based settings persistence

## Technology Stack

- React.js
- Vite
- JavaScript
- Tailwind CSS
- React Router
- Lucide React icons
- Python Flask API
- SQLite for local development

## Installation

```bash
npm install
```

Install the backend dependencies in a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Running locally

Start the Flask API in one terminal:

```bash
.venv\Scripts\activate
python -m flask --app backend.app run --debug --host 127.0.0.1 --port 5001
```

Start the frontend in a second terminal:

```bash
npm run dev
```

The Vite development server proxies `/api` requests to Flask. The backend initializes missing SQLite tables without replacing existing records.
Restart the Flask command after changing API or quiz content; the debug option
reloads the backend when source files change.
If an older Flask process is already listening on port 5001, stop it in its
original terminal with Ctrl+C before starting the updated backend so it does not
continue serving a stale quiz response.

To start the existing Flask backend and Vite frontend together, wait for the
quiz API to be ready, and keep both running in one terminal, use:

```bash
npm run dev:stack
```

Stop both servers with Ctrl+C. This command uses the existing Flask port 5001
and lets Vite choose its normal available development port.

## Project Structure

```text
src/
  components/
  context/
  data/
  locales/
  pages/
  services/
  utils/
  App.jsx
  main.jsx
  index.css
```

## Future Improvements

- Connect a real AI fraud detection API
- Add Android/iOS app integration for call and SMS detection
- Use a persistent managed database for production progress and quiz history
- Improve voice understanding with real natural language processing
- Add multilingual voice support and accessibility enhancements

## Connecting Real AI APIs

The service layer is isolated under `src/services/` so it can be replaced later with real API integrations:

- `scamDetectionService.js` for fraud or scam detection
- `qrVerificationService.js` for payment verification logic
- `voiceService.js` for speech recognition and text-to-speech

For production integration, add environment variables such as:

```bash
VITE_AI_API_URL=
VITE_AI_API_KEY=
```

Then replace the mock logic in the service files with API calls that validate input safely and never expose secret keys in client code.

## Deployment

Vercel builds the frontend into `dist` and serves the Flask API through `api/index.py`. The frontend uses same-origin API URLs; `VITE_API_BASE_URL` is only needed if the API is hosted on a different origin.

Vercel's function filesystem is temporary. The API uses `/tmp/smart_shield.db` there and serves authored lesson and quiz content from `backend/learning_content.py` if SQLite is missing or unavailable. Browser lesson progress remains in that device's local storage. For durable quiz attempts and server-side progress shared across devices, migrate SQLite to a managed PostgreSQL database before relying on those records in production; do not use the bundled SQLite file as persistent Vercel storage.

Deploy from the project root using the Vercel CLI:

```bash
npx vercel
npx vercel --prod
```

Alternatively, connect the Git repository to Vercel and redeploy the production branch after pushing the changes.

The full-stack app can be deployed to:

- Vercel (Vite frontend and Flask API)
- Netlify
- Firebase Hosting
- Other static hosts when the Flask API is deployed separately

Build locally with:

```bash
npm run build
```

## Demo Notes

The smartphone lessons and cyber safety quiz use the Flask API and authored content. On Vercel, lesson progress is kept in the current browser and SQLite-backed server progress is temporary; use a managed database for durable, cross-device progress. Emergency alerts and SMS actions remain demonstrations and do not contact emergency services or send messages.
