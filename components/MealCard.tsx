'use client'

interface Meal {
  id: string
  name: string
  type: string
  imageUrl?: string
  tags: string
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  ingredients: { name: string; amount: string; unit: string; category: string }[]
}

interface MealCardProps {
  meal: Meal
  onDelete?: (id: string) => void
  onClick?: (meal: Meal) => void
}

const initial = (name: string) => name?.charAt(0)?.toUpperCase() ?? '?'

export default function MealCard({ meal, onDelete, onClick }: MealCardProps) {
  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm ${
        onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''
      }`}
      onClick={() => onClick?.(meal)}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 relative">
        {meal.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={meal.imageUrl}
            alt={meal.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl font-bold text-gray-200">{initial(meal.name)}</span>
          </div>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete(meal.id)
            }}
            className="absolute top-2 right-2 w-7 h-7 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-base leading-none transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{meal.name}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-gray-400 capitalize">{meal.type.toLowerCase()}</p>
          {meal.nutrition?.kcal > 0 && (
            <p className="text-xs text-gray-400">{meal.nutrition.kcal} kcal</p>
          )}
        </div>
      </div>
    </div>
  )
}
