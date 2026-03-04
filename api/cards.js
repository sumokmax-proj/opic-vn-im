const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

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

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('cards').select('*').order('id')
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ cards: data.map(toCardShape) })
  }

  if (req.method === 'POST') {
    const { data: existing, error: listErr } = await supabase.from('cards').select('id')
    if (listErr) return res.status(500).json({ error: listErr.message })

    const maxId = existing.reduce((max, c) => Math.max(max, parseInt(c.id)), 0)
    const newId = String(maxId + 1).padStart(3, '0')

    const { data, error } = await supabase
      .from('cards')
      .insert({
        id: newId,
        category: req.body.category ?? '자기소개',
        question_vi: req.body.question_vi ?? '',
        question_ko: req.body.question_ko ?? '',
        answer_vi: req.body.answer_vi ?? '',
        answer_ko: req.body.answer_ko ?? '',
        level: req.body.level ?? 'IM',
        tags: [req.body.category ?? '자기소개'],
      })
      .select()
      .single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json(toCardShape(data))
  }

  res.status(405).json({ error: 'Method not allowed' })
}
