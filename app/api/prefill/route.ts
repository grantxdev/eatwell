import { NextRequest, NextResponse } from 'next/server'
import { prefillMeal } from '@/lib/claude'

export async function POST(req: NextRequest) {
  const { name } = await req.json()
  if (!name?.trim()) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 })
  }
  const data = await prefillMeal(name.trim())
  return NextResponse.json(data)
}
