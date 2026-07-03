import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { COLORS, FONTS, RADIUS } from '../constants/theme'
import { setConfig } from '../lib/db'

const { width } = Dimensions.get('window')

const PASSOS = [
  {
    icone: 'flash' as const,
    cor: '#F59E0B',
    titulo: 'Cálculos técnicos precisos',
    descricao: 'Bitola, disjuntor, aterramento, SPDA, motores e mais — tudo conforme as normas NBR, com resultados aprovados ou reprovados na hora.',
  },
  {
    icone: 'document-text' as const,
    cor: '#3B82F6',
    titulo: 'Gere relatórios profissionais',
    descricao: 'Exporte PDF com referência normativa, responsável técnico e número de documento. Compartilhe direto pelo WhatsApp ou e-mail.',
  },
  {
    icone: 'time' as const,
    cor: '#10B981',
    titulo: 'Histórico de cálculos',
    descricao: 'Todos os cálculos ficam salvos no aparelho. Acesse, revise e re-exporte a qualquer momento — sem internet.',
  },
]

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets()
  const [passo, setPasso] = useState(0)

  function avancar() {
    if (passo < PASSOS.length - 1) {
      setPasso(passo + 1)
    } else {
      concluir()
    }
  }

  function concluir() {
    setConfig('onboarding_done', '1')
    router.replace('/(tabs)/bitola')
  }

  const p = PASSOS[passo]

  return (
    <View style={[s.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      {/* Skip */}
      <TouchableOpacity style={s.skip} onPress={concluir}>
        <Text style={s.skipTxt}>Pular</Text>
      </TouchableOpacity>

      {/* Ícone central */}
      <View style={s.iconArea}>
        <View style={[s.iconCircle, { backgroundColor: p.cor + '20' }]}>
          <Ionicons name={p.icone} size={72} color={p.cor} />
        </View>
      </View>

      {/* Texto */}
      <View style={s.textArea}>
        <Text style={s.titulo}>{p.titulo}</Text>
        <Text style={s.descricao}>{p.descricao}</Text>
      </View>

      {/* Indicadores */}
      <View style={s.dots}>
        {PASSOS.map((_, i) => (
          <View key={i} style={[s.dot, i === passo && s.dotAtivo]} />
        ))}
      </View>

      {/* Botão */}
      <TouchableOpacity style={s.btn} onPress={avancar}>
        <Text style={s.btnTxt}>
          {passo < PASSOS.length - 1 ? 'Próximo' : 'Começar'}
        </Text>
        <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </View>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: COLORS.bg,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  skip: { alignSelf: 'flex-end', padding: 4 },
  skipTxt: { fontSize: FONTS.sm, color: COLORS.textMuted },
  iconArea: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  iconCircle: {
    width: 160, height: 160, borderRadius: 80,
    alignItems: 'center', justifyContent: 'center',
  },
  textArea: { width: '100%', alignItems: 'center', marginBottom: 32 },
  titulo: {
    fontSize: FONTS['2xl'], fontWeight: '800', color: COLORS.text,
    textAlign: 'center', marginBottom: 12,
  },
  descricao: {
    fontSize: FONTS.md, color: COLORS.textMuted,
    textAlign: 'center', lineHeight: 24,
  },
  dots: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotAtivo: { backgroundColor: COLORS.primary, width: 24 },
  btn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: FONTS.lg },
})
