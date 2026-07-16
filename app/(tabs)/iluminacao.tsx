import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../hooks/useAppTheme'
import { FONTS, RADIUS } from '../../constants/theme'
import { AMBIENTES, calcularIluminacao, ResultadoIluminacao } from '../../lib/iluminacao'
import { compartilharTexto } from '../../lib/share'

export default function IluminacaoScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()
  const s = makeStyles(colors)

  const [ambiente, setAmbiente] = useState(AMBIENTES[2].key) // recepção
  const [area, setArea] = useState('')
  const [alturaPe, setAlturaPe] = useState('3.0')
  const [alturaPlano, setAlturaPlano] = useState('0.8')
  const [fm, setFM] = useState('0.70')
  const [efi, setEfi] = useState('100')
  const [pot, setPot] = useState('40')
  const [resultado, setResultado] = useState<ResultadoIluminacao | null>(null)
  const [erro, setErro] = useState('')

  function calcular() {
    setErro('')
    const areaV = parseFloat(area.replace(',', '.'))
    if (!areaV || areaV <= 0) { setErro('Informe a área do ambiente.'); return }
    const peV = parseFloat(alturaPe.replace(',', '.'))
    const planoV = parseFloat(alturaPlano.replace(',', '.'))
    if (peV <= planoV) { setErro('Pé-direito deve ser maior que a altura do plano de trabalho.'); return }

    const res = calcularIluminacao({
      tipoAmbiente: ambiente,
      area: areaV,
      alturaPe: peV,
      alturaPlano: planoV,
      fatorManutencao: parseFloat(fm.replace(',', '.')) || 0.7,
      efiLuminaria: parseFloat(efi.replace(',', '.')) || 100,
      potLuminaria: parseFloat(pot.replace(',', '.')) || 40,
    })

    if (!res) { setErro('Verifique os dados de entrada.'); return }
    setResultado(res)
  }

  function compartilhar() {
    if (!resultado) return
    const amb = AMBIENTES.find(a => a.key === ambiente)
    compartilharTexto('Iluminação NBR ISO/CIE 8995-1 — Elétrica NBR', [
      `Ambiente: ${amb?.label}`,
      `Iluminância mínima: ${resultado.iluminanciaMinima} lux`,
      `Fluxo total necessário: ${resultado.fluxoTotal} lm`,
      `Luminárias necessárias: ${resultado.quantidadeLuminarias} un`,
      `Potência total: ${resultado.potenciaTotal} W`,
      `Densidade: ${resultado.densidadePotencia} W/m²`,
    ].join('\n'))
  }

  const ambSelecionado = AMBIENTES.find(a => a.key === ambiente)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Ionicons name="sunny" size={22} color={colors.primary} accessible={false} />
        <Text style={s.pageTitle}>Calculadora de Iluminação</Text>
      </View>
      <Text style={s.pageSub}>Método dos lúmens — NBR ISO/CIE 8995-1:2013</Text>

      {/* Tipo de ambiente */}
      <View style={s.card}>
        <Text style={s.label}>Tipo de ambiente</Text>
        <View style={{ gap: 6 }}>
          {AMBIENTES.map(a => (
            <TouchableOpacity
              key={a.key}
              style={[s.ambienteBtn, ambiente === a.key && s.ambienteBtnActive]}
              onPress={() => { setAmbiente(a.key); setResultado(null) }}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.ambienteBtnLabel, ambiente === a.key && s.ambienteBtnLabelActive]}>{a.label}</Text>
                <Text style={[s.ambienteBtnSub, ambiente === a.key && s.ambienteBtnSubActive]}>
                  {a.iluminanciaMin} lux mín · {a.categoria}
                </Text>
              </View>
              {ambiente === a.key && (
                <Ionicons name="checkmark-circle" size={18} color={colors.primaryDark} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dimensões */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Dimensões</Text>

        <Text style={s.label}>Área do ambiente (m²)</Text>
        <TextInput
          style={s.input}
          value={area}
          onChangeText={v => { setArea(v); setResultado(null) }}
          placeholder="Ex: 30"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />

        <Text style={[s.label, { marginTop: 12 }]}>Pé-direito (m)</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['2.5', '2.7', '3.0', '3.5', '4.0'].map(v => (
            <TouchableOpacity key={v} style={[s.chip, alturaPe === v && s.chipActive]} onPress={() => { setAlturaPe(v); setResultado(null) }}>
              <Text style={[s.chipText, alturaPe === v && s.chipTextActive]}>{v}m</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { marginTop: 12 }]}>Plano de trabalho (m)</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['0.0', '0.8', '0.9', '1.0'].map(v => (
            <TouchableOpacity key={v} style={[s.chip, alturaPlano === v && s.chipActive]} onPress={() => { setAlturaPlano(v); setResultado(null) }}>
              <Text style={[s.chipText, alturaPlano === v && s.chipTextActive]}>{v}m</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Luminária */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Luminária</Text>

        <Text style={s.label}>Potência unitária (W)</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['9', '18', '24', '36', '40', '60'].map(v => (
            <TouchableOpacity key={v} style={[s.chip, pot === v && s.chipActive]} onPress={() => { setPot(v); setResultado(null) }}>
              <Text style={[s.chipText, pot === v && s.chipTextActive]}>{v}W</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[s.input, { marginTop: 8 }]}
          value={pot}
          onChangeText={v => { setPot(v); setResultado(null) }}
          placeholder="40"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />

        <Text style={[s.label, { marginTop: 12 }]}>Eficiência luminosa (lm/W)</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['80', '90', '100', '110', '120', '130'].map(v => (
            <TouchableOpacity key={v} style={[s.chip, efi === v && s.chipActive]} onPress={() => { setEfi(v); setResultado(null) }}>
              <Text style={[s.chipText, efi === v && s.chipTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { marginTop: 12 }]}>Fator de manutenção (fm)</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {['0.60', '0.65', '0.70', '0.75', '0.80'].map(v => (
            <TouchableOpacity key={v} style={[s.chip, fm === v && s.chipActive]} onPress={() => { setFM(v); setResultado(null) }}>
              <Text style={[s.chipText, fm === v && s.chipTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!!erro && (
        <View style={s.erroBox}>
          <Text style={s.erroText}>{erro}</Text>
        </View>
      )}

      <TouchableOpacity style={s.btnCalc} onPress={calcular} activeOpacity={0.8}>
        <Text style={s.btnCalcText}>Calcular iluminação</Text>
      </TouchableOpacity>

      {resultado && (
        <View style={s.resultadoCard}>
          <Text style={s.resultadoTitulo}>Resultado</Text>

          <View style={s.destaque}>
            <Text style={s.destaqueLabel}>Luminárias necessárias</Text>
            <Text style={s.destaqueValor}>{resultado.quantidadeLuminarias}</Text>
            <Text style={s.destaqueUnit}>unidades de {pot} W / {efi} lm/W</Text>
          </View>

          <LinhaDados label="Iluminância mínima"    valor={`${resultado.iluminanciaMinima} lux`} colors={colors} s={s} />
          <LinhaDados label="Fluxo total necessário" valor={`${resultado.fluxoTotal} lm`} colors={colors} s={s} />
          <LinhaDados label="Fluxo por luminária"    valor={`${resultado.fluxoPorLuminaria} lm`} colors={colors} s={s} />
          <LinhaDados label="Potência total"         valor={`${resultado.potenciaTotal} W`} colors={colors} s={s} />
          <LinhaDados label="Densidade de potência"  valor={`${resultado.densidadePotencia} W/m²`} colors={colors} s={s} />
          <LinhaDados label="Índice de ambiente (k)" valor={String(resultado.indiceAmbiente)} colors={colors} s={s} />
          <LinhaDados label="Fator de utilização"    valor={String(resultado.fatorUtilizacao)} colors={colors} s={s} />

          {resultado.observacoes.length > 0 && (
            <View style={s.obsBox}>
              {resultado.observacoes.map((o, i) => (
                <Text key={i} style={s.obsText}>• {o}</Text>
              ))}
            </View>
          )}

          <TouchableOpacity style={s.btnCompartilhar} onPress={compartilhar} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={16} color={colors.text} />
            <Text style={s.btnCompartilharTxt}>Compartilhar resultado</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.disclaimer}>
        Cálculo orientativo pelo método dos lúmens (NBR ISO/CIE 8995-1). Consulte projetista habilitado para projetos luminotécnicos.
      </Text>
    </ScrollView>
  )
}

function LinhaDados({ label, valor, colors, s }: { label: string; valor: string; colors: any; s: any }) {
  return (
    <View style={s.linhaDados}>
      <Text style={s.dadoLabel}>{label}</Text>
      <Text style={s.dadoValor}>{valor}</Text>
    </View>
  )
}

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    pageTitle: { fontSize: FONTS['2xl'], fontWeight: '800', color: colors.text },
    pageSub: { fontSize: FONTS.sm, color: colors.textMuted, marginBottom: 20 },
    card: { backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    sectionLabel: { fontSize: FONTS.base, fontWeight: '700', color: colors.text, marginBottom: 12 },
    label: { fontSize: FONTS.sm, fontWeight: '600', color: colors.text, marginBottom: 6 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: FONTS.md, color: colors.text, backgroundColor: colors.bg,
    },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipText: { fontSize: FONTS.sm, fontWeight: '600', color: colors.textMuted },
    chipTextActive: { color: colors.primaryDark },
    ambienteBtn: { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
    ambienteBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    ambienteBtnLabel: { fontSize: FONTS.sm, fontWeight: '600', color: colors.textMuted },
    ambienteBtnLabelActive: { color: colors.primaryDark },
    ambienteBtnSub: { fontSize: FONTS.xs, color: colors.textLight, marginTop: 1 },
    ambienteBtnSubActive: { color: colors.primaryDark },
    erroBox: { backgroundColor: colors.dangerLight, borderRadius: RADIUS.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.danger },
    erroText: { color: colors.danger, fontSize: FONTS.sm },
    btnCalc: { backgroundColor: colors.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    btnCalcText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
    resultadoCard: { backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    resultadoTitulo: { fontSize: FONTS.lg, fontWeight: '800', color: colors.text, marginBottom: 16 },
    destaque: { backgroundColor: colors.primaryLight, borderRadius: RADIUS.md, padding: 16, alignItems: 'center', marginBottom: 16 },
    destaqueLabel: { fontSize: FONTS.sm, color: colors.primaryDark, fontWeight: '600' },
    destaqueValor: { fontSize: 48, fontWeight: '900', color: colors.primaryDark, marginTop: 4 },
    destaqueUnit: { fontSize: FONTS.xs, color: colors.primaryDark, marginTop: 2 },
    linhaDados: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
    dadoLabel: { fontSize: FONTS.base, color: colors.textMuted, flex: 1 },
    dadoValor: { fontSize: FONTS.base, fontWeight: '700', color: colors.text },
    obsBox: { marginTop: 12, backgroundColor: colors.warningLight, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: colors.warning, gap: 4 },
    obsText: { fontSize: FONTS.sm, color: colors.warning, lineHeight: 18 },
    btnCompartilhar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    btnCompartilharTxt: { fontSize: FONTS.sm, fontWeight: '700', color: colors.text },
    disclaimer: { fontSize: FONTS.xs, color: colors.textLight, textAlign: 'center', marginTop: 8 },
  })
}
