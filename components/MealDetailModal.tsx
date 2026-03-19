'use client'

interface Ingredient {
  name: string
  amount: string
  unit: string
  category: string
}

interface Meal {
  id: string
  name: string
  type: string
  imageUrl?: string
  tags: string
  servings: number
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  ingredients: Ingredient[]
}

interface MealDetailModalProps {
  meal: Meal
  day?: string
  mealType?: string
  onClose: () => void
  onRemove?: () => void
  onEdit?: () => void
}

export default function MealDetailModal({
  meal,
  day,
  mealType,
  onClose,
  onRemove,
  onEdit,
}: MealDetailModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero */}
        <div className="relative">
          {meal.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={meal.imageUrl} alt={meal.name} className="w-full h-52 object-cover rounded-t-3xl" />
          ) : (
            <div className="w-full h-52 bg-gray-100 rounded-t-3xl flex items-center justify-center">
              <span className="text-7xl font-bold text-gray-200">{meal.name?.charAt(0)?.toUpperCase()}</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center text-lg leading-none transition-colors"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{meal.name}</h2>
              <p className="text-sm text-gray-400 mt-1">
                {day && mealType ? `${day} · ${mealType.charAt(0) + mealType.slice(1).toLowerCase()} · ` : ''}
                Serves {meal.servings ?? 2}
              </p>
            </div>
            {onEdit && (
              <button
                onClick={onEdit}
                className="shrink-0 px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:border-gray-400 transition-colors"
              >
                Edit
              </button>
            )}
          </div>

          {meal.nutrition?.kcal > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-5">
              {[
                { label: 'Calories', value: meal.nutrition.kcal, unit: '' },
                { label: 'Protein', value: meal.nutrition.protein, unit: 'g' },
                { label: 'Carbs', value: meal.nutrition.carbs, unit: 'g' },
                { label: 'Fat', value: meal.nutrition.fat, unit: 'g' },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{stat.value}{stat.unit}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          )}

          {meal.ingredients?.length > 0 && (
            <div className="mt-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Ingredients · serves {meal.servings ?? 2}
              </h3>
              <ul className="space-y-2">
                {meal.ingredients.map((ing, i) => (
                  <li key={i} className="flex justify-between text-sm">
                    <span className="text-gray-800 capitalize">{ing.name}</span>
                    <span className="text-gray-400">{ing.amount} {ing.unit}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {onRemove && (
            <button
              onClick={onRemove}
              className="mt-6 w-full py-3 text-sm text-red-400 hover:text-red-500 border border-red-100 hover:border-red-200 rounded-2xl transition-colors"
            >
              Remove from this slot
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
