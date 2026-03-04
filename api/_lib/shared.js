import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

export const API_KEY = process.env.ANTHROPIC_API_KEY

export function toCardShape(c) {
  return {
    id: c.id,
    category: c.category,
    question: { vi: c.question_vi, ko: c.question_ko },
    answer: { vi: c.answer_vi, ko: c.answer_ko },
    level: c.level,
    tags: c.tags ?? [],
  }
}

export async function parseBody(req) {
  if (req.body && typeof req.body === 'object') return req.body
  return new Promise((resolve) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(JSON.parse(data || '{}')) } catch { resolve({}) }
    })
  })
}

export function send(res, status, body) {
  res.setHeader('Content-Type', 'application/json')
  res.statusCode = status
  res.end(JSON.stringify(body))
}
