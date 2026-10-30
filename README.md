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

## Installation

```bash
npm install
```

## Running the app

```bash
npm run dev
```

Then open the local URL shown in the terminal.

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
- Add secure backend and database for logs and user profiles
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

This app can be deployed to:

- Vercel
- Netlify
- Firebase Hosting
- Any static hosting service for Vite apps

Example:

```bash
npm run build
```

Then upload the generated `dist` folder to your hosting provider.

## Demo Notes

This is a realistic front-end prototype. It uses mock data and does not send real emergency alerts or SMS messages unless a backend and authentication are connected.
