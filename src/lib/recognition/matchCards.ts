import type { ICard } from '@/types/cards'

export type TOcrBox = { text: string; confidence: number }
export type TNamedCard = Pick<ICard, 'id' | 'name'>

// Thresholds tuned on the photos in recognizer/fixtures (photoFixtures.test.ts guards them)
const MIN_SIMILARITY = 0.7
// Joining two lines invites near-misses (I + LAND ~ Island), real split titles join almost exactly
const JOINED_MIN_SIMILARITY = 0.9

const normalize = (s: string) => s.toLowerCase().trim().replace(/\s+/g, ' ')
// Edition variants are stored as e.g. "Bell Tower (Cursed Hoard)" but the card only prints "BELL TOWER"
const printedName = (name: string) => normalize(name.replace(/\s*\([^)]*\)$/, ''))

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

// Card titles are printed in capitals, rules text ("+15 with ... Enchantress") is mixed case.
// Counting letters (not requiring all-caps) survives misreads like UNlC0RN.
const isMostlyCaps = (s: string) =>
  (s.match(/[A-Z]/g)?.length ?? 0) > (s.match(/[a-z]/g)?.length ?? 0)

export function matchCards(boxes: TOcrBox[], cards: TNamedCard[]) {
  const matches = new Map<string, number>() // cardId -> confidence
  const unmatched: string[] = []

  const bestCard = (raw: string, minSimilarity = MIN_SIMILARITY) => {
    const text = normalize(raw)
    let best: { card: TNamedCard; score: number } | undefined
    for (const card of cards) {
      const score = similarity(text, printedName(card.name))
      if (!best || score > best.score) best = { card, score }
    }
    return best && best.score >= minSimilarity ? best : undefined
  }
  const add = (cardId: string, confidence: number) =>
    matches.set(cardId, Math.max(confidence, matches.get(cardId) ?? 0))

  const fragments: TOcrBox[] = []
  for (const box of boxes) {
    if (!isMostlyCaps(box.text)) {
      unmatched.push(box.text)
      continue
    }
    const best = bestCard(box.text)
    if (best) add(best.card.id, box.confidence * best.score)
    else fragments.push(box)
  }

  // Long titles wrap onto two OCR lines (STAFF OF / TRANSMUTATION), which need not come out
  // adjacent: try every ordered pair of leftover capitalised lines.
  const used = new Set<TOcrBox>()
  for (const a of fragments) {
    for (const b of fragments) {
      if (a === b || used.has(a) || used.has(b)) continue
      const joined = bestCard(`${a.text} ${b.text}`, JOINED_MIN_SIMILARITY)
      if (!joined) continue
      add(joined.card.id, Math.min(a.confidence, b.confidence) * joined.score)
      used.add(a).add(b)
    }
  }
  unmatched.push(...fragments.filter((f) => !used.has(f)).map((f) => f.text))
  return {
    matches: [...matches].map(([cardId, confidence]) => ({ cardId, confidence })),
    unmatched,
  }
}
