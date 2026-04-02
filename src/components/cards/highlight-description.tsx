import { getSuitColors } from '@/components/cards/suit-badge'

function SuitTag({ suit, label }: { suit: string; label: string }) {
  const colors = getSuitColors(suit)

  return (
    <span
      style={{ backgroundColor: colors.bg, color: colors.text }}
      className="inline-block rounded px-1.5 py-0.5 text-xs font-semibold leading-tight mx-0.5 align-middle"
    >
      {label}
    </span>
  )
}

// Sorted longest-first so multi-word patterns match before their substrings.
const HIGHLIGHT_MAP: Array<{ pattern: string; suit: string }> = [
  { pattern: 'Dwarvish Infantry', suit: 'army' },
  { pattern: 'Book of Changes', suit: 'artifact' },
  { pattern: 'Shield of Keth', suit: 'artifact' },
  { pattern: 'Treasure Chest', suit: 'cursed-item' },
  { pattern: 'Sword of Keth', suit: 'weapon' },
  { pattern: 'Cursed Items', suit: 'cursed-item' },
  { pattern: 'Elven Archers', suit: 'army' },
  { pattern: 'Warlock Lord', suit: 'wizard' },
  { pattern: 'Cursed Item', suit: 'cursed-item' },
  { pattern: 'Beastmaster', suit: 'wizard' },
  { pattern: 'Necromancer', suit: 'wizard' },
  { pattern: 'Great Flood', suit: 'flood' },
  { pattern: 'Enchantress', suit: 'wizard' },
  { pattern: 'Bell Tower', suit: 'land' },
  { pattern: 'Leprechaun', suit: 'outsider' },
  { pattern: 'Buildings', suit: 'building' },
  { pattern: 'Outsiders', suit: 'outsider' },
  { pattern: 'Artifacts', suit: 'artifact' },
  { pattern: 'Lightning', suit: 'flame' },
  { pattern: 'Rainstorm', suit: 'weather' },
  { pattern: 'Building', suit: 'building' },
  { pattern: 'Outsider', suit: 'outsider' },
  { pattern: 'Artifact', suit: 'artifact' },
  { pattern: 'Wildfire', suit: 'flame' },
  { pattern: 'Princess', suit: 'leader' },
  { pattern: 'Blizzard', suit: 'weather' },
  { pattern: 'Mountain', suit: 'land' },
  { pattern: 'Unicorn', suit: 'beast' },
  { pattern: 'Weather', suit: 'weather' },
  { pattern: 'Warlord', suit: 'leader' },
  { pattern: 'Weapons', suit: 'weapon' },
  { pattern: 'Wizards', suit: 'wizard' },
  { pattern: 'Leaders', suit: 'leader' },
  { pattern: 'Empress', suit: 'leader' },
  { pattern: 'Undead', suit: 'undead' },
  { pattern: 'Weapon', suit: 'weapon' },
  { pattern: 'Wizard', suit: 'wizard' },
  { pattern: 'Leader', suit: 'leader' },
  { pattern: 'Armies', suit: 'army' },
  { pattern: 'Flames', suit: 'flame' },
  { pattern: 'Floods', suit: 'flood' },
  { pattern: 'Beasts', suit: 'beast' },
  { pattern: 'Dragon', suit: 'beast' },
  { pattern: 'Island', suit: 'flood' },
  { pattern: 'Swamp', suit: 'flood' },
  { pattern: 'Smoke', suit: 'weather' },
  { pattern: 'Queen', suit: 'leader' },
  { pattern: 'Lands', suit: 'land' },
  { pattern: 'Genie', suit: 'outsider' },
  { pattern: 'Demon', suit: 'outsider' },
  { pattern: 'Beast', suit: 'beast' },
  { pattern: 'Flame', suit: 'flame' },
  { pattern: 'Flood', suit: 'flood' },
  { pattern: 'Army', suit: 'army' },
  { pattern: 'Land', suit: 'land' },
  { pattern: 'Wild', suit: 'wild' },
  { pattern: 'King', suit: 'leader' },
]

const HIGHLIGHT_PATTERN = new RegExp(
  `\\b(${HIGHLIGHT_MAP.map((e) => e.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`,
  'g'
)

export function highlightDescription(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  let last = 0
  let match: RegExpExecArray | null

  HIGHLIGHT_PATTERN.lastIndex = 0
  while ((match = HIGHLIGHT_PATTERN.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index))
    }
    const matched = match[0]
    const entry = HIGHLIGHT_MAP.find((e) => e.pattern === matched)!
    parts.push(<SuitTag key={match.index} suit={entry.suit} label={matched} />)
    last = match.index + matched.length
  }
  if (last < text.length) {
    parts.push(text.slice(last))
  }
  return parts
}
