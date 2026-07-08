import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import {
  calcularDisjuntor, TipoCarga, ResultadoDisjuntor,
} from '../../lib/nbr5410'
import { compartilharTexto } from '../../lib/share'
import { Ionicons } from '@expo/vector-icons'

type Tensao = 127 | 220

const CARGAS: { key: TipoCarga; label: string; exemplos: string }[] = [
  { key: 'resistiva', label: 'Resistiva', exemplos: 'Chuveiro, forno, ferro, lâmpada incandescente' },
  { key: 'indutiva',  label: 'Indutiva',  exemplos: 'Ar-condicionado, geladeira, motor de bomba' },
  { key: 'motor',     label: 'Motor',     exemplos: 'Bomba, compressor, portão automático' },
]

const AMBIENTES_OPCOES = [
  'Sala', 'Dormitório', 'Cozinha', 'Banheiro', 'Lavabo',
  'Área de Serviço', 'Garagem', 'Varanda', 'Escritório',
]

export default function DisjuntorScreen() {
  const insets = useSafeAreaInsets()

  const [potencia, setPotencia] = useState('')
  const [tensao, setTensao] = useState<Tensao>(220)
  const [tipoCarga, setTipoCarga] = useState<TipoCarga>('resistiva')
  const [ambientesSel, setAmbientesSel] = useState<string[]>([])
  const [resultado, setResultado] = useState<ResultadoDisjuntor | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function toggleAmbiente(a: string) {
    setAmbientesSel(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
    setResultado(null)
  }

  function calcular() {
    setErro(null)
    setResultado(null)
    const pot = parseFloat(potencia.replace(',', '.'))
    if (!pot || pot <= 0) { setErro('Informe a potência em watts.'); return }
    const r = calcularDisjuntor({ potencia: pot, tensao, tipoCarga, ambientes: ambientesSel })
    setResultado(r)
  }

  function limpar() {
    setPotencia('')
    setAmbientesSel([])
    setResultado(null)
    setErro(null)
  }

  return (
    <ScrollView
      style={s.bg}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Ionicons name="shield" size={22} color={COLORS.primary} accessible={false} />
        <Text style={s.pageTitle}>Calculadora de Disjuntor</Text>
      </View>
      <Text style={s.pageSub}>NBR 5410 — Proteção do circuito + verificação de DR</Text>

      <View style={s.card}>
        <Text style={s.label}>Potência do circuito (W)</Text>
        <TextInput
          style={s.input}
          value={potencia}
          onChangeText={v => { setPotencia(v); setResultado(null) }}
          placeholder="Ex: 3000"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
        />

        <Text style={s.label}>Tensão</Text>
        <View style={s.toggleRow}>
          {([127, 220] as Tensao[]).map(v => (
            <TouchableOpacity
              key={v}
              style={[s.toggleBtn, tensao === v && s.toggleBtnActive]}
              onPress={() => { setTensao(v); setResultado(null) }}
            >
              <Text style={[s.toggleBtnText, tensao === v && s.toggleBtnTextActive]}>{v}V</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Tipo de carga</Text>
        <View style={s.cargaGroup}>
          {CARGAS.map(c => (
            <TouchableOpacity
              key={c.key}
              style={[s.cargaBtn, tipoCarga === c.key && s.cargaBtnActive]}
              onPress={() => { setTipoCarga(c.key); setResultado(null) }}
            >
              <Text style={[s.cargaBtnLabel, tipoCarga === c.key && s.cargaBtnLabelActive]}>{c.label}</Text>
              <Text style={[s.cargaBtnDesc, tipoCarga === c.key && s.cargaBtnDescActive]}>{c.exemplos}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={s.label}>Ambientes alimentados (para verificar DR)</Text>
        <Text style={s.labelSub}>Selecione todos os ambientes do circuito</Text>
        <View style={s.chipsGrid}>
          {AMBIENTES_OPCOES.map(a => (
            <TouchableOpacity
              key={a}
              style={[s.chip, ambientesSel.includes(a) && s.chipActive]}
              onPress={() => toggleAmbiente(a)}
            >
              <Text style={[s.chipText, ambientesSel.includes(a) && s.chipTextActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
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
          <Text style={s.resultadoTitulo}>Resultado</Text>

          <View style={s.destaque}>
            <Text style={s.destaqueLabel}>Disjuntor recomendado</Text>
            <Text style={s.destaqueValor}>{resultado.disjuntorIn}A</Text>
          </View>

          <View style={s.linhaDados}>
            <Text style={s.dadoLabel}>Corrente de projeto</Text>
            <Text style={s.dadoValor}>{resultado.corrente} A</Text>
          </View>
          <View style={s.linhaDados}>
            <Text style={s.dadoLabel}>Fator de potência (cosφ)</Text>
            <Text style={s.dadoValor}>{resultado.fatorPotencia.toFixed(2)}</Text>
          </View>

          {/* DR */}
          <View style={[s.drBox, resultado.drObrigatorio ? s.drBoxObrig : s.drBoxOk]}>
            <Text style={[s.drTitulo, resultado.drObrigatorio ? s.drTituloObrig : s.drTituloOk]}>
              {resultado.drObrigatorio ? '⚠️ DR Obrigatório' : '✓ DR Não Obrigatório'}
            </Text>
            {resultado.motivoDR && (
              <Text style={[s.drDesc, s.drDescObrig]}>{resultado.motivoDR}</Text>
            )}
            {!resultado.drObrigatorio && (
              <Text style={s.drDesc}>Nenhum dos ambientes selecionados exige DR (NBR 5410 item 6.3.6).</Text>
            )}
            {resultado.drObrigatorio && (
              <Text style={s.drDesc}>DR 30mA classe AC (ou A para cargas eletrônicas).</Text>
            )}
          </View>

          <TouchableOpacity
            style={s.btnCompartilhar}
            onPress={() => compartilharTexto('Disjuntor NBR 5410', [
              `Disjuntor recomendado: ${resultado.disjuntorIn} A`,
              `Corrente de projeto: ${resultado.corrente} A`,
              `DR: ${resultado.drObrigatorio ? 'OBRIGATÓRIO — ' + resultado.motivoDR : 'Não obrigatório'}`,
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
  card: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  labelSub: { fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: 8, marginTop: -4 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: FONTS.md, color: COLORS.text, backgroundColor: COLORS.bg,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg },
  toggleBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  toggleBtnText: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textMuted },
  toggleBtnTextActive: { color: COLORS.primaryDark },
  cargaGroup: { gap: 8 },
  cargaBtn: { padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  cargaBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  cargaBtnLabel: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textMuted },
  cargaBtnLabelActive: { color: COLORS.primaryDark },
  cargaBtnDesc: { fontSize: FONTS.xs, color: COLORS.textLight, marginTop: 2 },
  cargaBtnDescActive: { color: COLORS.primaryDark },
  chipsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg },
  chipActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  chipText: { fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: '600' },
  chipTextActive: { color: COLORS.primaryDark },
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
  destaqueValor: { fontSize: 36, fontWeight: '900', color: COLORS.primaryDark, marginTop: 4 },
  linhaDados: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  dadoLabel: { fontSize: FONTS.base, color: COLORS.textMuted },
  dadoValor: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  drBox: { marginTop: 16, borderRadius: RADIUS.md, padding: 14, borderWidth: 1 },
  drBoxObrig: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning },
  drBoxOk: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  drTitulo: { fontSize: FONTS.md, fontWeight: '700', marginBottom: 6 },
  drTituloObrig: { color: COLORS.warning },
  drTituloOk: { color: COLORS.success },
  drDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  drDescObrig: { color: COLORS.warning },
  disclaimer: { fontSize: FONTS.xs, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
  btnCompartilhar: {
    marginTop: 12, padding: 12, borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  btnCompartilharTxt: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text },
})
