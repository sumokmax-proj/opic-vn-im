import { supabase, toCardShape, parseBody, send } from '../_lib/shared.js'

export default async function handler(req, res) {
  const { id } = req.query

  if (req.method === 'PUT') {
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

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) return send(res, 500, { error: error.message })
    return send(res, 200, { ok: true })
  }

  send(res, 405, { error: 'Method not allowed' })
}
