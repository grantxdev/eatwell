import { NextRequest, NextResponse } from 'next/server'
import { prisma, parseMeal } from '@/lib/db'
import { getFoodImageUrl } from '@/lib/images'

export async function GET() {
  const meals = await prisma.meal.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(meals.map(parseMeal))
}

export async function POST(req: NextRequest) {
  const body = await req.json()

  // Use provided imageUrl, or fetch one from Unsplash
  const imageUrl = body.imageUrl || (await getFoodImageUrl(body.name))

  const meal = await prisma.meal.create({
    data: {
      name: body.name,
      type: body.type,
      ingredients: JSON.stringify(body.ingredients ?? []),
      nutrition: JSON.stringify(body.nutrition ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
      tags: Array.isArray(body.tags) ? body.tags.join(',') : (body.tags ?? ''),
      emoji: body.emoji ?? '🍽️',
      imageUrl,
    },
  })
  return NextResponse.json(parseMeal(meal), { status: 201 })
}
