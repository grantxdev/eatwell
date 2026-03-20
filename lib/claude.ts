import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export interface MealSuggestion {
  name: string
  imageUrl: string
  ingredients: { name: string; amount: string; unit: string; category: string }[]
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  tags: string[]
  servings: number
}

export interface MealPrefill {
  ingredients: { name: string; amount: string; unit: string; category: string }[]
  nutrition: { kcal: number; protein: number; carbs: number; fat: number }
  tags: string[]
  servings: number
}

export async function suggestMeals(
  mealType: 'BREAKFAST' | 'LUNCH' | 'DINNER',
  recentMeals: string[],
  count = 3
): Promise<MealSuggestion[]> {
  const mealTypeLabel = mealType.toLowerCase()
  const recentContext =
    recentMeals.length > 0
      ? `Recent meals eaten: ${recentMeals.join(', ')}. Avoid repeating these.`
      : 'No recent meals to reference.'

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Suggest ${count} different ${mealTypeLabel} meal options for a household. ${recentContext}

Return ONLY a JSON array with exactly ${count} meals. Each meal object must have:
- name: string (meal name)
- ingredients: array of {name, amount, unit, category} where category is one of: produce, proteins, dairy, grains, pantry, other
- nutrition: {kcal, protein, carbs, fat} (numbers, per serving)
- tags: array of strings (e.g. ["quick", "healthy", "vegetarian"])
- servings: number (how many people this recipe serves, typically 2-4)

Example format:
[{"name":"Avocado Toast","ingredients":[{"name":"bread","amount":"2","unit":"slices","category":"grains"},{"name":"avocado","amount":"1","unit":"whole","category":"produce"}],"nutrition":{"kcal":320,"protein":8,"carbs":35,"fat":18},"tags":["quick","vegetarian"],"servings":2}]

Return only the JSON array, no other text.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  const jsonMatch = content.text.trim().match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array found in response')
  return JSON.parse(jsonMatch[0]) as MealSuggestion[]
}

type Ingredient = { name: string; amount: string; unit: string; category: string }

export async function canonicalizeIngredients(ingredients: Ingredient[]): Promise<Ingredient[]> {
  if (ingredients.length === 0) return []
  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `You are a grocery list deduplicator. Merge any ingredients that refer to the same food item — even if the names differ slightly or units differ.

Rules (apply strictly):
- "garlic cloves", "garlic clove", "garlic" → merge into "garlic"
- "fresh ginger", "ginger root", "ginger" → merge into "ginger"
- "spring onion", "green onion", "scallion" → merge into "spring onion"
- Strip adjectives like fresh, dried, ground, whole, raw, chopped, minced, sliced — they refer to the same ingredient
- Use the simplest, shortest name (e.g. "garlic" not "garlic cloves")
- When merging, sum numeric amounts if units are the same; if units differ, keep the larger/more useful unit and convert if obvious (e.g. 3 cloves + 10g garlic → just list "3 cloves garlic" since cloves is more useful for shopping)
- Keep the most specific category (avoid "other" when a better category exists)
- Lowercase all names

Input: ${JSON.stringify(ingredients)}

Return ONLY a JSON array. Same shape: [{name, amount, unit, category}]. No markdown, no explanation.`,
      },
    ],
  })
  const content = message.content[0]
  if (content.type !== 'text') return ingredients
  const match = content.text.trim().match(/\[[\s\S]*\]/)
  if (!match) return ingredients
  try {
    return JSON.parse(match[0]) as Ingredient[]
  } catch {
    return ingredients
  }
}

export async function prefillMeal(name: string): Promise<MealPrefill> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `For the meal "${name}", return a JSON object with:
- ingredients: array of {name, amount, unit, category} where category is one of: produce, proteins, dairy, grains, pantry, other
- nutrition: {kcal, protein, carbs, fat} (numbers, per serving)
- tags: array of strings (e.g. ["quick", "healthy"])
- servings: number (typical serving size for this dish, e.g. 2 or 4)

Return ONLY the JSON object, no other text.
Example: {"ingredients":[{"name":"chicken breast","amount":"200","unit":"g","category":"proteins"}],"nutrition":{"kcal":450,"protein":35,"carbs":40,"fat":12},"tags":["high-protein"],"servings":2}`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')
  const jsonMatch = content.text.trim().match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  return JSON.parse(jsonMatch[0]) as MealPrefill
}
