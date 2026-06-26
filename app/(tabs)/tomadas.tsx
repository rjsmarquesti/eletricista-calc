import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import {
  calcularTomadas, TipoAmbienteTomada, NOME_AMBIENTE_TOMADA, ResultadoTomadas,
} from '../../lib/nbr14136'

const AMBIENTES: TipoAmbienteTomada[] = [
  'sala', 'dormitorio', 'escritorio',
  'cozinha', 'banheiro', 'lavabo',
  'area_servico', 'garagem', 'varanda',
  'corredor', 'hall',
]

export default function TomadasScreen() {
  const insets = useSafeAreaInsets()

  const [ambiente, setAmbiente] = useState<TipoAmbienteTomada>('sala')
  const [area, setArea] = useState('')
  const [perimetro, setPerimetro] = useState('')
  const [usarPerimetro, setUsarPerimetro] = useState(false)
  const [resultado, setResultado] = useState<ResultadoTomadas | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function calcular() {
    setErro(null)
    setResultado(null)
    const areaNum = parseFloat(area.replace(',', '.'))
    const perimetroNum = parseFloat(perimetro.replace(',', '.'))

    if (usarPerimetro) {
      if (!perimetroNum || perimetroNum <= 0) { setErro('Informe o comprimento total de parede.'); return }
    } else {
      if (!areaNum || areaNum <= 0) { setErro('Informe a área do cômodo.'); return }
    }

    const r = calcularTomadas({
      ambiente,
      area: areaNum || 0,
      comprimentoParedes: usarPerimetro ? perimetroNum : undefined,
    })
    setResultado(r)
  }

  function limpar() {
    setArea('')
    setPerimetro('')
    setResultado(null)
    setErro(null)
  }

  return (
    <ScrollView
      style={s.bg}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={s.pageTitle}>🔌 Calculadora de Tomadas</Text>
      <Text style={s.pageSub}>NBR 5410 + NBR 14136</Text>

      <View style={s.card}>
        <Text style={s.label}>Ambiente</Text>
        <View style={s.chipsGrid}>
          {AMBIENTES.map(a => (
            <TouchableOpacity
              key={a}
              style={[s.chip, ambiente === a && s.chipActive]}
              onPress={() => { setAmbiente(a); setResultado(null) }}
            >
              <Text style={[s.chipText, ambiente === a && s.chipTextActive]}>
                {NOME_AMBIENTE_TOMADA[a]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Modo de cálculo */}
        <View style={s.modoRow}>
          <TouchableOpacity
            style={[s.modoBtn, !usarPerimetro && s.modoBtnActive]}
            onPress={() => { setUsarPerimetro(false); setResultado(null) }}
          >
            <Text style={[s.modoBtnText, !usarPerimetro && s.modoBtnTextActive]}>Por área (m²)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modoBtn, usarPerimetro && s.modoBtnActive]}
            onPress={() => { setUsarPerimetro(true); setResultado(null) }}
          >
            <Text style={[s.modoBtnText, usarPerimetro && s.modoBtnTextActive]}>Por parede (m)</Text>
          </TouchableOpacity>
        </View>

        {!usarPerimetro ? (
          <>
            <Text style={s.label}>Área do cômodo (m²)</Text>
            <TextInput
              style={s.input}
              value={area}
              onChangeText={v => { setArea(v); setResultado(null) }}
              placeholder="Ex: 12"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />
          </>
        ) : (
          <>
            <Text style={s.label}>Comprimento total de parede livre (m)</Text>
            <Text style={s.labelSub}>Some todos os trechos de parede livres de portas, janelas e móveis fixos</Text>
            <TextInput
              style={s.input}
              value={perimetro}
              onChangeText={v => { setPerimetro(v); setResultado(null) }}
              placeholder="Ex: 14"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />
          </>
        )}
      </View>

      <View style={s.btnRow}>
        <TouchableOpacity style={s.btnCalc} onPress={calcular} activeOpacity={0.8}>
          <Text style={s.btnCalcText}>Calcular</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnLimpar} onPress={limpar} activeOpacity={0.8}>
          <Text style={s.btnLimparText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {!!erro && (
        <View style={s.erroBox}>
          <Text style={s.erroText}>⚠️ {erro}</Text>
        </View>
      )}

      {resultado && (
        <View style={s.resultadoCard}>
          <Text style={s.resultadoTitulo}>Resultado — {NOME_AMBIENTE_TOMADA[ambiente]}</Text>

          <View style={s.destaque}>
            <Text style={s.destaqueLabel}>Quantidade mínima de tomadas</Text>
            <Text style={s.destaqueValor}>{resultado.qtdMinima}</Text>
          </View>

          <View style={s.linhaDados}>
            <Text style={s.dadoLabel}>Tipo de tomada</Text>
            <Text style={s.dadoValor}>{resultado.tipo === 'misto' ? '10A e 20A' : resultado.tipo}</Text>
          </View>
          <View style={s.linhaDados}>
            <Text style={s.dadoLabel}>Altura recomendada</Text>
            <Text style={[s.dadoValor, { flex: 1, textAlign: 'right', flexWrap: 'wrap' }]}>{resultado.alturaRecomendada}</Text>
          </View>

          {resultado.drObrigatorio && (
            <View style={s.drBox}>
              <Text style={s.drTitulo}>⚠️ DR Obrigatório</Text>
              <Text style={s.drDesc}>DR 30mA obrigatório neste ambiente (NBR 5410 item 6.3.6).</Text>
            </View>
          )}

          <Text style={s.regraLabel}>Regra aplicada</Text>
          <Text style={s.regraTexto}>{resultado.regra}</Text>

          <Text style={s.obsLabel}>Observações</Text>
          {resultado.observacoes.map((obs, i) => (
            <View key={i} style={s.obsItem}>
              <Text style={s.obsBullet}>•</Text>
              <Text style={s.obsText}>{obs}</Text>
            </View>
          ))}
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
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text, marginBottom: 8, marginTop: 12 },
  labelSub: { fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: 8, marginTop: -4 },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: COLORS.primaryDark, fontWeight: '700' },
  modoRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  modoBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg },
  modoBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  modoBtnText: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textMuted },
  modoBtnTextActive: { color: COLORS.primaryDark },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: FONTS.md, color: COLORS.text, backgroundColor: COLORS.bg,
  },
  btnRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  btnCalc: { flex: 1, backgroundColor: COLORS.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  btnCalcText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
  btnLimpar: { paddingHorizontal: 20, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  btnLimparText: { color: COLORS.textMuted, fontSize: FONTS.md, fontWeight: '600' },
  erroBox: { backgroundColor: COLORS.dangerLight, borderRadius: RADIUS.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.danger },
  erroText: { color: COLORS.danger, fontSize: FONTS.sm },
  resultadoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  resultadoTitulo: { fontSize: FONTS.lg, fontWeight: '800', color: COLORS.text, marginBottom: 16 },
  destaque: { backgroundColor: COLORS.primaryLight, borderRadius: RADIUS.md, padding: 16, alignItems: 'center', marginBottom: 16 },
  destaqueLabel: { fontSize: FONTS.sm, color: COLORS.primaryDark, fontWeight: '600' },
  destaqueValor: { fontSize: 48, fontWeight: '900', color: COLORS.primaryDark, marginTop: 4 },
  linhaDados: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border, gap: 8 },
  dadoLabel: { fontSize: FONTS.base, color: COLORS.textMuted },
  dadoValor: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  drBox: { marginTop: 12, backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: COLORS.warning },
  drTitulo: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.warning, marginBottom: 4 },
  drDesc: { fontSize: FONTS.sm, color: COLORS.warning },
  regraLabel: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text, marginTop: 16, marginBottom: 4 },
  regraTexto: { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18, marginBottom: 12 },
  obsLabel: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  obsItem: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  obsBullet: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700', marginTop: 1 },
  obsText: { flex: 1, fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  disclaimer: { fontSize: FONTS.xs, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
})
