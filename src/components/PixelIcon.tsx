type PixelIconProps = {
  grid: string[]
  color: string
}

export function PixelIcon({ grid, color }: PixelIconProps) {
  const w = grid[0].length
  const h = grid.length

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      width="1.4em"
      height="1.4em"
      style={{ display: 'inline-block', verticalAlign: 'middle', shapeRendering: 'crispEdges' }}
    >
      {grid.map((row, y) =>
        row
          .split('')
          .map((cell, x) => (cell === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null))
      )}
    </svg>
  )
}
