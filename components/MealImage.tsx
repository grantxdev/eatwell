interface MealImageProps {
  imageUrl?: string
  emoji: string
  size: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: { px: 36, text: 'text-lg' },
  md: { px: 52, text: 'text-3xl' },
  lg: { px: 72, text: 'text-4xl' },
  xl: { px: 120, text: 'text-5xl' },
}

export default function MealImage({ imageUrl, emoji, size, className = '' }: MealImageProps) {
  const { px, text } = sizes[size]

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt=""
        width={px}
        height={px}
        className={`object-cover rounded-xl shrink-0 ${className}`}
        style={{ width: px, height: px }}
        onError={(e) => {
          // If image fails to load, hide it and let parent show emoji fallback
          ;(e.target as HTMLImageElement).style.display = 'none'
        }}
      />
    )
  }

  return (
    <span className={`${text} leading-none shrink-0 ${className}`}>
      {emoji}
    </span>
  )
}
