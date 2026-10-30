import { useState } from 'react'
import VoiceAssistant from '../components/VoiceAssistant'

const commonCommands = [
  'Check this message.',
  'Teach me how to use WhatsApp.',
  'Read my safety alerts.',
  'How do I make a UPI payment?',
  'Call emergency.',
]

export default function VoiceAssistantPage() {
  const [command, setCommand] = useState('Check this message.')
  const [transcript, setTranscript] = useState('Listening for your request...')

  const handleSubmit = (text) => {
    setTranscript(text || 'Listening for your request...')
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-violet-700 to-purple-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">Voice Assistant</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-violet-50">
          Speak naturally and ask for help. The app can read security alerts and simple steps aloud.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <VoiceAssistant
          command={command}
          setCommand={setCommand}
          onSubmit={handleSubmit}
          transcript={transcript}
          spokenText="SmartShield is ready to help. Say 'Check this message' or 'How do I make a UPI payment?'"
        />

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-extrabold text-slate-900">Example commands</h2>
          <ul className="mt-4 space-y-3 text-lg text-slate-700">
            {commonCommands.map((item) => (
              <li key={item} className="rounded-2xl bg-slate-50 p-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
