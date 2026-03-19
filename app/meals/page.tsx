'use client'

import { useEffect, useState, useCallback } from 'react'
import MealCard from '@/components/MealCard'
import AddMealForm from '@/components/AddMealForm'
import MealDetailModal from '@/components/MealDetailModal'

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
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  ingredients: Ingredient[]
}

const FILTERS = ['ALL', 'BREAKFAST', 'LUNCH', 'DINNER']

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [filter, setFilter] = useState('ALL')

  const fetchMeals = useCallback(async () => {
    const res = await fetch('/api/meals')
    setMeals(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchMeals() }, [fetchMeals])

  async function addMeal(data: {
    name: string
    type: string
    imageUrl: string
    ingredients: Ingredient[]
    nutrition: { kcal: number; protein: number; carbs: number; fat: number }
    tags: string
  }) {
    const res = await fetch('/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const meal = await res.json()
    setMeals((prev) => [meal, ...prev])
    setShowAddForm(false)
  }

  async function deleteMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id))
    await fetch(`/api/meals/${id}`, { method: 'DELETE' })
  }

  const filtered = filter === 'ALL' ? meals : meals.filter((m) => m.type === filter)

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meals</h1>
          <p className="text-sm text-gray-400 mt-0.5">{meals.length} saved</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-2xl"
        >
          + Add meal
        </button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === f ? 'bg-black text-white' : 'bg-white text-gray-600 border border-gray-200'
            }`}
          >
            {f === 'ALL' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-300 text-sm">
          Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-gray-300">?</span>
          </div>
          <p className="text-gray-400 text-sm">
            {meals.length === 0 ? 'No meals yet — add your first one.' : 'No meals in this category.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((meal) => (
            <MealCard
              key={meal.id}
              meal={meal}
              onDelete={deleteMeal}
              onClick={setSelectedMeal}
            />
          ))}
        </div>
      )}

      {showAddForm && (
        <AddMealForm onSave={addMeal} onClose={() => setShowAddForm(false)} />
      )}

      {selectedMeal && (
        <MealDetailModal
          meal={selectedMeal}
          onClose={() => setSelectedMeal(null)}
        />
      )}
    </div>
  )
}
