export default function QuizCard({ quiz, selected, confirmed, onChoice }) {
  const { question, sentence, choices, blank } = quiz

  // Split sentence at blank for styled rendering
  const parts = sentence.split('___')
  const before = parts[0] ?? ''
  const after = parts[1] ?? ''

  return (
    <div className="bg-white rounded-lg border border-[#E8E4DF] p-6 space-y-5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)' }}>

      {/* Question */}
      <div>
        <p className="text-sm text-[#8C8480] leading-relaxed mb-1">{question.ko}</p>
        <p className="text-lg font-bold text-[#2C2C2C] leading-snug">{question.vi}</p>
      </div>

      <hr className="border-[#E8E4DF]" />

      {/* Answer sentence with blank */}
      <div className="bg-[#F5F3EF] rounded-lg px-4 py-3 text-sm leading-relaxed text-[#2C2C2C]">
        <span>{before}</span>
        {confirmed ? (
          <span className="font-bold text-[#7C6F5B] border-b-2 border-[#7C6F5B] mx-0.5 px-0.5">
            {blank}
          </span>
        ) : (
          <span className="inline-block border-b-2 border-[#7C6F5B] mx-0.5 px-3 text-transparent select-none">
            {blank}
          </span>
        )}
        <span>{after}</span>
      </div>

      {/* Choices */}
      <div className="grid grid-cols-2 gap-2.5">
        {choices.map((choice) => {
          let cls = 'border-[#E8E4DF] bg-white text-[#2C2C2C] hover:bg-[#F5F3EF]'
          if (confirmed) {
            if (choice === blank) {
              cls = 'border-green-400 bg-green-50 text-green-700 font-semibold'
            } else if (choice === selected) {
              cls = 'border-red-300 bg-red-50 text-red-600'
            } else {
              cls = 'border-[#E8E4DF] bg-white text-[#C4BFB9]'
            }
          } else if (choice === selected) {
            cls = 'border-[#7C6F5B] bg-[#F0EDE8] text-[#4A4340]'
          }

          return (
            <button
              key={choice}
              onClick={() => !confirmed && onChoice(choice)}
              disabled={confirmed}
              className={`rounded-lg border p-3 text-sm font-medium transition-colors text-center ${cls}`}
            >
              {choice}
            </button>
          )
        })}
      </div>
    </div>
  )
}
