import { useState, useMemo, useCallback, useRef } from 'react'
import FlashCard from '../components/Card'
import Filter from '../components/Filter'
import Analysis from '../components/Analysis'
import { analyzeAnswer } from '../api/claude'

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function loadSeen() {
  try {
    const s = localStorage.getItem('opic_seen')
    return s ? new Set(JSON.parse(s)) : new Set()
  } catch {
    return new Set()
  }
}

function saveSeen(set) {
  localStorage.setItem('opic_seen', JSON.stringify([...set]))
}

export default function Study({ cards, onAdminClick }) {
  const [category, setCategory] = useState('전체')
  const [isRandom, setIsRandom] = useState(true)
  const [index, setIndex] = useState(0)
  const [randomSeed, setRandomSeed] = useState(0)

  const analysisCache = useRef(new Map())
  const [analysisStatus, setAnalysisStatus] = useState('idle')
  const [analysisResult, setAnalysisResult] = useState('')
  const [analysisError, setAnalysisError] = useState('')

  const [seenIds, setSeenIds] = useState(loadSeen)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [swipeDir, setSwipeDir] = useState(null) // 'left' | 'right' | null

  const filtered = useMemo(() => {
    const base = category === '전체'
      ? cards
      : cards.filter(c => c.category === category)
    return isRandom ? shuffle(base) : base
  }, [cards, category, isRandom, randomSeed])

  const card = filtered[index] ?? null
  const total = filtered.length
  const totalAll = cards.length
  const seenCount = useMemo(() => cards.filter(c => seenIds.has(c.id)).length, [cards, seenIds])
  const progressPct = totalAll > 0 ? (seenCount / totalAll) * 100 : 0

  const resetAnalysis = () => {
    setAnalysisStatus('idle')
    setAnalysisResult('')
    setAnalysisError('')
    setCardFlipped(false)
  }

  const handleCategoryChange = useCallback((cat) => {
    setCategory(cat)
    setIndex(0)
    setSwipeDir(null)
    resetAnalysis()
  }, [])

  const handlePrev = () => {
    setSwipeDir('right')
    setIndex(i => Math.max(0, i - 1))
    resetAnalysis()
  }
  const handleNext = () => {
    setSwipeDir('left')
    setIndex(i => Math.min(total - 1, i + 1))
    resetAnalysis()
  }

  const handleFlip = useCallback((id) => {
    setSeenIds(prev => {
      const next = new Set(prev)
      next.add(id)
      saveSeen(next)
      return next
    })
  }, [])

  const handleAnalyze = useCallback(async () => {
    if (!card) return
    const cached = analysisCache.current.get(card.id)
    if (cached) {
      setAnalysisResult(cached)
      setAnalysisStatus('done')
      return
    }
    setAnalysisStatus('loading')
    setAnalysisError('')
    try {
      const result = await analyzeAnswer(card.id, card.answer.vi)
      analysisCache.current.set(card.id, result)
      setAnalysisResult(result)
      setAnalysisStatus('done')
    } catch (e) {
      setAnalysisError(e.message)
      setAnalysisStatus('error')
    }
  }, [card])

  const handleRandomToggle = () => {
    setIsRandom(r => !r)
    setIndex(0)
    setRandomSeed(s => s + 1)
    setSwipeDir(null)
    resetAnalysis()
  }

  const handleResetProgress = () => {
    setSeenIds(new Set())
    localStorage.removeItem('opic_seen')
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b border-[#E8E4DF] px-4 sticky top-0 bg-[#FAFAF8] z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between py-3.5">
          <h1 className="text-sm font-semibold text-[#2C2C2C] tracking-tight">
            OPIc 베트남어
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8C8480]">
              {total > 0 && card
                ? `${category === '전체' ? parseInt(card.id) : index + 1} / ${total}`
                : '0 / 0'}
            </span>
            <button
              onClick={onAdminClick}
              className="text-xs text-[#7C6F5B] font-medium hover:underline"
            >
              관리
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-[#E8E4DF]">
          <div
            className="h-full bg-[#7C6F5B] transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Category Filter */}
        <Filter selected={category} onChange={handleCategoryChange} />

        {/* Card */}
        {total === 0 ? (
          <div className="text-[#8C8480] text-sm text-center py-16">카드가 없습니다.</div>
        ) : (
          <div
            key={card?.id}
            className={
              swipeDir === 'left' ? 'slide-from-right' :
              swipeDir === 'right' ? 'slide-from-left' : ''
            }
          >
            <FlashCard
              card={card}
              seen={card ? seenIds.has(card.id) : false}
              onFlip={handleFlip}
              onFlipChange={setCardFlipped}
              onSwipeLeft={handleNext}
              onSwipeRight={handlePrev}
            />
          </div>
        )}

        {/* Analyze button — only visible after card is flipped to answer */}
        {total > 0 && cardFlipped && (
          <button
            onClick={handleAnalyze}
            disabled={analysisStatus === 'loading'}
            className="w-full py-3 rounded-lg bg-[#7C6F5B] text-white text-sm font-semibold tracking-wide hover:bg-[#6B5F4E] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {analysisStatus === 'loading' ? '분석 중...' : '분석하기'}
          </button>
        )}

        {/* Analysis panel */}
        <Analysis
          status={analysisStatus}
          result={analysisResult}
          error={analysisError}
        />

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={index === 0}
            className="px-5 py-2 rounded-lg border border-[#E8E4DF] text-[#4A4340] text-sm font-medium hover:bg-[#F5F3EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            이전
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(total, 9) }).map((_, i) => {
              const activeDot = total <= 9 ? index : Math.round((index / (total - 1)) * 8)
              return (
                <div
                  key={i}
                  className={`rounded-full transition-all duration-200 ${
                    i === activeDot
                      ? 'w-2 h-2 bg-[#7C6F5B]'
                      : 'w-1.5 h-1.5 bg-[#DDD9D4]'
                  }`}
                />
              )
            })}
          </div>

          <button
            onClick={handleNext}
            disabled={index === total - 1}
            className="px-5 py-2 rounded-lg border border-[#E8E4DF] text-[#4A4340] text-sm font-medium hover:bg-[#F5F3EF] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            다음
          </button>
        </div>

        {/* Footer row */}
        <div className="flex items-center justify-between pb-6">
          <button
            onClick={handleRandomToggle}
            className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              isRandom
                ? 'bg-[#7C6F5B] border-[#7C6F5B] text-white'
                : 'border-[#E8E4DF] text-[#8C8480] hover:bg-[#F5F3EF]'
            }`}
          >
            {isRandom ? '랜덤 순서' : '순차 순서'}
          </button>

          <span className="text-xs text-[#8C8480]">
            학습 완료 {seenCount} / {totalAll}
            {seenCount > 0 && (
              <button
                onClick={handleResetProgress}
                className="ml-2 text-[#C4BFB9] hover:text-[#8C8480] transition-colors"
              >
                초기화
              </button>
            )}
          </span>
        </div>

      </main>
    </div>
  )
}
