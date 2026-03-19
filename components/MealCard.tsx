'use client'

interface Meal {
  id: string
  name: string
  type: string
  emoji: string
  tags: string
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  ingredients: { name: string; amount: string; unit: string; category: string }[]
}

interface MealCardProps {
  meal: Meal
  onDelete?: (id: string) => void
  onClick?: (meal: Meal) => void
}

export default function MealCard({ meal, onDelete, onClick }: MealCardProps) {
  const tags = meal.tags ? meal.tags.split(',').filter(Boolean) : []

  return (
    <div
      className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm ${
        onClick ? 'cursor-pointer hover:border-gray-300 transition-colors' : ''
      }`}
      onClick={() => onClick?.(meal)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-3xl leading-none shrink-0">{meal.emoji}</span>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 leading-tight truncate">{meal.name}</p>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{meal.type.toLowerCase()}</p>
          </div>
        </div>
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(meal.id)
            }}
            className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-lg leading-none"
          >
            ×
          </button>
        )}
      </div>
      {meal.nutrition?.kcal > 0 && (
        <div className="mt-3 flex gap-3 text-xs text-gray-400">
          <span>{meal.nutrition.kcal} kcal</span>
          <span>{meal.nutrition.protein}g protein</span>
        </div>
      )}
      {tags.length > 0 && (
        <div className="mt-2 flex gap-1 flex-wrap">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
