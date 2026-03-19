import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Parse JSON string fields on a raw Meal DB record
export function parseMeal(meal: {
  id: string
  name: string
  type: string
  ingredients: string
  nutrition: string
  tags: string
  emoji: string
  imageUrl: string
  createdAt: Date
}) {
  return {
    ...meal,
    ingredients: JSON.parse(meal.ingredients || '[]'),
    nutrition: JSON.parse(meal.nutrition || '{}'),
  }
}
