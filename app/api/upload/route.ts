import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']
  if (!allowed.includes(ext)) {
    return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
  }

  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const uploadDir = join(process.cwd(), 'public', 'uploads')

  await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), buffer)

  return NextResponse.json({ url: `/uploads/${filename}` })
}
