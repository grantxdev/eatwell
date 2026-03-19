interface MealImageProps {
  imageUrl?: string
  name: string
  size: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { wh: 36, text: 'text-sm' },
  md: { wh: 52, text: 'text-base' },
  lg: { wh: 72, text: 'text-xl' },
}

export default function MealImage({ imageUrl, name, size, className = '' }: MealImageProps) {
  const { wh, text } = sizeMap[size]
  const initial = name?.charAt(0)?.toUpperCase() ?? '?'

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        width={wh}
        height={wh}
        className={`object-cover rounded-xl shrink-0 bg-gray-100 ${className}`}
        style={{ width: wh, height: wh }}
      />
    )
  }

  return (
    <div
      className={`rounded-xl shrink-0 bg-gray-100 flex items-center justify-center ${className}`}
      style={{ width: wh, height: wh }}
    >
      <span className={`${text} font-semibold text-gray-400`}>{initial}</span>
    </div>
  )
}
