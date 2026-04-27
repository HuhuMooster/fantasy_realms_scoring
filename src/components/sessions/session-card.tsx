import { Link, useNavigate } from '@tanstack/react-router'

import { cn, formatDate } from '@/lib/utils'
import type { IPlayer } from '@/types/players'

interface ISessionCardProps {
  id: string
  name: string
  date: string | Date
  status: 'IN_PROGRESS' | 'COMPLETED'
  players: IPlayer[]
}

export function SessionCard({ id, name, date, status, players }: ISessionCardProps) {
  const navigate = useNavigate()
  const dateStr = formatDate(date)

  const leader =
    status === 'COMPLETED'
      ? players.slice().sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))[0]
      : null

  return (
    <Link to="/sessions/$id" params={{ id }}>
      <div className="card bg-base-100 border border-base-300 shadow-sm shadow-primary transition-shadow active:scale-[0.98]">
        <div className="card-body p-4 gap-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-base leading-tight">{name}</h3>
            <span
              className={cn(
                'badge badge-sm shrink-0',
                status === 'COMPLETED' ? 'badge-success' : 'badge-warning'
              )}
            >
              {status === 'COMPLETED' ? 'Done' : 'In progress'}
            </span>
          </div>
          <p className="text-xs text-base-content/50">{dateStr}</p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-base-content/70">
              {players.length} {players.length === 1 ? 'player' : 'players'}
            </span>
            <div className="flex items-center gap-2">
              {leader && (
                <span className="text-sm font-medium text-primary">
                  {leader.nickname}
                  {': '}
                  {leader.finalScore}
                  {' pts'}
                </span>
              )}
              {status === 'COMPLETED' && (
                <button
                  type="button"
                  className="btn btn-xs btn-secondary"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    navigate({
                      to: '/sessions/new',
                      search: { n: players.map((p) => p.nickname) },
                    })
                  }}
                >
                  {'Rematch'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
