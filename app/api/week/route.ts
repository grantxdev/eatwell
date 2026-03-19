import { NextRequest, NextResponse } from 'next/server'
import { prisma, parseMeal } from '@/lib/db'
import { getWeekStart } from '@/lib/week'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('weekStart') ?? getWeekStart()

  const plans = await prisma.weekPlan.findMany({
    where: { weekStart },
    include: { meal: true },
  })

  return NextResponse.json(
    plans.map((p) => ({ ...p, meal: parseMeal(p.meal) }))
  )
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const weekStart = body.weekStart ?? getWeekStart()

  const plan = await prisma.weekPlan.upsert({
    where: {
      weekStart_day_mealType: {
        weekStart,
        day: body.day,
        mealType: body.mealType,
      },
    },
    create: {
      weekStart,
      day: body.day,
      mealType: body.mealType,
      mealId: body.mealId,
    },
    update: { mealId: body.mealId },
    include: { meal: true },
  })

  return NextResponse.json({ ...plan, meal: parseMeal(plan.meal) })
}

export async function DELETE(req: NextRequest) {
  const body = await req.json()
  const weekStart = body.weekStart ?? getWeekStart()

  await prisma.weekPlan.deleteMany({
    where: {
      weekStart,
      day: body.day,
      mealType: body.mealType,
    },
  })

  return NextResponse.json({ ok: true })
}
