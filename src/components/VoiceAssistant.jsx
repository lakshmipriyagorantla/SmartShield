import { Mic, Volume2, MessageSquareText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createVoiceService } from '../services/voiceService'

export default function VoiceAssistant({ command, setCommand, onSubmit, transcript, spokenText }) {
  const [voiceSupported, setVoiceSupported] = useState(true)

  useEffect(() => {
    const service = createVoiceService()
    setVoiceSupported(service.supported)
  }, [])

  const handleVoiceInput = () => {
    const service = createVoiceService()
    if (!service.supported) {
      setVoiceSupported(false)
      return
    }

    service.startListening((text) => {
      setCommand(text)
      if (onSubmit) {
        onSubmit(text)
      }
    })
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <Mic size={28} />
        </div>
        <div>
          <div className="text-2xl font-bold text-slate-900">Voice Assistant</div>
          <div className="text-base text-slate-600">Tap the microphone and speak.</div>
        </div>
      </div>

      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={handleVoiceInput}
          className="flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-lg font-semibold text-white shadow-sm hover:bg-violet-800"
        >
          <Mic size={20} />
          Speak
        </button>
        <button
          type="button"
          onClick={() => window.speechSynthesis?.speak(new SpeechSynthesisUtterance(spokenText || 'SmartShield is ready to help.'))}
          className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-lg font-semibold text-slate-700 border border-slate-300"
        >
          <Volume2 size={20} />
          Read Aloud
        </button>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-base font-semibold text-slate-700">Voice command</label>
        <textarea
          aria-label="Voice command input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-base focus:outline-none focus:ring-4 focus:ring-violet-200"
          placeholder="Example: Check this message."
        />
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-2"><MessageSquareText size={16} /> {transcript || 'No transcript yet'}</span>
          {!voiceSupported && <span className="text-red-600 font-semibold">Voice not supported</span>}
        </div>
      </div>
    </div>
  )
}
