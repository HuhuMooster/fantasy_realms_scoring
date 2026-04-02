import { cn } from '@/lib/utils'
import type { IPlayer } from '@/types/players'

interface IRankingTableProps {
  players: (IPlayer & { cardIds: string[] })[]
  status: 'IN_PROGRESS' | 'COMPLETED'
}

const MEDAL: Record<number, string> = { 0: '1st', 1: '2nd', 2: '3rd' }

export function RankingTable({ players, status }: IRankingTableProps) {
  const sorted = players
    .slice()
    .sort((a, b) => (b.finalScore ?? -1) - (a.finalScore ?? -1))

  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr>
            <th>{'Rank'}</th>
            <th>{'Player'}</th>
            <th className="text-right">{'Cards'}</th>
            <th className="text-right">{'Score'}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player, i) => {
            const hasScore = player.finalScore !== null
            return (
              <tr
                key={player.id}
                className={cn('', i === 0 && status === 'COMPLETED' && 'font-semibold')}
              >
                <td className="text-base-content/50 w-12">
                  {status === 'COMPLETED' && hasScore
                    ? (MEDAL[i] ?? `${i + 1}th`)
                    : '-'}
                </td>
                <td>{player.nickname}</td>
                <td className="text-right text-base-content/60">
                  {player.cardIds.length}
                </td>
                <td className="text-right">
                  {hasScore ? (
                    <span
                      className={cn(
                        '',
                        i === 0 && status === 'COMPLETED' && 'text-primary'
                      )}
                    >
                      {player.finalScore}
                    </span>
                  ) : (
                    <span className="badge badge-sm badge-ghost">{'pending'}</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
