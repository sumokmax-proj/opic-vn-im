import { useState, useLayoutEffect, useRef } from 'react'

export default function FlashCard({ card, seen, onFlip, onFlipChange, onSwipeLeft, onSwipeRight }) {
  const [flipped, setFlipped] = useState(false)
  const [height, setHeight] = useState(220)
  const frontRef = useRef(null)
  const backRef = useRef(null)
  // Gesture detection state (ref to avoid re-renders)
  const drag = useRef({ startX: 0, startY: 0, active: false, wasSwiped: false })

  // Measure front face height after mount (key={card.id} remounts on card change)
  useLayoutEffect(() => {
    if (frontRef.current) {
      setHeight(frontRef.current.scrollHeight)
    }
  }, [])

  if (!card) return null

  const onDragStart = (x, y) => {
    drag.current = { startX: x, startY: y, active: true, wasSwiped: false }
  }

  const onDragEnd = (x, y) => {
    if (!drag.current.active) return
    drag.current.active = false
    const dx = x - drag.current.startX
    const dy = y - drag.current.startY
    // Fire swipe only if horizontal movement > 50px AND more horizontal than vertical
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      drag.current.wasSwiped = true
      if (dx < 0) onSwipeLeft?.()   // swipe left = next
      else onSwipeRight?.()          // swipe right = prev
    }
  }

  const onDragCancel = () => {
    drag.current.active = false
  }

  const handleClick = () => {
    // Ignore click if it was triggered by a swipe gesture
    if (drag.current.wasSwiped) {
      drag.current.wasSwiped = false
      return
    }
    const next = !flipped
    if (!flipped) {
      onFlip?.(card.id)
      if (backRef.current) setHeight(backRef.current.scrollHeight)
    } else {
      if (frontRef.current) setHeight(frontRef.current.scrollHeight)
    }
    setFlipped(next)
    onFlipChange?.(next)
  }

  const faceStyle = {
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.04)',
  }

  return (
    <div className="perspective w-full select-none">
      <div
        className={`card-inner w-full cursor-pointer${flipped ? ' flipped' : ''}`}
        style={{ height: `${height}px` }}
        onClick={handleClick}
        onTouchStart={(e) => onDragStart(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchEnd={(e) => onDragEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY)}
        onTouchCancel={onDragCancel}
        onMouseDown={(e) => onDragStart(e.clientX, e.clientY)}
        onMouseUp={(e) => onDragEnd(e.clientX, e.clientY)}
        onMouseLeave={onDragCancel}
      >
        {/* Front: Question */}
        <div
          ref={frontRef}
          className="card-face bg-white rounded-lg border border-[#E8E4DF] p-6 flex flex-col"
          style={faceStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#7C6F5B] bg-[#F0EDE8] rounded-md px-2.5 py-1 tracking-wide">
              {card.category}
            </span>
            <div className="flex items-center gap-2">
              {seen && (
                <span className="text-xs text-[#7C6F5B] font-medium">학습완료</span>
              )}
              <span className="text-xs font-mono text-[#C4BFB9]">#{card.id}</span>
            </div>
          </div>
          <div className="text-2xl font-bold text-[#2C2C2C] mb-3 leading-snug">
            {card.question.vi}
          </div>
          <div className="text-sm text-[#8C8480] leading-relaxed">
            {card.question.ko}
          </div>
          <div className="mt-6 text-xs text-[#C4BFB9] text-center tracking-wide">
            탭하여 답변 보기
          </div>
        </div>

        {/* Back: Answer */}
        <div
          ref={backRef}
          className="card-face card-back bg-[#F5F3EF] rounded-lg border border-[#E8E4DF] p-6 flex flex-col"
          style={faceStyle}
        >
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-[#8C8480] bg-white border border-[#E8E4DF] rounded-md px-2.5 py-1 tracking-wide">
              모범 답안
            </span>
            <span className="text-xs font-mono text-[#C4BFB9]">#{card.id}</span>
          </div>
          <div className="text-xl font-bold text-[#2C2C2C] mb-3 leading-relaxed">
            {card.answer.vi}
          </div>
          <div className="text-sm text-[#8C8480] leading-relaxed">
            {card.answer.ko}
          </div>
          <div className="mt-6 text-xs text-[#C4BFB9] text-center tracking-wide">
            탭하여 질문으로 돌아가기
          </div>
        </div>
      </div>
    </div>
  )
}
