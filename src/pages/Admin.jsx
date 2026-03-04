import { useState } from 'react'
import { createCard, updateCard, deleteCard } from '../api/cards'
import Profile from './Profile'

const CATEGORIES = ['자기소개', '직장', '취미', '거주지', '여행', '음식']
const LEVELS = ['IM', 'NH', 'IH', 'AL']

const EMPTY_FORM = {
  category: '자기소개',
  level: 'IM',
  question_vi: '',
  question_ko: '',
  answer_vi: '',
  answer_ko: '',
}

function CardForm({ initial, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.question_vi.trim() && form.answer_vi.trim()

  return (
    <div className="bg-white rounded-lg border border-[#E8E4DF] p-5 space-y-3">
      {/* Category + Level row */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="block text-xs font-medium text-[#8C8480] mb-1">카테고리</label>
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className="w-full rounded-md border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-sm text-[#2C2C2C] focus:outline-none focus:border-[#7C6F5B]"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-[#8C8480] mb-1">레벨</label>
          <select
            value={form.level}
            onChange={e => set('level', e.target.value)}
            className="w-full rounded-md border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-sm text-[#2C2C2C] focus:outline-none focus:border-[#7C6F5B]"
          >
            {LEVELS.map(l => <option key={l}>{l}</option>)}
          </select>
        </div>
      </div>

      {/* Question */}
      <div>
        <label className="block text-xs font-medium text-[#8C8480] mb-1">질문 (베트남어)</label>
        <textarea
          value={form.question_vi}
          onChange={e => set('question_vi', e.target.value)}
          rows={2}
          placeholder="Hãy giới thiệu về bản thân bạn."
          className="w-full rounded-md border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-sm text-[#2C2C2C] placeholder-[#C4BFB9] focus:outline-none focus:border-[#7C6F5B] resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#8C8480] mb-1">질문 (한국어)</label>
        <textarea
          value={form.question_ko}
          onChange={e => set('question_ko', e.target.value)}
          rows={2}
          placeholder="자신에 대해 소개해 주세요."
          className="w-full rounded-md border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-sm text-[#2C2C2C] placeholder-[#C4BFB9] focus:outline-none focus:border-[#7C6F5B] resize-none"
        />
      </div>

      {/* Answer */}
      <div>
        <label className="block text-xs font-medium text-[#8C8480] mb-1">모범 답안 (베트남어)</label>
        <textarea
          value={form.answer_vi}
          onChange={e => set('answer_vi', e.target.value)}
          rows={3}
          placeholder="Xin chào, tôi tên là..."
          className="w-full rounded-md border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-sm text-[#2C2C2C] placeholder-[#C4BFB9] focus:outline-none focus:border-[#7C6F5B] resize-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#8C8480] mb-1">모범 답안 (한국어)</label>
        <textarea
          value={form.answer_ko}
          onChange={e => set('answer_ko', e.target.value)}
          rows={3}
          placeholder="안녕하세요, 저는..."
          className="w-full rounded-md border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-sm text-[#2C2C2C] placeholder-[#C4BFB9] focus:outline-none focus:border-[#7C6F5B] resize-none"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => valid && onSave(form)}
          disabled={!valid || saving}
          className="px-5 py-2 rounded-lg bg-[#7C6F5B] text-white text-sm font-semibold hover:bg-[#6B5F4E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? '저장 중...' : '저장'}
        </button>
        <button
          onClick={onCancel}
          disabled={saving}
          className="px-5 py-2 rounded-lg border border-[#E8E4DF] text-[#4A4340] text-sm font-medium hover:bg-[#F5F3EF] transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}

export default function Admin({ cards, onRefresh, onBack }) {
  const [tab, setTab] = useState('cards') // 'cards' | 'profile'
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [filterCat, setFilterCat] = useState('전체')

  const displayed = filterCat === '전체' ? cards : cards.filter(c => c.category === filterCat)

  const handleAdd = async (form) => {
    setSaving(true)
    setError('')
    try {
      await createCard(form)
      await onRefresh()
      setShowAddForm(false)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (form) => {
    setSaving(true)
    setError('')
    try {
      await updateCard(editingId, form)
      await onRefresh()
      setEditingId(null)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('이 카드를 삭제할까요?')) return
    setError('')
    try {
      await deleteCard(id)
      await onRefresh()
    } catch (e) {
      setError(e.message)
    }
  }

  const editInitial = (card) => ({
    category: card.category,
    level: card.level ?? 'IM',
    question_vi: card.question.vi,
    question_ko: card.question.ko,
    answer_vi: card.answer.vi,
    answer_ko: card.answer.ko,
  })

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Header */}
      <header className="border-b border-[#E8E4DF] sticky top-0 bg-[#FAFAF8] z-10">
        <div className="max-w-2xl mx-auto px-4 pt-3.5 pb-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-xs text-[#7C6F5B] font-medium hover:underline"
            >
              ← 홈
            </button>
            <span className="text-[#E8E4DF]">|</span>
            <h1 className="text-sm font-semibold text-[#2C2C2C]">관리</h1>
          </div>
          <span className="text-xs text-[#8C8480]">총 {cards.length}장</span>
        </div>
        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-0 mt-3">
          {[['cards', '카드 관리'], ['profile', '내 정보']].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                tab === key
                  ? 'border-[#7C6F5B] text-[#7C6F5B]'
                  : 'border-transparent text-[#8C8480] hover:text-[#4A4340]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-4">

        {/* Profile tab */}
        {tab === 'profile' && (
          <Profile cards={cards} onRefresh={onRefresh} />
        )}

        {/* Cards tab */}
        {tab === 'cards' && <>

        {/* Error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Add button or form */}
        {showAddForm ? (
          <CardForm
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
            saving={saving}
          />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 rounded-lg border-2 border-dashed border-[#DDD9D4] text-[#8C8480] text-sm font-medium hover:border-[#7C6F5B] hover:text-[#7C6F5B] transition-colors"
          >
            + 새 카드 추가
          </button>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {['전체', ...CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterCat === cat
                  ? 'bg-[#7C6F5B] text-white'
                  : 'bg-[#F0EDE8] text-[#7C6F5B] hover:bg-[#E8E4DF]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Card list */}
        <div className="space-y-2">
          {displayed.map(card => (
            <div key={card.id}>
              {editingId === card.id ? (
                <CardForm
                  initial={editInitial(card)}
                  onSave={handleEdit}
                  onCancel={() => setEditingId(null)}
                  saving={saving}
                />
              ) : (
                <div className="bg-white rounded-lg border border-[#E8E4DF] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-xs font-semibold text-[#7C6F5B] bg-[#F0EDE8] rounded-md px-2 py-0.5">
                          {card.category}
                        </span>
                        <span className="text-xs font-mono text-[#C4BFB9]">#{card.id}</span>
                        <span className="text-xs text-[#C4BFB9]">{card.level}</span>
                      </div>
                      <p className="text-sm font-medium text-[#2C2C2C] truncate">
                        {card.question.vi}
                      </p>
                      <p className="text-xs text-[#8C8480] truncate mt-0.5">
                        {card.question.ko}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => setEditingId(card.id)}
                        className="text-xs text-[#7C6F5B] font-medium hover:underline"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => handleDelete(card.id)}
                        className="text-xs text-[#C4BFB9] font-medium hover:text-red-400 transition-colors"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {displayed.length === 0 && (
          <p className="text-center text-[#8C8480] text-sm py-12">카드가 없습니다.</p>
        )}

        <div className="pb-8" />
        </>}
      </main>
    </div>
  )
}
