// Vietnamese OPIc Quiz Generator
// Generates fill-in-the-blank multiple choice questions from flashcard data

const STOP_WORDS = new Set([
  // Pronouns
  'tôi', 'bạn', 'anh', 'chị', 'em', 'ông', 'bà', 'họ', 'chúng', 'mình', 'nó',
  // Auxiliaries / particles
  'là', 'có', 'được', 'đã', 'đang', 'sẽ', 'bị', 'vẫn', 'đều', 'cũng', 'chỉ', 'còn',
  'không', 'chưa', 'luôn', 'thường', 'mọi', 'cả',
  // Conjunctions / prepositions
  'và', 'hoặc', 'hay', 'nhưng', 'nên', 'mà', 'vì', 'thì', 'khi', 'nếu', 'để',
  'với', 'của', 'cho', 'trong', 'trên', 'dưới', 'ngoài', 'giữa',
  'sau', 'trước', 'đến', 'từ', 'tại', 'về', 'theo', 'qua',
  'lên', 'xuống', 'ra', 'vào', 'lại',
  // Demonstratives / question words
  'đây', 'đó', 'này', 'kia', 'nào', 'gì', 'ai', 'sao', 'thế', 'như',
  // Quantifiers / degree words
  'một', 'các', 'những', 'nhiều', 'ít', 'rất', 'khá', 'hơi', 'quá',
])

// Vowel groups: [plain, sắc, huyền, hỏi, ngã, nặng]
const TONE_GROUPS = [
  ['a', 'á', 'à', 'ả', 'ã', 'ạ'],
  ['ă', 'ắ', 'ằ', 'ẳ', 'ẵ', 'ặ'],
  ['â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ'],
  ['e', 'é', 'è', 'ẻ', 'ẽ', 'ẹ'],
  ['ê', 'ế', 'ề', 'ể', 'ễ', 'ệ'],
  ['i', 'í', 'ì', 'ỉ', 'ĩ', 'ị'],
  ['o', 'ó', 'ò', 'ỏ', 'õ', 'ọ'],
  ['ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ'],
  ['ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ'],
  ['u', 'ú', 'ù', 'ủ', 'ũ', 'ụ'],
  ['ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự'],
  ['y', 'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ'],
]

// Check if word contains a diacritic (tone mark or modified vowel)
function hasDiacritic(word) {
  const marked = 'áàảãạắằẳẵặấầẩẫậéèẻẽẹếềểễệíìỉĩịóòỏõọốồổỗộớờởỡợúùủũụứừửữựýỳỷỹỵăâêôơư'
  return [...word].some(c => marked.includes(c))
}

// Strip punctuation from a token
function stripPunct(token) {
  return token.replace(/[.,!?;:"""''()[\]]/g, '')
}

// Get all tone variants of a word by changing the first toned vowel
function getToneVariants(word) {
  const variants = []
  for (const group of TONE_GROUPS) {
    for (let i = 0; i < word.length; i++) {
      const idx = group.indexOf(word[i])
      if (idx !== -1) {
        for (let j = 0; j < group.length; j++) {
          if (j !== idx) variants.push(word.slice(0, i) + group[j] + word.slice(i + 1))
        }
        return variants // only mutate first toned vowel found
      }
    }
  }
  return variants
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Pick the best word to blank out from a Vietnamese sentence
function pickBlankWord(sentence) {
  const tokens = sentence.split(/\s+/)
  const cleaned = tokens.map(stripPunct)

  // Prefer: has diacritic, length >= 3, not stop word
  const preferred = cleaned.filter(
    w => w.length >= 3 && hasDiacritic(w) && !STOP_WORDS.has(w) && !STOP_WORDS.has(w.toLowerCase())
  )
  if (preferred.length > 0) {
    const pool = preferred.slice(0, Math.min(preferred.length, 6))
    return pool[Math.floor(Math.random() * pool.length)]
  }

  // Fallback: any word >= 4 chars, not stop word
  const fallback = cleaned.filter(
    w => w.length >= 4 && !STOP_WORDS.has(w) && !STOP_WORDS.has(w.toLowerCase())
  )
  if (fallback.length === 0) return null
  return fallback[0]
}

// Collect words from other cards as distractor pool
function extractPoolWords(allCards, excludeWord, excludeCardId) {
  const words = new Set()
  for (const card of allCards) {
    if (card.id === excludeCardId) continue
    for (const token of card.answer.vi.split(/\s+/)) {
      const w = stripPunct(token)
      if (w.length >= 3 && w !== excludeWord && !STOP_WORDS.has(w) && !STOP_WORDS.has(w.toLowerCase())) {
        words.add(w)
      }
    }
  }
  return [...words]
}

// Generate a single quiz question for a card
export function generateQuiz(card, allCards) {
  const word = pickBlankWord(card.answer.vi)
  if (!word) return null

  // 1. Tone variants (up to 2) — tests pronunciation/tone accuracy
  const toneVariants = shuffle(getToneVariants(word)).slice(0, 2)

  // 2. Card pool words with similar length (±2 chars) — contextual distractors
  const poolWords = shuffle(
    extractPoolWords(allCards, word, card.id).filter(
      w => Math.abs(w.length - word.length) <= 2
    )
  )

  // Build 3 unique distractors: tone variants first, fill rest from pool
  const distractors = new Set(toneVariants)
  for (const w of poolWords) {
    if (distractors.size >= 3) break
    distractors.add(w)
  }

  // Not enough distractors for a valid question
  if (distractors.size < 3) return null

  // Blank the first occurrence of the word in the sentence
  const sentence = card.answer.vi.replace(word, '___')
  if (!sentence.includes('___')) return null

  return {
    cardId: card.id,
    category: card.category,
    question: card.question,
    sentence,           // Vietnamese answer with blank
    answer: card.answer, // full answer (for result review)
    blank: word,        // correct answer
    choices: shuffle([word, ...[...distractors].slice(0, 3)]),
  }
}

// Generate a full quiz set from a list of cards
export function generateQuizSet(cards, allCards) {
  return shuffle(cards)
    .map(card => generateQuiz(card, allCards))
    .filter(Boolean)
}
