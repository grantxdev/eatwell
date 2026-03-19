'use client'

import { useRef, useState } from 'react'

interface Ingredient {
  name: string
  amount: string
  unit: string
  category: string
}

interface MealData {
  name: string
  type: string
  imageUrl: string
  ingredients: Ingredient[]
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  tags: string
  servings: number
}

interface EditMeal extends Omit<MealData, 'imageUrl'> {
  id: string
  imageUrl?: string
}

interface AddMealFormProps {
  editMeal?: EditMeal
  onSave: (meal: MealData) => Promise<void>
  onClose: () => void
}

function ingredientsToText(ingredients: Ingredient[]): string {
  return ingredients.map((i) => [i.name, i.amount, i.unit, i.category].filter(Boolean).join(', ')).join('\n')
}

export default function AddMealForm({ editMeal, onSave, onClose }: AddMealFormProps) {
  const [name, setName] = useState(editMeal?.name ?? '')
  const [type, setType] = useState(editMeal?.type ?? 'DINNER')
  const [imageUrl, setImageUrl] = useState(editMeal?.imageUrl ?? '')
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [ingredientsText, setIngredientsText] = useState(
    editMeal ? ingredientsToText(editMeal.ingredients) : ''
  )
  const [kcal, setKcal] = useState(editMeal?.nutrition.kcal ? String(editMeal.nutrition.kcal) : '')
  const [protein, setProtein] = useState(editMeal?.nutrition.protein ? String(editMeal.nutrition.protein) : '')
  const [tags, setTags] = useState(editMeal?.tags ?? '')
  const [saving, setSaving] = useState(false)
  const [prefilling, setPrefilling] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  async function handlePrefill() {
    if (!name.trim()) return
    setPrefilling(true)
    try {
      const res = await fetch('/api/prefill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setIngredientsText(ingredientsToText(data.ingredients))
      setKcal(String(data.nutrition.kcal || ''))
      setProtein(String(data.nutrition.protein || ''))
      setTags(data.tags?.join(', ') ?? '')
    } catch {
      // silently fail — user can still fill manually
    } finally {
      setPrefilling(false)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/upload', { method: 'POST', body: form })
    const data = await res.json()
    if (data.url) setImageUrl(data.url)
    setUploading(false)
  }

  function applyUrl() {
    if (urlInput.trim()) {
      setImageUrl(urlInput.trim())
      setShowUrlInput(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)

    const ingredients = ingredientsText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [ingName, amount, unit, category] = line.split(',').map((p) => p.trim())
        return { name: ingName ?? line, amount: amount ?? '', unit: unit ?? '', category: category ?? 'other' }
      })

    await onSave({
      name: name.trim(),
      type,
      imageUrl,
      ingredients,
      nutrition: { kcal: parseInt(kcal) || 0, protein: parseInt(protein) || 0, carbs: 0, fat: 0 },
      tags,
      servings: 2,
    })
    setSaving(false)
  }

  const isEdit = !!editMeal

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Image area */}
          <div className="relative">
            {imageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Meal preview" className="w-full h-52 object-cover rounded-t-3xl" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-lg leading-none transition-colors"
                >
                  ×
                </button>
              </>
            ) : (
              <div className="w-full h-44 bg-gray-100 rounded-t-3xl flex flex-col items-center justify-center gap-3">
                <p className="text-sm text-gray-400">Add a food photo</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-400 transition-colors"
                  >
                    {uploading ? 'Uploading…' : '📁 Upload'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-gray-400 transition-colors"
                  >
                    🔗 Paste URL
                  </button>
                </div>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          </div>

          {showUrlInput && !imageUrl && (
            <div className="px-6 pt-4 flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyUrl())}
                placeholder="Paste image URL from Pinterest, HelloFresh…"
                className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                autoFocus
              />
              <button type="button" onClick={applyUrl} className="px-4 py-2.5 bg-black text-white rounded-xl text-sm font-medium shrink-0">Add</button>
              <button type="button" onClick={() => setShowUrlInput(false)} className="px-3 py-2.5 text-gray-400 hover:text-gray-600">×</button>
            </div>
          )}

          <div className="p-6 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">{isEdit ? 'Edit meal' : 'New meal'}</h2>
              <button type="button" onClick={onClose} className="text-gray-300 hover:text-gray-500 text-2xl leading-none">×</button>
            </div>

            {/* Name + AI prefill */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Name *</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Spicy Salmon Bowl"
                  className="flex-1 px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                  autoFocus={!isEdit}
                />
                <button
                  type="button"
                  onClick={handlePrefill}
                  disabled={prefilling || !name.trim()}
                  title="Let AI fill in the details"
                  className="px-4 py-3 bg-gray-900 text-white rounded-2xl text-sm font-medium disabled:opacity-40 hover:bg-black transition-colors whitespace-nowrap shrink-0"
                >
                  {prefilling ? '…' : '✨ Fill'}
                </button>
              </div>
              {name.trim() && !prefilling && (
                <p className="text-xs text-gray-400 mt-1.5 ml-1">Type the meal name then tap ✨ Fill to auto-fill details</p>
              )}
            </div>

            {/* Meal type */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Meal type</label>
              <div className="flex gap-2">
                {['BREAKFAST', 'LUNCH', 'DINNER'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      type === t ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {t.charAt(0) + t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Ingredients */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Ingredients
                <span className="normal-case font-normal ml-1 text-gray-300">(name, amount, unit, category)</span>
              </label>
              <textarea
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                placeholder={'salmon, 150, g, proteins\nrice, 80, g, grains\navocado, 1, whole, produce'}
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-sm text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10 resize-none"
              />
            </div>

            {/* Nutrition */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Calories</label>
                <input
                  type="number"
                  value={kcal}
                  onChange={(e) => setKcal(e.target.value)}
                  placeholder="450"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Protein (g)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(e.target.value)}
                  placeholder="35"
                  className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="quick, healthy, spicy"
                className="w-full px-4 py-3 bg-gray-50 rounded-2xl text-gray-900 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-black/10"
              />
            </div>

            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="w-full py-4 bg-black text-white font-semibold rounded-2xl disabled:opacity-40 transition-opacity"
            >
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Save meal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
