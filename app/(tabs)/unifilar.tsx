import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../hooks/useAppTheme'
import { FONTS, RADIUS } from '../../constants/theme'
import { getConfig, getUnifilares, salvarUnifilar, deletarUnifilar, UnifilarSalvo } from '../../lib/db'
import {
  gerarUnifilar, criarUnifilarManual, DadosUnifilar, ConfigUnifilar, RamoUnifilar, IconeUnifilar,
  validarRamo, bitolaMinima, capacidadeBitola, BITOLAS_DISPONIVEIS,
  serializarUnifilar, desserializarUnifilar,
} from '../../lib/unifilar'
import { ResultadoCircuitos, DISJUNTORES_PADRAO } from '../../lib/nbr5410'
import { UnifilarSVG } from '../../components/UnifilarSVG'
import { exportarUnifilarPDF } from '../../lib/pdf'
import { compartilharTexto } from '../../lib/share'

type Tensao = DadosUnifilar['tensao']
const TENSOES: Tensao[] = ['127V', '220V', 'Bifásico 127/220V', 'Trifásico 220V']
const CORRENTES = [32, 40, 50, 63, 80, 100]

const RAMOS_PADRAO: RamoUnifilar[] = [
  { nome: 'Iluminação', amperagem: 15, bitola: '1,5mm²', isDR: false, icone: 'luz' },
  { nome: 'Tomadas Sala', amperagem: 20, bitola: '2,5mm²', isDR: false, icone: 'tomada' },
  { nome: 'Tomadas Quarto', amperagem: 20, bitola: '2,5mm²', isDR: false, icone: 'tomada' },
  { nome: 'Cozinha', amperagem: 20, bitola: '2,5mm²', isDR: false, icone: 'tomada' },
  { nome: 'Chuveiro', amperagem: 32, bitola: '6mm²', isDR: true, icone: 'aquecimento' },
  { nome: 'Área Serv.', amperagem: 20, bitola: '2,5mm²', isDR: true, icone: 'tomada' },
]

const ICONES: { key: IconeUnifilar; label: string }[] = [
  { key: 'tomada', label: 'Tomada' },
  { key: 'luz', label: 'Luz' },
  { key: 'aquecimento', label: 'Aquecimento' },
  { key: 'ar', label: 'Ar-cond.' },
  { key: 'motor', label: 'Motor' },
]

const RAMO_VAZIO: RamoUnifilar = { nome: '', amperagem: 20, bitola: '2,5mm²', isDR: false, icone: 'tomada' }

export default function UnifilarScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()
  const s = makeStyles(colors)

  const [nome, setNome] = useState('')
  const [tensao, setTensao] = useState<Tensao>('220V')
  const [iGeral, setIGeral] = useState(40)
  const [dados, setDados] = useState<DadosUnifilar | null>(null)
  const [ultimoCircuito, setUltimoCircuito] = useState<ResultadoCircuitos | null>(null)
  const [exportando, setExportando] = useState(false)
  const [edicao, setEdicao] = useState<{ indice: number | null; ramo: RamoUnifilar } | null>(null)
  const [salvoId, setSalvoId] = useState<number | null>(null)
  const [salvos, setSalvos] = useState<UnifilarSalvo[]>([])

  function recarregarSalvos() {
    try { setSalvos(getUnifilares()) } catch { /* lista vazia */ }
  }

  useFocusEffect(useCallback(() => {
    const raw = getConfig('ultimo_circuito')
    if (raw) {
      try { setUltimoCircuito(JSON.parse(raw)) } catch { /* ignorar */ }
    }
    recarregarSalvos()
  }, []))

  const config: ConfigUnifilar = { nomeProjeto: nome, tensao, iGeneral: iGeral }

  function gerarDeCicuitos() {
    if (!ultimoCircuito) return
    setDados(gerarUnifilar(ultimoCircuito, config))
    setSalvoId(null)
    setEdicao(null)
  }

  function gerarPadrao() {
    setDados(criarUnifilarManual(config, RAMOS_PADRAO))
    setSalvoId(null)
    setEdicao(null)
  }

  function comecarDoZero() {
    setDados(criarUnifilarManual(config, []))
    setSalvoId(null)
    setEdicao(null)
  }

  // Mudar nome/tensão/corrente geral preserva os circuitos já editados
  function mudarConfig(n: string, t: Tensao, g: number) {
    setNome(n); setTensao(t); setIGeral(g)
    if (dados) setDados(criarUnifilarManual({ nomeProjeto: n, tensao: t, iGeneral: g }, dados.ramos))
  }

  function trocarRamos(ramos: RamoUnifilar[]) {
    if (!dados) return
    setDados(criarUnifilarManual(
      { nomeProjeto: dados.nomeProjeto, tensao: dados.tensao, iGeneral: dados.iGeneral }, ramos,
    ))
  }

  function editarCampo(patch: Partial<RamoUnifilar>) {
    setEdicao(e => (e ? { ...e, ramo: { ...e.ramo, ...patch } } : e))
  }

  // Ao subir o disjuntor, a seção sobe junto se o cabo atual não aguenta (nunca deixa sair inseguro por padrão)
  function escolherDisjuntor(amp: number) {
    setEdicao(e => {
      if (!e) return e
      const cap = capacidadeBitola(e.ramo.bitola)
      const bitola = cap === null || cap < amp ? (bitolaMinima(amp) ?? e.ramo.bitola) : e.ramo.bitola
      return { ...e, ramo: { ...e.ramo, amperagem: amp, bitola } }
    })
  }

  function confirmarRamo() {
    if (!edicao || !dados) return
    const r = { ...edicao.ramo, nome: edicao.ramo.nome.trim() }
    if (!r.nome) { Alert.alert('Nome obrigatório', 'Informe o nome do circuito.'); return }
    const ramos = [...dados.ramos]
    if (edicao.indice === null) ramos.push(r)
    else ramos[edicao.indice] = r
    trocarRamos(ramos)
    setEdicao(null)
  }

  function removerRamo(indice: number) {
    if (!dados) return
    const r = dados.ramos[indice]
    Alert.alert('Remover circuito', `Remover "${r.nome}" do diagrama?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover', style: 'destructive',
        onPress: () => { trocarRamos(dados.ramos.filter((_, i) => i !== indice)); setEdicao(null) },
      },
    ])
  }

  function salvar() {
    if (!dados) return
    const titulo = dados.nomeProjeto.trim() || 'Sem nome'
    try {
      const id = salvarUnifilar(titulo, serializarUnifilar(dados), salvoId ?? undefined)
      setSalvoId(id)
      recarregarSalvos()
      Alert.alert('Salvo', `"${titulo}" foi salvo neste aparelho.`)
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o diagrama.')
    }
  }

  function abrirSalvo(item: UnifilarSalvo) {
    const d = desserializarUnifilar(item.dados)
    if (!d) {
      Alert.alert('Erro', 'Este diagrama salvo está corrompido e não pôde ser aberto.')
      return
    }
    setNome(d.nomeProjeto); setTensao(d.tensao); setIGeral(d.iGeneral)
    setDados(d)
    setSalvoId(item.id)
    setEdicao(null)
  }

  function excluirSalvo(item: UnifilarSalvo) {
    Alert.alert('Excluir diagrama', `Excluir "${item.nome}" definitivamente?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: () => {
          try { deletarUnifilar(item.id) } catch { /* já removido */ }
          if (salvoId === item.id) setSalvoId(null)
          recarregarSalvos()
        },
      },
    ])
  }

  async function exportarPDF() {
    if (!dados) return
    setExportando(true)
    try { await exportarUnifilarPDF(dados) } finally { setExportando(false) }
  }

  function compartilhar() {
    if (!dados) return
    const linhas = [
      `DIAGRAMA UNIFILAR — ${dados.nomeProjeto}`,
      `Tensão: ${dados.tensao} | Corrente geral: ${dados.iGeneral}A`,
      `Bitola principal: ${dados.bitolaPrincipal}`,
      '',
      'CIRCUITOS:',
      ...dados.ramos.map((r, i) =>
        `${i + 1}. ${r.nome} — ${r.amperagem}A — ${r.bitola}${r.isDR ? ' (DR)' : ''}`
      ),
    ]
    compartilharTexto('Diagrama Unifilar — Eletricomtec Pro', linhas.join('\n'))
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Ionicons name="analytics" size={22} color={colors.primary} accessible={false} />
        <Text style={s.pageTitle}>Diagrama Unifilar</Text>
      </View>
      <Text style={s.pageSub}>Esquema do quadro de distribuição — orientativo</Text>

      {/* ─── Configuração ─── */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Identificação</Text>

        <Text style={s.label}>Nome do projeto / obra</Text>
        <TextInput
          style={s.input}
          value={nome}
          onChangeText={v => mudarConfig(v, tensao, iGeral)}
          placeholder="Ex: Residência João Silva"
          placeholderTextColor={colors.textLight}
        />

        <Text style={[s.label, { marginTop: 14 }]}>Tensão da instalação</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TENSOES.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.chip, tensao === t && s.chipActive]}
              onPress={() => mudarConfig(nome, t, iGeral)}
            >
              <Text style={[s.chipText, tensao === t && s.chipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[s.label, { marginTop: 14 }]}>Corrente geral (A)</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CORRENTES.map(c => (
            <TouchableOpacity
              key={c}
              style={[s.chip, iGeral === c && s.chipActive]}
              onPress={() => mudarConfig(nome, tensao, c)}
            >
              <Text style={[s.chipText, iGeral === c && s.chipTextActive]}>{c}A</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* ─── Banner de cálculo recente ─── */}
      {ultimoCircuito && (
        <TouchableOpacity style={s.bannerCircuito} onPress={gerarDeCicuitos} activeOpacity={0.8}>
          <Ionicons name="git-network-outline" size={18} color={colors.primaryDark} />
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitulo}>Usar cálculo de circuitos recente</Text>
            <Text style={s.bannerSub}>{ultimoCircuito.totalCircuitos} circuitos calculados</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primaryDark} />
        </TouchableOpacity>
      )}

      {/* ─── Botões de geração ─── */}
      <TouchableOpacity style={s.btnPrimary} onPress={gerarPadrao} activeOpacity={0.8}>
        <Text style={s.btnPrimaryText}>Gerar diagrama padrão</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[s.btnSecondary, { marginBottom: 16, minHeight: 44 }]} onPress={comecarDoZero} activeOpacity={0.8}>
        <Ionicons name="add-circle-outline" size={16} color={colors.text} />
        <Text style={s.btnSecondaryText}>Começar do zero</Text>
      </TouchableOpacity>

      {/* ─── Diagramas salvos ─── */}
      <View style={s.card}>
        <Text style={s.sectionLabel}>Diagramas salvos ({salvos.length})</Text>
        {salvos.length === 0 ? (
          <Text style={s.vazio}>Nenhum diagrama salvo ainda. Monte um diagrama e toque em “Salvar”.</Text>
        ) : (
          salvos.map(item => (
            <View key={item.id} style={s.salvoRow}>
              <TouchableOpacity
                style={{ flex: 1, minHeight: 44, justifyContent: 'center' }}
                onPress={() => abrirSalvo(item)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir diagrama ${item.nome}`}
              >
                <Text style={s.ramoNome}>{item.nome}</Text>
                <Text style={s.ramoBitola}>{new Date(item.atualizado_em).toLocaleDateString('pt-BR')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.iconBtn}
                onPress={() => excluirSalvo(item)}
                accessibilityRole="button"
                accessibilityLabel={`Excluir diagrama ${item.nome}`}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* ─── Diagrama ─── */}
      {dados && (
        <>
          {dados.ramos.length > 0 && (
            <View style={s.diagramaContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator>
                <UnifilarSVG dados={dados} colors={colors} width={Math.max(360, dados.ramos.length * 72 + 40)} />
              </ScrollView>
            </View>
          )}

          {/* Tabela de circuitos */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Circuitos ({dados.ramos.length})</Text>
            {dados.ramos.length === 0 && (
              <Text style={s.vazio}>Nenhum circuito. Toque em “Adicionar circuito”.</Text>
            )}
            {dados.ramos.map((r, i) => {
              const avisos = validarRamo(r)
              return (
                <View key={i} style={[s.ramoBloco, i % 2 === 0 && { backgroundColor: colors.bg }]}>
                  <View style={s.ramoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.ramoNome}>{r.nome}</Text>
                      <Text style={s.ramoBitola}>{r.bitola}</Text>
                    </View>
                    <Text style={[s.ramoAmp, r.isDR && { color: colors.danger }]}>{r.amperagem}A</Text>
                    {r.isDR && (
                      <View style={s.drBadge}>
                        <Text style={s.drText}>DR</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={s.iconBtn}
                      onPress={() => setEdicao({ indice: i, ramo: { ...r } })}
                      accessibilityRole="button"
                      accessibilityLabel={`Editar circuito ${r.nome}`}
                    >
                      <Ionicons name="create-outline" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={s.iconBtn}
                      onPress={() => removerRamo(i)}
                      accessibilityRole="button"
                      accessibilityLabel={`Remover circuito ${r.nome}`}
                    >
                      <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                  {avisos.map((a, k) => (
                    <View key={k} style={s.avisoRow}>
                      <Ionicons name="warning-outline" size={14} color={colors.warning} />
                      <Text style={s.avisoText}>{a}</Text>
                    </View>
                  ))}
                </View>
              )
            })}
            <TouchableOpacity
              style={[s.btnSecondary, { marginTop: 10, minHeight: 44 }]}
              onPress={() => setEdicao({ indice: null, ramo: { ...RAMO_VAZIO } })}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color={colors.text} />
              <Text style={s.btnSecondaryText}>Adicionar circuito</Text>
            </TouchableOpacity>
          </View>

          {/* Formulário de circuito */}
          {edicao && (
            <View style={[s.card, { borderColor: colors.primary }]}>
              <Text style={s.sectionLabel}>{edicao.indice === null ? 'Novo circuito' : 'Editar circuito'}</Text>

              <Text style={s.label}>Nome</Text>
              <TextInput
                style={s.input}
                value={edicao.ramo.nome}
                onChangeText={v => editarCampo({ nome: v })}
                placeholder="Ex: Tomadas Cozinha"
                placeholderTextColor={colors.textLight}
              />

              <Text style={[s.label, { marginTop: 14 }]}>Disjuntor (A)</Text>
              <View style={s.chipsWrap}>
                {DISJUNTORES_PADRAO.map(a => (
                  <TouchableOpacity
                    key={a}
                    style={[s.chip, s.chipLg, edicao.ramo.amperagem === a && s.chipActive]}
                    onPress={() => escolherDisjuntor(a)}
                  >
                    <Text style={[s.chipText, edicao.ramo.amperagem === a && s.chipTextActive]}>{a}A</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.label, { marginTop: 14 }]}>Seção do condutor (cobre)</Text>
              <View style={s.chipsWrap}>
                {BITOLAS_DISPONIVEIS.map(b => (
                  <TouchableOpacity
                    key={b}
                    style={[s.chip, s.chipLg, edicao.ramo.bitola === b && s.chipActive]}
                    onPress={() => editarCampo({ bitola: b })}
                  >
                    <Text style={[s.chipText, edicao.ramo.bitola === b && s.chipTextActive]}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {validarRamo({ ...edicao.ramo, nome: edicao.ramo.nome || '-' }).map((a, k) => (
                <View key={k} style={s.avisoRow}>
                  <Ionicons name="warning-outline" size={14} color={colors.warning} />
                  <Text style={s.avisoText}>{a}</Text>
                </View>
              ))}

              <Text style={[s.label, { marginTop: 14 }]}>Tipo de carga</Text>
              <View style={s.chipsWrap}>
                {ICONES.map(ic => (
                  <TouchableOpacity
                    key={ic.key}
                    style={[s.chip, s.chipLg, edicao.ramo.icone === ic.key && s.chipActive]}
                    onPress={() => editarCampo({ icone: ic.key })}
                  >
                    <Text style={[s.chipText, edicao.ramo.icone === ic.key && s.chipTextActive]}>{ic.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[s.chip, s.chipLg, { alignSelf: 'flex-start', marginTop: 14 }, edicao.ramo.isDR && s.chipActive]}
                onPress={() => editarCampo({ isDR: !edicao.ramo.isDR })}
                accessibilityRole="switch"
                accessibilityState={{ checked: edicao.ramo.isDR }}
              >
                <Text style={[s.chipText, edicao.ramo.isDR && s.chipTextActive]}>
                  {edicao.ramo.isDR ? 'Com DR ≤ 30 mA' : 'Sem DR'}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[s.btnSecondary, { flex: 1, minHeight: 44 }]}
                  onPress={() => setEdicao(null)}
                  activeOpacity={0.8}
                >
                  <Text style={s.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.btnPrimary, { flex: 1, marginBottom: 0, paddingVertical: 12, minHeight: 44 }]}
                  onPress={confirmarRamo}
                  activeOpacity={0.8}
                >
                  <Text style={s.btnPrimaryText}>{edicao.indice === null ? 'Adicionar' : 'Aplicar'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Ações */}
          <TouchableOpacity
            style={[s.btnPrimary, { marginBottom: 10 }]}
            onPress={salvar}
            activeOpacity={0.8}
          >
            <Text style={s.btnPrimaryText}>{salvoId === null ? 'Salvar diagrama' : 'Atualizar diagrama salvo'}</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[s.btnSecondary, { flex: 1 }]}
              onPress={exportarPDF}
              disabled={exportando}
              activeOpacity={0.8}
            >
              <Ionicons name="document-outline" size={16} color={colors.text} />
              <Text style={s.btnSecondaryText}>{exportando ? 'Gerando…' : 'Exportar PDF'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.btnSecondary, { flex: 1 }]}
              onPress={compartilhar}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={16} color={colors.text} />
              <Text style={s.btnSecondaryText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.disclaimer}>
            Diagrama orientativo. Não substitui projeto elétrico assinado por profissional habilitado (CREA/ART).
          </Text>
        </>
      )}
    </ScrollView>
  )
}

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    pageTitle: { fontSize: FONTS['2xl'], fontWeight: '800', color: colors.text },
    pageSub: { fontSize: FONTS.sm, color: colors.textMuted, marginBottom: 20 },
    card: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: 16,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border,
    },
    sectionLabel: { fontSize: FONTS.base, fontWeight: '700', color: colors.text, marginBottom: 12 },
    label: { fontSize: FONTS.sm, fontWeight: '600', color: colors.text, marginBottom: 6 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: RADIUS.md,
      paddingHorizontal: 12, paddingVertical: 10, fontSize: FONTS.md,
      color: colors.text, backgroundColor: colors.bg,
    },
    chip: {
      paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.full,
      borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg,
    },
    chipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    chipText: { fontSize: FONTS.sm, fontWeight: '600', color: colors.textMuted },
    chipTextActive: { color: colors.primaryDark },

    bannerCircuito: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: colors.primaryLight, borderRadius: RADIUS.md,
      padding: 12, marginBottom: 12,
      borderWidth: 1, borderColor: colors.primary,
    },
    bannerTitulo: { fontSize: FONTS.sm, fontWeight: '700', color: colors.primaryDark },
    bannerSub: { fontSize: FONTS.xs, color: colors.primaryDark },

    btnPrimary: {
      backgroundColor: colors.primary, borderRadius: RADIUS.md,
      paddingVertical: 14, alignItems: 'center', marginBottom: 16,
    },
    btnPrimaryText: { color: '#fff', fontSize: FONTS.md, fontWeight: '700' },

    diagramaContainer: {
      backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: 12,
      marginBottom: 12, borderWidth: 1, borderColor: colors.border,
    },

    ramoBloco: { borderRadius: RADIUS.sm },
    ramoRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 4, paddingHorizontal: 6, borderRadius: RADIUS.sm,
    },
    salvoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    iconBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
    chipLg: { minHeight: 44, justifyContent: 'center' },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    avisoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, paddingHorizontal: 6, paddingBottom: 6, marginTop: 4 },
    avisoText: { flex: 1, fontSize: FONTS.xs, color: colors.warning },
    vazio: { fontSize: FONTS.sm, color: colors.textMuted },
    ramoNome: { fontSize: FONTS.sm, fontWeight: '600', color: colors.text },
    ramoBitola: { fontSize: FONTS.xs, color: colors.textMuted },
    ramoAmp: { fontSize: FONTS.sm, fontWeight: '700', color: colors.primary },
    drBadge: {
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.sm,
      backgroundColor: colors.dangerLight,
    },
    drText: { fontSize: FONTS.xs, fontWeight: '700', color: colors.danger },

    btnSecondary: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      padding: 12, borderRadius: RADIUS.md, borderWidth: 1,
      borderColor: colors.border, backgroundColor: colors.card,
    },
    btnSecondaryText: { fontSize: FONTS.sm, fontWeight: '700', color: colors.text },
    disclaimer: { fontSize: FONTS.xs, color: colors.textLight, textAlign: 'center', marginTop: 12 },
  })
}
