import { useState } from 'react'
import {
  View, Text, FlatList, ScrollView, StyleSheet,
  TouchableOpacity, useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../hooks/useAppTheme'
import { FONTS, RADIUS } from '../../constants/theme'
import { ESQUEMAS, Esquema } from '../../lib/esquemas'
import { EsquemaSVG } from '../../components/EsquemaSVG'
import { compartilharTexto } from '../../lib/share'

const DIFICULDADE_COLOR: Record<Esquema['dificuldade'], 'success' | 'warning' | 'danger'> = {
  'Básico': 'success',
  'Intermediário': 'warning',
  'Avançado': 'danger',
}

type TabId = 'esquema' | 'passos' | 'notas'

export default function EsquemasScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()
  const { width: screenW } = useWindowDimensions()
  const s = makeStyles(colors)

  const [selecionado, setSelecionado] = useState<Esquema | null>(null)
  const [tab, setTab] = useState<TabId>('esquema')

  function abrirEsquema(e: Esquema) {
    setSelecionado(e)
    setTab('esquema')
  }

  function fechar() {
    setSelecionado(null)
  }

  function compartilhar() {
    if (!selecionado) return
    compartilharTexto(
      `${selecionado.titulo} — Elétrica NBR`,
      [
        selecionado.descricao,
        '',
        'PASSO A PASSO:',
        ...selecionado.passos.map((p, i) => `${i + 1}. ${p}`),
        '',
        `Norma: ${selecionado.norma}`,
      ].join('\n')
    )
  }

  // ── Visualizador fullscreen ──
  if (selecionado) {
    const svgW = screenW - 32
    const difColor = DIFICULDADE_COLOR[selecionado.dificuldade]

    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        {/* Header do visualizador */}
        <View style={[s.detHeader, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={fechar} style={s.btnFechar} accessibilityLabel="Voltar">
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={s.detTitulo} numberOfLines={1}>{selecionado.titulo}</Text>
            <Text style={s.detSub} numberOfLines={1}>{selecionado.norma}</Text>
          </View>
          <TouchableOpacity onPress={compartilhar} style={s.btnCompartilhar} accessibilityLabel="Compartilhar">
            <Ionicons name="share-social-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={s.tabs}>
          {(['esquema', 'passos', 'notas'] as TabId[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[s.tab, tab === t && s.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === 'esquema' ? 'Esquema' : t === 'passos' ? 'Passo a passo' : 'Notas'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Conteúdo da tab */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}
          maximumZoomScale={tab === 'esquema' ? 4 : 1}
          minimumZoomScale={1}
          bouncesZoom
        >
          {tab === 'esquema' && (
            <View style={s.svgContainer}>
              <EsquemaSVG
                paths={selecionado.paths}
                viewBox={selecionado.viewBox}
                colors={colors}
                width={svgW}
              />
              <Text style={s.svgHint}>Aperte dois dedos para dar zoom</Text>
            </View>
          )}

          {tab === 'passos' && (
            <View>
              <View style={[s.difBadge, { backgroundColor: (colors as any)[`${difColor}Light`] }]}>
                <Text style={[s.difText, { color: (colors as any)[difColor] }]}>
                  {selecionado.dificuldade}
                </Text>
              </View>
              {selecionado.passos.map((passo, i) => (
                <View key={i} style={s.passoRow}>
                  <View style={s.passoNum}>
                    <Text style={s.passoNumText}>{i + 1}</Text>
                  </View>
                  <Text style={s.passoText}>{passo}</Text>
                </View>
              ))}
            </View>
          )}

          {tab === 'notas' && (
            <View>
              <Text style={s.notaDescricao}>{selecionado.descricao}</Text>
              <View style={s.normaBox}>
                <Ionicons name="book-outline" size={16} color={colors.primary} />
                <Text style={s.normaText}>Referência: {selecionado.norma}</Text>
              </View>
              <View style={s.aviso}>
                <Ionicons name="warning-outline" size={16} color={colors.warning} />
                <Text style={s.avisoText}>
                  Este esquema é orientativo. Sempre consulte um profissional habilitado
                  (eletricista credenciado) para execução de instalações elétricas.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    )
  }

  // ── Grid de listagem ──
  const cardW = (screenW - 48) / 2

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={[s.pageHeader, { paddingTop: insets.top + 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <Ionicons name="git-branch" size={22} color={colors.primary} accessible={false} />
          <Text style={s.pageTitle}>Esquemas de Ligação</Text>
        </View>
        <Text style={s.pageSub}>12 esquemas elétricos — toque para zoom e passo a passo</Text>
      </View>

      <FlatList
        data={ESQUEMAS}
        keyExtractor={item => item.key}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: insets.bottom + 40, paddingTop: 8 }}
        renderItem={({ item }) => {
          const difColor = DIFICULDADE_COLOR[item.dificuldade]
          return (
            <TouchableOpacity
              style={[s.card, { width: cardW }]}
              onPress={() => abrirEsquema(item)}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel={item.titulo}
            >
              <View style={s.cardSvg}>
                <EsquemaSVG
                  paths={item.paths}
                  viewBox={item.viewBox}
                  colors={colors}
                  width={cardW - 24}
                />
              </View>
              <View style={{ padding: 10 }}>
                <Text style={s.cardTitulo} numberOfLines={2}>{item.titulo}</Text>
                <View style={[s.difBadgeSmall, { backgroundColor: (colors as any)[`${difColor}Light`] }]}>
                  <Text style={[s.difTextSmall, { color: (colors as any)[difColor] }]}>
                    {item.dificuldade}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )
        }}
      />
    </View>
  )
}

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    pageHeader: { paddingHorizontal: 16, paddingBottom: 8 },
    pageTitle: { fontSize: FONTS['2xl'], fontWeight: '800', color: colors.text },
    pageSub: { fontSize: FONTS.sm, color: colors.textMuted, marginBottom: 4 },

    card: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    cardSvg: {
      backgroundColor: colors.bg,
      padding: 12,
      alignItems: 'center',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    cardTitulo: { fontSize: FONTS.sm, fontWeight: '700', color: colors.text, marginBottom: 6 },

    difBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.full, marginBottom: 8 },
    difText: { fontSize: FONTS.sm, fontWeight: '700' },
    difBadgeSmall: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.full },
    difTextSmall: { fontSize: FONTS.xs, fontWeight: '700' },

    // Visualizador
    detHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 16, paddingBottom: 12,
      backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    btnFechar: { padding: 4 },
    btnCompartilhar: { padding: 4 },
    detTitulo: { fontSize: FONTS.md, fontWeight: '800', color: colors.text },
    detSub: { fontSize: FONTS.xs, color: colors.textMuted },

    tabs: {
      flexDirection: 'row',
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
    tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary },
    tabText: { fontSize: FONTS.sm, color: colors.textMuted, fontWeight: '600' },
    tabTextActive: { color: colors.primary },

    svgContainer: {
      backgroundColor: colors.card,
      borderRadius: RADIUS.lg,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    svgHint: { fontSize: FONTS.xs, color: colors.textLight, marginTop: 8 },

    passoRow: { flexDirection: 'row', gap: 12, marginBottom: 14, alignItems: 'flex-start' },
    passoNum: {
      width: 26, height: 26, borderRadius: 13,
      backgroundColor: colors.primaryLight,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    passoNumText: { fontSize: FONTS.sm, fontWeight: '800', color: colors.primaryDark },
    passoText: { flex: 1, fontSize: FONTS.base, color: colors.text, lineHeight: 20 },

    notaDescricao: { fontSize: FONTS.base, color: colors.text, lineHeight: 22, marginBottom: 16 },
    normaBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: colors.primaryLight, borderRadius: RADIUS.md,
      padding: 12, marginBottom: 12,
    },
    normaText: { fontSize: FONTS.sm, color: colors.primaryDark, fontWeight: '600' },
    aviso: {
      flexDirection: 'row', gap: 8, alignItems: 'flex-start',
      backgroundColor: colors.warningLight, borderRadius: RADIUS.md,
      padding: 12, borderWidth: 1, borderColor: colors.warning,
    },
    avisoText: { flex: 1, fontSize: FONTS.sm, color: colors.warning, lineHeight: 18 },
  })
}
