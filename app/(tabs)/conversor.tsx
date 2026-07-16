import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../hooks/useAppTheme'
import { FONTS, RADIUS } from '../../constants/theme'
import {
  kWParaCV, CVParakW, kWParaW, WParakW,
  kWParakVA, kVAParakW, CVParakVA, kVAParaCV,
  calcularCorrenteMono, calcularCorrenteTri,
  VParakV, kVParaV,
  TABELA_AWG_MM2,
} from '../../lib/conversor'

type GrupoAtivo = 'potencia' | 'bitola' | 'tensao' | 'corrente'

const GRUPOS: { key: GrupoAtivo; label: string; icon: string }[] = [
  { key: 'potencia', label: 'Potência',  icon: 'flash' },
  { key: 'bitola',   label: 'Bitola',    icon: 'git-branch' },
  { key: 'tensao',   label: 'Tensão',    icon: 'speedometer' },
  { key: 'corrente', label: 'Corrente',  icon: 'battery-charging' },
]

function fmt(n: number, casas = 3): string {
  if (!isFinite(n)) return '—'
  return n % 1 === 0 ? String(n) : n.toFixed(casas).replace(/\.?0+$/, '')
}

export default function ConversorScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()
  const s = makeStyles(colors)

  const [grupo, setGrupo] = useState<GrupoAtivo>('potencia')
  const [valor, setValor] = useState('')
  const [fp, setFP] = useState('0.92')
  const [tensaoCorr, setTensaoCorr] = useState('220')
  const [fases, setFases] = useState<'mono' | 'tri'>('mono')
  const [mm2Selecionado, setMm2Selecionado] = useState(2.5)

  const v = parseFloat(valor.replace(',', '.'))
  const fpN = parseFloat(fp.replace(',', '.')) || 0.92
  const tensaoCorrN = parseFloat(tensaoCorr.replace(',', '.')) || 220

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Ionicons name="swap-horizontal" size={22} color={colors.primary} accessible={false} />
        <Text style={s.pageTitle}>Conversor de Unidades</Text>
      </View>
      <Text style={s.pageSub}>kW ↔ CV ↔ kVA · mm² ↔ AWG · V ↔ kV · corrente</Text>

      {/* Seletor de grupo */}
      <View style={s.grupoRow}>
        {GRUPOS.map(g => (
          <TouchableOpacity
            key={g.key}
            style={[s.grupoBtn, grupo === g.key && s.grupoBtnActive]}
            onPress={() => { setGrupo(g.key); setValor('') }}
          >
            <Ionicons name={g.icon as any} size={16} color={grupo === g.key ? colors.primaryDark : colors.textMuted} />
            <Text style={[s.grupoBtnText, grupo === g.key && s.grupoBtnTextActive]}>{g.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── POTÊNCIA ── */}
      {grupo === 'potencia' && (
        <View style={s.card}>
          <Text style={s.label}>Valor de entrada</Text>
          <TextInput
            style={s.input}
            value={valor}
            onChangeText={setValor}
            placeholder="Digite o valor (kW, CV, kVA ou W)"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />

          <Text style={[s.label, { marginTop: 12 }]}>Fator de potência (FP)</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['0.80', '0.85', '0.90', '0.92', '0.95', '1.00'].map(f => (
              <TouchableOpacity key={f} style={[s.chip, fp === f && s.chipActive]} onPress={() => setFP(f)}>
                <Text style={[s.chipText, fp === f && s.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {!isNaN(v) && v > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.resultTitle}>Resultado para {fmt(v, 3)} inserido:</Text>
              <ConvRow label="kW → CV"    valor={`${fmt(kWParaCV(v))} CV`}    colors={colors} s={s} />
              <ConvRow label="kW → kVA"   valor={`${fmt(kWParakVA(v, fpN))} kVA (FP ${fpN})`} colors={colors} s={s} />
              <ConvRow label="kW → W"     valor={`${fmt(kWParaW(v))} W`}       colors={colors} s={s} />
              <ConvRow label="CV → kW"    valor={`${fmt(CVParakW(v))} kW`}     colors={colors} s={s} />
              <ConvRow label="CV → kVA"   valor={`${fmt(CVParakVA(v, fpN))} kVA (FP ${fpN})`} colors={colors} s={s} />
              <ConvRow label="kVA → kW"   valor={`${fmt(kVAParakW(v, fpN))} kW (FP ${fpN})`} colors={colors} s={s} />
              <ConvRow label="kVA → CV"   valor={`${fmt(kVAParaCV(v, fpN))} CV (FP ${fpN})`} colors={colors} s={s} />
              <ConvRow label="W → kW"     valor={`${fmt(WParakW(v), 4)} kW`}  colors={colors} s={s} />
            </View>
          )}
        </View>
      )}

      {/* ── BITOLA ── */}
      {grupo === 'bitola' && (
        <View style={s.card}>
          <Text style={s.label}>Selecione a bitola (mm²)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {TABELA_AWG_MM2.map(r => (
                <TouchableOpacity
                  key={r.mm2}
                  style={[s.chip, mm2Selecionado === r.mm2 && s.chipActive]}
                  onPress={() => setMm2Selecionado(r.mm2)}
                >
                  <Text style={[s.chipText, mm2Selecionado === r.mm2 && s.chipTextActive]}>{r.mm2}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {(() => {
            const reg = TABELA_AWG_MM2.find(r => r.mm2 === mm2Selecionado)
            if (!reg) return null
            return (
              <View style={{ marginTop: 16 }}>
                <Text style={s.resultTitle}>{reg.mm2} mm² — equivalência AWG:</Text>
                <ConvRow label="AWG (NEC)"        valor={reg.awg}             colors={colors} s={s} />
                <ConvRow label="Corrente (B1, Cu)" valor={`${reg.corrente} A`}  colors={colors} s={s} />
              </View>
            )
          })()}

          <Text style={[s.disclaimer, { marginTop: 16 }]}>
            Tabela IEC/NBR. Corrente p/ cobre método B1, temperatura 30°C.
          </Text>
        </View>
      )}

      {/* ── TENSÃO ── */}
      {grupo === 'tensao' && (
        <View style={s.card}>
          <Text style={s.label}>Valor de entrada</Text>
          <TextInput
            style={s.input}
            value={valor}
            onChangeText={setValor}
            placeholder="Digite tensão em V ou kV"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />
          {!isNaN(v) && v > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.resultTitle}>Conversões para {fmt(v, 3)}:</Text>
              <ConvRow label="V → kV"  valor={`${fmt(VParakV(v), 4)} kV`}  colors={colors} s={s} />
              <ConvRow label="kV → V"  valor={`${fmt(kVParaV(v))} V`}      colors={colors} s={s} />
              <ConvRow label="V fase (Δ→Y)" valor={`${fmt(v / Math.sqrt(3), 2)} V`} colors={colors} s={s} />
              <ConvRow label="V linha (Y→Δ)" valor={`${fmt(v * Math.sqrt(3), 2)} V`} colors={colors} s={s} />
            </View>
          )}
        </View>
      )}

      {/* ── CORRENTE ── */}
      {grupo === 'corrente' && (
        <View style={s.card}>
          <Text style={s.label}>Potência (W)</Text>
          <TextInput
            style={s.input}
            value={valor}
            onChangeText={setValor}
            placeholder="Ex: 3000"
            placeholderTextColor={colors.textLight}
            keyboardType="numeric"
          />

          <Text style={[s.label, { marginTop: 12 }]}>Tensão (V)</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['127', '220', '380', '440'].map(t => (
              <TouchableOpacity key={t} style={[s.chip, tensaoCorr === t && s.chipActive]} onPress={() => setTensaoCorr(t)}>
                <Text style={[s.chipText, tensaoCorr === t && s.chipTextActive]}>{t}V</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 12 }]}>Fator de potência</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['0.80', '0.85', '0.92', '1.00'].map(f => (
              <TouchableOpacity key={f} style={[s.chip, fp === f && s.chipActive]} onPress={() => setFP(f)}>
                <Text style={[s.chipText, fp === f && s.chipTextActive]}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[s.label, { marginTop: 12 }]}>Tipo de circuito</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['mono', 'tri'] as const).map(f => (
              <TouchableOpacity key={f} style={[s.toggleBtn, fases === f && s.toggleBtnActive]} onPress={() => setFases(f)}>
                <Text style={[s.toggleBtnText, fases === f && s.toggleBtnTextActive]}>
                  {f === 'mono' ? 'Monofásico' : 'Trifásico'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {!isNaN(v) && v > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={s.resultTitle}>Corrente de projeto:</Text>
              {fases === 'mono' ? (
                <ConvRow
                  label={`I monofásico (FP ${fpN})`}
                  valor={`${fmt(calcularCorrenteMono(v, tensaoCorrN, fpN), 2)} A`}
                  colors={colors} s={s}
                />
              ) : (
                <ConvRow
                  label={`I trifásico (FP ${fpN})`}
                  valor={`${fmt(calcularCorrenteTri(v, tensaoCorrN, fpN), 2)} A`}
                  colors={colors} s={s}
                />
              )}
            </View>
          )}
        </View>
      )}
    </ScrollView>
  )
}

function ConvRow({ label, valor, colors, s }: { label: string; valor: string; colors: any; s: any }) {
  return (
    <View style={s.convRow}>
      <Text style={s.convLabel}>{label}</Text>
      <Text style={s.convValor}>{valor}</Text>
    </View>
  )
}

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    pageTitle: { fontSize: FONTS['2xl'], fontWeight: '800', color: colors.text },
    pageSub: { fontSize: FONTS.sm, color: colors.textMuted, marginBottom: 20 },
    grupoRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
    grupoBtn: { flex: 1, minWidth: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    grupoBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    grupoBtnText: { fontSize: FONTS.xs, fontWeight: '600', color: colors.textMuted },
    grupoBtnTextActive: { color: colors.primaryDark },
    card: { backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    label: { fontSize: FONTS.sm, fontWeight: '600', color: colors.text, marginBottom: 6 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: FONTS.md, color: colors.text, backgroundColor: colors.bg,
    },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipText: { fontSize: FONTS.sm, fontWeight: '600', color: colors.textMuted },
    chipTextActive: { color: colors.primaryDark },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bg },
    toggleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    toggleBtnText: { fontSize: FONTS.base, fontWeight: '600', color: colors.textMuted },
    toggleBtnTextActive: { color: colors.primaryDark },
    resultTitle: { fontSize: FONTS.base, fontWeight: '700', color: colors.text, marginBottom: 8 },
    convRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    convLabel: { fontSize: FONTS.sm, color: colors.textMuted, flex: 1 },
    convValor: { fontSize: FONTS.base, fontWeight: '700', color: colors.text },
    disclaimer: { fontSize: FONTS.xs, color: colors.textLight, textAlign: 'center' },
  })
}
