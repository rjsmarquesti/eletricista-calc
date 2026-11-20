/**
 * NBR 5410:2004 — Instalações Elétricas de Baixa Tensão
 * Tabelas e cálculos conforme norma vigente.
 * AVISO: este app é orientativo — não substitui ART/CREA do responsável técnico.
 */

// ── Tabela 36 da NBR 5410 — Capacidade de condução de corrente (A) por seção e método de referência ──
// Cobre/alumínio, isolação PVC (70°C), temperatura ambiente 30°C, 3 condutores carregados
// (valores de 3 condutores também servem, a favor da segurança, para circuitos de 2 condutores).
// Métodos de referência (Tabela 33 da NBR 5410):
//   B1 = condutores isolados em eletroduto (aparente ou embutido em alvenaria)
//   B2 = cabo multipolar em eletroduto
//   C  = cabos sobre parede/teto ou embutidos diretamente em alvenaria

export interface LinhaCapacidade {
  secao: number    // mm²
  b1: number       // capacidade de condução, método B1 (A)
  b2: number       // capacidade de condução, método B2 (A)
  c: number        // capacidade de condução, método C (A)
}

export const TABELA_CAPACIDADE_COBRE: LinhaCapacidade[] = [
  { secao: 1.5,   b1: 15.5,  b2: 15,    c: 17.5 },
  { secao: 2.5,   b1: 21,    b2: 20,    c: 24 },
  { secao: 4,     b1: 28,    b2: 27,    c: 32 },
  { secao: 6,     b1: 36,    b2: 34,    c: 41 },
  { secao: 10,    b1: 50,    b2: 46,    c: 57 },
  { secao: 16,    b1: 68,    b2: 62,    c: 76 },
  { secao: 25,    b1: 89,    b2: 80,    c: 96 },
  { secao: 35,    b1: 110,   b2: 99,    c: 119 },
  { secao: 50,    b1: 134,   b2: 118,   c: 144 },
  { secao: 70,    b1: 171,   b2: 149,   c: 184 },
  { secao: 95,    b1: 207,   b2: 179,   c: 223 },
  { secao: 120,   b1: 239,   b2: 206,   c: 259 },
]

export const TABELA_CAPACIDADE_ALUMINIO: LinhaCapacidade[] = [
  { secao: 16,    b1: 53,    b2: 48,    c: 59 },
  { secao: 25,    b1: 70,    b2: 62,    c: 73 },
  { secao: 35,    b1: 86,    b2: 77,    c: 90 },
  { secao: 50,    b1: 104,   b2: 92,    c: 110 },
  { secao: 70,    b1: 133,   b2: 116,   c: 140 },
  { secao: 95,    b1: 161,   b2: 139,   c: 170 },
  { secao: 120,   b1: 186,   b2: 160,   c: 197 },
]

// ── Fatores de correção de temperatura (Tabela 40 da NBR 5410) ──
// Isolação PVC — referência 30°C

export const FATORES_TEMPERATURA: { temp: number; fator: number }[] = [
  { temp: 10, fator: 1.22 },
  { temp: 15, fator: 1.17 },
  { temp: 20, fator: 1.12 },
  { temp: 25, fator: 1.06 },
  { temp: 30, fator: 1.00 },
  { temp: 35, fator: 0.94 },
  { temp: 40, fator: 0.87 },
  { temp: 45, fator: 0.79 },
  { temp: 50, fator: 0.71 },
  { temp: 55, fator: 0.61 },
]

// ── Disjuntores padronizados (série preferencial IEC 60898) ──

export const DISJUNTORES_PADRAO = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125]

// ── Tipos de instalação ──

export type MetodoInstalacao = 'B1' | 'B2' | 'C'
export type MaterialConductor = 'cobre' | 'aluminio'

export interface EntradaBitola {
  potencia?: number        // W (alternativo à corrente)
  corrente?: number        // A (direto)
  tensao: 127 | 220
  comprimento: number      // m — só a distância de ida (quadro → carga); a fórmula já considera ida e volta
  metodo: MetodoInstalacao
  material: MaterialConductor
  temperatura?: number     // °C ambiente (padrão 30)
  fatorDemanda?: number    // 0–1 (padrão 1)
}

export interface ResultadoBitola {
  correnteCalc: number     // A calculada
  correnteCorrigida: number
  bitolaMinimaIdx: number  // índice na tabela
  bitolaRecomendada: number // mm²
  quedaTensao: number      // %
  quedaAlerta: boolean     // > 4% (NBR 5410 item 6.2.7)
  capacidadeNominal: number // A da bitola recomendada no método escolhido
  aviso?: string
}

export function calcularBitola(e: EntradaBitola): ResultadoBitola {
  const tabela = e.material === 'cobre' ? TABELA_CAPACIDADE_COBRE : TABELA_CAPACIDADE_ALUMINIO
  const metodoKey = e.metodo.toLowerCase() as 'b1' | 'b2' | 'c'

  // Corrente de projeto
  const corrente = e.corrente ?? (e.potencia! / e.tensao)
  const fatorDemanda = e.fatorDemanda ?? 1
  const correnteProj = corrente * fatorDemanda

  // Fator de temperatura
  const temp = e.temperatura ?? 30
  const fatorTemp = getFatorTemperatura(temp)
  const correnteCorrigida = correnteProj / fatorTemp

  // Encontrar menor seção que suporte a corrente corrigida
  const idx = tabela.findIndex(l => l[metodoKey] >= correnteCorrigida)
  const linha = idx >= 0 ? tabela[idx] : tabela[tabela.length - 1]
  const bitolaReal = idx >= 0 ? linha.secao : tabela[tabela.length - 1].secao

  // Queda de tensão: ΔU% = (2 × ρ × L × I) / (S × U) × 100
  // ρ cobre ≈ 0.0216 Ω·mm²/m (à temperatura de operação, 70 °C), alumínio ≈ 0.0280 Ω·mm²/m
  const rho = e.material === 'cobre' ? 0.0216 : 0.0280
  const quedaV = (2 * rho * e.comprimento * correnteProj) / bitolaReal
  const quedaPct = (quedaV / e.tensao) * 100

  return {
    correnteCalc: correnteProj,
    correnteCorrigida,
    bitolaMinimaIdx: Math.max(0, idx),
    bitolaRecomendada: bitolaReal,
    quedaTensao: +quedaPct.toFixed(2),
    quedaAlerta: quedaPct > 4,
    capacidadeNominal: linha[metodoKey],
    aviso: idx < 0
      ? `Corrente (${correnteCorrigida.toFixed(1)}A) excede a maior seção disponível (${tabela[tabela.length - 1].secao}mm²). Consulte projeto especializado.`
      : undefined,
  }
}

function getFatorTemperatura(temp: number): number {
  const sorted = [...FATORES_TEMPERATURA].sort((a, b) => Math.abs(a.temp - temp) - Math.abs(b.temp - temp))
  return sorted[0].fator
}

// ── Cálculo de disjuntor ──────────────────────────────────────────────────────

export type TipoCarga = 'resistiva' | 'indutiva' | 'motor'

export interface EntradaDisjuntor {
  potencia: number      // W
  tensao: 127 | 220
  tipoCarga: TipoCarga
  fatorPotencia?: number // cosφ — default por tipo
  ambientes?: string[]   // ambientes alimentados (para verificar DR)
}

export interface ResultadoDisjuntor {
  corrente: number       // A de projeto
  disjuntorIn: number    // In recomendado
  drObrigatorio: boolean
  motivoDR?: string
  fatorPotencia: number
}

const FATOR_POTENCIA_PADRAO: Record<TipoCarga, number> = {
  resistiva: 1.0,
  indutiva: 0.85,
  motor: 0.80,
}

// Ambientes onde DR é obrigatório (NBR 5410 item 5.1.3.2.2)
const AMBIENTES_DR = [
  'banheiro', 'lavabo', 'wc',
  'cozinha', 'copa',
  'área de serviço', 'area de servico', 'lavanderia',
  'garagem', 'quintal', 'jardim', 'externo', 'área externa', 'area externa',
  'piscina', 'spa', 'sauna',
  'churrasqueira',
]

export function calcularDisjuntor(e: EntradaDisjuntor): ResultadoDisjuntor {
  const fp = e.fatorPotencia ?? FATOR_POTENCIA_PADRAO[e.tipoCarga]
  const corrente = e.potencia / (e.tensao * fp)

  // Disjuntor padrão acima da corrente (com margem de 125% para motores)
  const margem = e.tipoCarga === 'motor' ? 1.25 : 1.0
  const corrMinDis = corrente * margem
  const disjuntorIn = DISJUNTORES_PADRAO.find(d => d >= corrMinDis) ?? DISJUNTORES_PADRAO[DISJUNTORES_PADRAO.length - 1]

  // Verificar necessidade de DR
  const ambLower = (e.ambientes ?? []).map(a => a.toLowerCase())
  const ambDR = ambLower.filter(a => AMBIENTES_DR.some(d => a.includes(d)))
  const drObrigatorio = ambDR.length > 0

  return {
    corrente: +corrente.toFixed(2),
    disjuntorIn,
    drObrigatorio,
    motivoDR: drObrigatorio
      ? `DR obrigatório por NBR 5410 item 5.1.3.2.2: ${ambDR.join(', ')}`
      : undefined,
    fatorPotencia: fp,
  }
}

// ── Circuitos mínimos por residência (NBR 5410 item 9.1) ──────────────────────

export type TipoAmbiente =
  | 'dormitorio' | 'sala' | 'cozinha' | 'banheiro' | 'area_servico'
  | 'garagem' | 'varanda' | 'escritorio' | 'corredor'

export interface AmbienteResidencial {
  tipo: TipoAmbiente
  area: number       // m²
  largura?: number   // m
  comprimento?: number
  cargas?: string[]  // 'chuveiro' | 'ar_cond' | 'forno' | 'lavadora' | 'freezer' | 'microondas'
}

export interface CircuitoSugerido {
  nome: string
  tipo: '15A' | '20A' | 'dedicado'
  descricao: string
  tomadas?: number
  ambientes?: string[]
}

export interface ResultadoCircuitos {
  circuitos: CircuitoSugerido[]
  totalCircuitos: number
  observacoes: string[]
}

export function calcularCircuitos(ambientes: AmbienteResidencial[]): ResultadoCircuitos {
  const circuitos: CircuitoSugerido[] = []
  const observacoes: string[] = []

  // Circuito de iluminação — separado das tomadas (item 9.1.1.1)
  circuitos.push({
    nome: 'Iluminação geral',
    tipo: '15A',
    descricao: 'Pontos de luz de todos os cômodos (exceto área de serviço). Disjuntor 10A, fio 1,5mm².',
    ambientes: ambientes.map(a => a.tipo),
  })

  // Tomadas de uso geral (TUG)
  const totalTomadas = ambientes.reduce((acc, a) => acc + calcularTomadasPorAmbiente(a), 0)
  const circTUG = Math.ceil(totalTomadas / 10) // máx 10 TUG por circuito (boa prática)
  for (let i = 0; i < circTUG; i++) {
    circuitos.push({
      nome: `Tomadas gerais — circuito ${i + 1}`,
      tipo: '15A' as const,
      descricao: `TUG 10A. Disjuntor 16A, fio 2,5mm².`,
      tomadas: Math.min(10, totalTomadas - i * 10),
    })
  }

  // Cargas especiais — sempre dedicadas (item 9.1.1.3)
  const todasCargas = ambientes.flatMap(a => a.cargas ?? [])

  if (todasCargas.includes('chuveiro')) {
    circuitos.push({
      nome: 'Chuveiro elétrico',
      tipo: 'dedicado',
      descricao: 'Circuito exclusivo. 220V, 40A, fio 6mm² (chuveiro até 7500W). Disjuntor 32A.',
    })
    observacoes.push('Chuveiro: verificar potência real — 5500W usa 4mm², acima de 7500W usa 10mm².')
  }

  if (todasCargas.includes('ar_cond')) {
    const qtd = todasCargas.filter(c => c === 'ar_cond').length
    for (let i = 0; i < qtd; i++) {
      circuitos.push({
        nome: `Ar-condicionado ${qtd > 1 ? i + 1 : ''}`.trim(),
        tipo: 'dedicado',
        descricao: 'Circuito exclusivo. 220V ou 127V conforme fabricante. Fio mínimo 2,5mm².',
      })
    }
  }

  if (todasCargas.includes('forno')) {
    circuitos.push({
      nome: 'Forno elétrico / micro-ondas',
      tipo: 'dedicado',
      descricao: 'Circuito exclusivo TUE 20A. Disjuntor 20A, fio 2,5mm².',
    })
  }

  if (todasCargas.includes('lavadora')) {
    circuitos.push({
      nome: 'Máquina de lavar / secar',
      tipo: 'dedicado',
      descricao: 'Circuito exclusivo TUE 20A. Disjuntor 20A, fio 2,5mm².',
    })
  }

  if (todasCargas.includes('freezer')) {
    circuitos.push({
      nome: 'Freezer / geladeira',
      tipo: 'dedicado',
      descricao: 'Circuito exclusivo TUE 20A. Disjuntor 20A, fio 2,5mm².',
    })
  }

  if (todasCargas.includes('microondas')) {
    circuitos.push({
      nome: 'Micro-ondas',
      tipo: 'dedicado',
      descricao: 'Circuito exclusivo TUE 20A. Disjuntor 20A, fio 2,5mm².',
    })
  }

  // Iluminação área de serviço separada (boa prática)
  const temAS = ambientes.some(a => a.tipo === 'area_servico')
  if (temAS) {
    circuitos.push({
      nome: 'Iluminação / tomadas — Área de Serviço',
      tipo: '15A',
      descricao: 'Circuito separado para área de serviço. DR obrigatório. Fio 2,5mm².',
    })
  }

  // DR obrigatório em áreas molhadas
  const areasMolhadas = ambientes.filter(a =>
    ['banheiro', 'cozinha', 'area_servico', 'garagem'].includes(a.tipo)
  )
  if (areasMolhadas.length > 0) {
    observacoes.push(
      `DR obrigatório (NBR 5410 item 5.1.3.2.2) nos circuitos: ${areasMolhadas.map(a => NOME_AMBIENTE[a.tipo]).join(', ')}.`
    )
  }

  observacoes.push('Todos os circuitos devem ter condutor de proteção (terra).')
  observacoes.push('Quadro de distribuição deve ter espaço reserva de 20% (boa prática).')

  return {
    circuitos,
    totalCircuitos: circuitos.length,
    observacoes,
  }
}

export function calcularTomadasPorAmbiente(a: AmbienteResidencial): number {
  if (a.area <= 6) return 1
  // 1 tomada + 1 a cada 3,5m de parede livre (simplificado: 1 por 6m² acima de 6m²)
  return 1 + Math.ceil((a.area - 6) / 6)
}

export const NOME_AMBIENTE: Record<TipoAmbiente, string> = {
  dormitorio: 'Dormitório',
  sala: 'Sala',
  cozinha: 'Cozinha',
  banheiro: 'Banheiro',
  area_servico: 'Área de Serviço',
  garagem: 'Garagem',
  varanda: 'Varanda',
  escritorio: 'Escritório',
  corredor: 'Corredor',
}
