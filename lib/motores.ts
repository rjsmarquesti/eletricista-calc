// Motores elétricos e comandos — NBR IEC 60947 + NBR 5410
// Referência: Weg, Siemens, Schneider — tabelas de seleção

export type TipoPartida =
  | 'direta'
  | 'estrelaTriangulo'
  | 'softStarter'
  | 'inversor'
  | 'autoTransformador'

export type NumeroFases = 1 | 3

export type MetodoInstalacao = 'B1' | 'B2' | 'C'

export interface EntradaMotor {
  potencia: number          // kW
  tensao: number            // V (220, 380, 440, 127)
  fases: NumeroFases
  fatorPotencia: number     // cos φ (0.1–1.0)
  rendimento: number        // η (0.1–1.0)
  tipoPartida: TipoPartida
  metodoInstalacao: MetodoInstalacao
}

export interface ResultadoMotor {
  correnteNominal: number     // A
  correntePartida: number     // A
  fatorPartida: number        // multiplicador de In
  disjuntorMotor: number      // A (curva D)
  contatora: number           // A (categoria AC-3)
  releTermico: { min: number; max: number } // faixa de ajuste (A)
  secaoCabo: number           // mm²
  observacoes: string[]
}

// Disjuntores padrão IEC (curva D — motores)
const DISJUNTORES_D = [1, 2, 3, 4, 6, 8, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250]

// Contatores padrão AC-3 (correntes nominais em A)
const CONTATORES_AC3 = [9, 12, 18, 25, 32, 40, 50, 65, 80, 95, 115, 150, 185, 225, 265, 330, 400]

// Seções de cabo mínimas para métodos B1/B2/C (tabela NBR 5410 simplificada para condutores de Cu)
// capacidade de corrente (A) por seção (mm²)
const TABELA_CABO: { secao: number; B1: number; B2: number; C: number }[] = [
  { secao: 1.5,  B1: 13,  B2: 13.5, C: 15.5 },
  { secao: 2.5,  B1: 17.5, B2: 18,  C: 21   },
  { secao: 4,    B1: 23,  B2: 24,   C: 28   },
  { secao: 6,    B1: 29,  B2: 31,   C: 36   },
  { secao: 10,   B1: 39,  B2: 42,   C: 50   },
  { secao: 16,   B1: 52,  B2: 56,   C: 66   },
  { secao: 25,   B1: 68,  B2: 73,   C: 84   },
  { secao: 35,   B1: 83,  B2: 89,   C: 104  },
  { secao: 50,   B1: 99,  B2: 108,  C: 125  },
  { secao: 70,   B1: 125, B2: 136,  C: 160  },
  { secao: 95,   B1: 150, B2: 164,  C: 194  },
  { secao: 120,  B1: 172, B2: 188,  C: 225  },
]

// Fatores de multiplicação de corrente de partida por In
const FATOR_PARTIDA: Record<TipoPartida, number> = {
  direta:             7.0,
  estrelaTriangulo:   2.3,  // 1/3 × 7
  softStarter:        3.0,
  inversor:           1.5,
  autoTransformador:  4.0,  // depende do tap (65% típico)
}

// Corrente nominal do motor
export function calcularCorrenteMotor(
  kW: number,
  tensao: number,
  fp: number,
  rendimento: number,
  fases: NumeroFases
): number {
  if (fases === 3) {
    return (kW * 1000) / (Math.sqrt(3) * tensao * fp * rendimento)
  }
  return (kW * 1000) / (tensao * fp * rendimento)
}

// Disjuntor curva D: fator 10× In, arredondado para o padrão IEC acima
export function selecionarDisjuntorMotor(In: number): number {
  const minimo = In * 10
  return DISJUNTORES_D.find(d => d >= minimo) ?? DISJUNTORES_D[DISJUNTORES_D.length - 1]
}

// Contator AC-3: mínimo 1.25× In
export function selecionarContator(In: number): number {
  const minimo = In * 1.25
  return CONTATORES_AC3.find(c => c >= minimo) ?? CONTATORES_AC3[CONTATORES_AC3.length - 1]
}

// Relé térmico: faixa 0.9×In a 1.1×In
export function faixaReleTermico(In: number): { min: number; max: number } {
  return { min: +(In * 0.9).toFixed(2), max: +(In * 1.1).toFixed(2) }
}

// Seção do cabo de alimentação do motor
export function secaoCaboMotor(In: number, metodo: MetodoInstalacao): number {
  const col = metodo as 'B1' | 'B2' | 'C'
  const linha = TABELA_CABO.find(r => r[col] >= In)
  return linha?.secao ?? 120
}

export function calcularMotor(e: EntradaMotor): ResultadoMotor {
  const In = calcularCorrenteMotor(e.potencia, e.tensao, e.fatorPotencia, e.rendimento, e.fases)
  const fatorP = FATOR_PARTIDA[e.tipoPartida]
  const Ip = In * fatorP
  const disjuntor = selecionarDisjuntorMotor(In)
  const contator = selecionarContator(In)
  const rele = faixaReleTermico(In)
  const secao = secaoCaboMotor(In, e.metodoInstalacao)
  const observacoes: string[] = []

  if (e.tipoPartida === 'estrelaTriangulo' && e.potencia < 7.5) {
    observacoes.push('Partida estrela-triângulo: recomendada para motores ≥ 7,5 kW. Para potências menores, considerar soft-starter.')
  }
  if (e.tipoPartida === 'direta' && e.potencia > 7.5) {
    observacoes.push('Partida direta em motor > 7,5 kW pode gerar queda de tensão excessiva. Verificar com a concessionária.')
  }
  if (e.fases === 1 && e.potencia > 2.5) {
    observacoes.push('Motor monofásico > 2,5 kW: verificar disponibilidade e viabilidade. Prefira trifásico acima dessa potência.')
  }
  if (e.tensao === 220 && e.fases === 3 && e.potencia > 15) {
    observacoes.push('Para motores > 15 kW em 220V trifásico, verificar bitola de alimentação — corrente elevada.')
  }
  observacoes.push(`Categoria do contator: AC-3 (motor gaiola de esquilo — partida e reversão em plena tensão).`)

  return {
    correnteNominal: +In.toFixed(2),
    correntePartida: +Ip.toFixed(2),
    fatorPartida: fatorP,
    disjuntorMotor: disjuntor,
    contatora: contator,
    releTermico: rele,
    secaoCabo: secao,
    observacoes,
  }
}

export const LABEL_PARTIDA: Record<TipoPartida, { titulo: string; quando: string }> = {
  direta: {
    titulo: 'Partida Direta',
    quando: 'Motores até 7,5 kW. Simples e barata, mas gera pico de corrente de até 7× In.',
  },
  estrelaTriangulo: {
    titulo: 'Estrela-Triângulo (Y-Δ)',
    quando: 'Motores ≥ 7,5 kW com carga leve na partida. Reduz pico para ~2,3× In. Motor deve ter 6 terminais.',
  },
  softStarter: {
    titulo: 'Soft-Starter',
    quando: 'Qualquer potência onde se deseja controle de aceleração e redução de pico (~3× In). Mais caro que Y-Δ.',
  },
  inversor: {
    titulo: 'Inversor de Frequência (VFD)',
    quando: 'Quando precisa de controle de velocidade. Mínimo pico de partida (~1,5× In). Proteção total do motor.',
  },
  autoTransformador: {
    titulo: 'Autotransformador',
    quando: 'Motores grandes onde Y-Δ não é viável. Reduz pico conforme o tap selecionado (65–80%).',
  },
}

export const LABEL_METODO: Record<MetodoInstalacao, string> = {
  B1: 'B1 — Embutido em conduto na parede',
  B2: 'B2 — Eletroduto na superfície',
  C:  'C — Cabo fixado diretamente na parede',
}
