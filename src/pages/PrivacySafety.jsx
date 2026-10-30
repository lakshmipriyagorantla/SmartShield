export default function PrivacySafety() {
  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-slate-800 to-slate-700 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">Privacy & Safety</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-slate-100">
          SmartShield helps you learn and stay safe. We keep your data simple and clear.
        </p>
      </section>

      <div className="grid gap-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">What is stored locally?</h2>
          <ul className="mt-4 space-y-3 text-lg leading-8 text-slate-700">
            <li>• Emergency contacts are saved locally in your browser for this website demo.</li>
            <li>• Recent activity is kept inside the website for convenience and learning.</li>
            <li>• Accessibility settings such as font size and contrast are also saved in the browser.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">Important advice</h2>
          <ul className="mt-4 space-y-3 text-lg leading-8 text-slate-700">
            <li>• Never enter OTPs, passwords, UPI PINs, or bank details into any website unless you trust it completely.</li>
            <li>• Scam detection is helpful, but it is not a guarantee that a number, message, or link is safe.</li>
            <li>• Browser websites cannot intercept calls or SMS automatically. That requires a native Android app and device permissions.</li>
            <li>• Real protection for live call screening, message monitoring, and automatic blocking is planned for a future Android app and backend service.</li>
          </ul>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-3xl font-extrabold text-slate-900">What SmartShield does well</h2>
          <ul className="mt-4 space-y-3 text-lg leading-8 text-slate-700">
            <li>• Manage emergency contacts.</li>
            <li>• Open phone and SMS apps safely from the browser using tel: and sms: links.</li>
            <li>• Help identify suspicious messages, links, and phone numbers.</li>
            <li>• Let users learn smartphone skills and video safety lessons.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
