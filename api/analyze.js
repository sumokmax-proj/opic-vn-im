import { supabase, API_KEY, parseBody, send } from './_lib/shared.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' })

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

  try {
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
  } catch (e) {
    return send(res, 500, { error: e.message })
  }
}
