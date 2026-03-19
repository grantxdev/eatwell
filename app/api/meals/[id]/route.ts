import { NextRequest, NextResponse } from 'next/server'
import { prisma, parseMeal } from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json()
  const meal = await prisma.meal.update({
    where: { id: params.id },
    data: {
      name: body.name,
      type: body.type,
      ingredients: JSON.stringify(body.ingredients ?? []),
      nutrition: JSON.stringify(body.nutrition ?? { kcal: 0, protein: 0, carbs: 0, fat: 0 }),
      tags: Array.isArray(body.tags) ? body.tags.join(',') : (body.tags ?? ''),
      imageUrl: body.imageUrl ?? '',
      servings: body.servings ?? 2,
    },
  })
  return NextResponse.json(parseMeal(meal))
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.meal.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
