export type TOcrBox = { text: string; confidence: number }
export type TNamedCard = { id: string; name: string }
export type TCardMatch = { cardId: string; confidence: number }

// ponytail: guessed threshold, tune it in the spike against real photos
const MIN_SIMILARITY = 0.7

const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')

function levenshtein(a: string, b: string) {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      )
    }
    prev = cur
  }
  return prev[b.length]
}

const similarity = (a: string, b: string) =>
  1 - levenshtein(a, b) / Math.max(a.length, b.length, 1)

export function matchCards(boxes: TOcrBox[], cards: TNamedCard[]) {
  const matches = new Map<string, number>() // cardId -> confidence
  const unmatched: string[] = []
  for (const box of boxes) {
    const text = normalize(box.text)
    let best: { card: TNamedCard; score: number } | undefined
    for (const card of cards) {
      const score = similarity(text, normalize(card.name))
      if (!best || score > best.score) best = { card, score }
    }
    if (best && best.score >= MIN_SIMILARITY) {
      const confidence = box.confidence * best.score
      matches.set(best.card.id, Math.max(confidence, matches.get(best.card.id) ?? 0))
    } else unmatched.push(box.text)
  }
  return {
    matches: [...matches].map(([cardId, confidence]): TCardMatch => ({
      cardId,
      confidence,
    })),
    unmatched,
  }
}
