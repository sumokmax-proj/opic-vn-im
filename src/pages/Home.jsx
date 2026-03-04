function loadWrongIds() {
  try { return JSON.parse(localStorage.getItem('opic_wrong') || '[]') } catch { return [] }
}

export default function Home({ onStudy, onStudyWrong, onExam, onAdmin }) {
  const wrongCount = loadWrongIds().length

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">

      {/* Header */}
      <header className="border-b border-[#E8E4DF] px-4">
        <div className="max-w-sm mx-auto py-5">
          <h1 className="text-lg font-bold text-[#2C2C2C] tracking-tight">OPIc 베트남어</h1>
          <p className="text-xs text-[#8C8480] mt-0.5">NH → IM 목표</p>
        </div>
      </header>

      {/* Menu */}
      <main className="flex-1 flex flex-col justify-center px-4 py-8">
        <div className="max-w-sm mx-auto w-full space-y-3">

          {/* 공부하기 */}
          <button
            onClick={onStudy}
            className="w-full text-left rounded-xl border border-[#E8E4DF] bg-white px-5 py-4 hover:border-[#7C6F5B] hover:bg-[#FDFCFA] transition-colors group"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#7C6F5B] transition-colors">
                  공부하기
                </p>
                <p className="text-xs text-[#8C8480] mt-0.5">플래시카드로 질문·답변 학습</p>
              </div>
              <span className="text-[#C4BFB9] group-hover:text-[#7C6F5B] text-lg transition-colors">→</span>
            </div>
          </button>

          {/* 시험보기 */}
          <button
            onClick={onExam}
            className="w-full text-left rounded-xl border border-[#E8E4DF] bg-white px-5 py-4 hover:border-[#7C6F5B] hover:bg-[#FDFCFA] transition-colors group"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#2C2C2C] group-hover:text-[#7C6F5B] transition-colors">
                  시험보기
                </p>
                <p className="text-xs text-[#8C8480] mt-0.5">객관식 빈칸 채우기</p>
              </div>
              <span className="text-[#C4BFB9] group-hover:text-[#7C6F5B] text-lg transition-colors">→</span>
            </div>
          </button>

          {/* 오답노트 — shown only when there are wrong answers */}
          {wrongCount > 0 && (
            <button
              onClick={onStudyWrong}
              className="w-full text-left rounded-xl border border-[#E8C4B8] bg-[#FDF7F5] px-5 py-4 hover:border-[#C4856A] hover:bg-[#FCF2EE] transition-colors group"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#A0522D] group-hover:text-[#8B4513] transition-colors">
                    오답노트
                  </p>
                  <p className="text-xs text-[#B8896E] mt-0.5">틀린 카드만 다시 학습</p>
                </div>
                <span className="bg-[#C4856A] text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {wrongCount}
                </span>
              </div>
            </button>
          )}

          {/* 설정 */}
          <button
            onClick={onAdmin}
            className="w-full text-left rounded-xl border border-[#E8E4DF] bg-[#FAFAF8] px-5 py-3 hover:bg-[#F5F3EF] transition-colors"
          >
            <p className="text-xs text-[#8C8480]">설정 / 카드 관리</p>
          </button>

        </div>
      </main>

    </div>
  )
}
