import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import { TABELA_CAPACIDADE_COBRE, DISJUNTORES_PADRAO, FATORES_TEMPERATURA } from '../../lib/nbr5410'
import { TABELA_NBR14136 } from '../../lib/nbr14136'

type Secao = 'bitola' | 'disjuntores' | 'temperatura' | 'tomadas' | 'alturas' | 'circuitos_min'

const SECOES: { key: Secao; titulo: string; emoji: string }[] = [
  { key: 'bitola',        titulo: 'Tabela de Bitolas',          emoji: '🔌' },
  { key: 'disjuntores',   titulo: 'Disjuntores Padronizados',   emoji: '🛡️' },
  { key: 'temperatura',   titulo: 'Fatores de Temperatura',     emoji: '🌡️' },
  { key: 'tomadas',       titulo: 'Padrão NBR 14136',           emoji: '🔋' },
  { key: 'alturas',       titulo: 'Alturas de Tomadas',         emoji: '📏' },
  { key: 'circuitos_min', titulo: 'Circuitos Mínimos',          emoji: '📋' },
]

export default function NormasScreen() {
  const insets = useSafeAreaInsets()
  const [secaoAberta, setSecaoAberta] = useState<Secao | null>('bitola')

  function toggle(key: Secao) {
    setSecaoAberta(prev => prev === key ? null : key)
  }

  return (
    <ScrollView
      style={s.bg}
      contentContainerStyle={[s.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
    >
      <Text style={s.pageTitle}>📖 Referência de Normas</Text>
      <Text style={s.pageSub}>Tabelas NBR 5410 e NBR 14136 — disponível offline</Text>

      {SECOES.map(sec => (
        <View key={sec.key} style={s.secaoCard}>
          <TouchableOpacity style={s.secaoHeader} onPress={() => toggle(sec.key)} activeOpacity={0.7}>
            <Text style={s.secaoEmoji}>{sec.emoji}</Text>
            <Text style={s.secaoTitulo}>{sec.titulo}</Text>
            <Text style={s.chevron}>{secaoAberta === sec.key ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {secaoAberta === sec.key && (
            <View style={s.secaoBody}>
              {sec.key === 'bitola' && <TabelaBitola />}
              {sec.key === 'disjuntores' && <TabelaDisjuntores />}
              {sec.key === 'temperatura' && <TabelaTemperatura />}
              {sec.key === 'tomadas' && <TabelaTomadas />}
              {sec.key === 'alturas' && <TabelaAlturas />}
              {sec.key === 'circuitos_min' && <TabelaCircuitosMin />}
            </View>
          )}
        </View>
      ))}

      <View style={s.footerBox}>
        <Text style={s.footerText}>
          Referência: ABNT NBR 5410:2004 e NBR 14136:2012.{'\n'}
          ⚠️ App orientativo — não substitui ART/CREA do responsável técnico.
        </Text>
      </View>
    </ScrollView>
  )
}

function TabelaBitola() {
  return (
    <View>
      <Text style={s.tabelaDesc}>Corrente admissível (A) — Cobre, PVC 70°C, 30°C ambiente</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, s.col1]}>Seção</Text>
        <Text style={[s.th, s.col2]}>B1</Text>
        <Text style={[s.th, s.col2]}>B2</Text>
        <Text style={[s.th, s.col2]}>C</Text>
      </View>
      {TABELA_CAPACIDADE_COBRE.map((l, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
          <Text style={[s.td, s.col1, s.tdBold]}>{l.secao} mm²</Text>
          <Text style={[s.td, s.col2]}>{l.b1} A</Text>
          <Text style={[s.td, s.col2]}>{l.b2} A</Text>
          <Text style={[s.td, s.col2]}>{l.c} A</Text>
        </View>
      ))}
      <Text style={s.legenda}>B1: Embutido em parede  B2: Eletroduto superfície  C: Fixado na parede</Text>
    </View>
  )
}

function TabelaDisjuntores() {
  return (
    <View>
      <Text style={s.tabelaDesc}>Correntes nominais padronizadas (IEC 60898)</Text>
      <View style={s.chipsRow}>
        {DISJUNTORES_PADRAO.map(d => (
          <View key={d} style={s.disjChip}>
            <Text style={s.disjChipText}>{d}A</Text>
          </View>
        ))}
      </View>
      <Text style={s.legenda}>
        Selecionar o disjuntor imediatamente acima da corrente de projeto.{'\n'}
        Motores elétricos: usar 125% da corrente nominal.
      </Text>
    </View>
  )
}

function TabelaTemperatura() {
  return (
    <View>
      <Text style={s.tabelaDesc}>Fator de correção de temperatura — Isolação PVC (referência 30°C)</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, { flex: 1 }]}>Temperatura</Text>
        <Text style={[s.th, { flex: 1 }]}>Fator</Text>
      </View>
      {FATORES_TEMPERATURA.map((f, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
          <Text style={[s.td, { flex: 1 }]}>{f.temp}°C</Text>
          <Text style={[s.td, { flex: 1 }, f.fator < 1 && s.tdAlerta]}>{f.fator.toFixed(2)}</Text>
        </View>
      ))}
      <Text style={s.legenda}>Corrente corrigida = Iproj ÷ Fator. Aplique quando a temperatura local diferir de 30°C.</Text>
    </View>
  )
}

function TabelaTomadas() {
  return (
    <View>
      {TABELA_NBR14136.map((t, i) => (
        <View key={i} style={[s.nbr14Card, i > 0 && { marginTop: 12 }]}>
          <Text style={s.nbr14Tipo}>{t.tipo}</Text>
          <View style={s.nbr14Row}>
            <Text style={s.nbr14Label}>Pinos</Text>
            <Text style={s.nbr14Val}>{t.pinos}</Text>
          </View>
          <View style={s.nbr14Row}>
            <Text style={s.nbr14Label}>Uso</Text>
            <Text style={[s.nbr14Val, { flex: 1 }]}>{t.uso}</Text>
          </View>
          <View style={s.nbr14Row}>
            <Text style={s.nbr14Label}>Corrente</Text>
            <Text style={[s.nbr14Val, { flex: 1 }]}>{t.corrente}</Text>
          </View>
        </View>
      ))}
    </View>
  )
}

const ALTURAS = [
  { ambiente: 'Uso geral',         altura: '0,40 m mínimo do piso' },
  { ambiente: 'Bancada de cozinha', altura: '1,00 m a 1,20 m' },
  { ambiente: 'Banheiro / lavabo', altura: '1,10 m (fora do volume de proteção)' },
  { ambiente: 'Área de serviço',   altura: '1,00 m a 1,20 m' },
  { ambiente: 'Garagem',           altura: '1,10 m (protegida de respingos)' },
  { ambiente: 'Cabeceira de cama', altura: '0,65 m a 1,00 m' },
  { ambiente: 'Externo / varanda', altura: '0,40 m (IP44 mínimo)' },
]

function TabelaAlturas() {
  return (
    <View>
      <Text style={s.tabelaDesc}>Alturas de referência para tomadas (NBR 5410 e normas ABNT)</Text>
      {ALTURAS.map((a, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
          <Text style={[s.td, { flex: 1.2 }, s.tdBold]}>{a.ambiente}</Text>
          <Text style={[s.td, { flex: 1.8 }]}>{a.altura}</Text>
        </View>
      ))}
      <Text style={s.legenda}>Medição a partir do piso acabado. Altura da tomada = centro da placa.</Text>
    </View>
  )
}

const CIRCUITOS_MIN = [
  { item: 'Iluminação', regra: 'Circuito separado das tomadas. Mínimo 1 circuito por pavimento.' },
  { item: 'TUG (tomadas gerais)', regra: 'Mínimo 1 circuito 15A por grupos de cômodos. Máx. 10 tomadas por circuito (boa prática).' },
  { item: 'Chuveiro elétrico', regra: 'Circuito dedicado 220V. Mínimo 4mm² (5500W) ou 6mm² (7500W).' },
  { item: 'Forno elétrico', regra: 'Circuito dedicado TUE 20A. Fio 2,5mm².' },
  { item: 'Ar-condicionado', regra: 'Circuito dedicado por unidade. Fio conforme potência.' },
  { item: 'Máquina de lavar', regra: 'Circuito dedicado TUE 20A. Fio 2,5mm².' },
  { item: 'Freezer / geladeira', regra: 'Circuito dedicado TUE 20A recomendado.' },
  { item: 'Área de serviço', regra: 'Iluminação + tomadas em circuito separado. DR obrigatório.' },
]

function TabelaCircuitosMin() {
  return (
    <View>
      <Text style={s.tabelaDesc}>NBR 5410 item 9.1 — Distribuição mínima de circuitos residenciais</Text>
      {CIRCUITOS_MIN.map((c, i) => (
        <View key={i} style={[s.circMin, i % 2 === 0 && s.tableRowAlt]}>
          <Text style={s.circMinItem}>{c.item}</Text>
          <Text style={s.circMinRegra}>{c.regra}</Text>
        </View>
      ))}
      <Text style={s.legenda}>
        DR 30mA obrigatório: banheiro, cozinha, área de serviço, garagem, área externa e piscina (item 6.3.6).
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: COLORS.bg },
  container: { padding: 16 },
  pageTitle: { fontSize: FONTS['2xl'], fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  pageSub: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 20 },
  secaoCard: { backgroundColor: COLORS.card, borderRadius: RADIUS.lg, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  secaoHeader: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 10 },
  secaoEmoji: { fontSize: 18 },
  secaoTitulo: { flex: 1, fontSize: FONTS.base, fontWeight: '700', color: COLORS.text },
  chevron: { fontSize: FONTS.sm, color: COLORS.textLight },
  secaoBody: { borderTopWidth: 1, borderTopColor: COLORS.border, padding: 14 },
  tabelaDesc: { fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: 12, lineHeight: 18 },
  tableHead: { flexDirection: 'row', backgroundColor: COLORS.primaryLight, paddingVertical: 8, paddingHorizontal: 4, borderRadius: RADIUS.sm, marginBottom: 2 },
  th: { fontSize: FONTS.xs, fontWeight: '700', color: COLORS.primaryDark, textAlign: 'center' },
  col1: { flex: 1.2 },
  col2: { flex: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 7, paddingHorizontal: 4 },
  tableRowAlt: { backgroundColor: '#F9FAFB' },
  td: { fontSize: FONTS.sm, color: COLORS.textMuted, textAlign: 'center' },
  tdBold: { fontWeight: '700', color: COLORS.text },
  tdAlerta: { color: COLORS.danger, fontWeight: '700' },
  legenda: { fontSize: FONTS.xs, color: COLORS.textLight, marginTop: 10, lineHeight: 16 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  disjChip: { backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md },
  disjChipText: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.primaryDark },
  nbr14Card: { backgroundColor: COLORS.bg, borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: COLORS.border },
  nbr14Tipo: { fontSize: FONTS.base, fontWeight: '700', color: COLORS.text, marginBottom: 8 },
  nbr14Row: { flexDirection: 'row', marginBottom: 4, gap: 8 },
  nbr14Label: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.textMuted, width: 60 },
  nbr14Val: { fontSize: FONTS.sm, color: COLORS.text },
  circMin: { paddingVertical: 10, paddingHorizontal: 4 },
  circMinItem: { fontSize: FONTS.sm, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  circMinRegra: { fontSize: FONTS.sm, color: COLORS.textMuted, lineHeight: 18 },
  footerBox: { backgroundColor: COLORS.warningLight, borderRadius: RADIUS.md, padding: 14, marginTop: 8, borderWidth: 1, borderColor: COLORS.warning },
  footerText: { fontSize: FONTS.xs, color: COLORS.warning, lineHeight: 18, textAlign: 'center' },
})
