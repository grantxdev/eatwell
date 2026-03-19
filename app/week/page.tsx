'use client'

import { useEffect, useState, useCallback } from 'react'
import { DAYS, MEAL_TYPES, getDayLabel, getMealTypeLabel, getWeekStart } from '@/lib/week'
import SuggestModal from '@/components/SuggestModal'
import MealDetailModal from '@/components/MealDetailModal'
import MealImage from '@/components/MealImage'

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
  emoji: string
  imageUrl?: string
  tags: string
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  ingredients: Ingredient[]
}

interface WeekPlan {
  id: string
  day: string
  mealType: string
  meal: Meal
}

interface MealSuggestion {
  name: string
  emoji: string
  ingredients: Ingredient[]
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  tags: string[]
}

export default function WeekPage() {
  const weekStart = getWeekStart()
  const [plans, setPlans] = useState<WeekPlan[]>([])
  const [allMeals, setAllMeals] = useState<Meal[]>([])
  const [loading, setLoading] = useState(true)
  const [suggestSlot, setSuggestSlot] = useState<{ day: string; mealType: string } | null>(null)
  const [detailSlot, setDetailSlot] = useState<{ plan: WeekPlan } | null>(null)

  const fetchData = useCallback(async () => {
    const [plansRes, mealsRes] = await Promise.all([
      fetch(`/api/week?weekStart=${weekStart}`),
      fetch('/api/meals'),
    ])
    setPlans(await plansRes.json())
    setAllMeals(await mealsRes.json())
    setLoading(false)
  }, [weekStart])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  function getPlan(day: string, mealType: string) {
    return plans.find((p) => p.day === day && p.mealType === mealType)
  }

  async function assignMeal(
    day: string,
    mealType: string,
    meal: Meal | MealSuggestion
  ) {
    let mealId: string

    if ('id' in meal) {
      mealId = meal.id
    } else {
      // Save suggestion to library first
      const res = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...meal,
          type: mealType,
          tags: meal.tags.join(','),
        }),
      })
      const saved = await res.json()
      mealId = saved.id
    }

    const res = await fetch('/api/week', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, day, mealType, mealId }),
    })
    const updated = await res.json()

    setPlans((prev) => {
      const filtered = prev.filter((p) => !(p.day === day && p.mealType === mealType))
      return [...filtered, updated]
    })

    // Regenerate shopping list
    fetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart }),
    })

    setSuggestSlot(null)
    fetchData()
  }

  async function removeFromSlot(day: string, mealType: string) {
    await fetch('/api/week', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, day, mealType }),
    })
    setPlans((prev) => prev.filter((p) => !(p.day === day && p.mealType === mealType)))
    setDetailSlot(null)

    fetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart }),
    })
  }

  const weekLabel = new Date(weekStart + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">This Week</h1>
          <p className="text-sm text-gray-400 mt-0.5">Week of {weekLabel}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-300 text-sm">
          Loading...
        </div>
      ) : (
        <div className="space-y-3">
          {DAYS.map((day) => (
            <div key={day} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="font-semibold text-gray-900">{getDayLabel(day)}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {MEAL_TYPES.map((mealType) => {
                  const plan = getPlan(day, mealType)
                  return (
                    <div
                      key={mealType}
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => {
                        if (plan) {
                          setDetailSlot({ plan })
                        } else {
                          setSuggestSlot({ day, mealType })
                        }
                      }}
                    >
                      <span className="text-xs text-gray-400 w-20 shrink-0">
                        {getMealTypeLabel(mealType)}
                      </span>
                      {plan ? (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MealImage imageUrl={plan.meal.imageUrl} emoji={plan.meal.emoji} size="sm" />
                          <span className="text-sm font-medium text-gray-900 truncate">
                            {plan.meal.name}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-gray-200 text-xl leading-none">+</span>
                          <span className="text-sm text-gray-300">Add meal</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {suggestSlot && (
        <SuggestModal
          mealType={suggestSlot.mealType}
          day={getDayLabel(suggestSlot.day)}
          existingMeals={allMeals}
          onSelect={(meal) => assignMeal(suggestSlot.day, suggestSlot.mealType, meal as Meal | MealSuggestion)}
          onClose={() => setSuggestSlot(null)}
        />
      )}

      {detailSlot && (
        <MealDetailModal
          meal={detailSlot.plan.meal}
          day={getDayLabel(detailSlot.plan.day)}
          mealType={detailSlot.plan.mealType}
          onClose={() => setDetailSlot(null)}
          onRemove={() => removeFromSlot(detailSlot.plan.day, detailSlot.plan.mealType)}
        />
      )}
    </div>
  )
}
