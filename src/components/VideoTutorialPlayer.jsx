import { AlertTriangle, Play, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { getTranslation } from '../utils/translations'

function getYoutubeEmbedUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}?rel=0&enablejsapi=1` : ''
}

export default function VideoTutorialPlayer({ tutorial, language = 'en', onComplete }) {
  const iframeRef = useRef(null)
  const completedRef = useRef(false)
  const [videoError, setVideoError] = useState('')

  useEffect(() => {
    completedRef.current = false
  }, [tutorial?.id, tutorial?.videoUrl])

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return
      const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data)
      if (data.includes('"event":"onStateChange"') && data.includes('"data":0')) {
        completedRef.current = true
        onComplete?.()
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onComplete])

  const markCompleted = () => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete?.()
  }

  if (!tutorial) return null

  const videoUrl = tutorial.videoUrl || 'VIDEO_URL_TO_BE_CONFIGURED'
  const isPlaceholder = !videoUrl || videoUrl === 'VIDEO_URL_TO_BE_CONFIGURED' || videoUrl.trim() === ''
  const youtubeUrl = getYoutubeEmbedUrl(videoUrl)

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      {isPlaceholder ? (
        <div className="relative aspect-video w-full bg-slate-100">
          {tutorial.thumbnailUrl ? (
            <img src={tutorial.thumbnailUrl} alt={tutorial.title || 'Tutorial thumbnail'} className="h-full w-full object-cover opacity-70" />
          ) : null}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/60 p-6 text-center text-white">
            <AlertTriangle className="mb-3 h-10 w-10 text-amber-300" />
            <div className="text-2xl font-black">{getTranslation(language, 'videos.videoUnavailable')}</div>
            <p className="mt-2 max-w-md text-base text-slate-200">{getTranslation(language, 'videos.addUrlPrompt')}</p>
          </div>
        </div>
      ) : youtubeUrl ? (
        <div className="aspect-video w-full">
          <iframe
            ref={iframeRef}
            title={tutorial.title || 'Video tutorial'}
            src={youtubeUrl}
            className="h-full w-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <div className="aspect-video w-full bg-slate-900">
          {videoError === videoUrl ? (
            <div role="alert" className="flex h-full items-center justify-center p-6 text-center text-lg font-semibold text-white">
              {getTranslation(language, 'videos.playbackError')}
            </div>
          ) : (
            <video
              controls
              preload="metadata"
              playsInline
              poster={tutorial.thumbnailUrl || undefined}
              className="h-full w-full object-cover"
              aria-label={tutorial.title || 'Tutorial video'}
              onEnded={markCompleted}
              onError={() => setVideoError(videoUrl)}
              onLoadedData={() => setVideoError('')}
            >
              <source src={videoUrl} type="video/mp4" />
            </video>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <div className="flex items-center gap-2 font-semibold">
          <Play size={16} className="text-emerald-700" />
          {getTranslation(language, 'videos.watchVideo')}
        </div>
        <div className="flex items-center gap-2 font-medium">
          <Volume2 size={16} className="text-sky-700" />
          {tutorial.duration || '00:00'}
        </div>
      </div>
    </div>
  )
}
