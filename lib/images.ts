export async function getFoodImageUrl(mealName: string): Promise<string> {
  const query = encodeURIComponent(`${mealName} food dish`)
  const url = `https://source.unsplash.com/featured/400x400/?${query}`
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)
    const res = await fetch(url, { redirect: 'follow', signal: controller.signal })
    clearTimeout(timeout)
    if (res.url && res.url.includes('unsplash.com/photo')) {
      return res.url
    }
    return ''
  } catch {
    return ''
  }
}
