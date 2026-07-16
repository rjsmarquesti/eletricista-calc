import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { compartilharTexto } from '../../lib/share'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import {
  calcularCircuitos, AmbienteResidencial, TipoAmbiente, NOME_AMBIENTE,
  ResultadoCircuitos,
} from '../../lib/nbr5410'
import { setConfig } from '../../lib/db'

const TIPOS_AMBIENTE: TipoAmbiente[] = [
  'dormitorio', 'sala', 'cozinha', 'banheiro',
  'area_servico', 'garagem', 'varanda', 'escritorio', 'corredor',
]

const CARGAS_OPCOES: { key: string; label: string; emoji: string }[] = [
  { key: 'chuveiro',   label: 'Chuveiro elétrico', emoji: '🚿' },
  { key: 'ar_cond',    label: 'Ar-condicionado',    emoji: '❄️' },
  { key: 'forno',      label: 'Forno / micro-ondas', emoji: '🔥' },
  { key: 'lavadora',   label: 'Máquina de lavar',   emoji: '👕' },
  { key: 'freezer',    label: 'Freezer / geladeira', emoji: '🧊' },
  { key: 'microondas', label: 'Micro-ondas separado', emoji: '📡' },
]

interface AmbienteEntry {
  tipo: TipoAmbiente
  area: string
  cargas: string[]
}

export default function CircuitosScreen() {
  const insets = useSafeAreaInsets()
  const [ambientes, setAmbientes] = useState<AmbienteEntry[]>([])
  const [resultado, setResultado] = useState<ResultadoCircuitos | null>(null)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)

  function addAmbiente(tipo: TipoAmbiente) {
    setAmbientes(prev => [...prev, { tipo, area: '', cargas: [] }])
    setResultado(null)
    setExpandedIdx(ambientes.length)
  }

  function removeAmbiente(idx: number) {
    setAmbientes(prev => prev.filter((_, i) => i !== idx))
    setResultado(null)
    setExpandedIdx(null)
  }

  function updateArea(idx: number, area: string) {
    setAmbientes(prev => prev.map((a, i) => i === idx ? { ...a, area } : a))
    setResultado(null)
  }

  function toggleCarga(idx: number, carga: string) {
    setAmbientes(prev => prev.map((a, i) => {
      if (i !== idx) return a
      const cargas = a.cargas.includes(carga) ? a.cargas.filter(c => c !== carga) : [...a.cargas, carga]
      return { ...a, cargas }
    }))
    setResultado(null)
  }

  function calcular() {
    if (ambientes.length === 0) {
      Alert.alert('Adicione ambientes', 'Adicione ao menos um ambiente para calcular.')
      return
    }
    const entradas: AmbienteResidencial[] = ambientes.map(a => ({
      tipo: a.tipo,
      area: parseFloat(a.area.replace(',', '.')) || 10,
      cargas: a.cargas,
    }))
    const r = calcularCircuitos(entradas)
    setResultado(r)
    setExpandedIdx(null)
    // Salva resultado para uso no Diagrama Unifilar
    setConfig('ultimo_circuito', JSON.stringify(r))
  }

  function limpar() {
    setAmbientes([])
    setResultado(null)
    setExpandedIdx(null)
  }

  const TIPO_BADGE: Record<string, { label: string; cor: string; bg: string }> = {
    '15A':     { label: '15A', cor: COLORS.success, bg: COLORS.successLight },
    '20A':     { label: '20A', cor: COLORS.warning, bg: COLORS.warningLight },
    'dedicado': { label: 'DEDICADO', cor: COLORS.danger, bg: COLORS.dangerLight },
  }

  return (
    <ScrollView
      style={s.bg}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={s.pageTitle}>🔧 Planejador de Circuitos</Text>
      <Text style={s.pageSub}>NBR 5410 — Mínimo de circuitos por residência</Text>

      {/* Ambientes adicionados */}
      {ambientes.map((amb, idx) => (
        <View key={idx} style={s.ambCard}>
          <TouchableOpacity style={s.ambHeader} onPress={() => setExpandedIdx(expandedIdx === idx ? null : idx)}>
            <Text style={s.ambNome}>{NOME_AMBIENTE[amb.tipo]}</Text>
            <View style={s.ambHeaderRight}>
              {amb.area ? <Text style={s.ambArea}>{amb.area} m²</Text> : null}
              {amb.cargas.length > 0 ? <Text style={s.ambCargas}>{amb.cargas.length} carga{amb.cargas.length > 1 ? 's' : ''}</Text> : null}
              <Text style={s.ambChevron}>{expandedIdx === idx ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>

          {expandedIdx === idx && (
            <View style={s.ambBody}>
              <Text style={s.label}>Área (m²)</Text>
              <TextInput
                style={s.input}
                value={amb.area}
                onChangeText={v => updateArea(idx, v)}
                placeholder="Ex: 12"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />
              <Text style={s.label}>Cargas especiais neste ambiente</Text>
              <View style={s.chipsGrid}>
                {CARGAS_OPCOES.map(c => (
                  <TouchableOpacity
                    key={c.key}
                    style={[s.chipCarga, amb.cargas.includes(c.key) && s.chipCargaActive]}
                    onPress={() => toggleCarga(idx, c.key)}
                  >
                    <Text style={s.chipEmoji}>{c.emoji}</Text>
                    <Text style={[s.chipLabel, amb.cargas.includes(c.key) && s.chipLabelActive]}>{c.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.btnRemover} onPress={() => removeAmbiente(idx)}>
                <Text style={s.btnRemoverText}>Remover ambiente</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      ))}

      {/* Botões de adicionar ambiente */}
      <Text style={s.sectionTitle}>Adicionar ambiente</Text>
      <View style={s.tiposGrid}>
        {TIPOS_AMBIENTE.map(t => (
          <TouchableOpacity key={t} style={s.tipoBtn} onPress={() => addAmbiente(t)}>
            <Text style={s.tipoBtnText}>+ {NOME_AMBIENTE[t]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.btnRow}>
        <TouchableOpacity style={s.btnCalc} onPress={calcular} activeOpacity={0.8}>
          <Text style={s.btnCalcText}>Calcular circuitos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnLimpar} onPress={limpar} activeOpacity={0.8}>
          <Text style={s.btnLimparText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* Resultado */}
      {resultado && (
        <View style={s.resultadoCard}>
          <View style={s.resultadoHeader}>
            <Text style={s.resultadoTitulo}>Circuitos necessários</Text>
            <View style={s.totalBadge}>
              <Text style={s.totalBadgeText}>{resultado.totalCircuitos} circuitos</Text>
            </View>
          </View>

          {resultado.circuitos.map((circ, i) => {
            const badge = TIPO_BADGE[circ.tipo]
            return (
              <View key={i} style={s.circuitoItem}>
                <View style={s.circuitoTop}>
                  <Text style={s.circuitoNome}>{circ.nome}</Text>
                  <View style={[s.tipoBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.tipoBadgeText, { color: badge.cor }]}>{badge.label}</Text>
                  </View>
                </View>
                <Text style={s.circuitoDesc}>{circ.descricao}</Text>
              </View>
            )
          })}

          <Text style={s.obsLabel}>Observações</Text>
          {resultado.observacoes.map((obs, i) => (
            <View key={i} style={s.obsItem}>
              <Text style={s.obsBullet}>•</Text>
              <Text style={s.obsText}>{obs}</Text>
            </View>
          ))}

          <TouchableOpacity
            style={s.btnCompartilhar}
            onPress={() => compartilharTexto('Circuitos NBR 5410', [
              `Total: ${resultado.totalCircuitos} circuitos`,
              ...resultado.circuitos.map(c => `• ${c.nome} (${c.tipo}): ${c.descricao}`),
            ].join('\n'))}
          >
            <Text style={s.btnCompartilharTxt}>📤 Compartilhar</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.disclaimer}>
        ⚠️ Resultado orientativo — não substitui ART/CREA do responsável técnico.
      </Text>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16 },
  pageTitle: { fontSize: FONTS['2xl'], fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  pageSub: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 20 },
  sectionTitle: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, marginTop: 4, marginBottom: 10 },
  ambCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  ambHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  ambNome: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  ambHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ambArea: { fontSize: FONTS.sm, color: COLORS.textMuted },
  ambCargas: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },
  ambChevron: { fontSize: FONTS.sm, color: COLORS.textLight },
  ambBody: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 14 },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: FONTS.md, color: COLORS.text, backgroundColor: COLORS.bg,
  },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipCarga: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  chipCargaActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipEmoji: { fontSize: 14 },
  chipLabel: { fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: '600' },
  chipLabelActive: { color: COLORS.primaryDark },
  btnRemover: { marginTop: 12, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.danger },
  btnRemoverText: { fontSize: FONTS.sm, color: COLORS.danger, fontWeight: '600' },
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  tipoBtn: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight,
  },
  tipoBtnText: { fontSize: FONTS.sm, color: COLORS.primaryDark, fontWeight: '700' },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  btnCalc: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  btnCalcText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
  btnLimpar: { paddingHorizontal: 20, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  btnLimparText: { color: COLORS.textMuted, fontSize: FONTS.md, fontWeight: '600' },
  resultadoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  resultadoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  resultadoTitulo: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.text },
  totalBadge: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 4, borderRadius: RADIUS.full },
  totalBadgeText: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.primaryDark },
  circuitoItem: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 12 },
  circuitoTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  circuitoNome: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, flex: 1, marginRight: 8 },
  tipoBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  tipoBadgeText: { fontSize: FONTS.xs, fontWeight: '700' },
  circuitoDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  obsLabel: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 8 },
  obsItem: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  obsBullet: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700' },
  obsText: { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  disclaimer: { fontSize: FONTS.xs, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
  btnCompartilhar: {
    marginTop: 12, padding: 12, borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  btnCompartilharTxt: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text },
})
