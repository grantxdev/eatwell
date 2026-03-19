import { NextRequest, NextResponse } from 'next/server'
import { prisma, parseMeal } from '@/lib/db'

export async function GET() {
  const meals = await prisma.meal.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(meals.map(parseMeal))
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const meal = await prisma.meal.create({
    data: {
      name: body.name,
      type: body.type,
      ingredients: JSON.stringify(body.ingredients ?? []),
      nutrition: JSON.stringify(body.nutrition ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
      tags: Array.isArray(body.tags) ? body.tags.join(',') : (body.tags ?? ''),
      emoji: '',
      imageUrl: body.imageUrl ?? '',
    },
  })
  return NextResponse.json(parseMeal(meal), { status: 201 })
}
