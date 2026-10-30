import { Search, SlidersHorizontal, Video, ChevronRight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVideoTutorials } from '../services/videoTutorialService'
import { getTranslation } from '../utils/translations'
import { useSmartShield } from '../context/SmartShieldContext'

export default function VideoTutorialsPage() {
  const { language } = useSmartShield()
  const [videos, setVideos] = useState([])
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    setLoading(true)
    fetchVideoTutorials(language)
      .then((items) => {
        if (isActive) {
          setVideos(items)
          setError('')
        }
      })
      .catch(() => {
        if (isActive) {
          setError(getTranslation(language, 'videos.loadError'))
        }
      })
      .finally(() => {
        if (isActive) setLoading(false)
      })

    return () => {
      isActive = false
    }
  }, [language])

  const categories = useMemo(() => {
    const unique = [...new Set(videos.map((item) => item.categoryKey || item.category))]
    return unique.map((categoryKey) => ({
      key: categoryKey,
      label: categoryKey && categoryKey.startsWith('videoCategories.') ? getTranslation(language, categoryKey) : categoryKey,
    }))
  }, [videos, language])

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase()
    return videos.filter((video) => {
      const matchesCategory = selectedCategory === 'all' || video.categoryKey === selectedCategory || video.category === selectedCategory
      const searchableText = `${video.title || ''} ${video.description || ''}`.toLowerCase()
      const matchesSearch = !query || searchableText.includes(query)
      return matchesCategory && matchesSearch
    })
  }, [videos, search, selectedCategory])

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-indigo-700 to-violet-600 p-8 text-white shadow-lg">
        <h1 className="text-4xl font-black">{getTranslation(language, 'videos.title')}</h1>
        <p className="mt-3 max-w-2xl text-lg leading-8 text-violet-50">{getTranslation(language, 'videos.subtitle')}</p>
      </section>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <Search className="text-slate-500" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={getTranslation(language, 'videos.searchPlaceholder')}
              className="w-full bg-transparent text-base text-slate-800 placeholder:text-slate-400 focus:outline-none"
              aria-label={getTranslation(language, 'videos.searchPlaceholder')}
            />
          </label>

          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
            <SlidersHorizontal className="text-slate-500" size={18} />
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full bg-transparent text-base text-slate-800 focus:outline-none"
              aria-label={getTranslation(language, 'videos.categoryFilter')}
            >
              <option value="all">{getTranslation(language, 'videos.allCategories')}</option>
              {categories.map((category) => (
                <option key={category.key} value={category.key}>{category.label}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-xl font-semibold text-slate-700">
          {getTranslation(language, 'videos.loading')}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-lg text-rose-900">
          {error}
        </div>
      ) : filteredVideos.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center text-lg text-slate-700">
          {getTranslation(language, 'videos.emptyState')}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredVideos.map((video) => (
            <div key={video.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md">
              <div className="relative">
                <img src={video.thumbnailUrl || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80'} alt={video.title} className="h-52 w-full object-cover" />
                <div className="absolute left-3 top-3 rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-white">
                  {video.duration || '00:00'}
                </div>
              </div>

              <div className="p-5">
                <div className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-violet-700">
                  {video.categoryKey ? getTranslation(language, video.categoryKey) : video.category}
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">{video.title}</h2>
                <p className="mt-3 line-clamp-3 text-base leading-7 text-slate-600">{video.description}</p>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-violet-100 px-3 py-2 text-sm font-bold text-violet-900">
                    <Video size={16} /> {getTranslation(language, 'videos.watchVideo')}
                  </div>
                  <Link
                    to={`/video-tutorials/${video.id}`}
                    className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white"
                  >
                    {getTranslation(language, 'videos.learnMore')} <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
