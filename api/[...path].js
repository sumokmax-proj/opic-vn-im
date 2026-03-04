import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)
const API_KEY = process.env.ANTHROPIC_API_KEY

function toCardShape(c) {
  return {
    id: c.id,
    category: c.category,
    question: { vi: c.question_vi, ko: c.question_ko },
    answer: { vi: c.answer_vi, ko: c.answer_ko },
    level: c.level,
    tags: c.tags ?? [],
  }
}

async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  return new Promise((resolve) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
  })
}

function send(res, status, body) {
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = status
  res.end(JSON.stringify(body))
}

export default async function handler(req, res) {
  const method = req.method
  // path segments: /api/cards → ['cards'], /api/cards/001 → ['cards','001']
  const pathParts = Array.isArray(req.query.path)
    ? req.query.path
    : [req.query.path].filter(Boolean)
  const resource = pathParts[0]
  const id = pathParts[1]

  try {
    // ── Cards ──────────────────────────────────────────────────────────────────

    if (resource === 'cards' && !id) {
      if (method === 'GET') {
        const { data, error } = await supabase.from('cards').select('*').order('id')
        if (error) return send(res, 500, { error: error.message })
        return send(res, 200, { cards: data.map(toCardShape) })
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const { data: existing, error: listErr } = await supabase.from('cards').select('id')
        if (listErr) return send(res, 500, { error: listErr.message })
        const maxId = existing.reduce((max, c) => Math.max(max, parseInt(c.id)), 0)
        const newId = String(maxId + 1).padStart(3, '0')
        const { data, error } = await supabase.from('cards').insert({
          id: newId,
          category: body.category ?? '자기소개',
          question_vi: body.question_vi ?? '',
          question_ko: body.question_ko ?? '',
          answer_vi: body.answer_vi ?? '',
          answer_ko: body.answer_ko ?? '',
          level: body.level ?? 'IM',
          tags: [body.category ?? '자기소개'],
        }).select().single()
        if (error) return send(res, 500, { error: error.message })
        return send(res, 200, toCardShape(data))
      }
    }

    if (resource === 'cards' && id) {
      if (method === 'PUT') {
        const body = await parseBody(req)
        const { data: existing, error: fetchErr } = await supabase
          .from('cards').select('*').eq('id', id).single()
        if (fetchErr) return send(res, 404, { error: 'Card not found' })
        const { data, error } = await supabase.from('cards').update({
          category: body.category ?? existing.category,
          question_vi: body.question_vi ?? existing.question_vi,
          question_ko: body.question_ko ?? existing.question_ko,
          answer_vi: body.answer_vi ?? existing.answer_vi,
          answer_ko: body.answer_ko ?? existing.answer_ko,
          level: body.level ?? existing.level,
        }).eq('id', id).select().single()
        if (error) return send(res, 500, { error: error.message })
        return send(res, 200, toCardShape(data))
      }
      if (method === 'DELETE') {
        const { error } = await supabase.from('cards').delete().eq('id', id)
        if (error) return send(res, 500, { error: error.message })
        return send(res, 200, { ok: true })
      }
    }

    // ── Profile ────────────────────────────────────────────────────────────────

    if (resource === 'profile') {
      if (method === 'GET') {
        const { data } = await supabase.from('profiles').select('data').eq('id', 'default').single()
        return send(res, 200, data?.data ?? {})
      }
      if (method === 'POST') {
        const body = await parseBody(req)
        const { error } = await supabase.from('profiles').upsert({ id: 'default', data: body })
        if (error) return send(res, 500, { error: error.message })
        return send(res, 200, { ok: true })
      }
    }

    // ── Analyze ────────────────────────────────────────────────────────────────

    if (method === 'POST' && resource === 'analyze') {
      const { cardId, answerVi } = await parseBody(req)
      if (!answerVi) return send(res, 400, { error: 'answerVi required' })
      if (!API_KEY) return send(res, 500, { error: 'API key not configured' })

      if (cardId) {
        const { data } = await supabase.from('analysis_cache').select('result').eq('card_id', cardId).single()
        if (data) return send(res, 200, { result: data.result, cached: true })
      }

      const prompt = `Analyze the following Vietnamese sentence for a Korean learner.
Learner level: targeting OPIc IM (currently NH)

Sentence: ${answerVi}

Respond in Korean with this structure:
1. Sentence structure: subject / verb / object breakdown
2. Key expressions: important phrases or idioms explained
3. Vocabulary: meaning of key words
4. Usage examples: 1–2 sentences using the same expression`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }),
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        return send(res, response.status, { error: err?.error?.message ?? `API error ${response.status}` })
      }
      const apiData = await response.json()
      const result = apiData.content[0].text
      if (cardId) await supabase.from('analysis_cache').upsert({ card_id: cardId, result })
      return send(res, 200, { result })
    }

    // ── Customize ──────────────────────────────────────────────────────────────

    if (method === 'POST' && resource === 'customize') {
      const { profile, cardIds } = await parseBody(req)
      if (!profile) return send(res, 400, { error: 'profile required' })
      if (!API_KEY) return send(res, 500, { error: 'API key not configured' })

      const { data: allCards, error: cardsErr } = await supabase.from('cards').select('*').order('id')
      if (cardsErr) return send(res, 500, { error: cardsErr.message })
      const targets = cardIds ? allCards.filter(c => cardIds.includes(c.id)) : allCards

      const profileLines = [
        ['호칭', profile.nickname], ['나이', profile.age], ['직업', profile.job],
        ['거주지', profile.location], ['가족', profile.family], ['취미', profile.hobbies],
        ['여행 경험', profile.travel], ['선호 음식', profile.food],
        ['운동/건강', profile.health], ['학습 동기', profile.motivation],
      ].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')

      const profileHashStr = createHash('sha256').update(profileLines).digest('hex').slice(0, 8)
      const results = []
      const failed = []

      for (const card of targets) {
        const cacheKey = `${card.id}_${profileHashStr}`
        const { data: cached } = await supabase
          .from('customize_cache').select('new_answer_vi, new_answer_ko').eq('cache_key', cacheKey).single()

        if (cached) {
          results.push({ id: card.id, category: card.category, question_vi: card.question_vi, question_ko: card.question_ko, old_answer_vi: card.answer_vi, old_answer_ko: card.answer_ko, new_answer_vi: cached.new_answer_vi, new_answer_ko: cached.new_answer_ko })
          continue
        }

        const prompt = `당신은 한국인 베트남어 학습자의 OPIc 연습 플래시카드 모범 답안을 개인화하는 도우미입니다.

사용자 정보:\n${profileLines}

질문 (베트남어): ${card.question_vi}
질문 (한국어): ${card.question_ko}
현재 모범 답안 (베트남어): ${card.answer_vi}
현재 모범 답안 (한국어): ${card.answer_ko}

위 사용자 정보를 반영하여 모범 답안을 자연스럽게 수정하세요.
- OPIc IM 수준의 자연스러운 베트남어 유지
- 반드시 순수 JSON만 응답: {"answer_vi":"...","answer_ko":"..."}`

        try {
          const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, messages: [{ role: 'user', content: prompt }] }),
          })
          if (!apiRes.ok) { failed.push({ id: card.id, error: `API ${apiRes.status}` }); continue }
          const apiData = await apiRes.json()
          const raw = apiData.content[0].text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
          const match = raw.match(/\{[\s\S]*\}/)
          if (!match) { failed.push({ id: card.id, error: '파싱 실패' }); continue }
          let parsed
          try { parsed = JSON.parse(match[0]) } catch { failed.push({ id: card.id, error: '파싱 실패' }); continue }
          await supabase.from('customize_cache').upsert({ cache_key: cacheKey, new_answer_vi: parsed.answer_vi, new_answer_ko: parsed.answer_ko })
          results.push({ id: card.id, category: card.category, question_vi: card.question_vi, question_ko: card.question_ko, old_answer_vi: card.answer_vi, old_answer_ko: card.answer_ko, new_answer_vi: parsed.answer_vi, new_answer_ko: parsed.answer_ko })
        } catch (e) {
          failed.push({ id: card.id, error: e.message })
        }
      }
      return send(res, 200, { results, failed })
    }

    send(res, 404, { error: 'Not found' })
  } catch (e) {
    send(res, 500, { error: e.message })
  }
}
