import { Pause, Play, Volume2, SkipBack, SkipForward, CheckCircle2, Maximize2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function VideoLessonPlayer({ lesson, language, onNext, onPrevious, onComplete }) {
  const videoRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(80)

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100
      videoRef.current.muted = muted
    }
  }, [volume, muted])

  if (!lesson) return null

  const title = lesson.title?.[language] || lesson.title?.en || lesson.title
  const description = lesson.description?.[language] || lesson.description?.en || lesson.description
  const transcript = lesson.transcript?.[language] || lesson.transcript?.en || lesson.transcript
  const steps = lesson.steps?.[language] || lesson.steps?.en || lesson.steps || []

  const togglePlay = async () => {
    if (!videoRef.current) return

    if (videoRef.current.paused) {
      await videoRef.current.play()
      setPlaying(true)
    } else {
      videoRef.current.pause()
      setPlaying(false)
    }
  }

  const handleTimeUpdate = () => {
    if (!videoRef.current) return
    const current = (videoRef.current.currentTime / videoRef.current.duration) * 100 || 0
    setProgress(current)
  }

  const handleFullscreen = async () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      await videoRef.current.requestFullscreen()
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-wide text-sky-700">{lesson.category}</div>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{title}</h2>
        </div>
        <div className="rounded-full bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-900">{lesson.duration}</div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl">
        <video
          ref={videoRef}
          src={lesson.videoUrl}
          controls={false}
          className="h-72 w-full object-cover md:h-80"
          onTimeUpdate={handleTimeUpdate}
          onPause={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onPrevious} className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-800">Previous</button>
        <button type="button" onClick={togglePlay} className="rounded-2xl bg-sky-700 px-4 py-3 text-lg font-semibold text-white">
          {playing ? <><Pause size={20} className="inline" /> Pause</> : <><Play size={20} className="inline" /> Play</>}
        </button>
        <button type="button" onClick={() => setMuted((value) => !value)} className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-800">
          <Volume2 size={20} className="inline" /> {muted ? 'Muted' : 'Sound'}
        </button>
        <button type="button" onClick={handleFullscreen} className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-800">
          <Maximize2 size={20} className="inline" /> Fullscreen
        </button>
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-base font-semibold text-slate-700">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(event) => {
            const nextProgress = Number(event.target.value)
            setProgress(nextProgress)
            if (videoRef.current && videoRef.current.duration) {
              videoRef.current.currentTime = (nextProgress / 100) * videoRef.current.duration
            }
          }}
          className="w-full accent-sky-600"
          aria-label="Lesson progress"
        />
      </div>

      <div className="mt-5 rounded-2xl bg-sky-50 p-4">
        <div className="text-xl font-bold text-slate-900">Lesson summary</div>
        <p className="mt-2 text-lg leading-8 text-slate-700">{description}</p>
      </div>

      <div className="mt-6">
        <div className="text-xl font-bold text-slate-900">Step-by-step</div>
        <ol className="mt-3 space-y-3">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3 rounded-2xl border border-slate-200 p-3 text-lg">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-bold text-sky-900">{index + 1}</span>
              <span className="flex-1 leading-7 text-slate-700">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-lg leading-8 text-slate-700">
        <strong>Captions:</strong> {transcript}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onPrevious} className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-800">
          <SkipBack size={18} /> Previous Lesson
        </button>
        <button type="button" onClick={onNext} className="flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-3 text-lg font-semibold text-white">
          Next Lesson <SkipForward size={18} />
        </button>
        <button type="button" onClick={onComplete} className="flex items-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-lg font-semibold text-white">
          <CheckCircle2 size={18} /> Mark as Completed
        </button>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <label className="text-base font-semibold text-slate-700">Volume</label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(event) => setVolume(Number(event.target.value))}
          className="w-32 accent-violet-600"
          aria-label="Volume"
        />
      </div>
    </div>
  )
}
