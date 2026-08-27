import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FONTS, RADIUS } from '../../constants/theme'
import { useAppTheme } from '../../hooks/useAppTheme'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

type Modulo = {
  rota: string
  icone: IoniconName
  label: string
}

type Categoria = {
  titulo: string
  modulos: Modulo[]
}

const CATEGORIAS: Categoria[] = [
  {
    titulo: 'Instalações',
    modulos: [
      { rota: '/(tabs)/bitola',     icone: 'flash',        label: 'Bitola' },
      { rota: '/(tabs)/disjuntor',  icone: 'shield',       label: 'Disjuntor' },
      { rota: '/(tabs)/tomadas',    icone: 'hardware-chip', label: 'Tomadas' },
      { rota: '/(tabs)/circuitos',  icone: 'git-network',  label: 'Circuitos' },
      { rota: '/(tabs)/esquemas',   icone: 'git-branch',   label: 'Esquemas' },
      { rota: '/(tabs)/unifilar',   icone: 'analytics',    label: 'Unifilar' },
    ],
  },
  {
    titulo: 'Proteção',
    modulos: [
      { rota: '/(tabs)/aterramento', icone: 'earth',        label: 'Aterramento' },
      { rota: '/(tabs)/spda',        icone: 'thunderstorm', label: 'SPDA' },
      { rota: '/(tabs)/emergencia',  icone: 'warning',      label: 'Emergência' },
    ],
  },
  {
    titulo: 'Ferramentas',
    modulos: [
      { rota: '/(tabs)/motores',    icone: 'settings',        label: 'Motores' },
      { rota: '/(tabs)/orcamento',  icone: 'calculator',      label: 'Orçamento' },
      { rota: '/(tabs)/conversor',  icone: 'swap-horizontal', label: 'Conversor' },
      { rota: '/(tabs)/iluminacao', icone: 'sunny',           label: 'Iluminação' },
      { rota: '/(tabs)/widget',     icone: 'grid',            label: 'Referência' },
    ],
  },
]

export default function InicioScreen() {
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={[s.headerTitle, { color: colors.text }]}>Calculadoras</Text>
      <Text style={[s.headerSub, { color: colors.textMuted }]}>Selecione o módulo técnico</Text>

      {CATEGORIAS.map(categoria => (
        <View key={categoria.titulo} style={s.categoriaBox}>
          <Text style={[s.categoriaTitulo, { color: colors.textMuted }]}>{categoria.titulo}</Text>
          <View style={s.grid}>
            {categoria.modulos.map(modulo => (
              <TouchableOpacity
                key={modulo.rota}
                style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(modulo.rota as any)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${modulo.label}`}
                activeOpacity={0.7}
              >
                <View style={[s.iconBox, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={modulo.icone} size={22} color={colors.primary} />
                </View>
                <Text style={[s.cardLabel, { color: colors.text }]} numberOfLines={2}>
                  {modulo.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  )
}

const CARD_WIDTH = '31%'

const s = StyleSheet.create({
  container: { padding: 16, gap: 4 },
  headerTitle: { fontSize: FONTS['2xl'], fontWeight: '800' },
  headerSub: { fontSize: FONTS.sm, marginBottom: 8 },

  categoriaBox: { marginTop: 16, gap: 10 },
  categoriaTitulo: {
    fontSize: FONTS.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: '3.5%' as any, rowGap: 12 },
  card: {
    width: CARD_WIDTH,
    minHeight: 88,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontSize: FONTS.xs, fontWeight: '600', textAlign: 'center' },
})
