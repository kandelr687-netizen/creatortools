import { formatPoints, formatCurrency } from "@/lib/utils"

interface PointCardProps {
  points: number
}

export function PointCard({ points }: PointCardProps) {
  const isNegative = points < 0
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary to-indigo-600 text-white p-6 shadow-lg">
      <div className="text-sm opacity-80 mb-2">Total Points</div>
      <div className="text-4xl font-bold mb-1">
        {formatPoints(points)} <span className="text-lg">Points</span>
      </div>
      <div className="text-sm opacity-80">
        {isNegative ? (
          <span>Current value unavailable for negative balance</span>
        ) : (
          formatCurrency(points)
        )}
      </div>
    </div>
  )
}
