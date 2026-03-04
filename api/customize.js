import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const API_KEY = process.env.ANTHROPIC_API_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { profile, cardIds } = req.body
  if (!profile) return res.status(400).json({ error: 'profile required' })
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' })

  const { data: allCards, error: cardsErr } = await supabase.from('cards').select('*').order('id')
  if (cardsErr) return res.status(500).json({ error: cardsErr.message })

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
      results.push({
        id: card.id, category: card.category,
        question_vi: card.question_vi, question_ko: card.question_ko,
        old_answer_vi: card.answer_vi, old_answer_ko: card.answer_ko,
        new_answer_vi: cached.new_answer_vi, new_answer_ko: cached.new_answer_ko,
      })
      continue
    }

    const prompt = `당신은 한국인 베트남어 학습자의 OPIc 연습 플래시카드 모범 답안을 개인화하는 도우미입니다.

사용자 정보:
${profileLines}

질문 (베트남어): ${card.question_vi}
질문 (한국어): ${card.question_ko}
현재 모범 답안 (베트남어): ${card.answer_vi}
현재 모범 답안 (한국어): ${card.answer_ko}

위 사용자 정보를 반영하여 모범 답안을 자연스럽게 수정하세요.
- OPIc IM 수준의 자연스러운 베트남어 유지
- 질문 주제와 관련된 사용자 정보만 반영
- 반드시 순수 JSON만 응답 (마크다운 코드블록, 설명 절대 없이)
- 정확히 이 형식으로만: {"answer_vi":"...","answer_ko":"..."}`

    try {
      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 512, messages: [{ role: 'user', content: prompt }] }),
      })
      if (!apiRes.ok) {
        const errData = await apiRes.json().catch(() => ({}))
        failed.push({ id: card.id, error: errData?.error?.message ?? `API ${apiRes.status}` })
        continue
      }
      const apiData = await apiRes.json()
      const raw = apiData.content[0].text.trim()
      const text = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim()
      const match = text.match(/\{[\s\S]*\}/)
      if (!match) { failed.push({ id: card.id, error: 'AI 응답 파싱 실패' }); continue }
      let parsed
      try { parsed = JSON.parse(match[0]) } catch { failed.push({ id: card.id, error: 'AI 응답 파싱 실패' }); continue }
      await supabase.from('customize_cache').upsert({ cache_key: cacheKey, new_answer_vi: parsed.answer_vi, new_answer_ko: parsed.answer_ko })
      results.push({
        id: card.id, category: card.category,
        question_vi: card.question_vi, question_ko: card.question_ko,
        old_answer_vi: card.answer_vi, old_answer_ko: card.answer_ko,
        new_answer_vi: parsed.answer_vi, new_answer_ko: parsed.answer_ko,
      })
    } catch (e) {
      failed.push({ id: card.id, error: e.message })
    }
  }
  res.json({ results, failed })
}
