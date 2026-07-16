import { Svg, Line, Circle, Rect, Text as SvgText, Path as SvgPath } from 'react-native-svg'
import { AppColors } from '../constants/theme'
import { EsquemaPath } from '../lib/esquemas'

interface Props {
  paths: EsquemaPath[]
  viewBox: string
  colors: AppColors
  width: number
}

function resolveStroke(stroke: EsquemaPath['stroke'], colors: AppColors): string {
  if (!stroke || stroke === 'none') return 'none'
  switch (stroke) {
    case 'primary': return colors.primary
    case 'text': return colors.text
    case 'textMuted': return colors.textMuted
    case 'danger': return colors.danger
    default: return colors.text
  }
}

function resolveFill(fill: EsquemaPath['fill'], colors: AppColors): string {
  if (!fill || fill === 'none') return 'none'
  switch (fill) {
    case 'primary': return colors.primary
    case 'text': return colors.text
    case 'card': return colors.card
    case 'danger': return colors.danger
    default: return 'none'
  }
}

function resolveColor(color: EsquemaPath['color'], colors: AppColors): string {
  switch (color) {
    case 'primary': return colors.primary
    case 'text': return colors.text
    case 'textMuted': return colors.textMuted
    case 'danger': return colors.danger
    default: return colors.textMuted
  }
}

export function EsquemaSVG({ paths, viewBox, colors, width }: Props) {
  const parts = viewBox.split(' ').map(Number)
  const vbW = parts[2] || 320
  const vbH = parts[3] || 160
  const height = (width / vbW) * vbH

  return (
    <Svg width={width} height={height} viewBox={viewBox}>
      {paths.map((p, i) => {
        switch (p.type) {
          case 'line':
            return (
              <Line
                key={i}
                x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                stroke={resolveStroke(p.stroke, colors)}
                strokeWidth={p.strokeWidth ?? 1.5}
                strokeLinecap="round"
              />
            )

          case 'circle':
          case 'arc':
            return (
              <Circle
                key={i}
                cx={p.cx} cy={p.cy} r={p.r ?? 6}
                fill={resolveFill(p.fill, colors)}
                stroke={resolveStroke(p.stroke, colors)}
                strokeWidth={p.strokeWidth ?? 1.5}
              />
            )

          case 'dot':
            return (
              <Circle
                key={i}
                cx={p.cx} cy={p.cy} r={p.r ?? 3}
                fill={resolveFill(p.fill ?? 'text', colors)}
                stroke="none"
              />
            )

          case 'rect':
            return (
              <Rect
                key={i}
                x={p.x} y={p.y} width={p.width} height={p.height}
                fill={resolveFill(p.fill, colors)}
                stroke={resolveStroke(p.stroke, colors)}
                strokeWidth={p.strokeWidth ?? 1.5}
                rx={2}
              />
            )

          case 'path':
            return (
              <SvgPath
                key={i}
                d={p.d}
                fill={resolveFill(p.fill, colors)}
                stroke={resolveStroke(p.stroke, colors)}
                strokeWidth={p.strokeWidth ?? 1.5}
              />
            )

          case 'label':
            return (
              <SvgText
                key={i}
                x={p.cx} y={p.cy}
                fill={resolveColor(p.color, colors)}
                fontSize={p.fontSize ?? 11}
                textAnchor={p.textAnchor ?? 'middle'}
                fontWeight={p.fontWeight ?? 'normal'}
              >
                {p.text}
              </SvgText>
            )

          default:
            return null
        }
      })}
    </Svg>
  )
}
