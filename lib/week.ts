export function getWeekStart(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun, 1=Mon
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust to Monday
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().split('T')[0]
}

export const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'] as const
export const MEAL_TYPES = ['BREAKFAST', 'LUNCH', 'DINNER'] as const

export function getDayLabel(day: string): string {
  const map: Record<string, string> = {
    MON: 'Mon',
    TUE: 'Tue',
    WED: 'Wed',
    THU: 'Thu',
    FRI: 'Fri',
    SAT: 'Sat',
    SUN: 'Sun',
  }
  return map[day] ?? day
}

export function getMealTypeLabel(type: string): string {
  const map: Record<string, string> = {
    BREAKFAST: 'Breakfast',
    LUNCH: 'Lunch',
    DINNER: 'Dinner',
  }
  return map[type] ?? type
}
