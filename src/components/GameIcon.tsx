import type { ElementType } from 'react'

type GameIconProps = {
  icon: ElementType
  color?: string
}

export function GameIcon({ icon: Icon, color }: GameIconProps) {
  return (
    <Icon
      color={color}
      size="1.2em"
      stroke={1.9}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
      aria-hidden="true"
    />
  )
}
