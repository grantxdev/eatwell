'use client'

import { useEffect, useState, useCallback } from 'react'
import { getWeekStart } from '@/lib/week'

interface ShoppingItem {
  id: string
  name: string
  amount: string
  unit: string
  category: string
  checked: boolean
}

const CATEGORY_LABELS: Record<string, string> = {
  produce: '🥦 Produce',
  proteins: '🥩 Proteins',
  dairy: '🥛 Dairy',
  grains: '🌾 Grains',
  pantry: '🫙 Pantry',
  other: '📦 Other',
}

const CATEGORY_ORDER = ['produce', 'proteins', 'dairy', 'grains', 'pantry', 'other']

export default function ShoppingPage() {
  const weekStart = getWeekStart()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [loading, setLoading] = useState(true)

  const fetchItems = useCallback(async () => {
    const res = await fetch(`/api/shopping?weekStart=${weekStart}`)
    setItems(await res.json())
    setLoading(false)
  }, [weekStart])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  async function toggleItem(item: ShoppingItem) {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i))
    )
    await fetch('/api/shopping', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, checked: !item.checked }),
    })
  }

  async function clearChecked() {
    setItems((prev) => prev.filter((i) => !i.checked))
    await fetch('/api/shopping', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearChecked: true, weekStart }),
    })
  }

  const checkedCount = items.filter((i) => i.checked).length
  const totalCount = items.length

  const grouped = CATEGORY_ORDER.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalCount === 0
              ? 'No items — plan some meals first'
              : `${totalCount - checkedCount} of ${totalCount} remaining`}
          </p>
        </div>
        {checkedCount > 0 && (
          <button
            onClick={clearChecked}
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear checked
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-300 text-sm">
          Loading...
        </div>
      ) : totalCount === 0 ? (
        <div className="text-center py-20">
          <span className="text-5xl">🛒</span>
          <p className="text-gray-400 text-sm mt-4">
            Plan meals in the week view to auto-generate your list.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {CATEGORY_LABELS[category] ?? category}
              </p>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => toggleItem(item)}
                  >
                    <div
                      className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                        item.checked
                          ? 'bg-black border-black'
                          : 'border-gray-200'
                      }`}
                    >
                      {item.checked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                          <path
                            d="M2 6l3 3 5-5"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      className={`flex-1 text-sm capitalize transition-colors ${
                        item.checked ? 'text-gray-300 line-through' : 'text-gray-800'
                      }`}
                    >
                      {item.name}
                    </span>
                    {(item.amount || item.unit) && (
                      <span className="text-xs text-gray-400">
                        {item.amount} {item.unit}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
