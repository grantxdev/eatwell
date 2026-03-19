'use client'

import { useState } from 'react'

interface Ingredient {
  name: string
  amount: string
  unit: string
  category: string
}

interface MealSuggestion {
  name: string
  emoji: string
  ingredients: Ingredient[]
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  tags: string[]
}

interface Meal {
  id: string
  name: string
  type: string
  emoji: string
  tags: string
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  ingredients: Ingredient[]
}

interface SuggestModalProps {
  mealType: string
  day: string
  existingMeals: Meal[]
  onSelect: (meal: Meal | MealSuggestion) => Promise<void>
  onClose: () => void
}

export default function SuggestModal({
  mealType,
  day,
  existingMeals,
  onSelect,
  onClose,
}: SuggestModalProps) {
  const [suggestions, setSuggestions] = useState<MealSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'ai' | 'library'>('ai')
  const [selecting, setSelecting] = useState<string | null>(null)

  const filteredLibrary = existingMeals.filter((m) => m.type === mealType)

  async function loadSuggestions() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType }),
      })
      if (!res.ok) throw new Error('Failed to get suggestions')
      const data = await res.json()
      setSuggestions(data)
    } catch {
      setError('Could not load suggestions. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelect(meal: Meal | MealSuggestion) {
    const key = meal.name
    setSelecting(key)
    await onSelect(meal)
    setSelecting(null)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add meal</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {day} · {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-300 hover:text-gray-500 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setTab('ai')
                if (suggestions.length === 0) loadSuggestions()
              }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === 'ai' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              AI Suggest
            </button>
            <button
              onClick={() => setTab('library')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === 'library' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Library ({filteredLibrary.length})
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 p-6 pt-4">
          {tab === 'ai' ? (
            <div>
              {loading && (
                <div className="flex items-center justify-center py-12 text-gray-400">
                  <span className="text-sm">Getting suggestions...</span>
                </div>
              )}
              {error && (
                <div className="text-center py-8">
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                  <button
                    onClick={loadSuggestions}
                    className="text-sm text-gray-500 underline"
                  >
                    Try again
                  </button>
                </div>
              )}
              {!loading && !error && suggestions.length === 0 && (
                <div className="text-center py-8">
                  <button
                    onClick={loadSuggestions}
                    className="bg-black text-white px-6 py-3 rounded-2xl text-sm font-medium"
                  >
                    Get suggestions
                  </button>
                </div>
              )}
              {suggestions.map((s) => (
                <div
                  key={s.name}
                  className="mb-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSelect(s)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl leading-none">{s.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 leading-tight">{s.name}</p>
                      {s.nutrition?.kcal > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.nutrition.kcal} kcal · {s.nutrition.protein}g protein
                        </p>
                      )}
                    </div>
                    {selecting === s.name ? (
                      <span className="text-xs text-gray-400">Adding...</span>
                    ) : (
                      <span className="text-gray-300 text-lg">+</span>
                    )}
                  </div>
                </div>
              ))}
              {suggestions.length > 0 && !loading && (
                <button
                  onClick={loadSuggestions}
                  className="w-full mt-2 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Get new suggestions
                </button>
              )}
            </div>
          ) : (
            <div>
              {filteredLibrary.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  No {mealType.toLowerCase()} meals in library yet.
                </p>
              ) : (
                filteredLibrary.map((meal) => (
                  <div
                    key={meal.id}
                    className="mb-3 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleSelect(meal)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">{meal.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 leading-tight">{meal.name}</p>
                        {meal.nutrition?.kcal > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {meal.nutrition.kcal} kcal
                          </p>
                        )}
                      </div>
                      {selecting === meal.name ? (
                        <span className="text-xs text-gray-400">Adding...</span>
                      ) : (
                        <span className="text-gray-300 text-lg">+</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
