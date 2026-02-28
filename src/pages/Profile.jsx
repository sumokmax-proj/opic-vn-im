import { useState, useEffect } from 'react'
import { fetchProfile, saveProfile, customizeCards, updateCard } from '../api/cards'

const CATEGORIES = ['자기소개', '직장', '취미', '거주지', '여행', '음식']

const FIELDS = [
  { key: 'nickname',   label: '호칭 / 이름',          placeholder: 'Sumok',               hint: '베트남어로 불릴 이름이나 닉네임 (실명 불필요)' },
  { key: 'age',        label: '나이',                   placeholder: '36살',                hint: '나이 또는 연령대 (예: 30대 중반)' },
  { key: 'job',        label: '직업 / 직무',            placeholder: 'IT 회사 소프트웨어 개발자', hint: '' },
  { key: 'location',   label: '거주지',                 placeholder: '서울 마포',           hint: '구(區) 수준까지만 — 상세 주소 불필요' },
  { key: 'family',     label: '가족 구성',              placeholder: '아내 1명, 양가 부모님', hint: '' },
  { key: 'hobbies',    label: '취미',                   placeholder: '코딩, 독서',          hint: '' },
  { key: 'travel',     label: '여행 경험',              placeholder: '베트남 미방문 / 호치민 방문 경험 있음', hint: '' },
  { key: 'food',       label: '선호 음식',              placeholder: '쌀국수, 한식',        hint: '' },
  { key: 'health',     label: '운동 / 건강 습관',       placeholder: '주 2회 헬스',         hint: '' },
  { key: 'motivation', label: '베트남어 학습 동기',     placeholder: '업무상 베트남 출장 예정', hint: '' },
]

const EMPTY = Object.fromEntries(FIELDS.map(f => [f.key, '']))

export default function Profile({ cards, onRefresh }) {
  const [profile, setProfile] = useState(EMPTY)
  const [saveStatus, setSaveStatus] = useState('idle') // idle | saving | saved
  const [selectedCat, setSelectedCat] = useState('자기소개')
  const [testOne, setTestOne] = useState(false)
  const [previews, setPreviews] = useState(null)
  const [failed, setFailed] = useState([])
  const [previewStatus, setPreviewStatus] = useState('idle') // idle | loading | done
  const [applyStatus, setApplyStatus] = useState('idle') // idle | applying | done
  const [error, setError] = useState('')

  useEffect(() => {
    fetchProfile()
      .then(p => { if (p && Object.keys(p).length) setProfile({ ...EMPTY, ...p }) })
      .catch(() => {})
  }, [])

  const set = (k, v) => setProfile(prev => ({ ...prev, [k]: v }))

  const handleSave = async () => {
    setSaveStatus('saving')
    setError('')
    try {
      await saveProfile(profile)
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (e) {
      setError(e.message)
      setSaveStatus('idle')
    }
  }

  const handlePreview = async () => {
    setPreviewStatus('loading')
    setPreviews(null)
    setFailed([])
    setApplyStatus('idle')
    setError('')
    try {
      const catIds = selectedCat === '전체'
        ? cards.map(c => c.id)
        : cards.filter(c => c.category === selectedCat).map(c => c.id)
      const targetIds = testOne ? catIds.slice(0, 1) : catIds
      const { results, failed: failedCards } = await customizeCards(profile, targetIds)
      setPreviews(results)
      setFailed(failedCards ?? [])
      setPreviewStatus('done')
    } catch (e) {
      setError(e.message)
      setPreviewStatus('idle')
    }
  }

  const handleApply = async () => {
    if (!previews?.length) return
    setApplyStatus('applying')
    setError('')
    try {
      for (const p of previews) {
        await updateCard(p.id, {
          answer_vi: p.new_answer_vi,
          answer_ko: p.new_answer_ko,
        })
      }
      await onRefresh()
      setApplyStatus('done')
      setPreviews(null)
      setPreviewStatus('idle')
      setTimeout(() => setApplyStatus('idle'), 3000)
    } catch (e) {
      setError(e.message)
      setApplyStatus('idle')
    }
  }

  const hasProfile = FIELDS.some(f => profile[f.key].trim())

  return (
    <div className="space-y-5">

      {/* Profile form */}
      <div className="bg-white rounded-lg border border-[#E8E4DF] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#2C2C2C]">내 정보</h2>
          <p className="text-xs text-[#8C8480] mt-0.5">OPIc 연습 답변을 개인화하는 데 사용됩니다.</p>
        </div>

        <div className="space-y-3">
          {FIELDS.map(({ key, label, placeholder, hint }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-[#8C8480] mb-1">{label}</label>
              <input
                type="text"
                value={profile[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="w-full rounded-md border border-[#E8E4DF] bg-[#FAFAF8] px-3 py-2 text-sm text-[#2C2C2C] placeholder-[#C4BFB9] focus:outline-none focus:border-[#7C6F5B]"
              />
              {hint && <p className="text-xs text-[#C4BFB9] mt-0.5">{hint}</p>}
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className="px-5 py-2 rounded-lg bg-[#7C6F5B] text-white text-sm font-semibold hover:bg-[#6B5F4E] disabled:opacity-40 transition-colors"
        >
          {saveStatus === 'saving' ? '저장 중...' : saveStatus === 'saved' ? '저장 완료' : '저장'}
        </button>
      </div>

      {/* Customize section */}
      <div className="bg-white rounded-lg border border-[#E8E4DF] p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-[#2C2C2C]">카드 커스터마이징</h2>
          <p className="text-xs text-[#8C8480] mt-0.5">내 정보를 반영하여 모범 답안을 AI로 재생성합니다.</p>
        </div>

        {/* Privacy notice */}
        <div className="rounded-lg bg-[#FFF8EF] border border-[#F0DEC0] px-4 py-3 text-xs text-[#8C6030] leading-relaxed">
          입력하신 정보가 Anthropic API로 전송됩니다. 실명·정확한 주소 등 민감한 정보는 입력하지 마세요.
        </div>

        {/* Category picker */}
        <div>
          <p className="text-xs font-medium text-[#8C8480] mb-2">커스터마이징할 카테고리</p>
          <div className="flex flex-wrap gap-1.5">
            {['전체', ...CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => { setSelectedCat(cat); setPreviews(null); setPreviewStatus('idle') }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCat === cat
                    ? 'bg-[#7C6F5B] text-white'
                    : 'bg-[#F0EDE8] text-[#7C6F5B] hover:bg-[#E8E4DF]'
                }`}
              >
                {cat}
                {cat !== '전체' && (
                  <span className="ml-1 text-[10px] opacity-60">
                    {cards.filter(c => c.category === cat).length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Test mode toggle */}
        <label className="flex items-center gap-2.5 cursor-pointer select-none w-fit">
          <div
            onClick={() => setTestOne(v => !v)}
            className={`relative w-9 h-5 rounded-full transition-colors ${testOne ? 'bg-[#7C6F5B]' : 'bg-[#DDD9D4]'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${testOne ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </div>
          <span className="text-xs text-[#8C8480]">
            1장만 테스트 <span className="text-[#C4BFB9]">(토큰 절약)</span>
          </span>
        </label>

        {/* Preview button */}
        <button
          onClick={handlePreview}
          disabled={previewStatus === 'loading' || !hasProfile}
          className="w-full py-2.5 rounded-lg border border-[#7C6F5B] text-[#7C6F5B] text-sm font-semibold hover:bg-[#F5F3EF] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {previewStatus === 'loading'
            ? 'AI 생성 중... (잠시 기다려 주세요)'
            : !hasProfile
              ? '먼저 내 정보를 입력하세요'
              : testOne ? '1장 미리보기 생성' : '미리보기 생성'}
        </button>

        {/* Network/server error */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Partial failure warning */}
        {failed.length > 0 && (
          <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-xs text-orange-700 space-y-1">
            <p className="font-semibold">일부 카드 처리 실패 ({failed.length}장)</p>
            {failed.map(f => (
              <p key={f.id}>#{f.id} — {f.error}</p>
            ))}
          </div>
        )}

        {/* Apply success */}
        {applyStatus === 'done' && (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 text-center font-medium">
            커스터마이징 완료! 카드가 업데이트되었습니다.
          </div>
        )}

        {/* Preview list */}
        {previews && previews.length === 0 && (
          <p className="text-sm text-center text-[#8C8480] py-4">커스터마이징할 카드가 없습니다.</p>
        )}

        {previews && previews.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs text-[#8C8480]">
              {previews.length}장의 카드 미리보기 — 좌측: 현재 / 우측: 변경 후
            </p>

            {previews.map(p => (
              <div key={p.id} className="rounded-lg border border-[#E8E4DF] overflow-hidden text-xs">
                <div className="bg-[#F5F3EF] px-3 py-2 font-medium text-[#7C6F5B]">
                  #{p.id} {p.question_ko}
                </div>
                <div className="grid grid-cols-2 divide-x divide-[#E8E4DF]">
                  <div className="p-3">
                    <div className="text-[10px] text-[#C4BFB9] mb-1.5">현재</div>
                    <p className="text-[#8C8480] leading-relaxed">{p.old_answer_vi}</p>
                  </div>
                  <div className="p-3 bg-[#FAFAF8]">
                    <div className="text-[10px] text-[#7C6F5B] mb-1.5">변경 후</div>
                    <p className="text-[#2C2C2C] leading-relaxed">{p.new_answer_vi}</p>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleApply}
              disabled={applyStatus === 'applying'}
              className="w-full py-3 rounded-lg bg-[#7C6F5B] text-white text-sm font-semibold hover:bg-[#6B5F4E] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {applyStatus === 'applying' ? '적용 중...' : `전체 적용 (${previews.length}장)`}
            </button>
          </div>
        )}
      </div>

      <div className="pb-8" />
    </div>
  )
}
