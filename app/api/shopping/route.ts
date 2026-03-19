import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getWeekStart } from '@/lib/week'

function scaleAmount(amount: string, scale: number): string {
  if (scale === 1 || !amount) return amount
  const num = parseFloat(amount)
  if (isNaN(num)) return amount
  const scaled = num * scale
  return scaled % 1 === 0 ? scaled.toString() : scaled.toFixed(1)
}

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

  // Get household size for scaling
  const settings = await prisma.settings.upsert({
    where: { id: 'household' },
    create: { id: 'household', people: 2 },
    update: {},
  })
  const householdPeople = settings.people

  const plans = await prisma.weekPlan.findMany({
    where: { weekStart },
    include: { meal: true },
  })

  // Aggregate ingredients, scaling amounts to household size
  const ingredientMap = new Map<
    string,
    { name: string; amount: string; unit: string; category: string }
  >()

  for (const plan of plans) {
    const mealServings = plan.meal.servings || 2
    const scale = householdPeople / mealServings
    const ingredients = JSON.parse(plan.meal.ingredients || '[]') as {
      name: string; amount: string; unit: string; category: string
    }[]
    for (const ing of ingredients) {
      const key = `${ing.name.toLowerCase()}__${ing.unit.toLowerCase()}`
      if (ingredientMap.has(key)) {
        // Add amounts together if same ingredient + unit
        const existing = ingredientMap.get(key)!
        const existingNum = parseFloat(existing.amount)
        const newNum = parseFloat(scaleAmount(ing.amount, scale))
        if (!isNaN(existingNum) && !isNaN(newNum)) {
          const total = existingNum + newNum
          existing.amount = total % 1 === 0 ? total.toString() : total.toFixed(1)
        }
      } else {
        ingredientMap.set(key, {
          ...ing,
          amount: scaleAmount(ing.amount, scale),
        })
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
    await prisma.shoppingItem.deleteMany({ where: { weekStart, checked: true } })
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
