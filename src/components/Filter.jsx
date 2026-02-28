const CATEGORIES = ['전체', '자기소개', '직장', '취미', '거주지', '여행', '음식']

export default function Filter({ selected, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            selected === cat
              ? 'bg-[#7C6F5B] text-white'
              : 'bg-[#F0EDE8] text-[#7C6F5B] hover:bg-[#E8E4DF]'
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
