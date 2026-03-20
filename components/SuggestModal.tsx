'use client'

import { useState } from 'react'
import MealImage from './MealImage'

interface Ingredient {
  name: string
  amount: string
  unit: string
  category: string
}

interface MealSuggestion {
  name: string
  imageUrl: string
  ingredients: Ingredient[]
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  tags: string[]
}

interface Meal {
  id: string
  name: string
  type: string
  imageUrl?: string
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

  const filteredLibrary = existingMeals.filter((m) => m.type.split(',').includes(mealType))

  async function loadSuggestions() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealType }),
      })
      if (!res.ok) throw new Error('Failed')
      setSuggestions(await res.json())
    } catch {
      setError('Could not load suggestions. Check your API key.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSelect(meal: Meal | MealSuggestion) {
    setSelecting(meal.name)
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
        {/* Header */}
        <div className="p-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add meal</h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {day} · {mealType.charAt(0) + mealType.slice(1).toLowerCase()}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">
              ×
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setTab('ai'); if (suggestions.length === 0) loadSuggestions() }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'ai' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              AI Suggest
            </button>
            <button
              onClick={() => setTab('library')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${tab === 'library' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'}`}
            >
              Library ({filteredLibrary.length})
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4">
          {tab === 'ai' ? (
            <>
              {loading && (
                <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                  Getting suggestions...
                </div>
              )}
              {error && (
                <div className="text-center py-8">
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                  <button onClick={loadSuggestions} className="text-sm text-gray-500 underline">Try again</button>
                </div>
              )}
              {!loading && !error && suggestions.length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <button
                    onClick={loadSuggestions}
                    className="bg-black text-white px-6 py-3 rounded-2xl text-sm font-medium"
                  >
                    Get suggestions
                  </button>
                </div>
              )}
              {suggestions.map((s) => (
                <button
                  key={s.name}
                  className="w-full mb-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left"
                  onClick={() => handleSelect(s)}
                  disabled={selecting === s.name}
                >
                  <div className="flex items-center gap-3">
                    <MealImage imageUrl={s.imageUrl} name={s.name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm leading-tight">{s.name}</p>
                      {s.nutrition?.kcal > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {s.nutrition.kcal} kcal · {s.nutrition.protein}g protein
                        </p>
                      )}
                      {s.tags?.length > 0 && (
                        <p className="text-xs text-gray-300 mt-1">{s.tags.slice(0, 3).join(' · ')}</p>
                      )}
                    </div>
                    <span className="text-gray-300 text-lg shrink-0">
                      {selecting === s.name ? '…' : '+'}
                    </span>
                  </div>
                </button>
              ))}
              {suggestions.length > 0 && !loading && (
                <button
                  onClick={loadSuggestions}
                  className="w-full mt-1 py-3 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                >
                  Refresh suggestions
                </button>
              )}
            </>
          ) : (
            <>
              {filteredLibrary.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-8">
                  No meals saved for {mealType.toLowerCase()} yet.
                </p>
              ) : (
                filteredLibrary.map((meal) => (
                  <button
                    key={meal.id}
                    className="w-full mb-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-2xl transition-colors text-left"
                    onClick={() => handleSelect(meal)}
                    disabled={selecting === meal.name}
                  >
                    <div className="flex items-center gap-3">
                      <MealImage imageUrl={meal.imageUrl} name={meal.name} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-tight">{meal.name}</p>
                        {meal.nutrition?.kcal > 0 && (
                          <p className="text-xs text-gray-400 mt-0.5">{meal.nutrition.kcal} kcal</p>
                        )}
                      </div>
                      <span className="text-gray-300 text-lg shrink-0">
                        {selecting === meal.name ? '…' : '+'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
