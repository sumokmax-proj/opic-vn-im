import { useState, useEffect, useCallback } from 'react'
import Study from './pages/Study'
import Admin from './pages/Admin'
import { fetchCards } from './api/cards'

export default function App() {
  const [page, setPage] = useState('study')
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <span className="text-[#8C8480] text-sm">불러오는 중...</span>
      </div>
    )
  }

  if (page === 'admin') {
    return <Admin cards={cards} onRefresh={loadCards} onBack={() => setPage('study')} />
  }

  return <Study cards={cards} onAdminClick={() => setPage('admin')} />
}
