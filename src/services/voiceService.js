export function createVoiceService() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

  if (!SpeechRecognition) {
    return {
      supported: false,
      startListening: () => ({ error: 'Voice input is not supported on this browser.' }),
      stopListening: () => {},
      speak: () => {},
    }
  }

  const recognition = new SpeechRecognition()
  recognition.lang = 'en-IN'
  recognition.interimResults = false
  recognition.maxAlternatives = 1

  return {
    supported: true,
    recognition,
    startListening: (onResult) => {
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        onResult?.(transcript)
      }
      recognition.start()
    },
    stopListening: () => recognition.stop(),
    speak: (text) => {
      if (!('speechSynthesis' in window)) return
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      utterance.pitch = 1
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utterance)
    },
  }
}
