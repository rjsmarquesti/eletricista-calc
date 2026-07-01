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
  calcularSPDA,
  FatorForma,
  TipoUso,
  TipoConteudo,
  TipoOcupacao,
  NivelProtecao,
  LABEL_FATOR_FORMA,
  LABEL_USO,
  LABEL_CONTEUDO,
  LABEL_OCUPACAO,
  NG_BRASIL,
  ResultadoSPDA,
} from '../../lib/nbr5419'
import { salvarCalculo } from '../../lib/db'

const FATORES_FORMA: FatorForma[] = ['isolada', 'proximo', 'entre']
const TIPOS_USO: TipoUso[] = ['residencial', 'comercial', 'industrial', 'hospitalar', 'cultural', 'explosivos']
const TIPOS_CONTEUDO: TipoConteudo[] = ['baixoRisco', 'medioRisco', 'altoRisco']
const TIPOS_OCUPACAO: TipoOcupacao[] = ['reduzida', 'normal', 'elevada']

const COR_NP: Record<NivelProtecao, string> = {
  I: COLORS.danger,
  II: COLORS.warning,
  III: '#CA8A04',
  IV: COLORS.success,
}

export default function SPDAScreen() {
  const insets = useSafeAreaInsets()

  const [comprimento, setComprimento] = useState('10')
  const [largura, setLargura] = useState('10')
  const [altura, setAltura] = useState('8')
  const [fatorForma, setFatorForma] = useState<FatorForma>('isolada')
  const [Ng, setNg] = useState('6')
  const [tipoUso, setTipoUso] = useState<TipoUso>('residencial')
  const [tipoConteudo, setTipoConteudo] = useState<TipoConteudo>('medioRisco')
  const [tipoOcupacao, setTipoOcupacao] = useState<TipoOcupacao>('normal')
  const [resultado, setResultado] = useState<ResultadoSPDA | null>(null)
  const [erro, setErro] = useState('')
  const [mostrarNg, setMostrarNg] = useState(false)

  function calcular() {
    const L = parseFloat(comprimento)
    const W = parseFloat(largura)
    const H = parseFloat(altura)
    const ng = parseFloat(Ng)

    if (!L || !W || !H || !ng || L <= 0 || W <= 0 || H <= 0 || ng <= 0) {
      setErro('Preencha todas as dimensões e o Ng corretamente.')
      setResultado(null)
      return
    }

    setErro('')
    const res = calcularSPDA({ comprimento: L, largura: W, altura: H, fatorForma, Ng: ng, tipoUso, tipoConteudo, tipoOcupacao })
    setResultado(res)

    try {
      salvarCalculo(
        'spda',
        `${L}×${W}×${H}m — Ng=${ng} — ${tipoUso}`,
        { comprimento: L, largura: W, altura: H, fatorForma, Ng: ng, tipoUso, tipoConteudo, tipoOcupacao },
        res as unknown as object
      )
    } catch { /* não crítico */ }
  }

  function limpar() {
    setComprimento('10'); setLargura('10'); setAltura('8')
    setFatorForma('isolada'); setNg('6')
    setTipoUso('residencial'); setTipoConteudo('medioRisco'); setTipoOcupacao('normal')
    setResultado(null); setErro('')
  }

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={s.titulo}>SPDA — Para-Raios</Text>
      <Text style={s.subtitulo}>NBR 5419:2015 — Gerenciamento de riscos</Text>

      {/* Dimensões */}
      <View style={s.card}>
        <Text style={s.label}>Dimensões da Estrutura</Text>
        <View style={s.row3}>
          <View style={s.col}>
            <Text style={s.inputLabel}>Comprimento (m)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={comprimento} onChangeText={setComprimento} placeholder="m" />
          </View>
          <View style={s.col}>
            <Text style={s.inputLabel}>Largura (m)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={largura} onChangeText={setLargura} placeholder="m" />
          </View>
          <View style={s.col}>
            <Text style={s.inputLabel}>Altura (m)</Text>
            <TextInput style={s.input} keyboardType="decimal-pad" value={altura} onChangeText={setAltura} placeholder="m" />
          </View>
        </View>
      </View>

      {/* Posição da estrutura */}
      <View style={s.card}>
        <Text style={s.label}>Posição da Estrutura</Text>
        {FATORES_FORMA.map(f => (
          <TouchableOpacity
            key={f}
            style={[s.opcao, fatorForma === f && s.opcaoAtiva]}
            onPress={() => setFatorForma(f)}
          >
            <Text style={[s.opcaoTxt, fatorForma === f && s.opcaoTxtAtiva]}>
              {LABEL_FATOR_FORMA[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ng */}
      <View style={s.card}>
        <View style={s.rowBetween}>
          <Text style={s.label}>Densidade de Descargas (Ng)</Text>
          <TouchableOpacity onPress={() => setMostrarNg(!mostrarNg)}>
            <Text style={s.linkTxt}>{mostrarNg ? 'Ocultar tabela' : 'Ver por região'}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={s.input}
          keyboardType="decimal-pad"
          value={Ng}
          onChangeText={setNg}
          placeholder="descargas/km²/ano"
        />
        <Text style={s.hint}>Valores típicos: Sul=4 | Sudeste=6–10 | Centro-Oeste=14 | Norte=16–25</Text>
        {mostrarNg && NG_BRASIL.map(({ regiao, Ng: ng }) => (
          <TouchableOpacity
            key={regiao}
            style={s.ngRow}
            onPress={() => { setNg(String(ng)); setMostrarNg(false) }}
          >
            <Text style={s.ngRegiao}>{regiao}</Text>
            <Text style={s.ngValor}>Ng = {ng}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Uso */}
      <View style={s.card}>
        <Text style={s.label}>Tipo de Uso</Text>
        {TIPOS_USO.map(u => (
          <TouchableOpacity
            key={u}
            style={[s.opcao, tipoUso === u && s.opcaoAtiva]}
            onPress={() => setTipoUso(u)}
          >
            <Text style={[s.opcaoTxt, tipoUso === u && s.opcaoTxtAtiva]}>{LABEL_USO[u]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conteúdo e Ocupação */}
      <View style={s.card}>
        <Text style={s.label}>Conteúdo</Text>
        {TIPOS_CONTEUDO.map(c => (
          <TouchableOpacity
            key={c}
            style={[s.opcao, tipoConteudo === c && s.opcaoAtiva]}
            onPress={() => setTipoConteudo(c)}
          >
            <Text style={[s.opcaoTxt, tipoConteudo === c && s.opcaoTxtAtiva]}>{LABEL_CONTEUDO[c]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={s.card}>
        <Text style={s.label}>Nível de Ocupação</Text>
        {TIPOS_OCUPACAO.map(o => (
          <TouchableOpacity
            key={o}
            style={[s.opcao, tipoOcupacao === o && s.opcaoAtiva]}
            onPress={() => setTipoOcupacao(o)}
          >
            <Text style={[s.opcaoTxt, tipoOcupacao === o && s.opcaoTxtAtiva]}>{LABEL_OCUPACAO[o]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {erro ? <Text style={s.erro}>{erro}</Text> : null}

      <TouchableOpacity style={s.btnPrimario} onPress={calcular}>
        <Text style={s.btnPrimarioTxt}>Calcular SPDA</Text>
      </TouchableOpacity>
      <TouchableOpacity style={s.btnSecundario} onPress={limpar}>
        <Text style={s.btnSecundarioTxt}>Limpar</Text>
      </TouchableOpacity>

      {resultado && <Resultado r={resultado} />}
    </ScrollView>
  )
}

function Resultado({ r }: { r: ResultadoSPDA }) {
  const corNP = COR_NP[r.nivelProtecao]

  return (
    <View style={s.resultadoWrap}>
      {/* Status SPDA */}
      <View style={[s.statusCard, r.spda ? s.statusNok : s.statusOk]}>
        <Text style={[s.statusTxt, { color: r.spda ? COLORS.danger : COLORS.success }]}>
          {r.spda ? '⚡ SPDA NECESSÁRIO' : '✓ SPDA NÃO OBRIGATÓRIO'}
        </Text>
        <Text style={s.statusSub}>
          Nd/Nc = {r.relacaoNdNc.toFixed(3)} {r.spda ? '(Nd > Nc)' : '(Nd ≤ Nc)'}
        </Text>
      </View>

      {/* Nível de Proteção */}
      {r.spda && (
        <View style={[s.npCard, { borderColor: corNP, backgroundColor: corNP + '15' }]}>
          <Text style={[s.npLabel, { color: corNP }]}>Nível de Proteção</Text>
          <Text style={[s.npValor, { color: corNP }]}>NP {r.nivelProtecao}</Text>
          <Text style={s.npEficiencia}>Eficiência mínima: {(r.eficienciaMinima * 100).toFixed(1)}%</Text>
        </View>
      )}

      {/* Dados técnicos */}
      <View style={s.card}>
        <Row label="Nd (frequência esperada)" value={`${r.Nd.toExponential(3)} /ano`} />
        <Row label="Nc (frequência aceitável)" value={`${r.Nc.toExponential(3)} /ano`} />
        <Row label="Raio da esfera rolante" value={`${r.raioEsfera} m`} destaque />
        <Row label="Ângulo de proteção" value={`${r.anguloProtecao}°`} />
        <Row label="Nº mínimo de descidas" value={`${r.numeroMinDescidas}`} destaque />
        <Row label="Espaçamento entre descidas" value={`${r.espacamentoDescidas} m`} />
      </View>

      {/* DPS */}
      <View style={s.card}>
        <Text style={s.label}>Dispositivos de Proteção contra Surto (DPS)</Text>
        <DpsRow tipo="Tipo 1" desc="Captor / entrada de descidas" ativo={r.dpsTipo1} />
        <DpsRow tipo="Tipo 2" desc="Quadro de distribuição principal" ativo={r.dpsTipo2} />
        <DpsRow tipo="Tipo 3" desc="Equipamentos sensíveis / TI" ativo={r.dpsTipo3} />
      </View>

      {/* Observações */}
      {r.observacoes.length > 0 && (
        <View style={[s.card, r.spda ? s.avisoAmarelo : s.avisoVerde]}>
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

function DpsRow({ tipo, desc, ativo }: { tipo: string; desc: string; ativo: boolean }) {
  return (
    <View style={[s.dpsRow, ativo ? s.dpsAtivo : s.dpsInativo]}>
      <Text style={[s.dposTipo, { color: ativo ? COLORS.primary : COLORS.textMuted }]}>{tipo}</Text>
      <Text style={s.dpsDesc}>{desc}</Text>
      <Text style={{ color: ativo ? COLORS.success : COLORS.textLight, fontWeight: '700' }}>
        {ativo ? '✓' : '—'}
      </Text>
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
  inputLabel: { fontSize: FONTS.xs, color: COLORS.textMuted, marginBottom: 2 },
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
  hint: { fontSize: FONTS.xs, color: COLORS.textMuted },
  row3: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkTxt: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '600' },
  ngRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ngRegiao: { fontSize: FONTS.sm, color: COLORS.text, flex: 1 },
  ngValor: { fontSize: FONTS.sm, color: COLORS.primary, fontWeight: '700' },
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
    padding: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statusOk: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  statusNok: { backgroundColor: COLORS.dangerLight, borderColor: COLORS.danger },
  statusTxt: { fontSize: FONTS.xl, fontWeight: '800' },
  statusSub: { fontSize: FONTS.base, color: COLORS.textMuted, marginTop: 4 },
  npCard: {
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 2,
    alignItems: 'center',
    gap: 4,
  },
  npLabel: { fontSize: FONTS.base, fontWeight: '600' },
  npValor: { fontSize: 40, fontWeight: '900' },
  npEficiencia: { fontSize: FONTS.sm, color: COLORS.textMuted },
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
  dpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  dpsAtivo: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  dpsInativo: { borderColor: COLORS.border, backgroundColor: COLORS.bg },
  dposTipo: { fontSize: FONTS.sm, fontWeight: '700', width: 56 },
  dpsDesc: { fontSize: FONTS.xs, color: COLORS.textMuted, flex: 1 },
  avisoAmarelo: { backgroundColor: COLORS.warningLight, borderColor: COLORS.warning },
  avisoVerde: { backgroundColor: COLORS.successLight, borderColor: COLORS.success },
  avisoTxt: { fontSize: FONTS.sm, color: COLORS.text, lineHeight: 20 },
})
