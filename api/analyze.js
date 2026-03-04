const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const API_KEY = process.env.ANTHROPIC_API_KEY

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { cardId, answerVi } = req.body
  if (!answerVi) return res.status(400).json({ error: 'answerVi required' })
  if (!API_KEY) return res.status(500).json({ error: 'API key not configured' })

  if (cardId) {
    const { data } = await supabase
      .from('analysis_cache')
      .select('result')
      .eq('card_id', cardId)
      .single()
    if (data) return res.json({ result: data.result, cached: true })
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

    if (cardId) {
      await supabase.from('analysis_cache').upsert({ card_id: cardId, result })
    }

    res.json({ result })
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
