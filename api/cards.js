import { supabase, toCardShape, parseBody, send } from './_lib/shared.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data, error } = await supabase.from('cards').select('*').order('id')
    if (error) return send(res, 500, { error: error.message })
    return send(res, 200, { cards: data.map(toCardShape) })
  }

  if (req.method === 'POST') {
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

  send(res, 405, { error: 'Method not allowed' })
}
