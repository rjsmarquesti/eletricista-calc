import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../hooks/useAppTheme'
import { FONTS, RADIUS } from '../../constants/theme'
import { TABELA_CAPACIDADE_COBRE, DISJUNTORES_PADRAO } from '../../lib/nbr5410'
import { TABELA_AWG_MM2 } from '../../lib/conversor'

export default function WidgetScreen() {
  const insets = useSafeAreaInsets()
  const { colors, dark, toggleDark } = useAppTheme()
  const s = makeStyles(colors)

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        <Ionicons name="grid" size={22} color={colors.primary} accessible={false} />
        <Text style={s.pageTitle}>Referência Rápida</Text>
      </View>
      <Text style={s.pageSub}>Tabelas NBR 5410 — consulta em 1 toque</Text>

      {/* Modo escuro */}
      <View style={s.card}>
        <View style={s.switchRow}>
          <Ionicons name={dark ? 'moon' : 'sunny-outline'} size={18} color={colors.primary} />
          <Text style={s.switchLabel}>Modo escuro</Text>
          <Switch
            value={dark}
            onValueChange={toggleDark}
            trackColor={{ true: colors.primary }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Tabela bitolas × corrente (B1, cobre) */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Bitola × Corrente — Cobre, Método B1</Text>
        <Text style={s.cardSub}>NBR 5410 Tabela 36 — 30°C</Text>
        <View style={s.tableHeader}>
          <Text style={[s.th, { flex: 1 }]}>mm²</Text>
          <Text style={[s.th, { flex: 1, textAlign: 'center' }]}>Corrente (A)</Text>
          <Text style={[s.th, { flex: 1.5, textAlign: 'right' }]}>Equiv. AWG</Text>
        </View>
        {TABELA_AWG_MM2.filter(r => r.mm2 <= 35).map((r, i) => {
          const cap = TABELA_CAPACIDADE_COBRE.find(c => c.secao === r.mm2)
          return (
            <View key={r.mm2} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
              <Text style={[s.td, { flex: 1, fontWeight: '700' }]}>{r.mm2}</Text>
              <Text style={[s.td, { flex: 1, textAlign: 'center' }]}>{cap?.b1 ?? r.corrente}</Text>
              <Text style={[s.td, { flex: 1.5, textAlign: 'right', color: colors.textMuted }]}>{r.awg}</Text>
            </View>
          )
        })}
      </View>

      {/* Disjuntores padronizados */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Disjuntores Padronizados</Text>
        <Text style={s.cardSub}>NBR 5410 — valores comerciais</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {DISJUNTORES_PADRAO.map(d => (
            <View key={d} style={s.disjBadge}>
              <Text style={s.disjBadgeText}>{d} A</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Queda de tensão máxima */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Queda de Tensão — Limites NBR 5410</Text>
        {[
          { desc: 'Ramal de distribuição', limite: '4%' },
          { desc: 'Iluminação (total da instalação)', limite: '4%' },
          { desc: 'Outros usos (total da instalação)', limite: '7%' },
          { desc: 'Circuito terminal isolado', limite: '4%' },
        ].map((r, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
            <Text style={[s.td, { flex: 1 }]}>{r.desc}</Text>
            <Text style={[s.td, { fontWeight: '800', color: colors.primaryDark }]}>{r.limite}</Text>
          </View>
        ))}
      </View>

      {/* Circuitos mínimos NBR 5410 */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Circuitos Mínimos por Cômodo</Text>
        <Text style={s.cardSub}>NBR 5410 seção 9.1</Text>
        {[
          { comodo: 'Cozinha / Copa',       min: '2 circuitos (ilum. + tomadas)',   extra: '+ 1 p/ forno/microondas' },
          { comodo: 'Área de serviço',      min: '2 circuitos',                      extra: '+ 1 p/ lav./secadora' },
          { comodo: 'Banheiro',             min: '1 circuito tomada',                extra: 'tomada a ≥ 0.6m da borda' },
          { comodo: 'Dormitório',           min: '1 circuito ilum. + tomadas',       extra: '≥ 1 tomada/5m²' },
          { comodo: 'Sala de estar',        min: '1 circuito ilum. + tomadas',       extra: '≥ 1 tomada/5m²' },
          { comodo: 'Garagem',              min: '1 circuito',                       extra: 'tomada ≥ 20A p/ veículo elétrico' },
        ].map((r, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt, { flexDirection: 'column', alignItems: 'flex-start', paddingVertical: 8 }]}>
            <Text style={{ fontSize: FONTS.sm, fontWeight: '700', color: colors.text }}>{r.comodo}</Text>
            <Text style={{ fontSize: FONTS.xs, color: colors.textMuted, marginTop: 2 }}>{r.min}</Text>
            <Text style={{ fontSize: FONTS.xs, color: colors.textLight }}>{r.extra}</Text>
          </View>
        ))}
      </View>

      {/* Alturas de tomadas */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Alturas de Tomadas — NBR 14136</Text>
        {[
          { local: 'Cômodos em geral',        altura: '≥ 0.40m do piso' },
          { local: 'Bancada de cozinha',       altura: '0.90 a 1.20m' },
          { local: 'Banheiro',                 altura: '≥ 0.60m da borda da pia' },
          { local: 'Área externa',             altura: '≥ 1.00m + proteção IP44' },
          { local: 'Quartos (uso geral)',       altura: '0.30m (NBR permite ≥ 0.15m)' },
        ].map((r, i) => (
          <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
            <Text style={[s.td, { flex: 1 }]}>{r.local}</Text>
            <Text style={[s.td, { color: colors.primaryDark, fontWeight: '700' }]}>{r.altura}</Text>
          </View>
        ))}
      </View>

      <Text style={s.disclaimer}>
        Tabelas resumidas para consulta rápida. Sempre consulte a NBR completa para projetos.
      </Text>
    </ScrollView>
  )
}

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    pageTitle: { fontSize: FONTS['2xl'], fontWeight: '800', color: colors.text },
    pageSub: { fontSize: FONTS.sm, color: colors.textMuted, marginBottom: 20 },
    card: { backgroundColor: colors.card, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
    cardTitle: { fontSize: FONTS.base, fontWeight: '800', color: colors.text, marginBottom: 2 },
    cardSub: { fontSize: FONTS.xs, color: colors.textMuted, marginBottom: 8 },
    switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    switchLabel: { flex: 1, fontSize: FONTS.base, fontWeight: '600', color: colors.text },
    tableHeader: { flexDirection: 'row', paddingVertical: 6, borderBottomWidth: 2, borderBottomColor: colors.primary, marginBottom: 4 },
    th: { fontSize: FONTS.xs, fontWeight: '800', color: colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 },
    tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, paddingHorizontal: 4, borderRadius: RADIUS.sm },
    tableRowAlt: { backgroundColor: colors.bg },
    td: { fontSize: FONTS.sm, color: colors.text },
    disjBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
    disjBadgeText: { fontSize: FONTS.sm, fontWeight: '700', color: colors.primaryDark },
    disclaimer: { fontSize: FONTS.xs, color: colors.textLight, textAlign: 'center', marginTop: 8 },
  })
}
