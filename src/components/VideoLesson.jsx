import { CheckCircle2, Gauge, Maximize2, Pause, Play, SkipBack, SkipForward, Volume2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

export default function VideoLesson({ tutorial, language = 'en', onNext, onPrevious, onComplete }) {
  const videoRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [volume, setVolume] = useState(80)
  const [showTranscript, setShowTranscript] = useState(true)

  const title = useMemo(() => tutorial?.title?.[language] || tutorial?.title?.en || tutorial?.title || 'Lesson', [tutorial, language])
  const description = useMemo(() => tutorial?.description?.[language] || tutorial?.description?.en || tutorial?.description || '', [tutorial, language])
  const transcript = useMemo(() => tutorial?.transcript?.[language] || tutorial?.transcript?.en || tutorial?.transcript || '', [tutorial, language])
  const steps = useMemo(() => tutorial?.steps?.[language] || tutorial?.steps?.en || tutorial?.steps || [], [tutorial, language])

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed
      videoRef.current.volume = volume / 100
    }
  }, [speed, volume])

  const togglePlay = async () => {
    if (!videoRef.current) return

    if (videoRef.current.paused) {
      await videoRef.current.play()
      setIsPlaying(true)
    } else {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handleProgress = () => {
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration) || videoRef.current.duration === 0) return
    setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100)
  }

  const handleSeek = (nextValue) => {
    if (!videoRef.current || !Number.isFinite(videoRef.current.duration) || videoRef.current.duration === 0) return
    videoRef.current.currentTime = (nextValue / 100) * videoRef.current.duration
    setProgress(nextValue)
  }

  const handleFullscreen = async () => {
    if (!videoRef.current) return
    if (videoRef.current.requestFullscreen) {
      await videoRef.current.requestFullscreen()
    }
  }

  if (!tutorial) return null

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold uppercase tracking-[0.2em] text-sky-700">{tutorial.category}</div>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{title}</h2>
        </div>
        <div className="rounded-full bg-sky-100 px-3 py-2 text-sm font-bold text-sky-900">{tutorial.duration}</div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900">
        <video
          ref={videoRef}
          src={tutorial.videoUrl}
          className="h-72 w-full object-cover md:h-80"
          playsInline
          onTimeUpdate={handleProgress}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={onPrevious} className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-800">Previous</button>
        <button type="button" onClick={togglePlay} className="rounded-2xl bg-sky-700 px-4 py-3 text-lg font-semibold text-white">
          {isPlaying ? <><Pause size={18} className="inline" /> Pause</> : <><Play size={18} className="inline" /> Play</>}
        </button>
        <button type="button" onClick={handleFullscreen} className="rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-800">
          <Maximize2 size={18} className="inline" /> Fullscreen
        </button>
        <button type="button" onClick={onComplete} className="rounded-2xl bg-emerald-700 px-4 py-3 text-lg font-semibold text-white">
          <CheckCircle2 size={18} className="inline" /> Mark complete
        </button>
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 p-4">
        <div className="mb-3 flex items-center justify-between text-base font-bold text-slate-700">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={progress}
          onChange={(event) => handleSeek(Number(event.target.value))}
          className="w-full accent-sky-600"
          aria-label="Video progress"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <label className="flex items-center gap-2 text-lg font-semibold text-slate-700">
          <Gauge size={18} /> Speed
          <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-base">
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
          </select>
        </label>

        <label className="flex items-center gap-2 text-lg font-semibold text-slate-700">
          <Volume2 size={18} /> Volume
          <input type="range" min="0" max="100" value={volume} onChange={(event) => setVolume(Number(event.target.value))} className="w-24 accent-violet-600" aria-label="Video volume" />
        </label>
      </div>

      <div className="mt-6 rounded-2xl bg-sky-50 p-4">
        <div className="text-2xl font-extrabold text-slate-900">Lesson summary</div>
        <p className="mt-2 text-lg leading-8 text-slate-700">{description}</p>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="text-2xl font-extrabold text-slate-900">Step by step</div>
          <ol className="mt-4 space-y-3">
            {steps.map((step, index) => (
              <li key={`${step}-${index}`} className="flex gap-3 rounded-2xl border border-slate-200 p-3 text-lg text-slate-700">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sm font-extrabold text-sky-900">{index + 1}</span>
                <span className="flex-1 leading-7">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-extrabold text-slate-900">Transcript</div>
            <button type="button" onClick={() => setShowTranscript((value) => !value)} className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
              {showTranscript ? 'Hide' : 'Show'}
            </button>
          </div>
          {showTranscript && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-lg leading-8 text-slate-700">
              {transcript}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={onPrevious} className="flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-lg font-semibold text-slate-800">
          <SkipBack size={18} /> Previous lesson
        </button>
        <button type="button" onClick={onNext} className="flex items-center gap-2 rounded-2xl bg-violet-700 px-4 py-3 text-lg font-semibold text-white">
          Next lesson <SkipForward size={18} />
        </button>
      </div>
    </div>
  )
}
