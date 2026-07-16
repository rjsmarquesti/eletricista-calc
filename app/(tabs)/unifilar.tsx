import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../hooks/useAppTheme'
import { FONTS, RADIUS } from '../../constants/theme'
import { getConfig } from '../../lib/db'
import { gerarUnifilar, criarUnifilarManual, DadosUnifilar, ConfigUnifilar, RamoUnifilar } from '../../lib/unifilar'
import { ResultadoCircuitos } from '../../lib/nbr5410'
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
  { nome: 'Chuveiro', amperagem: 40, bitola: '6mm²', isDR: true, icone: 'aquecimento' },
  { nome: 'Área Serv.', amperagem: 20, bitola: '2,5mm²', isDR: true, icone: 'tomada' },
]

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

  useFocusEffect(useCallback(() => {
    const raw = getConfig('ultimo_circuito')
    if (raw) {
      try { setUltimoCircuito(JSON.parse(raw)) } catch { /* ignorar */ }
    }
  }, []))

  const config: ConfigUnifilar = { nomeProjeto: nome, tensao, iGeneral: iGeral }

  function gerarDeCicuitos() {
    if (!ultimoCircuito) return
    setDados(gerarUnifilar(ultimoCircuito, config))
  }

  function gerarPadrao() {
    setDados(criarUnifilarManual(config, RAMOS_PADRAO))
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
    compartilharTexto('Diagrama Unifilar — Elétrica NBR', linhas.join('\n'))
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
          onChangeText={v => { setNome(v); setDados(null) }}
          placeholder="Ex: Residência João Silva"
          placeholderTextColor={colors.textLight}
        />

        <Text style={[s.label, { marginTop: 14 }]}>Tensão da instalação</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {TENSOES.map(t => (
            <TouchableOpacity
              key={t}
              style={[s.chip, tensao === t && s.chipActive]}
              onPress={() => { setTensao(t); setDados(null) }}
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
              onPress={() => { setIGeral(c); setDados(null) }}
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

      {/* ─── Diagrama ─── */}
      {dados && (
        <>
          <View style={s.diagramaContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <UnifilarSVG dados={dados} colors={colors} width={Math.max(360, dados.ramos.length * 72 + 40)} />
            </ScrollView>
          </View>

          {/* Tabela de circuitos */}
          <View style={s.card}>
            <Text style={s.sectionLabel}>Circuitos ({dados.ramos.length})</Text>
            {dados.ramos.map((r, i) => (
              <View key={i} style={[s.ramoRow, i % 2 === 0 && { backgroundColor: colors.bg }]}>
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
              </View>
            ))}
          </View>

          {/* Ações */}
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

    ramoRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 8, paddingHorizontal: 6, borderRadius: RADIUS.sm,
    },
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
