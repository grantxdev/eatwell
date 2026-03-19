'use client'

import { useEffect, useState, useCallback } from 'react'

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

const STATUS_CONFIG = {
  ok:  { label: 'In stock',  dot: 'bg-black' },
  low: { label: 'Low',       dot: 'bg-yellow-400' },
  out: { label: 'Out',       dot: 'bg-gray-300' },
}

const NEXT_STATUS: Record<string, 'ok' | 'low' | 'out'> = { ok: 'low', low: 'out', out: 'ok' }

const UNITS = ['g', 'kg', 'ml', 'l', 'tsp', 'tbsp', 'cup', 'oz', 'lb', 'piece', 'clove', 'bunch', 'can', 'slice']
const CATEGORIES = ['produce', 'proteins', 'dairy', 'grains', 'pantry', 'other']

export default function PantryPage() {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [unit, setUnit] = useState('g')
  const [category, setCategory] = useState('other')
  const [saving, setSaving] = useState(false)

  const fetchItems = useCallback(async () => {
    const res = await fetch('/api/pantry')
    setItems(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  async function cycleStatus(item: PantryItem) {
    const next = NEXT_STATUS[item.status]
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: next } : i))
    await fetch('/api/pantry', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status: next }),
    })
  }

  async function deleteItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
    await fetch(`/api/pantry?id=${id}`, { method: 'DELETE' })
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const res = await fetch('/api/pantry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), amount, unit, category }),
    })
    const item = await res.json()
    setItems((prev) => [...prev, item])
    setName('')
    setAmount('')
    setUnit('g')
    setCategory('other')
    setShowForm(false)
    setSaving(false)
  }

  const grouped = CATEGORY_ORDER.reduce<Record<string, PantryItem[]>>((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat)
    if (catItems.length > 0) acc[cat] = catItems
    return acc
  }, {})

  const lowCount = items.filter((i) => i.status === 'low' || i.status === 'out').length

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pantry</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {items.length === 0
              ? 'Track what you have at home'
              : `${items.length} items${lowCount > 0 ? ` · ${lowCount} low or out` : ''}`}
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-black text-white text-sm font-semibold px-4 py-2.5 rounded-2xl"
        >
          + Add item
        </button>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mb-5">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
            <span className="text-xs text-gray-400">{cfg.label}</span>
          </div>
        ))}
        <span className="text-xs text-gray-300 ml-1">· tap dot to cycle</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-300 text-sm">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl">🫙</div>
          <p className="text-gray-400 text-sm">Add items you keep at home to track stock levels.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, catItems]) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">
                {CATEGORY_LABELS[cat] ?? cat}
              </p>
              <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm divide-y divide-gray-50">
                {catItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => cycleStatus(item)}
                      className={`w-3 h-3 rounded-full shrink-0 transition-colors ${STATUS_CONFIG[item.status].dot}`}
                    />
                    <span className={`flex-1 text-sm capitalize ${item.status === 'out' ? 'text-gray-300 line-through' : 'text-gray-800'}`}>
                      {item.name}
                    </span>
                    {(item.amount || item.unit) && (
                      <span className="text-xs text-gray-400">{item.amount} {item.unit}</span>
                    )}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-gray-200 hover:text-gray-400 transition-colors text-lg leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add item modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add pantry item</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Item name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Olive oil"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Amount</label>
                  <input
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                        category === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={saving || !name.trim()}
                className="w-full py-4 bg-black text-white font-semibold rounded-2xl disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Add to pantry'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
