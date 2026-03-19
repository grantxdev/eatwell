import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const items = await prisma.pantryItem.findMany({
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  })
  return NextResponse.json(items)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const item = await prisma.pantryItem.create({
    data: {
      name: body.name,
      amount: body.amount ?? '',
      unit: body.unit ?? '',
      category: body.category ?? 'other',
      status: 'ok',
    },
  })
  return NextResponse.json(item)
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const item = await prisma.pantryItem.update({
    where: { id: body.id },
    data: {
      ...(body.status !== undefined && { status: body.status }),
      ...(body.amount !== undefined && { amount: body.amount }),
      ...(body.unit !== undefined && { unit: body.unit }),
      ...(body.name !== undefined && { name: body.name }),
    },
  })
  return NextResponse.json(item)
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  await prisma.pantryItem.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
