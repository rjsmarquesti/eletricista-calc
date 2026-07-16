import { useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Switch,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../hooks/useAppTheme'
import { FONTS, RADIUS } from '../../constants/theme'
import {
  calcularOrcamento, formatarMoeda,
  BITOLAS_DISPONIVEIS, AMPERAGENS_DISPONIVEIS,
  EntradaOrcamento, ResultadoOrcamento,
} from '../../lib/orcamento'
import { compartilharTexto } from '../../lib/share'

const DIAMETROS = ['20mm', '25mm', '32mm'] as const

export default function OrcamentoScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()
  const s = makeStyles(colors)

  const [bitola, setBitola] = useState(2.5)
  const [comprimento, setComprimento] = useState('')
  const [circuitos, setCircuitos] = useState('1')
  const [eletroduto, setEletroduto] = useState(false)
  const [diametro, setDiametro] = useState<'20mm' | '25mm' | '32mm'>('20mm')
  const [nDisjuntores, setNDisjuntores] = useState('1')
  const [ampDisjuntor, setAmpDisjuntor] = useState(20)
  const [nTomadas, setNTomadas] = useState('')
  const [nInterruptores, setNInterruptores] = useState('')
  const [percMO, setPercMO] = useState('40')
  const [resultado, setResultado] = useState<ResultadoOrcamento | null>(null)
  const [erro, setErro] = useState('')

  function calcular() {
    setErro('')
    const comp = parseFloat(comprimento.replace(',', '.'))
    if (!comp || comp <= 0) { setErro('Informe o comprimento do circuito.'); return }

    const entrada: EntradaOrcamento = {
      bitola,
      comprimento: comp,
      quantidadeCircuitos: Math.max(1, parseInt(circuitos) || 1),
      incluirEletroduto: eletroduto,
      diametroEletroduto: diametro,
      quantidadeDisjuntores: parseInt(nDisjuntores) || 0,
      amperagemDisjuntor: ampDisjuntor,
      quantidadeTomadas: parseInt(nTomadas) || 0,
      quantidadeInterruptores: parseInt(nInterruptores) || 0,
      percentualMaoDeObra: parseFloat(percMO) || 0,
    }
    setResultado(calcularOrcamento(entrada))
  }

  function compartilhar() {
    if (!resultado) return
    const linhas = resultado.itens.map(i =>
      `${i.descricao}: ${i.qtd} ${i.unidade} × ${formatarMoeda(i.unitario)} = ${formatarMoeda(i.total)}`
    )
    linhas.push('')
    linhas.push(`Material: ${formatarMoeda(resultado.subtotalMaterial)}`)
    linhas.push(`Mão de obra (${percMO}%): ${formatarMoeda(resultado.maoDeObra)}`)
    linhas.push(`TOTAL: ${formatarMoeda(resultado.total)}`)
    compartilharTexto('Orçamento Elétrico — Elétrica NBR', linhas.join('\n'))
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Ionicons name="calculator" size={22} color={colors.primary} accessible={false} />
        <Text style={s.pageTitle}>Calculadora de Orçamento</Text>
      </View>
      <Text style={s.pageSub}>Material elétrico + mão de obra — referência SINAPI</Text>

      {/* Bitola */}
      <View style={s.card}>
        <Text style={s.label}>Bitola do condutor (mm²)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {BITOLAS_DISPONIVEIS.filter(b => b <= 16).map(b => (
              <TouchableOpacity
                key={b}
                style={[s.chip, bitola === b && s.chipActive]}
                onPress={() => { setBitola(b); setResultado(null) }}
              >
                <Text style={[s.chipText, bitola === b && s.chipTextActive]}>{b}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <Text style={[s.label, { marginTop: 12 }]}>Comprimento do circuito (m)</Text>
        <TextInput
          style={s.input}
          value={comprimento}
          onChangeText={v => { setComprimento(v); setResultado(null) }}
          placeholder="Ex: 20"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />

        <Text style={[s.label, { marginTop: 12 }]}>Número de circuitos</Text>
        <TextInput
          style={s.input}
          value={circuitos}
          onChangeText={v => { setCircuitos(v); setResultado(null) }}
          placeholder="1"
          placeholderTextColor={colors.textLight}
          keyboardType="number-pad"
        />
      </View>

      {/* Eletroduto */}
      <View style={s.card}>
        <View style={s.switchRow}>
          <Text style={s.switchLabel}>Incluir eletroduto PVC</Text>
          <Switch
            value={eletroduto}
            onValueChange={v => { setEletroduto(v); setResultado(null) }}
            trackColor={{ true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
        {eletroduto && (
          <>
            <Text style={s.label}>Diâmetro do eletroduto</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {DIAMETROS.map(d => (
                <TouchableOpacity
                  key={d}
                  style={[s.toggleBtn, diametro === d && s.toggleBtnActive]}
                  onPress={() => { setDiametro(d); setResultado(null) }}
                >
                  <Text style={[s.toggleBtnText, diametro === d && s.toggleBtnTextActive]}>{d}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>

      {/* Disjuntores */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Disjuntores</Text>
        <Text style={s.label}>Quantidade</Text>
        <TextInput
          style={s.input}
          value={nDisjuntores}
          onChangeText={v => { setNDisjuntores(v); setResultado(null) }}
          placeholder="0"
          placeholderTextColor={colors.textLight}
          keyboardType="number-pad"
        />
        <Text style={[s.label, { marginTop: 12 }]}>Amperagem (A)</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {AMPERAGENS_DISPONIVEIS.map(a => (
              <TouchableOpacity
                key={a}
                style={[s.chip, ampDisjuntor === a && s.chipActive]}
                onPress={() => { setAmpDisjuntor(a); setResultado(null) }}
              >
                <Text style={[s.chipText, ampDisjuntor === a && s.chipTextActive]}>{a}A</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Tomadas e interruptores */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Pontos de instalação</Text>
        <Text style={s.label}>Tomadas 2P+T 10A NBR 14136</Text>
        <TextInput
          style={s.input}
          value={nTomadas}
          onChangeText={v => { setNTomadas(v); setResultado(null) }}
          placeholder="0"
          placeholderTextColor={colors.textLight}
          keyboardType="number-pad"
        />
        <Text style={[s.label, { marginTop: 12 }]}>Interruptores simples</Text>
        <TextInput
          style={s.input}
          value={nInterruptores}
          onChangeText={v => { setNInterruptores(v); setResultado(null) }}
          placeholder="0"
          placeholderTextColor={colors.textLight}
          keyboardType="number-pad"
        />
      </View>

      {/* Mão de obra */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Mão de obra</Text>
        <Text style={s.label}>Percentual sobre o material (%)</Text>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {['30', '40', '50', '60', '70', '100'].map(p => (
            <TouchableOpacity
              key={p}
              style={[s.chip, percMO === p && s.chipActive]}
              onPress={() => { setPercMO(p); setResultado(null) }}
            >
              <Text style={[s.chipText, percMO === p && s.chipTextActive]}>{p}%</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={[s.input, { marginTop: 8 }]}
          value={percMO}
          onChangeText={v => { setPercMO(v); setResultado(null) }}
          placeholder="40"
          placeholderTextColor={colors.textLight}
          keyboardType="numeric"
        />
      </View>

      {!!erro && (
        <View style={s.erroBox}>
          <Text style={s.erroText}>{erro}</Text>
        </View>
      )}

      <TouchableOpacity style={s.btnCalc} onPress={calcular} activeOpacity={0.8}>
        <Text style={s.btnCalcText}>Calcular orçamento</Text>
      </TouchableOpacity>

      {resultado && (
        <View style={s.resultadoCard}>
          <Text style={s.resultadoTitulo}>Orçamento estimado</Text>

          {resultado.itens.map((item, i) => (
            <View key={i} style={s.itemRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.itemDesc}>{item.descricao}</Text>
                <Text style={s.itemDetalhe}>{item.qtd} {item.unidade} × {formatarMoeda(item.unitario)}</Text>
              </View>
              <Text style={s.itemTotal}>{formatarMoeda(item.total)}</Text>
            </View>
          ))}

          <View style={s.divider} />

          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Material</Text>
            <Text style={s.totalValor}>{formatarMoeda(resultado.subtotalMaterial)}</Text>
          </View>
          <View style={s.totalRow}>
            <Text style={s.totalLabel}>Mão de obra ({percMO}%)</Text>
            <Text style={s.totalValor}>{formatarMoeda(resultado.maoDeObra)}</Text>
          </View>

          <View style={[s.totalRow, s.totalFinal]}>
            <Text style={s.totalFinalLabel}>TOTAL</Text>
            <Text style={s.totalFinalValor}>{formatarMoeda(resultado.total)}</Text>
          </View>

          <TouchableOpacity style={s.btnCompartilhar} onPress={compartilhar} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={16} color={colors.text} />
            <Text style={s.btnCompartilharTxt}>Compartilhar orçamento</Text>
          </TouchableOpacity>
        </View>
      )}

      <Text style={s.disclaimer}>
        Valores de referência SINAPI Centro-Oeste jul/2026. Preços regionais podem variar.
      </Text>
    </ScrollView>
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
    switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    switchLabel: { fontSize: FONTS.base, fontWeight: '600', color: colors.text },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.full, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipText: { fontSize: FONTS.sm, fontWeight: '600', color: colors.textMuted },
    chipTextActive: { color: colors.primaryDark },
    toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.bg },
    toggleBtnActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    toggleBtnText: { fontSize: FONTS.base, fontWeight: '600', color: colors.textMuted },
    toggleBtnTextActive: { color: colors.primaryDark },
    erroBox: { backgroundColor: colors.dangerLight, borderRadius: RADIUS.md, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: colors.danger },
    erroText: { color: colors.danger, fontSize: FONTS.sm },
    btnCalc: { backgroundColor: colors.primary, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
    btnCalcText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },
    resultadoCard: { backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    resultadoTitulo: { fontSize: FONTS.lg, fontWeight: '800', color: colors.text, marginBottom: 16 },
    itemRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 8 },
    itemDesc: { fontSize: FONTS.sm, fontWeight: '600', color: colors.text },
    itemDetalhe: { fontSize: FONTS.xs, color: colors.textMuted, marginTop: 2 },
    itemTotal: { fontSize: FONTS.base, fontWeight: '700', color: colors.text },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
    totalLabel: { fontSize: FONTS.base, color: colors.textMuted },
    totalValor: { fontSize: FONTS.base, fontWeight: '600', color: colors.text },
    totalFinal: { backgroundColor: colors.primaryLight, borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, marginTop: 8 },
    totalFinalLabel: { fontSize: FONTS.md, fontWeight: '800', color: colors.primaryDark },
    totalFinalValor: { fontSize: FONTS.xl, fontWeight: '900', color: colors.primaryDark },
    btnCompartilhar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    btnCompartilharTxt: { fontSize: FONTS.sm, fontWeight: '700', color: colors.text },
    disclaimer: { fontSize: FONTS.xs, color: colors.textLight, textAlign: 'center', marginTop: 8 },
  })
}
