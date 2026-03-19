import { NextRequest, NextResponse } from 'next/server'
import { suggestMeals } from '@/lib/claude'
import { prisma } from '@/lib/db'
import { getWeekStart } from '@/lib/week'
import { getFoodImageUrl } from '@/lib/images'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const mealType = body.mealType as 'BREAKFAST' | 'LUNCH' | 'DINNER'

  // Get recent meals from the past 2 weeks for context
  const twoWeeksAgo = new Date()
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14)
  const weekStart = getWeekStart(twoWeeksAgo)

  const recentPlans = await prisma.weekPlan.findMany({
    where: { weekStart: { gte: weekStart } },
    include: { meal: true },
    take: 20,
  })

  const recentMealNames = Array.from(new Set(recentPlans.map((p) => p.meal.name)))
  const suggestions = await suggestMeals(mealType, recentMealNames)

  // Fetch images for all suggestions in parallel
  const withImages = await Promise.all(
    suggestions.map(async (s) => ({
      ...s,
      imageUrl: await getFoodImageUrl(s.name),
    }))
  )

  return NextResponse.json(withImages)
}
