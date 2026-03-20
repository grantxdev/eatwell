import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getWeekStart } from '@/lib/week'
import { canonicalizeIngredients } from '@/lib/claude'

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim()
  if (['g', 'gram', 'grams'].includes(u)) return 'g'
  if (['kg', 'kilogram', 'kilograms'].includes(u)) return 'kg'
  if (['ml', 'milliliter', 'milliliters', 'millilitre', 'millilitres'].includes(u)) return 'ml'
  if (['l', 'liter', 'liters', 'litre', 'litres'].includes(u)) return 'l'
  if (['tsp', 'teaspoon', 'teaspoons'].includes(u)) return 'tsp'
  if (['tbsp', 'tablespoon', 'tablespoons'].includes(u)) return 'tbsp'
  if (['cup', 'cups'].includes(u)) return 'cup'
  if (['oz', 'ounce', 'ounces'].includes(u)) return 'oz'
  if (['lb', 'lbs', 'pound', 'pounds'].includes(u)) return 'lb'
  if (['piece', 'pieces', 'whole', 'unit', 'units', 'pcs'].includes(u)) return 'piece'
  if (['clove', 'cloves'].includes(u)) return 'clove'
  if (['slice', 'slices'].includes(u)) return 'slice'
  if (['bunch', 'bunches'].includes(u)) return 'bunch'
  if (['can', 'cans'].includes(u)) return 'can'
  return u
}

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

  // Get household size for scaling — prefer value passed in body (avoids pool read lag)
  let householdPeople: number = body.people
  if (!householdPeople) {
    const settings = await prisma.settings.upsert({
      where: { id: 'household' },
      create: { id: 'household', people: 2 },
      update: {},
    })
    householdPeople = settings.people
  }

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
    const scale = householdPeople / 2
    const ingredients = JSON.parse(plan.meal.ingredients || '[]') as {
      name: string; amount: string; unit: string; category: string
    }[]
    for (const ing of ingredients) {
      const normUnit = normalizeUnit(ing.unit)
      const key = `${ing.name.toLowerCase().trim()}__${normUnit}`
      if (ingredientMap.has(key)) {
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
          unit: normUnit,
          amount: scaleAmount(ing.amount, scale),
        })
      }
    }
  }

  // AI canonicalization — merges fuzzy duplicates like "fresh ginger" + "ginger root"
  let finalIngredients = Array.from(ingredientMap.values())
  if (finalIngredients.length > 0) {
    try {
      finalIngredients = await canonicalizeIngredients(finalIngredients)
    } catch {
      // fall back to uncanonicalised list if AI fails
    }
  }

  // Only delete meal-plan items — keep custom items added manually
  await prisma.shoppingItem.deleteMany({ where: { weekStart, custom: false } })

  if (finalIngredients.length > 0) {
    await Promise.all(
      finalIngredients.map((ing) =>
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

export async function PUT(req: NextRequest) {
  const body = await req.json()
  const weekStart = body.weekStart ?? getWeekStart()
  const item = await prisma.shoppingItem.create({
    data: {
      weekStart,
      name: body.name,
      amount: body.amount ?? '',
      unit: body.unit ?? '',
      category: body.category ?? 'other',
      price: body.price ?? 0,
      custom: true,
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.shoppingItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
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
    data: {
      ...(body.checked !== undefined && { checked: body.checked }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.unit !== undefined && { unit: body.unit }),
      ...(body.price !== undefined && { price: body.price }),
    },
  })
  return NextResponse.json(item)
}
