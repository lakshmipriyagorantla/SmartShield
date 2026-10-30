import { useSmartShield } from '../context/SmartShieldContext'

export default function Settings() {
  const { language, setLanguage, accessibility, setAccessibility } = useSmartShield()

  const updateAccessibility = (key, value) => {
    setAccessibility((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-slate-700 to-slate-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">Profile & Settings</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-100">
          Set your preferred language, text size, and emergency notes.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">User profile</h2>
          <div className="mt-5 space-y-4">
            <label className="block text-lg font-semibold text-slate-700">
              Name
              <input defaultValue="Sita Sharma" className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" />
            </label>
            <label className="block text-lg font-semibold text-slate-700">
              Preferred language
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg">
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="te">తెలుగు</option>
              </select>
            </label>
            <label className="block text-lg font-semibold text-slate-700">
              Emergency contact
              <input defaultValue="Asha" className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-lg" />
            </label>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">Accessibility</h2>
          <div className="mt-5 space-y-5">
            <div>
              <div className="mb-2 text-lg font-semibold text-slate-700">Text size</div>
              <div className="flex flex-wrap gap-3">
                {['normal', 'large', 'extra-large'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => updateAccessibility('textSize', size)}
                    className={`rounded-2xl px-4 py-3 text-lg font-semibold ${accessibility.textSize === size ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {size === 'normal' ? 'Normal' : size === 'large' ? 'Large' : 'Extra Large'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-lg font-semibold text-slate-700">Contrast</div>
              <div className="flex flex-wrap gap-3">
                {['standard', 'high'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => updateAccessibility('contrast', mode)}
                    className={`rounded-2xl px-4 py-3 text-lg font-semibold ${accessibility.contrast === mode ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-700'}`}
                  >
                    {mode === 'standard' ? 'Standard' : 'High Contrast'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 text-lg font-semibold text-slate-700">Reduced motion</div>
              <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-lg font-semibold text-slate-700">
                Reduce animation
                <input
                  type="checkbox"
                  checked={!!accessibility.reduceMotion}
                  onChange={(e) => updateAccessibility('reduceMotion', e.target.checked)}
                  className="h-6 w-6 accent-emerald-600"
                />
              </label>
            </div>

            <label className="flex items-center justify-between rounded-2xl bg-slate-50 p-4 text-lg font-semibold text-slate-700">
              Voice assistance
              <input
                type="checkbox"
                checked={!!accessibility.voice}
                onChange={(e) => updateAccessibility('voice', e.target.checked)}
                className="h-6 w-6 accent-emerald-600"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-extrabold text-slate-900">Privacy & safety</h2>
        <ul className="mt-4 space-y-3 text-lg leading-8 text-slate-700">
          <li>• Emergency contacts are sensitive information and should be kept only on trusted devices.</li>
          <li>• Do not save OTPs, UPI PINs, bank passwords, or identity numbers in the app.</li>
          <li>• Do not send private message content to a backend unless there is clear consent and secure HTTPS.</li>
          <li>• Scam detection is a helpful tool, not a guarantee that a call or message is safe.</li>
          <li>• Real-time Android call or SMS screening requires native app permissions and a backend service.</li>
        </ul>
      </div>
    </div>
  )
}
