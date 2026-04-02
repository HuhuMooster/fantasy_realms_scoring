import type { TScoreResult } from '@/lib/scoring/types'
import { cn } from '@/lib/utils'

interface IScoreBreakdownProps {
  result: TScoreResult | undefined
}

export function ScoreBreakdown({ result }: IScoreBreakdownProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-right">
        <span className="text-md font-bold text-primary">
          {result?.totalScore ?? 0}
        </span>
        <span className="text-base-content/50 ml-1">{'pts'}</span>
      </div>

      <table className="table table-sm w-full">
        <thead>
          <tr>
            <th>{'Card'}</th>
            <th className="text-right w-10">{'Base'}</th>
            <th className="text-right w-10">{'Bonus'}</th>
            <th className="text-right w-10">{'Pen.'}</th>
            <th className="text-right w-10">{'Net'}</th>
          </tr>
        </thead>
        <tbody>
          {result?.perCard.map((row) => (
            <tr key={row.cardId} className={cn('', row.blanked && 'opacity-40')}>
              <td>
                <span className={cn('', row.blanked && 'line-through')}>
                  {row.name}
                </span>
              </td>
              <td className="text-right text-base-content/50">
                {row.blanked ? '-' : row.basePower}
              </td>
              <td className="text-right text-success">
                {!row.blanked && row.bonus > 0 ? `+${row.bonus}` : '-'}
              </td>
              <td className="text-right text-error">
                {!row.blanked && row.penalty > 0 ? `-${row.penalty}` : '-'}
              </td>
              <td className="text-right font-semibold">{row.blanked ? 0 : row.net}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4} className="font-bold text-right">
              {'Total'}
            </td>
            <td className="font-bold text-right text-primary">
              {result?.totalScore ?? 0}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
