import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import {
  calcularBitola, MetodoInstalacao, MaterialConductor, ResultadoBitola,
} from '../../lib/nbr5410'
import { compartilharTexto } from '../../lib/share'

type Tensao = 127 | 220

const METODOS: { key: MetodoInstalacao; label: string; desc: string }[] = [
  { key: 'B1', label: 'B1', desc: 'Embutido em conduto na parede' },
  { key: 'B2', label: 'B2', desc: 'Eletroduto na superfície' },
  { key: 'C',  label: 'C',  desc: 'Cabo fixado na parede' },
]

export default function BitolaScreen() {
  const insets = useSafeAreaInsets()

  const [usarPotencia, setUsarPotencia] = useState(true)
  const [potencia, setPotencia] = useState('')
  const [corrente, setCorrente] = useState('')
  const [tensao, setTensao] = useState<Tensao>(220)
  const [comprimento, setComprimento] = useState('')
  const [metodo, setMetodo] = useState<MetodoInstalacao>('B1')
  const [material, setMaterial] = useState<MaterialConductor>('cobre')
  const [resultado, setResultado] = useState<ResultadoBitola | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  function calcular() {
    setErro(null)
    setResultado(null)

    const comp = parseFloat(comprimento.replace(',', '.'))
    const pot = parseFloat(potencia.replace(',', '.'))
    const cor = parseFloat(corrente.replace(',', '.'))

    if (!comp || comp <= 0) { setErro('Informe o comprimento do circuito.'); return }
    if (usarPotencia && (!pot || pot <= 0)) { setErro('Informe a potência em watts.'); return }
    if (!usarPotencia && (!cor || cor <= 0)) { setErro('Informe a corrente em ampères.'); return }

    const r = calcularBitola({
      potencia: usarPotencia ? pot : undefined,
      corrente: usarPotencia ? undefined : cor,
      tensao,
      comprimento: comp,
      metodo,
      material,
    })
    setResultado(r)
  }

  function limpar() {
    setPotencia('')
    setCorrente('')
    setComprimento('')
    setResultado(null)
    setErro(null)
  }

  return (
    <ScrollView
      style={s.bg}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={s.pageTitle}>⚡ Calculadora de Bitola</Text>
      <Text style={s.pageSub}>NBR 5410 — Seção mínima do condutor</Text>

      {/* Entrada: potência ou corrente */}
      <View style={s.card}>
        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Calcular por potência (W)</Text>
          <Switch
            value={usarPotencia}
            onValueChange={v => { setUsarPotencia(v); setResultado(null) }}
            trackColor={{ true: COLORS.primary }}
            thumbColor="#fff"
          />
        </View>

        {usarPotencia ? (
          <>
            <Text style={s.label}>Potência total do circuito (W)</Text>
            <TextInput
              style={s.input}
              value={potencia}
              onChangeText={setPotencia}
              placeholder="Ex: 2500"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />
          </>
        ) : (
          <>
            <Text style={s.label}>Corrente do circuito (A)</Text>
            <TextInput
              style={s.input}
              value={corrente}
              onChangeText={setCorrente}
              placeholder="Ex: 20"
              placeholderTextColor={COLORS.textLight}
              keyboardType="numeric"
            />
          </>
        )}

        <Text style={s.label}>Comprimento do circuito (m) — ida + volta</Text>
        <TextInput
          style={s.input}
          value={comprimento}
          onChangeText={setComprimento}
          placeholder="Ex: 15"
          placeholderTextColor={COLORS.textLight}
          keyboardType="numeric"
        />

        {/* Tensão */}
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

        {/* Método de instalação */}
        <Text style={s.label}>Método de instalação</Text>
        <View style={s.metodoGroup}>
          {METODOS.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[s.metodoBtn, metodo === m.key && s.metodoBtnActive]}
              onPress={() => { setMetodo(m.key); setResultado(null) }}
            >
              <Text style={[s.metodoBtnLabel, metodo === m.key && s.metodoBtnLabelActive]}>{m.label}</Text>
              <Text style={[s.metodoBtnDesc, metodo === m.key && s.metodoBtnDescActive]}>{m.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Material */}
        <Text style={s.label}>Material do condutor</Text>
        <View style={s.toggleRow}>
          {(['cobre', 'aluminio'] as MaterialConductor[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[s.toggleBtn, material === m && s.toggleBtnActive]}
              onPress={() => { setMaterial(m); setResultado(null) }}
            >
              <Text style={[s.toggleBtnText, material === m && s.toggleBtnTextActive]}>
                {m === 'cobre' ? 'Cobre' : 'Alumínio'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Botões */}
      <View style={s.btnRow}>
        <TouchableOpacity style={s.btnCalc} onPress={calcular} activeOpacity={0.8}>
          <Text style={s.btnCalcText}>Calcular</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnLimpar} onPress={limpar} activeOpacity={0.8}>
          <Text style={s.btnLimparText}>Limpar</Text>
        </TouchableOpacity>
      </View>

      {/* Erro */}
      {!!erro && (
        <View style={s.erroBox}>
          <Text style={s.erroText}>⚠️ {erro}</Text>
        </View>
      )}

      {/* Resultado */}
      {resultado && (
        <View style={s.resultadoCard}>
          <Text style={s.resultadoTitulo}>Resultado</Text>

          <View style={s.destaque}>
            <Text style={s.destaqueLabel}>Bitola recomendada</Text>
            <Text style={s.destaqueValor}>{resultado.bitolaRecomendada} mm²</Text>
          </View>

          <View style={s.linhaDados}>
            <Text style={s.dadoLabel}>Corrente de projeto</Text>
            <Text style={s.dadoValor}>{resultado.correnteCalc.toFixed(2)} A</Text>
          </View>
          <View style={s.linhaDados}>
            <Text style={s.dadoLabel}>Capacidade nominal ({metodo})</Text>
            <Text style={s.dadoValor}>{resultado.capacidadeNominal} A</Text>
          </View>
          <View style={s.linhaDados}>
            <Text style={s.dadoLabel}>Queda de tensão</Text>
            <Text style={[s.dadoValor, resultado.quedaAlerta && s.valorAlerta]}>
              {resultado.quedaTensao}%{resultado.quedaAlerta ? ' ⚠️' : ' ✓'}
            </Text>
          </View>

          {resultado.quedaAlerta && (
            <View style={s.alertaBox}>
              <Text style={s.alertaText}>
                ⚠️ Queda de tensão acima de 4% (limite NBR 5410 item 6.2.7). Considere aumentar a seção do cabo ou reduzir o comprimento do circuito.
              </Text>
            </View>
          )}

          {resultado.aviso && (
            <View style={[s.alertaBox, { borderColor: COLORS.danger, backgroundColor: COLORS.dangerLight }]}>
              <Text style={[s.alertaText, { color: COLORS.danger }]}>{resultado.aviso}</Text>
            </View>
          )}

          <TouchableOpacity
            style={s.btnCompartilhar}
            onPress={() => compartilharTexto('Bitola NBR 5410', [
              `Bitola recomendada: ${resultado.bitolaRecomendada} mm²`,
              `Corrente de projeto: ${resultado.correnteCalc.toFixed(2)} A`,
              `Capacidade nominal (${metodo}): ${resultado.capacidadeNominal} A`,
              `Queda de tensão: ${resultado.quedaTensao}%${resultado.quedaAlerta ? ' ⚠️' : ' ✓'}`,
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
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  switchLabel: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.text, flex: 1 },
  label: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text, marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: FONTS.md, color: COLORS.text, backgroundColor: COLORS.bg,
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1, paddingVertical: 10, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', backgroundColor: COLORS.bg,
  },
  toggleBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  toggleBtnText: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.textMuted },
  toggleBtnTextActive: { color: COLORS.primaryDark },
  metodoGroup: { gap: 8 },
  metodoBtn: {
    padding: 10, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.bg,
  },
  metodoBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  metodoBtnLabel: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.textMuted },
  metodoBtnLabelActive: { color: COLORS.primaryDark },
  metodoBtnDesc: { fontSize: FONTS.sm, color: COLORS.textLight, marginTop: 2 },
  metodoBtnDescActive: { color: COLORS.primaryDark },
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
  valorAlerta: { color: COLORS.warning },
  alertaBox: { marginTop: 12, backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: COLORS.warning },
  alertaText: { fontSize: FONTS.sm, color: COLORS.warning, lineHeight: 18 },
  disclaimer: { fontSize: FONTS.xs, color: COLORS.textLight, textAlign: 'center', marginTop: 8 },
  btnCompartilhar: {
    marginTop: 12, padding: 12, borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  btnCompartilharTxt: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text },
})
