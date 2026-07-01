export type TipoTerreno =
  | 'pantanoso'
  | 'argilaUmida'
  | 'argila'
  | 'areia'
  | 'rochaSolta'
  | 'rocha'

export type TipoAplicacao =
  | 'residencial'
  | 'predial'
  | 'hospitalar'
  | 'spda'
  | 'industrial'

export type TipoEletrodo = 'haste' | 'malha' | 'contrapeso'

export interface EntradaAterramento {
  tipoTerreno: TipoTerreno
  tipoAplicacao: TipoAplicacao
  tipoEletrodo: TipoEletrodo
  // haste
  comprimentoHaste: number  // metros
  diametroHaste: number     // mm (padrão 16mm)
  numeroHastes: number
  // fase (para dimensionar cabo terra)
  secaoFase: number         // mm²
}

export interface ResultadoAterramento {
  resistividadeSolo: number     // Ω·m
  resistenciaUmaHaste: number   // Ω
  resistenciaResultante: number // Ω (hastes em paralelo)
  limiteNorma: number           // Ω
  aprovado: boolean
  hastesNecessarias: number     // para atingir limite
  secaoCaboTerra: number        // mm²
  secaoEquipotencializacao: number // mm²
  observacoes: string[]
}

// NBR 5410 / literatura técnica — valores típicos de resistividade (Ω·m)
export const RESISTIVIDADE_SOLO: Record<TipoTerreno, number> = {
  pantanoso:   30,
  argilaUmida: 100,
  argila:      200,
  areia:       500,
  rochaSolta:  1500,
  rocha:       3000,
}

export const LABEL_TERRENO: Record<TipoTerreno, string> = {
  pantanoso:   'Pântano / Solo encharcado',
  argilaUmida: 'Argila úmida',
  argila:      'Argila seca / Terra vegetal',
  areia:       'Areia / Solo arenoso',
  rochaSolta:  'Rocha solta / Cascalho',
  rocha:       'Rocha dura',
}

// NBR 5410 seção 5.4 e NBR 5419 — resistências máximas admissíveis (Ω)
export const RESISTENCIA_MAXIMA: Record<TipoAplicacao, number> = {
  residencial: 10,
  predial:     5,
  hospitalar:  1,
  spda:        10,
  industrial:  5,
}

export const LABEL_APLICACAO: Record<TipoAplicacao, string> = {
  residencial: 'Residencial',
  predial:     'Predial / Comercial',
  hospitalar:  'Hospitalar / Área crítica',
  spda:        'SPDA (Para-raios)',
  industrial:  'Industrial',
}

// Fórmula de Dwight — resistência de uma haste vertical (Ω)
// ρ = resistividade (Ω·m), L = comprimento (m), d = diâmetro (m)
export function resistenciaHaste(rho: number, L: number, dMm: number): number {
  const d = dMm / 1000 // converte mm → m
  return (rho / (2 * Math.PI * L)) * (Math.log((4 * L) / d) - 1)
}

// Hastes em paralelo com fator de interferência (k≈0.8 para hastes bem espaçadas)
export function hastesParalelo(R1: number, n: number): number {
  if (n <= 1) return R1
  return (R1 / n) * 0.8
}

// Resistência de malha quadrada (aproximação — Schwarz)
// rho = resistividade (Ω·m), A = área da malha (m²)
export function resistenciaMalha(rho: number, A: number): number {
  return rho / (4 * Math.sqrt(A))
}

// NBR 5410 Tabela 54.1 — seção mínima do condutor de proteção (PE)
export function secaoAterramento(secaoFase: number): number {
  if (secaoFase <= 16) return secaoFase
  if (secaoFase <= 35) return 16
  return Math.ceil(secaoFase / 2)
}

// Condutor de equipotencialização — metade do PE, mínimo 6mm²
export function secaoEquipotencializacao(secaoFase: number): number {
  const pe = secaoAterramento(secaoFase)
  return Math.max(6, Math.ceil(pe / 2))
}

// Quantas hastes são necessárias para atingir o limite da norma
function hastesNecessarias(R1: number, limite: number): number {
  if (R1 <= limite) return 1
  // R_paralelo = R1 / n × 0.8 ≤ limite → n ≥ R1 × 0.8 / limite
  return Math.ceil((R1 * 0.8) / limite)
}

export function calcularAterramento(e: EntradaAterramento): ResultadoAterramento {
  const rho = RESISTIVIDADE_SOLO[e.tipoTerreno]
  const limite = RESISTENCIA_MAXIMA[e.tipoAplicacao]
  const observacoes: string[] = []

  const R1 = resistenciaHaste(rho, e.comprimentoHaste, e.diametroHaste)
  const Rresultante = hastesParalelo(R1, e.numeroHastes)
  const aprovado = Rresultante <= limite
  const hastesMin = hastesNecessarias(R1, limite)
  const secaoTerra = secaoAterramento(e.secaoFase)
  const secaoEquip = secaoEquipotencializacao(e.secaoFase)

  if (e.diametroHaste < 16) {
    observacoes.push('NBR 5410: diâmetro mínimo de haste é 16mm para aço galvanizado.')
  }
  if (e.comprimentoHaste < 2.4) {
    observacoes.push('NBR 5410: comprimento mínimo recomendado de haste é 2,4m.')
  }
  if (!aprovado) {
    observacoes.push(
      `Resistência de ${Rresultante.toFixed(1)}Ω excede o limite de ${limite}Ω. ` +
      `Adicionar mais ${hastesMin - e.numeroHastes} haste(s) ou usar malha de aterramento.`
    )
  }
  if (e.tipoTerreno === 'rocha' || e.tipoTerreno === 'rochaSolta') {
    observacoes.push(
      'Solo rochoso: considerar malha de aterramento superficial ou tratamento químico do solo.'
    )
  }

  return {
    resistividadeSolo: rho,
    resistenciaUmaHaste: R1,
    resistenciaResultante: Rresultante,
    limiteNorma: limite,
    aprovado,
    hastesNecessarias: hastesMin,
    secaoCaboTerra: secaoTerra,
    secaoEquipotencializacao: secaoEquip,
    observacoes,
  }
}
