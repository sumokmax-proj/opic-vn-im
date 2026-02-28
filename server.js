import 'dotenv/config'
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { createHash } from 'crypto'

const app = express()
const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = process.env.PORT ?? 3200
const API_KEY = process.env.VITE_ANTHROPIC_API_KEY
const CARDS_PATH = join(__dirname, 'src', 'data', 'cards.json')
const CACHE_PATH = join(__dirname, 'src', 'data', 'analysis-cache.json')
const CUSTOMIZE_CACHE_PATH = join(__dirname, 'src', 'data', 'customize-cache.json')
const PROFILE_PATH = join(__dirname, 'src', 'data', 'profile.json')

// ── Analysis cache ─────────────────────────────────────────────────────────────

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {}
  try { return JSON.parse(readFileSync(CACHE_PATH, 'utf8')) } catch { return {} }
}

function saveCache(cache) {
  writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8')
}

let analysisCache = loadCache()

function loadCustomizeCache() {
  if (!existsSync(CUSTOMIZE_CACHE_PATH)) return {}
  try { return JSON.parse(readFileSync(CUSTOMIZE_CACHE_PATH, 'utf8')) } catch { return {} }
}
function saveCustomizeCache(cache) {
  writeFileSync(CUSTOMIZE_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8')
}
let customizeCache = loadCustomizeCache()

app.use(express.json())
app.use(express.static(join(__dirname, 'dist')))

// ── Cards CRUD ────────────────────────────────────────────────────────────────

function readCards() {
  return JSON.parse(readFileSync(CARDS_PATH, 'utf8'))
}

function writeCards(data) {
  writeFileSync(CARDS_PATH, JSON.stringify(data, null, 2), 'utf8')
}

app.get('/api/cards', (_req, res) => {
  try {
    res.json(readCards())
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.post('/api/cards', (req, res) => {
  try {
    const data = readCards()
    const maxId = data.cards.reduce((max, c) => Math.max(max, parseInt(c.id)), 0)
    const newCard = {
      id: String(maxId + 1).padStart(3, '0'),
      category: req.body.category ?? '자기소개',
      question: { vi: req.body.question_vi ?? '', ko: req.body.question_ko ?? '' },
      answer:   { vi: req.body.answer_vi   ?? '', ko: req.body.answer_ko   ?? '' },
      level: req.body.level ?? 'IM',
      tags: [req.body.category ?? '자기소개'],
    }
    data.cards.push(newCard)
    writeCards(data)
    res.json(newCard)
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.put('/api/cards/:id', (req, res) => {
  try {
    const data = readCards()
    const idx = data.cards.findIndex(c => c.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Card not found' })
    const b = req.body
    data.cards[idx] = {
      ...data.cards[idx],
      category: b.category ?? data.cards[idx].category,
      question: {
        vi: b.question_vi ?? data.cards[idx].question.vi,
        ko: b.question_ko ?? data.cards[idx].question.ko,
      },
      answer: {
        vi: b.answer_vi ?? data.cards[idx].answer.vi,
        ko: b.answer_ko ?? data.cards[idx].answer.ko,
      },
      level: b.level ?? data.cards[idx].level,
    }
    writeCards(data)
    res.json(data.cards[idx])
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

app.delete('/api/cards/:id', (req, res) => {
  try {
    const data = readCards()
    const idx = data.cards.findIndex(c => c.id === req.params.id)
    if (idx === -1) return res.status(404).json({ error: 'Card not found' })
    data.cards.splice(idx, 1)
    writeCards(data)
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Profile ───────────────────────────────────────────────────────────────────

function readProfile() {
  if (!existsSync(PROFILE_PATH)) return {}
  try { return JSON.parse(readFileSync(PROFILE_PATH, 'utf8')) } catch { return {} }
}

app.get('/api/profile', (_req, res) => {
  res.json(readProfile())
})

app.post('/api/profile', (req, res) => {
  try {
    writeFileSync(PROFILE_PATH, JSON.stringify(req.body, null, 2), 'utf8')
    res.json({ ok: true })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── Card Customization ─────────────────────────────────────────────────────────

app.post('/api/customize', async (req, res) => {
  const { profile, cardIds } = req.body
  if (!profile) return res.status(400).json({ error: 'profile required' })
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' })

  const allData = readCards()
  const targets = cardIds
    ? allData.cards.filter(c => cardIds.includes(c.id))
    : allData.cards

  const profileLines = [
    ['호칭', profile.nickname],
    ['나이', profile.age],
    ['직업', profile.job],
    ['거주지', profile.location],
    ['가족', profile.family],
    ['취미', profile.hobbies],
    ['여행 경험', profile.travel],
    ['선호 음식', profile.food],
    ['운동/건강', profile.health],
    ['학습 동기', profile.motivation],
  ].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')

  // Cache key = cardId + short hash of profile content
  // → 프로필이 바뀌면 다른 키 → 자동으로 재호출
  const profileHashStr = createHash('sha256').update(profileLines).digest('hex').slice(0, 8)

  const results = []
  const failed = []

  for (const card of targets) {
    const cacheKey = `${card.id}_${profileHashStr}`

    // Return from cache if profile hasn't changed
    if (customizeCache[cacheKey]) {
      results.push({
        id: card.id,
        category: card.category,
        question_vi: card.question.vi,
        question_ko: card.question.ko,
        old_answer_vi: card.answer.vi,
        old_answer_ko: card.answer.ko,
        ...customizeCache[cacheKey],
      })
      continue
    }

    const prompt = `당신은 한국인 베트남어 학습자의 OPIc 연습 플래시카드 모범 답안을 개인화하는 도우미입니다.

사용자 정보:
${profileLines}

질문 (베트남어): ${card.question.vi}
질문 (한국어): ${card.question.ko}
현재 모범 답안 (베트남어): ${card.answer.vi}
현재 모범 답안 (한국어): ${card.answer.ko}

위 사용자 정보를 반영하여 모범 답안을 자연스럽게 수정하세요.
- OPIc IM 수준의 자연스러운 베트남어 유지
- 질문 주제와 관련된 사용자 정보만 반영
- 반드시 순수 JSON만 응답 (마크다운 코드블록, 설명 절대 없이)
- 정확히 이 형식으로만: {"answer_vi":"...","answer_ko":"..."}`

    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!apiRes.ok) {
        const errData = await apiRes.json().catch(() => ({}))
        const msg = errData?.error?.message ?? `API ${apiRes.status}`
        console.error(`[customize] card ${card.id} API error: ${msg}`)
        failed.push({ id: card.id, error: msg })
        continue
      }

      const apiData = await apiRes.json()
      const raw = apiData.content[0].text.trim()
      // Strip markdown code fences if Claude added them (e.g. ```json ... ```)
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) {
        console.error(`[customize] card ${card.id} JSON parse failed. Response: ${raw.slice(0, 200)}`)
        failed.push({ id: card.id, error: 'AI 응답 파싱 실패' })
        continue
      }
      let parsed
      try {
        parsed = JSON.parse(match[0])
      } catch {
        console.error(`[customize] card ${card.id} JSON invalid. Extracted: ${match[0].slice(0, 200)}`)
        failed.push({ id: card.id, error: 'AI 응답 파싱 실패' })
        continue
      }

      // Save to customize cache
      customizeCache[cacheKey] = { new_answer_vi: parsed.answer_vi, new_answer_ko: parsed.answer_ko }
      saveCustomizeCache(customizeCache)

      results.push({
        id: card.id,
        category: card.category,
        question_vi: card.question.vi,
        question_ko: card.question.ko,
        old_answer_vi: card.answer.vi,
        old_answer_ko: card.answer.ko,
        new_answer_vi: parsed.answer_vi,
        new_answer_ko: parsed.answer_ko,
      })
    } catch (e) {
      console.error(`[customize] card ${card.id} exception: ${e.message}`)
      failed.push({ id: card.id, error: e.message })
    }
  }

  res.json({ results, failed })
})

// ── AI Analysis ───────────────────────────────────────────────────────────────

app.post('/api/analyze', async (req, res) => {
  const { cardId, answerVi } = req.body
  if (!answerVi) return res.status(400).json({ error: 'answerVi required' })
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' })

  // Return cached result if available
  if (cardId && analysisCache[cardId]) {
    return res.json({ result: analysisCache[cardId], cached: true })
  }

  const prompt = `Analyze the following Vietnamese sentence for a Korean learner.
Learner level: targeting OPIc IM (currently NH)

Sentence: ${answerVi}

Respond in Korean with this structure:
1. Sentence structure: subject / verb / object breakdown
2. Key expressions: important phrases or idioms explained
3. Vocabulary: meaning of key words
4. Usage examples: 1–2 sentences using the same expression`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
    }

    const data = await response.json()
    const result = data.content[0].text

    // Save to file cache
    if (cardId) {
      analysisCache[cardId] = result
      saveCache(analysisCache)
    }

    res.json({ result })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
})

// ── SPA fallback ──────────────────────────────────────────────────────────────

app.get('/{*splat}', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
