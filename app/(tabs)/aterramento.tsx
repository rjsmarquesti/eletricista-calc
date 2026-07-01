import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import {
  calcularAterramento,
  TipoTerreno,
  TipoAplicacao,
  TipoEletrodo,
  LABEL_TERRENO,
  LABEL_APLICACAO,
  ResultadoAterramento,
} from '../../lib/aterramento'
import { salvarCalculo } from '../../lib/db'

const TERRENOS: TipoTerreno[] = ['pantanoso', 'argilaUmida', 'argila', 'areia', 'rochaSolta', 'rocha']
const APLICACOES: TipoAplicacao[] = ['residencial', 'predial', 'hospitalar', 'spda', 'industrial']
const SECOES_FASE = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120]

export default function AterramentoScreen() {
  const insets = useSafeAreaInsets()

  const [terreno, setTerreno] = useState<TipoTerreno>('argila')
  const [aplicacao, setAplicacao] = useState<TipoAplicacao>('residencial')
  const [eletrodo] = useState<TipoEletrodo>('haste')
  const [comprimento, setComprimento] = useState('2.4')
  const [diametro, setDiametro] = useState('16')
  const [numHastes, setNumHastes] = useState('1')
  const [secaoFase, setSecaoFase] = useState(10)
  const [resultado, setResultado] = useState<ResultadoAterramento | null>(null)
  const [erro, setErro] = useState('')

  function calcular() {
    const L = parseFloat(comprimento)
    const d = parseFloat(diametro)
    const n = parseInt(numHastes)

    if (!L || L <= 0 || !d || d <= 0 || !n || n <= 0) {
      setErro('Preencha todos os campos corretamente.')
      setResultado(null)
      return
    }

    setErro('')
    const res = calcularAterramento({
      tipoTerreno: terreno,
      tipoAplicacao: aplicacao,
      tipoEletrodo: eletrodo,
      comprimentoHaste: L,
      diametroHaste: d,
      numeroHastes: n,
      secaoFase,
    })
    setResultado(res)

    try {
      salvarCalculo(
        'aterramento',
        `${LABEL_TERRENO[terreno]} — ${n} haste(s) ${L}m`,
        { terreno, aplicacao, comprimento: L, diametro: d, numHastes: n, secaoFase },
        res as unknown as object
      )
    } catch { /* não crítico */ }
  }

  function limpar() {
    setComprimento('2.4')
    setDiametro('16')
    setNumHastes('1')
    setSecaoFase(10)
    setTerreno('argila')
    setAplicacao('residencial')
    setResultado(null)
    setErro('')
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.titulo}>Aterramento Elétrico</Text>
      <Text style={s.subtitulo}>NBR 5410 seção 5.4 • Fórmula de Dwight</Text>

      {/* Tipo de terreno */}
      <View style={s.card}>
        <Text style={s.label}>Tipo de Solo</Text>
        {TERRENOS.map(t => (
          <TouchableOpacity
            key={t}
            style={[s.opcao, terreno === t && s.opcaoAtiva]}
            onPress={() => setTerreno(t)}
          >
            <Text style={[s.opcaoTxt, terreno === t && s.opcaoTxtAtiva]}>
              {LABEL_TERRENO[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tipo de aplicação */}
      <View style={s.card}>
        <Text style={s.label}>Aplicação</Text>
        <View style={s.row}>
          {APLICACOES.map(a => (
            <TouchableOpacity
              key={a}
              style={[s.chip, aplicacao === a && s.chipAtivo]}
              onPress={() => setAplicacao(a)}
            >
              <Text style={[s.chipTxt, aplicacao === a && s.chipTxtAtivo]}>
                {LABEL_APLICACAO[a]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Parâmetros da haste */}
      <View style={s.card}>
        <Text style={s.label}>Parâmetros da Haste</Text>

        <Text style={s.inputLabel}>Comprimento da haste (m)</Text>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={comprimento}
          onChangeText={setComprimento}
          placeholder="Ex: 2.4"
        />

        <Text style={s.inputLabel}>Diâmetro da haste (mm)</Text>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={diametro}
          onChangeText={setDiametro}
          placeholder="Ex: 16"
        />

        <Text style={s.inputLabel}>Número de hastes</Text>
        <TextInput
          style={s.input}
          keyboardType="number-pad"
          value={numHastes}
          onChangeText={setNumHastes}
          placeholder="Ex: 1"
        />
      </View>

      {/* Seção da fase */}
      <View style={s.card}>
        <Text style={s.label}>Seção do Condutor de Fase (mm²)</Text>
        <View style={s.row}>
          {SECOES_FASE.map(s_ => (
            <TouchableOpacity
              key={s_}
              style={[s.chip, secaoFase === s_ && s.chipAtivo]}
              onPress={() => setSecaoFase(s_)}
            >
              <Text style={[s.chipTxt, secaoFase === s_ && s.chipTxtAtivo]}>{s_}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {erro ? <Text style={s.erro}>{erro}</Text> : null}

      <TouchableOpacity style={s.btnPrimario} onPress={calcular}>
        <Text style={s.btnPrimarioTxt}>Calcular Aterramento</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecundario} onPress={limpar}>
        <Text style={s.btnSecundarioTxt}>Limpar</Text>
      </TouchableOpacity>

      {resultado && <Resultado r={resultado} />}
    </ScrollView>
  )
}

function Resultado({ r }: { r: ResultadoAterramento }) {
  return (
    <View style={s.resultadoWrap}>
      {/* Status principal */}
      <View style={[s.statusCard, r.aprovado ? s.statusOk : s.statusNok]}>
        <Text style={[s.statusTxt, { color: r.aprovado ? COLORS.success : COLORS.danger }]}>
          {r.aprovado ? '✓ APROVADO' : '✗ REPROVADO'}
        </Text>
        <Text style={s.statusSub}>
          {r.resistenciaResultante.toFixed(2)} Ω (limite: {r.limiteNorma} Ω)
        </Text>
      </View>

      {/* Dados */}
      <View style={s.card}>
        <Row label="Resistividade do solo" value={`${r.resistividadeSolo} Ω·m`} />
        <Row label="Resistência (1 haste)" value={`${r.resistenciaUmaHaste.toFixed(2)} Ω`} />
        <Row label="Resistência resultante" value={`${r.resistenciaResultante.toFixed(2)} Ω`} destaque />
        <Row label="Limite da norma" value={`${r.limiteNorma} Ω`} />
        <Row label="Hastes necessárias (mínimo)" value={`${r.hastesNecessarias}`} />
        <Row label="Condutor de proteção (PE)" value={`${r.secaoCaboTerra} mm²`} />
        <Row label="Equipotencialização" value={`${r.secaoEquipotencializacao} mm²`} />
      </View>

      {/* Observações */}
      {r.observacoes.length > 0 && (
        <View style={[s.card, r.aprovado ? s.avisoAmarelo : s.avisoVermelho]}>
          {r.observacoes.map((o, i) => (
            <Text key={i} style={s.avisoTxt}>• {o}</Text>
          ))}
        </View>
      )}
    </View>
  )
}

function Row({ label, value, destaque }: { label: string; value: string; destaque?: boolean }) {
  return (
    <View style={s.tableRow}>
      <Text style={s.tableLabel}>{label}</Text>
      <Text style={[s.tableValue, destaque && s.tableValueDestaque]}>{value}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, gap: 12 },
  titulo: { fontSize: FONTS['2xl'], fontWeight: '700', color: COLORS.text },
  subtitulo: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: -8 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 8,
  },
  label: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.text },
  inputLabel: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: FONTS.base,
    color: COLORS.text,
    backgroundColor: COLORS.bg,
  },
  opcao: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  opcaoAtiva: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  opcaoTxt: { fontSize: FONTS.sm, color: COLORS.text },
  opcaoTxtAtiva: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  chipAtivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { fontSize: FONTS.sm, color: COLORS.text },
  chipTxtAtivo: { color: '#fff', fontWeight: '600' },
  erro: { color: COLORS.danger, fontSize: FONTS.sm, textAlign: 'center' },
  btnPrimario: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  btnPrimarioTxt: { color: '#fff', fontWeight: '700', fontSize: FONTS.md },
  btnSecundario: {
    padding: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnSecundarioTxt: { color: COLORS.textMuted, fontSize: FONTS.base },
  resultadoWrap: { gap: 12 },
  statusCard: {
    padding: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusOk: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  statusNok: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  statusTxt: { fontSize: FONTS['2xl'], fontWeight: '800' },
  statusSub: { fontSize: FONTS.base, color: COLORS.textMuted, marginTop: 4 },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableLabel: { fontSize: FONTS.sm, color: COLORS.textMuted, flex: 1 },
  tableValue: { fontSize: FONTS.sm, color: COLORS.text, fontWeight: '600' },
  tableValueDestaque: { color: COLORS.primary, fontSize: FONTS.md },
  avisoAmarelo: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning },
  avisoVermelho: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  avisoTxt: { fontSize: FONTS.sm, color: COLORS.text, lineHeight: 20 },
})
