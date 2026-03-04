import { supabase, parseBody, send } from './_lib/shared.js'

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data } = await supabase.from('profiles').select('data').eq('id', 'default').single()
    return send(res, 200, data?.data ?? {})
  }

  if (req.method === 'POST') {
    const body = await parseBody(req)
    const { error } = await supabase.from('profiles').upsert({ id: 'default', data: body })
    if (error) return send(res, 500, { error: error.message })
    return send(res, 200, { ok: true })
  }

  send(res, 405, { error: 'Method not allowed' })
}
