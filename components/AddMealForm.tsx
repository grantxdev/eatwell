'use client'

import { useState } from 'react'

interface AddMealFormProps {
  onSave: (meal: {
    name: string
    type: string
    emoji: string
    ingredients: { name: string; amount: string; unit: string; category: string }[]
    nutrition: { kcal: number; protein: number; carbs: number; fat: number }
    tags: string
  }) => Promise<void>
  onClose: () => void
}

const EMOJIS = ['🍽️', '🥗', '🍳', '🥞', '🍲', '🥙', '🍜', '🥩', '🐟', '🥦', '🍕', '🌮', '🍱', '🥚', '🥣']

export default function AddMealForm({ onSave, onClose }: AddMealFormProps) {
  const [name, setName] = useState('')
  const [type, setType] = useState('DINNER')
  const [emoji, setEmoji] = useState('🍽️')
  const [ingredientsText, setIngredientsText] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)

    const ingredients = ingredientsText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(',').map((p) => p.trim())
        return {
          name: parts[0] ?? line,
          amount: parts[1] ?? '',
          unit: parts[2] ?? '',
          category: parts[3] ?? 'other',
        }
      })

    await onSave({
      name: name.trim(),
      type,
      emoji,
      ingredients,
      nutrition: {
        kcal: parseInt(kcal) || 0,
        protein: parseInt(protein) || 0,
        carbs: 0,
        fat: 0,
      },
      tags,
    })
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Add meal</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-300 hover:text-gray-500 text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Emoji</p>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`text-2xl p-2 rounded-xl transition-colors ${
                    emoji === e ? 'bg-black' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Meal name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Avocado Toast"
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
              autoFocus
            />
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Meal type
            </label>
            <div className="flex gap-2">
              {['BREAKFAST', 'LUNCH', 'DINNER'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                    type === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {t.charAt(0) + t.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Ingredients (one per line: name, amount, unit, category)
            </label>
            <textarea
              value={ingredientsText}
              onChange={(e) => setIngredientsText(e.target.value)}
              placeholder="eggs, 3, whole, proteins&#10;bread, 2, slices, grains"
              rows={4}
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Calories
              </label>
              <input
                type="number"
                value={kcal}
                onChange={(e) => setKcal(e.target.value)}
                placeholder="350"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Protein (g)
              </label>
              <input
                type="number"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
                placeholder="20"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="quick, healthy, vegetarian"
              className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
            />
          </div>

          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="w-full py-4 bg-black text-white font-semibold rounded-2xl disabled:opacity-40 transition-opacity"
          >
            {saving ? 'Saving...' : 'Save meal'}
          </button>
        </form>
      </div>
    </div>
  )
}
