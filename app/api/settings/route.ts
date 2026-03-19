import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const settings = await prisma.settings.upsert({
    where: { id: 'household' },
    create: { id: 'household', people: 2 },
    update: {},
  })
  return NextResponse.json(settings)
}

export async function PUT(req: NextRequest) {
  const { people } = await req.json()
  const settings = await prisma.settings.upsert({
    where: { id: 'household' },
    create: { id: 'household', people },
    update: { people },
  })
  return NextResponse.json(settings)
}
