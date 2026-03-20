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
  price: number
  custom: boolean
}

interface PantryItem {
  id: string
  name: string
  amount: string
  unit: string
  category: string
  status: 'ok' | 'low' | 'out'
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

function normalizeName(name: string) {
  return name.toLowerCase().trim()
}

export default function ShoppingPage() {
  const weekStart = getWeekStart()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [pantry, setPantry] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [people, setPeople] = useState(2)
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editUnit, setEditUnit] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newUnit, setNewUnit] = useState('')
  const [newCategory, setNewCategory] = useState('other')
  const [newPrice, setNewPrice] = useState('')

  const fetchItems = useCallback(async () => {
    const [itemsRes, settingsRes, pantryRes] = await Promise.all([
      fetch(`/api/shopping?weekStart=${weekStart}`),
      fetch('/api/settings'),
      fetch('/api/pantry'),
    ])
    setItems(await itemsRes.json())
    const settings = await settingsRes.json()
    setPeople(settings.people ?? 2)
    setPantry(await pantryRes.json())
    setLoading(false)
  }, [weekStart])

  useEffect(() => { fetchItems() }, [fetchItems])

  function getPantryStatus(itemName: string): 'ok' | 'low' | 'out' | null {
    const match = pantry.find((p) => normalizeName(p.name) === normalizeName(itemName))
    return match ? match.status : null
  }

  async function updatePeople(next: number) {
    const clamped = Math.max(1, next)
    setPeople(clamped)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ people: clamped }),
    })
    const res = await fetch('/api/shopping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, people: clamped }),
    })
    setItems(await res.json())
  }

  async function toggleItem(item: ShoppingItem) {
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, checked: !i.checked } : i)))
    await fetch('/api/shopping', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, checked: !item.checked }),
    })
  }

  async function addCustomItem(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/shopping', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ weekStart, name: newName.trim(), amount: newAmount, unit: newUnit, category: newCategory, price: parseFloat(newPrice) || 0 }),
    })
    const item = await res.json()
    setItems((prev) => [...prev, item])
    setNewName('')
    setNewAmount('')
    setNewUnit('')
    setNewCategory('other')
    setNewPrice('')
    setShowAddForm(false)
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch(`/api/shopping?id=${id}`, { method: 'DELETE' })
  }

  async function clearChecked() {
    setItems((prev) => prev.filter((i) => !i.checked))
    await fetch('/api/shopping', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearChecked: true, weekStart }),
    })
  }

  function openEdit(item: ShoppingItem) {
    setEditingItem(item)
    setEditAmount(item.amount)
    setEditUnit(item.unit)
    setEditPrice(item.price > 0 ? String(item.price) : '')
  }

  async function saveEdit() {
    if (!editingItem) return
    const price = parseFloat(editPrice) || 0
    setItems((prev) =>
      prev.map((i) =>
        i.id === editingItem.id
          ? { ...i, amount: editAmount, unit: editUnit, price }
          : i
      )
    )
    setEditingItem(null)
    await fetch('/api/shopping', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingItem.id, amount: editAmount, unit: editUnit, price }),
    })
  }

  const checkedCount = items.filter((i) => i.checked).length
  const totalCount = items.length
  const totalCost = items.reduce((sum, i) => sum + (i.price || 0), 0)

  const grouped = CATEGORY_ORDER.reduce<Record<string, ShoppingItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  const restockItems = pantry.filter((p) => p.status === 'low' || p.status === 'out')

  return (
    <div className="px-4 pt-6 pb-32">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {totalCount === 0
              ? 'No items — plan some meals first'
              : `${totalCount - checkedCount} of ${totalCount} remaining`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {checkedCount > 0 && (
            <button onClick={clearChecked} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Clear checked
            </button>
          )}
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-2xl"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Household size */}
      <div className="flex items-center gap-3 mb-6 py-3 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
        <span className="text-sm text-gray-500 flex-1">Household size</span>
        <button onClick={() => updatePeople(people - 1)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-medium transition-colors">−</button>
        <span className="text-base font-semibold text-gray-900 w-6 text-center">{people}</span>
        <button onClick={() => updatePeople(people + 1)} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-lg font-medium transition-colors">+</button>
        <span className="text-sm text-gray-400">people</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-300 text-sm">Loading…</div>
      ) : (
        <div className="space-y-6">
          {/* Restock section */}
          {restockItems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">⚠️ Restock</p>
              <div className="bg-white rounded-2xl overflow-hidden border border-yellow-100 shadow-sm divide-y divide-gray-50">
                {restockItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.status === 'low' ? 'bg-yellow-400' : 'bg-gray-300'}`} />
                    <span className="flex-1 text-sm capitalize text-gray-800">{item.name}</span>
                    <span className={`text-xs font-medium ${item.status === 'low' ? 'text-yellow-500' : 'text-gray-400'}`}>
                      {item.status === 'low' ? 'Low' : 'Out'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meal plan items */}
          {totalCount === 0 && restockItems.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-14 h-14 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl">🛒</div>
              <p className="text-gray-400 text-sm">Plan meals in the week view to auto-generate your list.</p>
            </div>
          ) : (
            Object.entries(grouped).map(([category, catItems]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                  {CATEGORY_LABELS[category] ?? category}
                </p>
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
                  {catItems.map((item) => {
                    const pantryStatus = getPantryStatus(item.name)
                    const inStock = pantryStatus === 'ok'
                    const isLow = pantryStatus === 'low'
                    const isChecked = item.checked

                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-4 py-3"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors cursor-pointer ${
                            isChecked ? 'bg-black border-black' : 'border-gray-200'
                          }`}
                          onClick={() => toggleItem(item)}
                        >
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </div>

                        <button className="flex-1 text-left min-w-0" onClick={() => openEdit(item)}>
                          <div className="flex items-center gap-1.5">
                            {inStock && <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />}
                            {isLow && <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />}
                            <span className={`text-sm capitalize ${isChecked ? 'text-gray-300 line-through' : 'text-gray-800'}`}>
                              {item.name}
                            </span>
                          </div>
                          {inStock && <span className="text-xs text-green-500 mt-0.5 block">In stock</span>}
                          {isLow && <span className="text-xs text-yellow-500 mt-0.5 block">Running low</span>}
                        </button>

                        <button onClick={() => openEdit(item)} className="text-right shrink-0">
                          <span className="text-xs text-gray-400 block">{item.amount} {item.unit}</span>
                          {item.price > 0 && (
                            <span className="text-xs font-medium text-gray-600 block">₦{item.price.toLocaleString()}</span>
                          )}
                        </button>
                        {item.custom && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteItem(item.id) }}
                            className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-gray-400 transition-colors text-lg leading-none shrink-0"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))
          )}

          {/* Total */}
          {totalCost > 0 && (
            <div className="bg-black text-white rounded-2xl px-4 py-4 flex items-center justify-between">
              <span className="text-sm font-medium">Estimated total</span>
              <span className="text-xl font-bold">₦{totalCost.toLocaleString()}</span>
            </div>
          )}
        </div>
      )}

      {/* Add custom item modal */}
      {showAddForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowAddForm(false)}
        >
          <div className="bg-white rounded-3xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={addCustomItem} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add item</h2>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Item *</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dish soap, Bin bags…"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Amount</label>
                  <input
                    type="text"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 1"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Unit</label>
                  <input
                    type="text"
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="e.g. pack, bottle"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Price (optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                  <input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="0"
                    step="1"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {['produce', 'proteins', 'dairy', 'grains', 'pantry', 'other'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        newCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!newName.trim()}
                className="w-full py-4 bg-black text-white font-semibold rounded-2xl disabled:opacity-40"
              >
                Add to list
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit item modal */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setEditingItem(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 capitalize">{editingItem.name}</h2>
                <button onClick={() => setEditingItem(null)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Quantity</label>
                  <input
                    type="text"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Unit</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    placeholder="e.g. g, pack, bunch"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Price (optional)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₦</span>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
              </div>

              <button
                onClick={saveEdit}
                className="w-full py-4 bg-black text-white font-semibold rounded-2xl"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
