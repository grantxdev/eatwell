import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getWeekStart } from '@/lib/week'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart') ?? getWeekStart()

  const items = await prisma.shoppingItem.findMany({
    where: { weekStart },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const weekStart = body.weekStart ?? getWeekStart()

  const plans = await prisma.weekPlan.findMany({
    where: { weekStart },
    include: { meal: true },
  })

  const ingredientMap = new Map<
    string,
    { name: string; amount: string; unit: string; category: string }
  >()

  for (const plan of plans) {
    const ingredients = JSON.parse(plan.meal.ingredients || '[]') as {
      name: string
      amount: string
      unit: string
      category: string
    }[]
    for (const ing of ingredients) {
      const key = ing.name.toLowerCase()
      if (!ingredientMap.has(key)) {
        ingredientMap.set(key, { ...ing })
      }
    }
  }

  await prisma.shoppingItem.deleteMany({ where: { weekStart } })

  if (ingredientMap.size > 0) {
    await Promise.all(
      Array.from(ingredientMap.values()).map((ing) =>
        prisma.shoppingItem.create({
          data: {
            weekStart,
            name: ing.name,
            amount: ing.amount ?? '',
            unit: ing.unit ?? '',
            category: ing.category || 'other',
          },
        })
      )
    )
  }

  const items = await prisma.shoppingItem.findMany({
    where: { weekStart },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(items)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()

  if (body.clearChecked) {
    const weekStart = body.weekStart ?? getWeekStart()
    await prisma.shoppingItem.deleteMany({
      where: { weekStart, checked: true },
    })
    const items = await prisma.shoppingItem.findMany({
      where: { weekStart },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(items)
  }

  const item = await prisma.shoppingItem.update({
    where: { id: body.id },
    data: { checked: body.checked },
  })
  return NextResponse.json(item)
}
