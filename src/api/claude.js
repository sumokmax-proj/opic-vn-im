export async function analyzeAnswer(cardId, answerVi) {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cardId, answerVi }),
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err?.error ?? `서버 오류 ${response.status}`)
  }

  const data = await response.json()
  return data.result
}
