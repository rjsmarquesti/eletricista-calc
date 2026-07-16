import { Svg, Line, Rect, Circle, Text as SvgText, Path as SvgPath, G } from 'react-native-svg'
import { AppColors } from '../constants/theme'
import { DadosUnifilar, IconeUnifilar } from '../lib/unifilar'

interface Props {
  dados: DadosUnifilar
  colors: AppColors
  width: number
}

const RAMO_W = 72    // largura de cada ramo
const RAMO_COL = 6   // máx. de ramos por coluna antes de segunda coluna
const QDC_H = 70     // altura do cabeçalho do quadro
const BUS_Y = QDC_H + 20  // posição Y do barramento
const DJ_TOP = BUS_Y + 16  // topo do disjuntor
const DJ_H = 44      // altura do símbolo do disjuntor
const WIRE_H = 24    // fio entre disjuntor e ícone de carga
const ICONE_Y = DJ_TOP + DJ_H + WIRE_H  // centro do ícone de carga
const LABEL_Y = ICONE_Y + 20  // rótulo do circuito
const BITOLA_Y = LABEL_Y + 14  // rótulo de bitola

function getIconePath(icone: IconeUnifilar): string {
  switch (icone) {
    case 'luz':
      // Círculo com X (luminária)
      return 'M-8,-8 L8,8 M8,-8 L-8,8'
    case 'ar':
      // Ondas (AC)
      return 'M-8,0 Q-4,-6 0,0 Q4,6 8,0'
    case 'aquecimento':
      // Chama simplificada
      return 'M0,-10 Q6,0 0,10 Q-6,0 0,-10'
    case 'motor':
      // M
      return 'M-8,6 L-8,-6 L0,2 L8,-6 L8,6'
    case 'tomada':
    default:
      // Dois pinos verticais
      return 'M-4,-6 L-4,4 M4,-6 L4,4 M0,4 L0,10'
  }
}

function IconeSVG({ icone, cx, cy, color }: { icone: IconeUnifilar; cx: number; cy: number; color: string }) {
  const r = 14
  return (
    <G>
      <Circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={1.5} />
      <SvgPath
        d={getIconePath(icone)}
        stroke={color}
        strokeWidth={1.5}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        transform={`translate(${cx},${cy})`}
      />
    </G>
  )
}

function truncar(texto: string, maxLen: number): string {
  return texto.length > maxLen ? texto.slice(0, maxLen - 1) + '…' : texto
}

export function UnifilarSVG({ dados, colors, width }: Props) {
  const numRamos = dados.ramos.length
  const qdcW = Math.max(width - 24, numRamos * RAMO_W + 20)

  // Altura total do SVG
  const svgH = BITOLA_Y + 30

  // Centro X do QDC
  const qdcCX = qdcW / 2

  // Posição X de cada ramo (centralizado)
  const totalRamosW = numRamos * RAMO_W
  const startX = (qdcW - totalRamosW) / 2 + RAMO_W / 2

  return (
    <Svg width={qdcW} height={svgH}>

      {/* ─── QDC — cabeçalho ─── */}
      <Rect
        x={8} y={8} width={qdcW - 16} height={QDC_H}
        fill={colors.card} stroke={colors.primary} strokeWidth={2} rx={6}
      />
      <SvgText x={qdcCX} y={32} textAnchor="middle" fill={colors.text} fontSize={13} fontWeight="bold">
        QDC — {truncar(dados.nomeProjeto, 22)}
      </SvgText>
      <SvgText x={qdcCX} y={52} textAnchor="middle" fill={colors.primary} fontSize={11}>
        {dados.tensao}
      </SvgText>
      <SvgText x={qdcCX} y={68} textAnchor="middle" fill={colors.textMuted} fontSize={10}>
        {dados.iGeneral}A — {dados.bitolaPrincipal}
      </SvgText>

      {/* ─── Barramento ─── */}
      <Line
        x1={16} y1={BUS_Y} x2={qdcW - 16} y2={BUS_Y}
        stroke={colors.primary} strokeWidth={5} strokeLinecap="round"
      />

      {/* ─── Fio do QDC ao barramento ─── */}
      <Line
        x1={qdcCX} y1={QDC_H + 8} x2={qdcCX} y2={BUS_Y}
        stroke={colors.primary} strokeWidth={2}
      />

      {/* ─── Ramos ─── */}
      {dados.ramos.map((ramo, i) => {
        const cx = startX + i * RAMO_W
        const djCX = cx
        const djX = djCX - 14
        const djY = DJ_TOP
        const djW = 28
        const isDR = ramo.isDR
        const lineColor = isDR ? colors.danger : colors.text
        const rectColor = isDR ? colors.danger : colors.text

        return (
          <G key={i}>
            {/* Fio do barramento ao disjuntor */}
            <Line
              x1={cx} y1={BUS_Y} x2={cx} y2={djY}
              stroke={colors.text} strokeWidth={1.5}
            />

            {/* Disjuntor */}
            <Rect
              x={djX} y={djY} width={djW} height={DJ_H}
              fill={colors.card} stroke={rectColor} strokeWidth={1.5} rx={2}
            />
            <Line
              x1={djX} y1={djY + DJ_H} x2={djX + djW} y2={djY}
              stroke={colors.primary} strokeWidth={1.5}
            />
            <SvgText x={cx} y={djY + DJ_H / 2 + 4} textAnchor="middle" fill={lineColor} fontSize={10} fontWeight="bold">
              {ramo.amperagem}A
            </SvgText>

            {/* Badge DR */}
            {isDR && (
              <SvgText x={cx} y={djY - 4} textAnchor="middle" fill={colors.danger} fontSize={9} fontWeight="bold">
                DR
              </SvgText>
            )}

            {/* Fio do disjuntor à carga */}
            <Line
              x1={cx} y1={djY + DJ_H} x2={cx} y2={ICONE_Y - 14}
              stroke={colors.text} strokeWidth={1.5}
            />

            {/* Ícone da carga */}
            <IconeSVG icone={ramo.icone} cx={cx} cy={ICONE_Y} color={colors.primary} />

            {/* Nome do circuito */}
            <SvgText x={cx} y={LABEL_Y} textAnchor="middle" fill={colors.text} fontSize={9} fontWeight="600">
              {truncar(ramo.nome, 10)}
            </SvgText>

            {/* Bitola */}
            <SvgText x={cx} y={BITOLA_Y} textAnchor="middle" fill={colors.textMuted} fontSize={8}>
              {ramo.bitola}
            </SvgText>
          </G>
        )
      })}
    </Svg>
  )
}
