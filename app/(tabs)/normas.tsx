import { useState } from 'react'
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS, FONTS, RADIUS } from '../../constants/theme'
import { TABELA_CAPACIDADE_COBRE, DISJUNTORES_PADRAO, FATORES_TEMPERATURA } from '../../lib/nbr5410'
import { TABELA_NBR14136 } from '../../lib/nbr14136'

type Secao =
  | 'bitola'
  | 'disjuntores'
  | 'temperatura'
  | 'tomadas'
  | 'alturas'
  | 'circuitos_min'
  | 'aterramento_ref'
  | 'spda_ref'
  | 'motores_ref'
  | 'emergencia_ref'

const SECOES: { key: Secao; titulo: string; emoji: string }[] = [
  { key: 'bitola',          titulo: 'Tabela de Bitolas',          emoji: '🔌' },
  { key: 'disjuntores',     titulo: 'Disjuntores Padronizados',   emoji: '🛡️' },
  { key: 'temperatura',     titulo: 'Fatores de Temperatura',     emoji: '🌡️' },
  { key: 'tomadas',         titulo: 'Padrão NBR 14136',           emoji: '🔋' },
  { key: 'alturas',         titulo: 'Alturas de Tomadas',         emoji: '📏' },
  { key: 'circuitos_min',   titulo: 'Circuitos Mínimos',          emoji: '📋' },
  { key: 'aterramento_ref', titulo: 'Aterramento — Referência',   emoji: '🌍' },
  { key: 'spda_ref',        titulo: 'SPDA — Referência',          emoji: '⛈️' },
  { key: 'motores_ref',     titulo: 'Motores — Referência',       emoji: '⚙️' },
  { key: 'emergencia_ref',  titulo: 'Iluminação de Emergência',   emoji: '🔦' },
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
              {sec.key === 'aterramento_ref' && <AterramentoRef />}
              {sec.key === 'spda_ref' && <SPDARef />}
              {sec.key === 'motores_ref' && <MotoresRef />}
              {sec.key === 'emergencia_ref' && <EmergenciaRef />}
            </View>
          )}
        </View>
      ))}

      <View style={s.footerBox}>
        <Text style={s.footerText}>
          Referência: NBR 5410:2004 • NBR 14136:2012 • NBR 5419:2015 • NBR 10898:2013 • NBR IEC 60947.{'\n'}
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

const RESISTIVIDADE = [
  { solo: 'Pântano / Solo encharcado', rho: '30 Ω·m' },
  { solo: 'Argila úmida',              rho: '100 Ω·m' },
  { solo: 'Argila seca / Terra vegetal', rho: '200 Ω·m' },
  { solo: 'Areia',                     rho: '500 Ω·m' },
  { solo: 'Rocha solta / Cascalho',    rho: '1.500 Ω·m' },
  { solo: 'Rocha dura',                rho: '3.000 Ω·m' },
]

function AterramentoRef() {
  return (
    <View>
      <Text style={s.tabelaDesc}>Resistividade típica do solo (Ω·m) — NBR 5410 / literatura técnica</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, { flex: 2 }]}>Tipo de solo</Text>
        <Text style={[s.th, { flex: 1 }]}>ρ típico</Text>
      </View>
      {RESISTIVIDADE.map((r, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
          <Text style={[s.td, { flex: 2, textAlign: 'left' }]}>{r.solo}</Text>
          <Text style={[s.td, { flex: 1 }, s.tdBold]}>{r.rho}</Text>
        </View>
      ))}
      <Text style={s.legenda}>
        Resistência máx. admissível (NBR 5410):{'\n'}
        Residencial: 10Ω • Predial: 5Ω • Hospitalar: 1Ω{'\n'}
        Fórmula Dwight (haste vertical): R = ρ/2πL × (ln(4L/d) – 1)
      </Text>
    </View>
  )
}

const NIVEIS_SPDA = [
  { np: 'NP I',  esfera: '20 m', eficiencia: '98%', descidas: '10 m', corrente: '3 kA' },
  { np: 'NP II', esfera: '30 m', eficiencia: '95%', descidas: '10 m', corrente: '5 kA' },
  { np: 'NP III',esfera: '45 m', eficiencia: '90%', descidas: '15 m', corrente: '10 kA' },
  { np: 'NP IV', esfera: '60 m', eficiencia: '80%', descidas: '20 m', corrente: '16 kA' },
]

function SPDARef() {
  return (
    <View>
      <Text style={s.tabelaDesc}>NBR 5419:2015 — Parâmetros por nível de proteção</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, { flex: 0.8 }]}>NP</Text>
        <Text style={[s.th, { flex: 0.9 }]}>Esfera</Text>
        <Text style={[s.th, { flex: 0.9 }]}>Efic.</Text>
        <Text style={[s.th, { flex: 1 }]}>Descidas</Text>
      </View>
      {NIVEIS_SPDA.map((n, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
          <Text style={[s.td, { flex: 0.8 }, s.tdBold]}>{n.np}</Text>
          <Text style={[s.td, { flex: 0.9 }]}>{n.esfera}</Text>
          <Text style={[s.td, { flex: 0.9 }]}>{n.eficiencia}</Text>
          <Text style={[s.td, { flex: 1 }]}>{n.descidas}</Text>
        </View>
      ))}
      <Text style={s.legenda}>
        Ng Brasil: Sul=4 • Sudeste=6–10 • Centro-Oeste=14 • Norte=16–25 descargas/km²/ano{'\n'}
        DPS Tipo 1: junto ao captor • Tipo 2: QD principal • Tipo 3: equipamentos sensíveis
      </Text>
    </View>
  )
}

const FATORES_PARTIDA = [
  { partida: 'Direta',              fator: '7,0× In', quando: 'Motores até 7,5 kW' },
  { partida: 'Estrela-triângulo',   fator: '2,3× In', quando: 'Motores ≥ 7,5 kW' },
  { partida: 'Soft-starter',        fator: '3,0× In', quando: 'Qualquer potência' },
  { partida: 'Inversor (VFD)',      fator: '1,5× In', quando: 'Quando requer velocidade variável' },
  { partida: 'Autotransformador',   fator: '4,0× In', quando: 'Motores grandes' },
]

function MotoresRef() {
  return (
    <View>
      <Text style={s.tabelaDesc}>NBR IEC 60947 — Fatores de corrente de partida por tipo</Text>
      {FATORES_PARTIDA.map((p, i) => (
        <View key={i} style={[s.circMin, i % 2 === 0 && s.tableRowAlt]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={s.circMinItem}>{p.partida}</Text>
            <Text style={[s.circMinItem, { color: COLORS.primary }]}>{p.fator}</Text>
          </View>
          <Text style={s.circMinRegra}>{p.quando}</Text>
        </View>
      ))}
      <Text style={s.legenda}>
        Disjuntor curva D: 10× In (motores){'\n'}
        Contator AC-3: ≥ 1,25× In{'\n'}
        Relé térmico: faixa 0,9× In a 1,1× In{'\n'}
        In (3F) = P / (√3 × U × cosφ × η)
      </Text>
    </View>
  )
}

const EMERGENCIA_TAB = [
  { tipo: 'Residencial',          autonomia: '1h', m2: '500', obrig: 'Não' },
  { tipo: 'Comercial < 750m²',    autonomia: '1h', m2: '500', obrig: 'Sim' },
  { tipo: 'Comercial ≥ 750m²',    autonomia: '2h', m2: '500', obrig: 'Sim' },
  { tipo: 'Industrial',           autonomia: '2h', m2: '300', obrig: 'Sim' },
  { tipo: 'Hospitalar',           autonomia: '2h', m2: '200', obrig: 'Sim' },
  { tipo: 'Hoteleiro / Escolar',  autonomia: '1h', m2: '500', obrig: 'Sim' },
]

function EmergenciaRef() {
  return (
    <View>
      <Text style={s.tabelaDesc}>NBR 10898:2013 — Blocos autônomos por tipo de edificação</Text>
      <View style={s.tableHead}>
        <Text style={[s.th, { flex: 2 }]}>Tipo</Text>
        <Text style={[s.th, { flex: 0.8 }]}>Autono.</Text>
        <Text style={[s.th, { flex: 0.8 }]}>m²/bloco</Text>
      </View>
      {EMERGENCIA_TAB.map((e, i) => (
        <View key={i} style={[s.tableRow, i % 2 === 0 && s.tableRowAlt]}>
          <Text style={[s.td, { flex: 2, textAlign: 'left' }]}>{e.tipo}</Text>
          <Text style={[s.td, { flex: 0.8 }, s.tdBold]}>{e.autonomia}</Text>
          <Text style={[s.td, { flex: 0.8 }]}>{e.m2}</Text>
        </View>
      ))}
      <Text style={s.legenda}>
        Iluminância mín. rota de fuga: 1 lux{'\n'}
        Iluminância mín. área de risco: 5–10 lux{'\n'}
        Manutenção: teste de autonomia a cada 6 meses (NBR 10898 seção 6.4)
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
