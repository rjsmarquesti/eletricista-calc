import { useState, useCallback } from 'react'
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Alert,
} from 'react-native'
import { useFocusEffect } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import { getUltimosCalculos, deletarCalculo, Calculo } from '../../lib/db'

const TIPO_LABEL: Record<string, { label: string; icon: string; cor: string }> = {
  bitola:      { label: 'Bitola',      icon: 'flash',        cor: COLORS.primary },
  disjuntor:   { label: 'Disjuntor',   icon: 'shield',       cor: '#3B82F6' },
  tomadas:     { label: 'Tomadas',     icon: 'hardware-chip', cor: '#8B5CF6' },
  circuitos:   { label: 'Circuitos',   icon: 'git-network',  cor: '#06B6D4' },
  aterramento: { label: 'Aterramento', icon: 'earth',        cor: '#10B981' },
  spda:        { label: 'SPDA',        icon: 'thunderstorm', cor: '#EF4444' },
  motor:       { label: 'Motor',       icon: 'settings',     cor: '#F97316' },
  emergencia:  { label: 'Emergência',  icon: 'warning',      cor: '#EAB308' },
}

function formatarData(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function HistoricoScreen() {
  const insets = useSafeAreaInsets()
  const [calculos, setCalculos] = useState<Calculo[]>([])
  const [expandido, setExpandido] = useState<number | null>(null)

  useFocusEffect(useCallback(() => {
    setCalculos(getUltimosCalculos(60))
  }, []))

  function confirmarDeletar(id: number) {
    Alert.alert(
      'Excluir cálculo',
      'Deseja excluir este registro do histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir', style: 'destructive',
          onPress: () => {
            deletarCalculo(id)
            setCalculos(prev => prev.filter(c => c.id !== id))
          },
        },
      ]
    )
  }

  function renderResultado(json: string): string {
    try {
      const obj = JSON.parse(json)
      return Object.entries(obj)
        .filter(([, v]) => v !== null && v !== undefined && v !== '' && typeof v !== 'object' && !Array.isArray(v))
        .slice(0, 6)
        .map(([k, v]) => `${k}: ${v}`)
        .join('\n')
    } catch {
      return json
    }
  }

  const info = (tipo: string) => TIPO_LABEL[tipo] ?? { label: tipo, icon: 'document', cor: COLORS.primary }

  return (
    <View style={[s.container, { paddingTop: insets.top + 12 }]}>
      <Text style={s.title}>Histórico</Text>
      <Text style={s.subtitle}>Últimos {calculos.length} cálculos realizados</Text>

      {calculos.length === 0 ? (
        <View style={s.vazio}>
          <Ionicons name="time-outline" size={48} color={COLORS.textLight} />
          <Text style={s.vazioTxt}>Nenhum cálculo salvo ainda</Text>
          <Text style={s.vazioSub}>Os cálculos aparecem aqui automaticamente após serem realizados.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }}>
          {calculos.map(c => {
            const meta = info(c.tipo)
            const aberto = expandido === c.id
            return (
              <TouchableOpacity
                key={c.id}
                style={s.card}
                onPress={() => setExpandido(aberto ? null : c.id)}
                activeOpacity={0.8}
              >
                <View style={s.cardHeader}>
                  <View style={[s.iconBox, { backgroundColor: meta.cor + '20' }]}>
                    <Ionicons name={meta.icon as any} size={20} color={meta.cor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={s.cardTipo}>{meta.label}</Text>
                    {c.descricao ? <Text style={s.cardDesc} numberOfLines={1}>{c.descricao}</Text> : null}
                    <Text style={s.cardData}>{formatarData(c.criado_em)}</Text>
                  </View>
                  <View style={s.cardActions}>
                    <TouchableOpacity onPress={() => confirmarDeletar(c.id)} hitSlop={8}>
                      <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                    </TouchableOpacity>
                    <Ionicons
                      name={aberto ? 'chevron-up' : 'chevron-down'}
                      size={18} color={COLORS.textLight}
                      style={{ marginLeft: 12 }}
                    />
                  </View>
                </View>

                {aberto && (
                  <View style={s.detalhe}>
                    <Text style={s.detalheLabel}>Resultado</Text>
                    <Text style={s.detalheTxt}>{renderResultado(c.resultado)}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title:     { fontSize: FONTS.xl, fontWeight: '800', color: COLORS.text, paddingHorizontal: 16 },
  subtitle:  { fontSize: FONTS.sm, color: COLORS.textMuted, paddingHorizontal: 16, marginTop: 2, marginBottom: 12 },
  vazio:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  vazioTxt:  { fontSize: FONTS.md, fontWeight: '700', color: COLORS.textMuted, marginTop: 16, textAlign: 'center' },
  vazioSub:  { fontSize: FONTS.sm, color: COLORS.textLight, marginTop: 8, textAlign: 'center', lineHeight: 18 },
  card:      { backgroundColor: COLORS.card, borderRadius: RADIUS.md, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: COLORS.border },
  cardHeader:{ flexDirection: 'row', alignItems: 'center' },
  iconBox:   { width: 40, height: 40, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  cardTipo:  { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  cardDesc:  { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 1 },
  cardData:  { fontSize: FONTS.xs, color: COLORS.textLight, marginTop: 2 },
  cardActions: { flexDirection: 'row', alignItems: 'center' },
  detalhe:   { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: COLORS.border },
  detalheLabel: { fontSize: FONTS.xs, fontWeight: '700', color: COLORS.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  detalheTxt: { fontSize: FONTS.sm, color: COLORS.text, lineHeight: 20 },
})
