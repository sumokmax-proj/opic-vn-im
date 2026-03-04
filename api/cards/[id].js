import { createClient } from '@supabase/supabase-js'

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

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
    const { data: existing, error: fetchErr } = await supabase
      .from('cards').select('*').eq('id', id).single()
    if (fetchErr) return res.status(404).json({ error: 'Card not found' })
    const b = req.body
    const { data, error } = await supabase
      .from('cards')
      .update({
        category: b.category ?? existing.category,
        question_vi: b.question_vi ?? existing.question_vi,
        question_ko: b.question_ko ?? existing.question_ko,
        answer_vi: b.answer_vi ?? existing.answer_vi,
        answer_ko: b.answer_ko ?? existing.answer_ko,
        level: b.level ?? existing.level,
      })
      .eq('id', id).select().single()
    if (error) return res.status(500).json({ error: error.message })
    return res.json(toCardShape(data))
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
