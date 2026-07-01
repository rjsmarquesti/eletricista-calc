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
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import {
  calcularEmergencia,
  TipoEdificio,
  LABEL_EDIFICIO,
  ResultadoEmergencia,
} from '../../lib/iluminacaoEmergencia'
import { salvarCalculo } from '../../lib/db'

const TIPOS: TipoEdificio[] = [
  'residencial', 'comercialPequeno', 'comercialGrande',
  'industrial', 'hospitalar', 'escolar', 'hoteleiro', 'garagem',
]

export default function EmergenciaScreen() {
  const insets = useSafeAreaInsets()

  const [area, setArea] = useState('200')
  const [tipo, setTipo] = useState<TipoEdificio>('comercialPequeno')
  const [rotas, setRotas] = useState('2')
  const [altura, setAltura] = useState('3.0')
  const [resultado, setResultado] = useState<ResultadoEmergencia | null>(null)
  const [erro, setErro] = useState('')

  function calcular() {
    const A = parseFloat(area)
    const R = parseInt(rotas)
    const H = parseFloat(altura)

    if (!A || A <= 0 || !R || R <= 0 || !H || H <= 0) {
      setErro('Preencha todos os campos corretamente.')
      setResultado(null)
      return
    }

    setErro('')
    const res = calcularEmergencia({
      areaTotalM2: A,
      tipoEdificio: tipo,
      numRotasFuga: R,
      alturaInstalacao: H,
    })
    setResultado(res)

    try {
      salvarCalculo(
        'emergencia',
        `${LABEL_EDIFICIO[tipo]} — ${A}m²`,
        { area: A, tipo, rotas: R, altura: H },
        res as unknown as object
      )
    } catch { /* não crítico */ }
  }

  function limpar() {
    setArea('200'); setTipo('comercialPequeno')
    setRotas('2'); setAltura('3.0')
    setResultado(null); setErro('')
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.titulo}>Iluminação de Emergência</Text>
      <Text style={s.subtitulo}>NBR 10898:2013 — Blocos autônomos</Text>

      {/* Tipo de edificação */}
      <View style={s.card}>
        <Text style={s.label}>Tipo de Edificação</Text>
        {TIPOS.map(t => (
          <TouchableOpacity
            key={t}
            style={[s.opcao, tipo === t && s.opcaoAtiva]}
            onPress={() => setTipo(t)}
          >
            <Text style={[s.opcaoTxt, tipo === t && s.opcaoTxtAtiva]}>
              {LABEL_EDIFICIO[t]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dados da área */}
      <View style={s.card}>
        <Text style={s.label}>Dados da Instalação</Text>

        <Text style={s.inputLabel}>Área total (m²)</Text>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={area}
          onChangeText={setArea}
          placeholder="Ex: 200"
        />

        <Text style={s.inputLabel}>Número de rotas de fuga</Text>
        <TextInput
          style={s.input}
          keyboardType="number-pad"
          value={rotas}
          onChangeText={setRotas}
          placeholder="Ex: 2"
        />

        <Text style={s.inputLabel}>Altura de instalação / pé-direito (m)</Text>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={altura}
          onChangeText={setAltura}
          placeholder="Ex: 3.0"
        />
      </View>

      {erro ? <Text style={s.erro}>{erro}</Text> : null}

      <TouchableOpacity style={s.btnPrimario} onPress={calcular}>
        <Text style={s.btnPrimarioTxt}>Calcular</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecundario} onPress={limpar}>
        <Text style={s.btnSecundarioTxt}>Limpar</Text>
      </TouchableOpacity>

      {resultado && <Resultado r={resultado} />}
    </ScrollView>
  )
}

function Resultado({ r }: { r: ResultadoEmergencia }) {
  return (
    <View style={s.resultadoWrap}>
      {/* Obrigatoriedade */}
      <View style={[s.statusCard, r.obrigatorio ? s.statusNok : s.statusAmarelo]}>
        <Text style={[s.statusTxt, { color: r.obrigatorio ? COLORS.danger : COLORS.warning }]}>
          {r.obrigatorio ? '⚠️ OBRIGATÓRIO' : 'ℹ️ RECOMENDADO'}
        </Text>
        <Text style={s.statusSub}>NBR 10898 — {r.autonomiaMinima}h de autonomia mínima</Text>
      </View>

      {/* Quantidade de blocos — destaque */}
      <View style={[s.card, s.blocosCard]}>
        <Text style={s.blocosLabel}>Blocos Autônomos Mínimos</Text>
        <Text style={s.blocosValor}>{r.blocosMinimos}</Text>
        <Text style={s.blocosSub}>blocos de ≥ {r.potenciaMinBlocoW}W</Text>
      </View>

      {/* Parâmetros técnicos */}
      <View style={s.card}>
        <Row label="Autonomia mínima" value={`${r.autonomiaMinima} horas`} destaque />
        <Row label="Iluminância mín. (rota de fuga)" value={`${r.fluxoMinRota} lux`} />
        <Row label="Iluminância mín. (área geral)" value={`${r.fluxoMinArea} lux`} />
        <Row label="Altura máx. de fixação" value={`${r.alturaMaxFixacao} m`} />
        <Row label="Potência mínima por bloco" value={`${r.potenciaMinBlocoW} W`} />
      </View>

      {/* Observações */}
      <View style={[s.card, s.avisoAmarelo]}>
        {r.observacoes.map((o, i) => (
          <Text key={i} style={s.avisoTxt}>• {o}</Text>
        ))}
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
    padding: 14,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusNok: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  statusAmarelo: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning },
  statusTxt: { fontSize: FONTS.xl, fontWeight: '800' },
  statusSub: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 4 },
  blocosCard: { alignItems: 'center', backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  blocosLabel: { fontSize: FONTS.base, fontWeight: '600', color: COLORS.primaryDark },
  blocosValor: { fontSize: 56, fontWeight: '900', color: COLORS.primary },
  blocosSub: { fontSize: FONTS.sm, color: COLORS.textMuted },
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
})
