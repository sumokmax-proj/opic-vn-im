export async function fetchCards() {
  const res = await fetch('/api/cards')
  if (!res.ok) throw new Error('카드를 불러올 수 없습니다')
  return res.json() // { cards: [...] }
}

export async function createCard(fields) {
  const res = await fetch('/api/cards', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error('카드 추가 실패')
  return res.json()
}

export async function updateCard(id, fields) {
  const res = await fetch(`/api/cards/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  })
  if (!res.ok) throw new Error('카드 수정 실패')
  return res.json()
}

export async function deleteCard(id) {
  const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('카드 삭제 실패')
  return res.json()
}

export async function fetchProfile() {
  const res = await fetch('/api/profile')
  if (!res.ok) throw new Error('프로필을 불러올 수 없습니다')
  return res.json()
}

export async function saveProfile(profile) {
  const res = await fetch('/api/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  })
  if (!res.ok) throw new Error('프로필 저장 실패')
  return res.json()
}

export async function customizeCards(profile, cardIds) {
  const res = await fetch('/api/customize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, cardIds: cardIds ?? null }),
  })
  if (!res.ok) throw new Error('커스터마이징 실패')
  return res.json()
}
