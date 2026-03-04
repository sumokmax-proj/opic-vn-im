import { useState, useEffect, useCallback, useMemo } from 'react'
import Home from './pages/Home'
import Study from './pages/Study'
import Exam from './pages/Exam'
import Admin from './pages/Admin'
import { fetchCards } from './api/cards'

function loadWrongIds() {
  try { return JSON.parse(localStorage.getItem('opic_wrong') || '[]') } catch { return [] }
}

export default function App() {
  const [page, setPage] = useState('home') // 'home' | 'study' | 'exam' | 'admin'
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [wrongOnly, setWrongOnly] = useState(false)

  const loadCards = useCallback(async () => {
    try {
      const data = await fetchCards()
      setCards(data.cards)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadCards() }, [loadCards])

  const studyCards = useMemo(() => {
    if (!wrongOnly) return cards
    const ids = loadWrongIds()
    return cards.filter(c => ids.includes(c.id))
  }, [cards, wrongOnly])

  const goHome = () => { setPage('home'); setWrongOnly(false) }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <span className="text-[#8C8480] text-sm">불러오는 중...</span>
      </div>
    )
  }

  if (page === 'study') {
    return (
      <Study
        cards={studyCards}
        wrongOnly={wrongOnly}
        onHome={goHome}
      />
    )
  }

  if (page === 'exam') {
    return <Exam cards={cards} onHome={goHome} />
  }

  if (page === 'admin') {
    return <Admin cards={cards} onRefresh={loadCards} onBack={goHome} />
  }

  return (
    <Home
      onStudy={() => { setWrongOnly(false); setPage('study') }}
      onStudyWrong={() => { setWrongOnly(true); setPage('study') }}
      onExam={() => setPage('exam')}
      onAdmin={() => setPage('admin')}
    />
  )
}
