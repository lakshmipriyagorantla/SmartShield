import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Trophy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '../services/apiClient'
import { getTranslation } from '../utils/translations'
import { useSmartShield } from '../context/SmartShieldContext'

function isCompleteLocalizedText(value, language) {
  if (typeof value !== 'string') return false
  if (language === 'te') {
    return /[\u0c00-\u0c7f]/.test(value)
      && !/[A-Za-z]/.test(value.replace(/\b(?:OTP|UPI)\b/g, ''))
  }
  if (language === 'hi') {
    const allowedTerms = /\b(?:OTP|UPI|PIN|SMS|Wi-?Fi|QR|SIM|GPS|USB|URL|HTTPS|Android|iPhone|Google|WhatsApp|Facebook|Instagram|YouTube|Bluetooth|PDF|Aadhaar|NFC|ATM|GooglePay|Paytm)\b/gi
    return /[\u0900-\u097f]/.test(value)
      && !/[A-Za-z]/.test(value.replace(allowedTerms, ''))
  }
  return true
}

function validateQuizSets(quizSets, language) {
  if (!Array.isArray(quizSets)) {
    throw new Error('Quiz API returned an invalid response.')
  }

  for (const quiz of quizSets) {
    if (
      quiz.language !== language
      || !quiz.title
      || !quiz.description
      || quiz.title !== quiz[`title_${language}`]
      || quiz.description !== quiz[`description_${language}`]
      || !Array.isArray(quiz.questions)
    ) {
      throw new Error(`Quiz API did not return a complete ${language} translation.`)
    }

    const localizedQuizFields = [quiz.title, quiz.description]
    if (localizedQuizFields.some((value) => !isCompleteLocalizedText(value, language))) {
      throw new Error(`Quiz API returned incomplete ${language} category text.`)
    }

    for (const question of quiz.questions) {
      const localizedFields = [
        question.question,
        question.explanation,
        ...(Array.isArray(question.options) ? question.options : []),
      ]
      const languageFields = [
        question[`question_${language}`],
        question[`explanation_${language}`],
        ...['A', 'B', 'C', 'D'].map((option) => question[`option_${option}_${language}`]),
      ]
      const hasCompleteTranslation = question.options?.length === 4
        && localizedFields.every((value) => typeof value === 'string' && value.trim())
        && languageFields.every((value) => typeof value === 'string' && value.trim())
        && question.question === question[`question_${language}`]
        && question.explanation === question[`explanation_${language}`]
        && question.options.every((option, index) => option === languageFields[index + 2])
        && ['A', 'B', 'C', 'D'].includes(question.correctOption)

      const hasIncompleteLanguageText = [...localizedFields]
        .some((value) => !isCompleteLocalizedText(value, language))

      if (!hasCompleteTranslation || hasIncompleteLanguageText) {
        throw new Error(`Quiz API returned incomplete ${language} content.`)
      }
    }
  }
}

export default function QuizPage() {
  const navigate = useNavigate()
  const { language } = useSmartShield()
  const [searchParams, setSearchParams] = useSearchParams()
  const preferredSetId = useRef(searchParams.get('quizSetId') || '')
  const [quizSets, setQuizSets] = useState([])
  const [selectedSetId, setSelectedSetId] = useState(preferredSetId.current)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    const loadQuizSets = async () => {
      try {
        const data = await apiClient.get(`/api/quiz?language=${encodeURIComponent(language)}`)
        validateQuizSets(data, language)
        if (!active) return
        setQuizSets(data)
        const requestedId = preferredSetId.current
        const initialId = requestedId && data.some((quiz) => quiz.id === requestedId)
          ? requestedId
          : data[0]?.id
        preferredSetId.current = initialId || ''
        if (initialId) {
          setSelectedSetId(initialId)
          if (!requestedId) setSearchParams({ quizSetId: initialId }, { replace: true })
        }
      } catch (loadError) {
        console.error('Unable to load quiz sets:', loadError)
        if (active) setError(getTranslation(language, 'quiz.loadError'))
      } finally {
        if (active) setLoading(false)
      }
    }
    loadQuizSets()
    return () => { active = false }
  }, [language, retryCount, setSearchParams])

  const localizedQuizSets = quizSets.filter((item) => item.language === language)
  const selectedQuiz = localizedQuizSets.find((item) => item.id === selectedSetId)
  const questions = selectedQuiz?.questions || []
  const currentQuestion = questions[currentIndex]
  const answeredCount = Object.keys(answers).length
  const progress = questions.length ? Math.round((answeredCount / questions.length) * 100) : 0

  const selectQuiz = (quizSetId) => {
    preferredSetId.current = quizSetId
    setSelectedSetId(quizSetId)
    setCurrentIndex(0)
    setAnswers({})
    setResult(null)
    setError('')
    if (quizSetId) {
      setSearchParams({ quizSetId }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }))
  }

  const handleSubmit = async () => {
    if (!selectedSetId || !questions.length) return
    setSubmitting(true)
    setError('')
    try {
      const payload = questions.map((question) => ({
        question_id: question.id,
        answer: answers[question.id] || '',
      }))
      const nextResult = await apiClient.post('/api/quiz/submit', {
        user_id: 1,
        quiz_set_id: selectedSetId,
        answers: payload,
      })
      setResult(nextResult)
    } catch {
      setError(getTranslation(language, 'quiz.submitError'))
    } finally {
      setSubmitting(false)
    }
  }

  const resetQuiz = () => {
    setAnswers({})
    setCurrentIndex(0)
    setResult(null)
    setError('')
  }

  const answeredQuestions = questions.map((question) => ({
    ...question,
    selected: answers[question.id],
    correct: answers[question.id] === question.correctOption,
  }))

  return (
    <div className="space-y-8 pb-24">
      <section className="rounded-3xl bg-gradient-to-r from-violet-700 to-indigo-600 p-8 text-white shadow-lg">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black">{getTranslation(language, 'quiz.title')}</h1>
            <p className="mt-3 max-w-2xl text-lg leading-8 text-violet-50">{getTranslation(language, 'quiz.subtitle')}</p>
          </div>
          <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-4 py-3 text-lg font-semibold text-white hover:bg-white/25">
            <ArrowLeft size={18} /> {getTranslation(language, 'quiz.backHome')}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-xl font-semibold text-slate-700">
          {getTranslation(language, 'common.loading')}
        </div>
      ) : error && !localizedQuizSets.length ? (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-red-200 bg-red-50 p-6 text-lg text-red-900">
          <span>{error}</span>
          <button type="button" onClick={() => setRetryCount((count) => count + 1)} className="rounded-xl bg-red-100 px-4 py-2 font-semibold hover:bg-red-200">
            {getTranslation(language, 'common.retry')}
          </button>
        </div>
      ) : localizedQuizSets.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 text-lg text-slate-700">{getTranslation(language, 'quiz.emptyState')}</div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-extrabold text-slate-900">{getTranslation(language, 'quiz.chooseSet')}</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {localizedQuizSets.map((quiz) => (
                <button
                  key={quiz.id}
                  type="button"
                  onClick={() => selectQuiz(quiz.id)}
                  className={`rounded-2xl border p-4 text-left transition ${selectedSetId === quiz.id ? 'border-violet-600 bg-violet-50 shadow-sm' : 'border-slate-200 hover:border-violet-300'}`}
                >
                  <div className="text-xl font-extrabold text-slate-900">{quiz.title}</div>
                  <div className="mt-1 text-base text-slate-600">{quiz.questions.length} {getTranslation(language, 'quiz.questions')}</div>
                </button>
              ))}
            </div>
          </div>

          {selectedQuiz && (
            <>
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-bold uppercase tracking-[0.2em] text-violet-700">{getTranslation(language, 'quiz.progress')}</div>
                    <h2 className="mt-2 text-3xl font-extrabold text-slate-900">{selectedQuiz.title}</h2>
                    <p className="mt-2 max-w-3xl text-lg leading-7 text-slate-600">{selectedQuiz.description}</p>
                  </div>
                  <div className="text-2xl font-black text-violet-700">{currentIndex + 1} / {questions.length}</div>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-violet-600 transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>

              {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-lg text-red-900">{error}</div>}

              {result ? (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-7 text-center shadow-sm">
                    <Trophy className="mx-auto text-emerald-700" size={42} />
                    <div className="mt-3 text-4xl font-black text-emerald-900">{result.score} / {result.total}</div>
                    <div className="mt-2 text-2xl font-bold text-emerald-800">{result.percentage}% {getTranslation(language, 'quiz.scoreLabel')}</div>
                    <p className="mt-3 text-lg text-emerald-900">{getTranslation(language, 'quiz.resultMessage')}</p>
                    {(!result.persisted || result.durable === false) && (
                      <p role="status" className="mt-3 text-base text-amber-900">{getTranslation(language, 'quiz.persistenceNotice')}</p>
                    )}
                  </div>
                  <div className="space-y-4">
                    {answeredQuestions.map((question) => (
                      <div key={question.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="text-xl font-extrabold text-slate-900">{question.question}</div>
                        <div className={`mt-4 inline-flex rounded-full px-3 py-2 text-sm font-bold ${question.correct ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}>
                          {question.correct ? getTranslation(language, 'quiz.correct') : getTranslation(language, 'quiz.incorrect')}
                        </div>
                        <p className="mt-3 text-base leading-7 text-slate-700">
                          <strong>{getTranslation(language, 'quiz.selectedAnswer')}:</strong>{' '}
                          {question.options[question.selected ? question.selected.charCodeAt(0) - 65 : -1] || '—'}
                        </p>
                        <p className="mt-2 text-base leading-7 text-slate-700">
                          <strong>{getTranslation(language, 'quiz.correctAnswer')}:</strong>{' '}
                          {question.options[question.correctOption.charCodeAt(0) - 65]}
                        </p>
                        <p className="mt-3 text-base leading-7 text-slate-700">{question.explanation}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" onClick={resetQuiz} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-lg font-bold text-white">
                      <RotateCcw size={18} /> {getTranslation(language, 'quiz.retry')}
                    </button>
                    <button type="button" onClick={() => selectQuiz('')} className="rounded-2xl bg-slate-100 px-5 py-3 text-lg font-bold text-slate-800">
                      {getTranslation(language, 'quiz.chooseAnother')}
                    </button>
                  </div>
                </div>
              ) : currentQuestion ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="text-2xl font-extrabold text-slate-900">{currentQuestion.question}</div>
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {currentQuestion.options.map((option, optionIndex) => {
                      const optionKey = String.fromCharCode(65 + optionIndex)
                      const selected = answers[currentQuestion.id] === optionKey
                      return (
                        <label key={optionKey} className={`flex cursor-pointer items-center gap-3 rounded-2xl border p-4 text-lg transition ${selected ? 'border-violet-600 bg-violet-50 text-violet-900' : 'border-slate-200 text-slate-700 hover:border-violet-300'}`}>
                          <input type="radio" name={`question-${currentQuestion.id}`} value={optionKey} checked={selected} onChange={() => handleAnswerChange(currentQuestion.id, optionKey)} className="h-5 w-5 accent-violet-700" />
                          <span>{option}</span>
                        </label>
                      )
                    })}
                  </div>
                  <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} disabled={currentIndex === 0} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-lg font-bold text-slate-800 disabled:opacity-50">
                      <ArrowLeft size={18} /> {getTranslation(language, 'common.previous')}
                    </button>
                    {currentIndex < questions.length - 1 ? (
                      <button type="button" onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))} className="inline-flex items-center gap-2 rounded-2xl bg-violet-700 px-5 py-3 text-lg font-bold text-white">
                        {getTranslation(language, 'common.next')} <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button type="button" onClick={handleSubmit} disabled={answeredCount !== questions.length || submitting} className="inline-flex items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3 text-lg font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">
                        <CheckCircle2 size={18} /> {submitting ? getTranslation(language, 'common.submitting') : getTranslation(language, 'quiz.submit')}
                      </button>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-slate-500">{getTranslation(language, 'quiz.answerAll')}</p>
                </div>
              ) : null}
            </>
          )}
        </div>
      )}
    </div>
  )
}
