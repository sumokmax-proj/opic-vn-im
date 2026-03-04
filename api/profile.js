import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { data } = await supabase
      .from('profiles').select('data').eq('id', 'default').single()
    return res.json(data?.data ?? {})
  }
  if (req.method === 'POST') {
    const { error } = await supabase
      .from('profiles').upsert({ id: 'default', data: req.body })
    if (error) return res.status(500).json({ error: error.message })
    return res.json({ ok: true })
  }
  res.status(405).json({ error: 'Method not allowed' })
}
