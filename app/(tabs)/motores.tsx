import React, { useState } from 'react'
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { compartilharTexto } from '../../lib/share'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import {
  calcularMotor,
  TipoPartida,
  NumeroFases,
  MetodoInstalacao,
  LABEL_PARTIDA,
  LABEL_METODO,
  ResultadoMotor,
} from '../../lib/motores'
import { salvarCalculo } from '../../lib/db'

const TENSOES_3F = [220, 380, 440]
const TENSOES_1F = [127, 220]
const TIPOS_PARTIDA: TipoPartida[] = ['direta', 'estrelaTriangulo', 'softStarter', 'inversor', 'autoTransformador']
const METODOS: MetodoInstalacao[] = ['B1', 'B2', 'C']

export default function MotoresScreen() {
  const insets = useSafeAreaInsets()

  const [potencia, setPotencia] = useState('5.5')
  const [fases, setFases] = useState<NumeroFases>(3)
  const [tensao, setTensao] = useState(380)
  const [fp, setFp] = useState('0.85')
  const [rendimento, setRendimento] = useState('0.90')
  const [tipoPartida, setTipoPartida] = useState<TipoPartida>('direta')
  const [metodo, setMetodo] = useState<MetodoInstalacao>('B1')
  const [resultado, setResultado] = useState<ResultadoMotor | null>(null)
  const [erro, setErro] = useState('')

  const tensoes = fases === 3 ? TENSOES_3F : TENSOES_1F

  function onFasesChange(f: NumeroFases) {
    setFases(f)
    setTensao(f === 3 ? 380 : 220)
  }

  function calcular() {
    const kW = parseFloat(potencia)
    const cosF = parseFloat(fp)
    const eta = parseFloat(rendimento)

    if (!kW || kW <= 0 || !cosF || cosF <= 0 || cosF > 1 || !eta || eta <= 0 || eta > 1) {
      setErro('Verifique potência, fator de potência e rendimento.')
      setResultado(null)
      return
    }

    setErro('')
    const res = calcularMotor({
      potencia: kW,
      tensao,
      fases,
      fatorPotencia: cosF,
      rendimento: eta,
      tipoPartida,
      metodoInstalacao: metodo,
    })
    setResultado(res)

    try {
      salvarCalculo(
        'motor',
        `Motor ${kW}kW ${fases}F ${tensao}V — ${LABEL_PARTIDA[tipoPartida].titulo}`,
        { potencia: kW, fases, tensao, fp: cosF, rendimento: eta, tipoPartida, metodo },
        res as unknown as object
      )
    } catch { /* não crítico */ }
  }

  function limpar() {
    setPotencia('5.5'); setFases(3); setTensao(380)
    setFp('0.85'); setRendimento('0.90')
    setTipoPartida('direta'); setMetodo('B1')
    setResultado(null); setErro('')
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.titulo}>Motores Elétricos</Text>
      <Text style={s.subtitulo}>NBR IEC 60947 • Dimensionamento de partida e proteção</Text>

      {/* Fases */}
      <View style={s.card}>
        <Text style={s.label}>Alimentação</Text>
        <View style={s.row}>
          {([1, 3] as NumeroFases[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[s.segBtn, fases === f && s.segBtnAtivo, { flex: 1 }]}
              onPress={() => onFasesChange(f)}
            >
              <Text style={[s.segBtnTxt, fases === f && s.segBtnTxtAtivo]}>
                {f === 1 ? 'Monofásico' : 'Trifásico'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={s.label}>Tensão (V)</Text>
        <View style={s.row}>
          {tensoes.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.chip, tensao === t && s.chipAtivo]}
              onPress={() => setTensao(t)}
            >
              <Text style={[s.chipTxt, tensao === t && s.chipTxtAtivo]}>{t}V</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Potência e parâmetros */}
      <View style={s.card}>
        <Text style={s.label}>Parâmetros do Motor</Text>

        <Text style={s.inputLabel}>Potência (kW)</Text>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={potencia}
          onChangeText={setPotencia}
          placeholder="Ex: 5.5"
        />

        <View style={s.row2}>
          <View style={s.col}>
            <Text style={s.inputLabel}>Fator de potência (cos φ)</Text>
            <TextInput
              style={s.input}
              keyboardType="decimal-pad"
              value={fp}
              onChangeText={setFp}
              placeholder="0.85"
            />
          </View>
          <View style={s.col}>
            <Text style={s.inputLabel}>Rendimento (η)</Text>
            <TextInput
              style={s.input}
              keyboardType="decimal-pad"
              value={rendimento}
              onChangeText={setRendimento}
              placeholder="0.90"
            />
          </View>
        </View>
      </View>

      {/* Tipo de partida */}
      <View style={s.card}>
        <Text style={s.label}>Tipo de Partida</Text>
        {TIPOS_PARTIDA.map(p => (
          <TouchableOpacity
            key={p}
            style={[s.partidaCard, tipoPartida === p && s.partidaCardAtivo]}
            onPress={() => setTipoPartida(p)}
          >
            <Text style={[s.partidaTitulo, tipoPartida === p && s.partidaTituloAtivo]}>
              {LABEL_PARTIDA[p].titulo}
            </Text>
            <Text style={s.partidaDesc}>{LABEL_PARTIDA[p].quando}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Método de instalação */}
      <View style={s.card}>
        <Text style={s.label}>Método de Instalação do Cabo</Text>
        {METODOS.map(m => (
          <TouchableOpacity
            key={m}
            style={[s.opcao, metodo === m && s.opcaoAtiva]}
            onPress={() => setMetodo(m)}
          >
            <Text style={[s.opcaoTxt, metodo === m && s.opcaoTxtAtiva]}>{LABEL_METODO[m]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {erro ? <Text style={s.erro}>{erro}</Text> : null}

      <TouchableOpacity style={s.btnPrimario} onPress={calcular}>
        <Text style={s.btnPrimarioTxt}>Calcular Motor</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecundario} onPress={limpar}>
        <Text style={s.btnSecundarioTxt}>Limpar</Text>
      </TouchableOpacity>

      {resultado && <Resultado r={resultado} partida={tipoPartida} />}
    </ScrollView>
  )
}

function Resultado({ r, partida }: { r: ResultadoMotor; partida: TipoPartida }) {
  return (
    <View style={s.resultadoWrap}>
      {/* Correntes */}
      <View style={s.row2}>
        <View style={[s.card, s.correnteCard]}>
          <Text style={s.correnteTitulo}>In</Text>
          <Text style={s.correnteValor}>{r.correnteNominal} A</Text>
          <Text style={s.correnteSub}>Nominal</Text>
        </View>
        <View style={[s.card, s.correnteCard]}>
          <Text style={s.correnteTitulo}>Ip</Text>
          <Text style={[s.correnteValor, { color: COLORS.warning }]}>{r.correntePartida} A</Text>
          <Text style={s.correnteSub}>Partida ({r.fatorPartida}× In)</Text>
        </View>
      </View>

      {/* Componentes */}
      <View style={s.card}>
        <Text style={s.label}>Componentes Selecionados</Text>
        <Row label="Disjuntor motor (curva D)" value={`${r.disjuntorMotor} A`} destaque />
        <Row label="Contator (AC-3)" value={`${r.contatora} A`} destaque />
        <Row label="Relé térmico (faixa)" value={`${r.releTermico.min} – ${r.releTermico.max} A`} />
        <Row label="Seção do cabo de alimentação" value={`${r.secaoCabo} mm²`} destaque />
      </View>

      {/* Observações */}
      {r.observacoes.length > 0 && (
        <View style={[s.card, s.avisoAmarelo]}>
          {r.observacoes.map((o, i) => (
            <Text key={i} style={s.avisoTxt}>• {o}</Text>
          ))}
        </View>
      )}

      <View style={s.acoesRow}>
        <TouchableOpacity
          style={s.btnAcao}
          onPress={() => compartilharTexto('Motor NBR IEC 60947', [
            `In = ${r.correnteNominal} A | Ip = ${r.correntePartida} A (${r.fatorPartida}× In)`,
            `Disjuntor motor (curva D): ${r.disjuntorMotor} A`,
            `Contator (AC-3): ${r.contatora} A`,
            `Relé térmico: ${r.releTermico.min}–${r.releTermico.max} A`,
            `Seção do cabo: ${r.secaoCabo} mm²`,
          ].join('\n'))}
        >
          <Text style={s.btnAcaoTxt}>📤 Compartilhar</Text>
        </TouchableOpacity>
      </View>
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
  inputLabel: { fontSize: FONTS.sm, color: COLORS.textMuted },
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
  row: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  row2: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  segBtn: {
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  segBtnAtivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  segBtnTxt: { fontSize: FONTS.base, color: COLORS.text, fontWeight: '600' },
  segBtnTxtAtivo: { color: '#fff' },
  chip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  chipAtivo: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipTxt: { fontSize: FONTS.sm, color: COLORS.text },
  chipTxtAtivo: { color: '#fff', fontWeight: '600' },
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
  partidaCard: {
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 2,
  },
  partidaCardAtivo: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  partidaTitulo: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  partidaTituloAtivo: { color: COLORS.primaryDark },
  partidaDesc: { fontSize: FONTS.xs, color: COLORS.textMuted, lineHeight: 16 },
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
  correnteCard: { flex: 1, alignItems: 'center' },
  correnteTitulo: { fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: '600' },
  correnteValor: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  correnteSub: { fontSize: FONTS.xs, color: COLORS.textMuted },
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
  avisoTxt: { fontSize: FONTS.sm, color: COLORS.text, lineHeight: 20 },
  acoesRow: { flexDirection: 'row', gap: 10 },
  btnAcao: {
    flex: 1, padding: 12, borderRadius: RADIUS.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card,
  },
  btnAcaoTxt: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text },
})
