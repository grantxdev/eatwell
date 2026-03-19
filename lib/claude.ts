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
- nutrition: {kcal, protein, carbs, fat} (numbers)
- tags: array of strings (e.g. ["quick", "healthy", "vegetarian"])

Example format:
[{"name":"Avocado Toast","ingredients":[{"name":"bread","amount":"2","unit":"slices","category":"grains"},{"name":"avocado","amount":"1","unit":"whole","category":"produce"}],"nutrition":{"kcal":320,"protein":8,"carbs":35,"fat":18},"tags":["quick","vegetarian"]}]

Return only the JSON array, no other text.`,
      },
    ],
  })

  const content = message.content[0]
  if (content.type !== 'text') throw new Error('Unexpected response type')

  const text = content.text.trim()
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) throw new Error('No JSON array found in response')

  return JSON.parse(jsonMatch[0]) as MealSuggestion[]
}
