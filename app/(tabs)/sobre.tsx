import { ScrollView, View, Text, Image, StyleSheet, TouchableOpacity, Linking } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Constants from 'expo-constants'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'

const APP_VERSION = Constants.expoConfig?.version ?? '1.0'

const MODULOS = [
  { icone: 'flash' as const,          label: 'Bitola de Cabos',            norma: 'NBR 5410' },
  { icone: 'shield' as const,         label: 'Disjuntor + DR',             norma: 'NBR 5410' },
  { icone: 'hardware-chip' as const,  label: 'Tomadas',                    norma: 'NBR 5410 + NBR 14136' },
  { icone: 'git-network' as const,    label: 'Planejador de Circuitos',    norma: 'NBR 5410' },
  { icone: 'earth' as const,          label: 'Aterramento',                norma: 'NBR 5410 seção 5.4' },
  { icone: 'thunderstorm' as const,   label: 'SPDA / Para-Raios',          norma: 'NBR 5419:2015' },
  { icone: 'settings' as const,       label: 'Motores Elétricos',          norma: 'NBR IEC 60947' },
  { icone: 'warning' as const,        label: 'Iluminação de Emergência',   norma: 'NBR 10898' },
  { icone: 'book' as const,           label: 'Normas Offline',             norma: 'Tabelas NBR completas' },
]

export default function SobreScreen() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.container, { paddingBottom: insets.bottom + 40 }]}
    >
      {/* Logo Eletricomtec */}
      <View style={s.heroBox}>
        <Image
          source={require('../../assets/logofinal.jpg')}
          style={s.logoFull}
          resizeMode="contain"
          accessibilityLabel="Logo Eletricomtec"
        />
        <View style={s.iconRow}>
          <Image
            source={require('../../assets/logo-icon.png')}
            style={s.iconImg}
            resizeMode="contain"
            accessibilityLabel="Ícone Elétrica NBR"
          />
          <View style={s.appInfo}>
            <Text style={s.appNome}>Elétrica NBR</Text>
            <View style={s.badgeRow}>
              <View style={s.badge}><Text style={s.badgeTxt}>PRO</Text></View>
              <Text style={s.version}>v{APP_VERSION}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Descrição */}
      <View style={s.card}>
        <Text style={s.cardTitle}>O app completo do eletricista profissional</Text>
        <Text style={s.cardDesc}>
          Cálculos técnicos baseados nas normas NBR, funcionando 100% offline.
          Gere laudos em PDF, compartilhe resultados pelo WhatsApp e mantenha
          histórico completo de todas as obras.
        </Text>
      </View>

      {/* Módulos */}
      <Text style={s.sectionTitle}>9 Módulos Técnicos</Text>
      {MODULOS.map((m, i) => (
        <View key={i} style={s.moduloRow} accessibilityRole="text">
          <View style={s.moduloIconBox}>
            <Ionicons name={m.icone} size={18} color={COLORS.primary} />
          </View>
          <View style={s.moduloInfo}>
            <Text style={s.moduloNome}>{m.label}</Text>
            <Text style={s.moduloNorma}>{m.norma}</Text>
          </View>
        </View>
      ))}

      {/* Diferenciais */}
      <Text style={s.sectionTitle}>Diferenciais</Text>
      <View style={s.card}>
        {[
          { icone: 'wifi-outline' as const,        txt: '100% offline — funciona sem internet' },
          { icone: 'document-text-outline' as const, txt: 'PDF profissional com carimbo técnico' },
          { icone: 'share-social-outline' as const,  txt: 'Compartilhar resultados via WhatsApp' },
          { icone: 'time-outline' as const,          txt: 'Histórico de cálculos salvo no celular' },
          { icone: 'lock-closed-outline' as const,   txt: 'Seus dados no seu aparelho — privacidade total' },
        ].map((item, i) => (
          <View key={i} style={s.difRow}>
            <Ionicons name={item.icone} size={18} color={COLORS.primary} />
            <Text style={s.difTxt}>{item.txt}</Text>
          </View>
        ))}
      </View>

      {/* Suporte */}
      <Text style={s.sectionTitle}>Suporte</Text>
      <View style={s.card}>
        <TouchableOpacity
          style={s.suporteBtn}
          onPress={() => Linking.openURL('https://wa.me/5561XXXXXXXXX?text=Suporte%20Elétrica%20NBR')}
          accessibilityRole="button"
          accessibilityLabel="Abrir WhatsApp para suporte"
        >
          <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
          <Text style={s.suporteTxt}>Suporte via WhatsApp</Text>
          <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Rodapé */}
      <View style={s.footer}>
        <Text style={s.footerTxt}>Desenvolvido por Eletricomtec</Text>
        <Text style={s.footerSub}>
          Os resultados são orientativos e não substituem{'\n'}ART/CREA do responsável técnico.
        </Text>
      </View>
    </ScrollView>
  )
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16, gap: 12 },

  heroBox: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  logoFull: { width: '100%', height: 80 },
  iconRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconImg: { width: 56, height: 56, borderRadius: RADIUS.md },
  appInfo: { flex: 1 },
  appNome: { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.text },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  badge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeTxt: { fontSize: FONTS.xs, fontWeight: '700', color: COLORS.primaryDark },
  version: { fontSize: FONTS.xs, color: COLORS.textLight },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    gap: 10,
  },
  cardTitle: { fontSize: FONTS.md, fontWeight: '700', color: COLORS.text },
  cardDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 20 },

  sectionTitle: {
    fontSize: FONTS.base,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },

  moduloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.card,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
  },
  moduloIconBox: {
    width: 34, height: 34,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moduloInfo: { flex: 1 },
  moduloNome: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.text },
  moduloNorma: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 1 },

  difRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  difTxt: { flex: 1, fontSize: FONTS.sm, color: COLORS.text },

  suporteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
    minHeight: 44,
  },
  suporteTxt: { flex: 1, fontSize: FONTS.base, color: COLORS.text, fontWeight: '600' },

  footer: { alignItems: 'center', marginTop: 8, gap: 6 },
  footerTxt: { fontSize: FONTS.sm, fontWeight: '600', color: COLORS.textMuted },
  footerSub: { fontSize: FONTS.xs, color: COLORS.textLight, textAlign: 'center', lineHeight: 16 },
})
