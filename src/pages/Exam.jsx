import { useState, useMemo } from 'react'
import Filter from '../components/Filter'
import QuizCard from '../components/QuizCard'
import { generateQuizSet } from '../utils/quiz'

function saveWrong(cardId) {
  try {
    const ids = JSON.parse(localStorage.getItem('opic_wrong') || '[]')
    if (!ids.includes(cardId)) localStorage.setItem('opic_wrong', JSON.stringify([...ids, cardId]))
  } catch { /* ignore */ }
}

function removeWrong(cardId) {
  try {
    const ids = JSON.parse(localStorage.getItem('opic_wrong') || '[]')
    localStorage.setItem('opic_wrong', JSON.stringify(ids.filter(id => id !== cardId)))
  } catch { /* ignore */ }
}

export default function Exam({ cards, onHome }) {
  const [phase, setPhase] = useState('category') // 'category' | 'quiz' | 'result'
  const [category, setCategory] = useState('전체')
  const [quizzes, setQuizzes] = useState([])
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [confirmed, setConfirmed] = useState(false)
  const [answers, setAnswers] = useState([]) // [{ cardId, correct, chosen, blank, category, question }]

  const filteredCards = useMemo(() =>
    category === '전체' ? cards : cards.filter(c => c.category === category),
  [cards, category])

  const handleStart = () => {
    const qs = generateQuizSet(filteredCards, cards)
    if (qs.length === 0) return
    setQuizzes(qs)
    setCurrent(0)
    setSelected(null)
    setConfirmed(false)
    setAnswers([])
    setPhase('quiz')
  }

  const handleChoice = (choice) => {
    if (confirmed) return
    setSelected(choice)
    setConfirmed(true)

    const quiz = quizzes[current]
    const correct = choice === quiz.blank

    setAnswers(prev => [...prev, {
      cardId: quiz.cardId,
      category: quiz.category,
      question: quiz.question,
      blank: quiz.blank,
      chosen: choice,
      correct,
    }])

    // Update 오답노트 in localStorage
    if (correct) {
      removeWrong(quiz.cardId)
    } else {
      saveWrong(quiz.cardId)
    }
  }

  const handleNext = () => {
    if (current + 1 >= quizzes.length) {
      setPhase('result')
    } else {
      setCurrent(c => c + 1)
      setSelected(null)
      setConfirmed(false)
    }
  }

  const handleRetryWrong = () => {
    const wrongIds = answers.filter(a => !a.correct).map(a => a.cardId)
    const wrongCards = cards.filter(c => wrongIds.includes(c.id))
    const qs = generateQuizSet(wrongCards, cards)
    if (qs.length === 0) return
    setQuizzes(qs)
    setCurrent(0)
    setSelected(null)
    setConfirmed(false)
    setAnswers([])
    setPhase('quiz')
  }

  // ── Category selection ──────────────────────────────────────────
  if (phase === 'category') {
    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <header className="border-b border-[#E8E4DF] px-4 sticky top-0 bg-[#FAFAF8] z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between py-3.5">
            <button onClick={onHome} className="text-xs text-[#8C8480] hover:text-[#4A4340] transition-colors">
              ← 홈
            </button>
            <h1 className="text-sm font-semibold text-[#2C2C2C]">시험보기</h1>
            <span className="w-8" />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8 flex flex-col gap-6">
          <div>
            <p className="text-sm font-medium text-[#4A4340] mb-1">카테고리 선택</p>
            <p className="text-xs text-[#8C8480]">시험 볼 범위를 선택하세요</p>
          </div>

          <Filter selected={category} onChange={setCategory} />

          <div className="bg-[#F5F3EF] rounded-lg px-4 py-3 text-sm text-[#8C8480]">
            <span className="font-medium text-[#4A4340]">{filteredCards.length}개</span> 카드에서
            객관식 빈칸 채우기 문제가 출제됩니다
          </div>

          <button
            onClick={handleStart}
            disabled={filteredCards.length === 0}
            className="w-full py-3.5 rounded-lg bg-[#7C6F5B] text-white text-sm font-semibold tracking-wide hover:bg-[#6B5F4E] disabled:opacity-40 transition-colors"
          >
            시험 시작
          </button>
        </main>
      </div>
    )
  }

  // ── Quiz ──────────────────────────────────────────────────────
  if (phase === 'quiz') {
    const quiz = quizzes[current]
    const progress = ((current + (confirmed ? 1 : 0)) / quizzes.length) * 100

    return (
      <div className="min-h-screen bg-[#FAFAF8]">
        <header className="border-b border-[#E8E4DF] px-4 sticky top-0 bg-[#FAFAF8] z-10">
          <div className="max-w-2xl mx-auto flex items-center justify-between py-3.5">
            <button onClick={onHome} className="text-xs text-[#8C8480] hover:text-[#4A4340] transition-colors">
              ← 홈
            </button>
            <span className="text-xs text-[#8C8480]">{current + 1} / {quizzes.length}</span>
            <span className="w-8" />
          </div>
          <div className="h-1 bg-[#E8E4DF]">
            <div className="h-full bg-[#7C6F5B] transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

          {/* Category badge */}
          <span className="self-start text-xs font-semibold text-[#7C6F5B] bg-[#F0EDE8] rounded-md px-2.5 py-1">
            {quiz.category}
          </span>

          <QuizCard
            quiz={quiz}
            selected={selected}
            confirmed={confirmed}
            onChoice={handleChoice}
          />

          {/* Feedback + Next */}
          {confirmed && (
            <div className="space-y-3">
              <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
                selected === quiz.blank
                  ? 'bg-green-50 border border-green-200 text-green-700'
                  : 'bg-red-50 border border-red-200 text-red-600'
              }`}>
                {selected === quiz.blank
                  ? '정답입니다!'
                  : `오답 — 정답: ${quiz.blank}`}
              </div>
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-lg bg-[#7C6F5B] text-white text-sm font-semibold hover:bg-[#6B5F4E] transition-colors"
              >
                {current + 1 < quizzes.length ? '다음 문제' : '결과 보기'}
              </button>
            </div>
          )}
        </main>
      </div>
    )
  }

  // ── Result ──────────────────────────────────────────────────────
  const correctCount = answers.filter(a => a.correct).length
  const totalCount = answers.length
  const pct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
  const wrongAnswers = answers.filter(a => !a.correct)

  const resultMessage = pct === 100
    ? '완벽합니다! 모든 문제를 맞혔어요'
    : pct >= 70
    ? '잘 했어요! 조금 더 연습하면 완벽해요'
    : '틀린 문제를 다시 한번 복습해 보세요'

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="border-b border-[#E8E4DF] px-4 sticky top-0 bg-[#FAFAF8] z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between py-3.5">
          <button onClick={onHome} className="text-xs text-[#8C8480] hover:text-[#4A4340] transition-colors">
            ← 홈
          </button>
          <h1 className="text-sm font-semibold text-[#2C2C2C]">시험 결과</h1>
          <span className="w-8" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-5">

        {/* Score card */}
        <div className="bg-white rounded-xl border border-[#E8E4DF] p-6 text-center"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>
          <div className="text-4xl font-bold text-[#7C6F5B] mb-1">{pct}%</div>
          <div className="text-sm text-[#8C8480] mb-4">{correctCount} / {totalCount} 정답</div>
          <p className="text-sm text-[#4A4340]">{resultMessage}</p>
        </div>

        {/* Wrong answers list */}
        {wrongAnswers.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[#8C8480] uppercase tracking-wide mb-2">
              틀린 문제 {wrongAnswers.length}개
            </p>
            <div className="space-y-2">
              {wrongAnswers.map((a, i) => (
                <div key={i} className="bg-white rounded-lg border border-[#E8E4DF] px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-[#7C6F5B] bg-[#F0EDE8] rounded px-1.5 py-0.5">
                      {a.category}
                    </span>
                  </div>
                  <p className="text-xs text-[#8C8480] mb-0.5">{a.question.ko}</p>
                  <p className="text-sm font-medium text-[#2C2C2C]">{a.question.vi}</p>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="text-red-400">내 답: {a.chosen}</span>
                    <span className="text-[#C4BFB9]">→</span>
                    <span className="text-green-600 font-medium">정답: {a.blank}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col gap-2 pb-6">
          {wrongAnswers.length > 0 && (
            <button
              onClick={handleRetryWrong}
              className="w-full py-3 rounded-lg border-2 border-[#7C6F5B] text-[#7C6F5B] text-sm font-semibold hover:bg-[#F0EDE8] transition-colors"
            >
              오답 다시 풀기 ({wrongAnswers.length}개)
            </button>
          )}
          <button
            onClick={() => { setPhase('category'); setAnswers([]) }}
            className="w-full py-3 rounded-lg border border-[#E8E4DF] text-[#4A4340] text-sm font-medium hover:bg-[#F5F3EF] transition-colors"
          >
            다시 시험보기
          </button>
          <button
            onClick={onHome}
            className="w-full py-3 rounded-lg bg-[#7C6F5B] text-white text-sm font-semibold hover:bg-[#6B5F4E] transition-colors"
          >
            홈으로
          </button>
        </div>

      </main>
    </div>
  )
}
