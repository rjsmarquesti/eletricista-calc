// NBR 5419:2015 — Sistema de Proteção contra Descargas Atmosféricas (SPDA)
// Partes 1 (Princípios gerais), 2 (Gerenciamento de riscos), 3 (Danos físicos), 4 (Sistemas elétricos)

export type NivelProtecao = 'I' | 'II' | 'III' | 'IV'

export type FatorForma =
  | 'isolada'        // estrutura isolada no campo aberto
  | 'proximo'        // próxima a estruturas similares
  | 'entre'          // entre estruturas mais altas

export type TipoUso =
  | 'residencial'
  | 'comercial'
  | 'industrial'
  | 'hospitalar'
  | 'cultural'       // museus, patrimônio
  | 'explosivos'     // áreas com risco de explosão

export type TipoConteudo =
  | 'baixoRisco'     // móveis, objetos comuns
  | 'medioRisco'     // eletrônicos, equipamentos
  | 'altoRisco'      // inflamáveis, explosivos

export type TipoOcupacao =
  | 'reduzida'       // raramente ocupada
  | 'normal'         // ocupação normal
  | 'elevada'        // sempre ocupada / evacuação difícil

export interface EntradaSPDA {
  comprimento: number        // m (dimensão maior da estrutura)
  largura: number            // m
  altura: number             // m
  fatorForma: FatorForma
  Ng: number                 // densidade de descargas ao solo (descargas/km²/ano)
  tipoUso: TipoUso
  tipoConteudo: TipoConteudo
  tipoOcupacao: TipoOcupacao
}

export interface ResultadoSPDA {
  Nd: number                 // frequência esperada de descargas na estrutura (/ano)
  Nc: number                 // frequência aceitável de danos (/ano)
  relacaoNdNc: number        // Nd/Nc — se >1: SPDA obrigatório
  nivelProtecao: NivelProtecao
  eficienciaMinima: number   // % (E = 1 - Nc/Nd)
  raioEsfera: number         // m (método da esfera rolante)
  anguloProtecao: number     // graus (método do cone)
  numeroMinDescidas: number
  espacamentoDescidas: number // m
  dpsTipo1: boolean          // DPS tipo 1 obrigatório (junto ao captor/descida)
  dpsTipo2: boolean          // DPS tipo 2 (quadro principal)
  dpsTipo3: boolean          // DPS tipo 3 (equipamentos sensíveis)
  spda: boolean              // SPDA é necessário?
  observacoes: string[]
}

// NBR 5419 Tabela 1 — parâmetros por nível de proteção
export const TABELA_NIVEIS: Record<NivelProtecao, {
  raioEsfera: number       // m
  anguloProtecao: number   // graus (para estruturas até 20m)
  eficiencia: number       // % mínima de eficiência
  correnteMinima: number   // kA (corrente de pico mínima interceptada)
  espacamentoDescidas: number // m
}> = {
  I:   { raioEsfera: 20, anguloProtecao: 25, eficiencia: 0.98, correnteMinima: 3,   espacamentoDescidas: 10 },
  II:  { raioEsfera: 30, anguloProtecao: 35, eficiencia: 0.95, correnteMinima: 5,   espacamentoDescidas: 10 },
  III: { raioEsfera: 45, anguloProtecao: 45, eficiencia: 0.90, correnteMinima: 10,  espacamentoDescidas: 15 },
  IV:  { raioEsfera: 60, anguloProtecao: 55, eficiencia: 0.80, correnteMinima: 16,  espacamentoDescidas: 20 },
}

// Fator de forma (Cd) — NBR 5419 Tabela B.1
const FATOR_FORMA: Record<FatorForma, number> = {
  isolada:  2.0,
  proximo:  1.0,
  entre:    0.5,
}

// Fator de consequência por uso (C2) — NBR 5419 Tabela C.1
const FATOR_USO: Record<TipoUso, number> = {
  residencial: 1.0,
  comercial:   2.0,
  industrial:  2.0,
  hospitalar:  5.0,
  cultural:    5.0,
  explosivos:  1000.0,
}

// Fator de conteúdo (C3) — NBR 5419 Tabela C.2
const FATOR_CONTEUDO: Record<TipoConteudo, number> = {
  baixoRisco: 1.0,
  medioRisco: 2.0,
  altoRisco:  5.0,
}

// Fator de ocupação (C4) — NBR 5419 Tabela C.3
const FATOR_OCUPACAO: Record<TipoOcupacao, number> = {
  reduzida: 0.5,
  normal:   1.0,
  elevada:  2.0,
}

// NBR 5419 eq. (B.1) — área de captação equivalente (m²)
// Considera a sombra da estrutura + zona de atração lateral
function areaCaptura(L: number, W: number, H: number): number {
  return L * W + 2 * (L + W) * H + Math.PI * H * H
}

// Nd = Ng × Ae × Cd × 10⁻⁶ (descargas/ano)
export function calcularNd(L: number, W: number, H: number, Ng: number, fatorForma: FatorForma): number {
  const Ae = areaCaptura(L, W, H)
  const Cd = FATOR_FORMA[fatorForma]
  return Ng * Ae * Cd * 1e-6
}

// Nc = 5.5 × 10⁻³ / (C2 × C3 × C4) — frequência aceitável
export function calcularNc(
  tipoUso: TipoUso,
  tipoConteudo: TipoConteudo,
  tipoOcupacao: TipoOcupacao
): number {
  const C2 = FATOR_USO[tipoUso]
  const C3 = FATOR_CONTEUDO[tipoConteudo]
  const C4 = FATOR_OCUPACAO[tipoOcupacao]
  return 5.5e-3 / (C2 * C3 * C4)
}

// Determina NP mínimo pela eficiência necessária: E = 1 - Nc/Nd
function nivelPorEficiencia(E: number): NivelProtecao {
  if (E >= 0.98) return 'I'
  if (E >= 0.95) return 'II'
  if (E >= 0.90) return 'III'
  return 'IV'
}

// Número mínimo de descidas pelo perímetro e espaçamento do NP
function numDescidas(perimetro: number, espacamento: number): number {
  return Math.max(2, Math.ceil(perimetro / espacamento))
}

export function calcularSPDA(e: EntradaSPDA): ResultadoSPDA {
  const Nd = calcularNd(e.comprimento, e.largura, e.altura, e.Ng, e.fatorForma)
  const Nc = calcularNc(e.tipoUso, e.tipoConteudo, e.tipoOcupacao)
  const relacao = Nd / Nc
  const spda = relacao > 1
  const observacoes: string[] = []

  let np: NivelProtecao = 'IV'
  let eficiencia = 0

  if (spda) {
    eficiencia = 1 - Nc / Nd
    np = nivelPorEficiencia(eficiencia)
  }

  const params = TABELA_NIVEIS[np]
  const perimetro = 2 * (e.comprimento + e.largura)
  const descidas = numDescidas(perimetro, params.espacamentoDescidas)

  if (!spda) {
    observacoes.push('SPDA não é obrigatório pela NBR 5419 para este caso. Recomendado para estruturas com Ng > 1 ou conteúdo de alto risco.')
  } else {
    observacoes.push(`SPDA obrigatório — Nd/Nc = ${relacao.toFixed(2)} (Nd > Nc).`)
    observacoes.push(`Eficiência mínima requerida: ${(eficiencia * 100).toFixed(1)}% → Nível de Proteção ${np}.`)
  }

  if (e.tipoUso === 'explosivos') {
    observacoes.push('⚠️ Área com risco de explosão: SPDA NP I obrigatório independente do cálculo. Consultar NBR IEC 60079.')
    np = 'I'
  }
  if (e.altura > 60) {
    observacoes.push('Estrutura alta (>60m): proteção lateral adicional necessária nas faces externas acima de 60m (NBR 5419-3 seção 5.2.5).')
  }
  if (e.Ng > 10) {
    observacoes.push('Alta densidade de descargas (Ng>10): revisar necessidade de blindagem adicional.')
  }

  return {
    Nd,
    Nc,
    relacaoNdNc: relacao,
    nivelProtecao: np,
    eficienciaMinima: eficiencia,
    raioEsfera: params.raioEsfera,
    anguloProtecao: params.anguloProtecao,
    numeroMinDescidas: descidas,
    espacamentoDescidas: params.espacamentoDescidas,
    dpsTipo1: spda,
    dpsTipo2: true,           // sempre recomendado no QD principal
    dpsTipo3: e.tipoConteudo !== 'baixoRisco',
    spda,
    observacoes,
  }
}

// Labels para UI
export const LABEL_FATOR_FORMA: Record<FatorForma, string> = {
  isolada:  'Isolada (campo aberto)',
  proximo:  'Próxima a estruturas similares',
  entre:    'Entre estruturas mais altas',
}

export const LABEL_USO: Record<TipoUso, string> = {
  residencial: 'Residencial',
  comercial:   'Comercial / Escritório',
  industrial:  'Industrial',
  hospitalar:  'Hospitalar / Escola',
  cultural:    'Cultural / Patrimônio',
  explosivos:  'Área com risco de explosão',
}

export const LABEL_CONTEUDO: Record<TipoConteudo, string> = {
  baixoRisco: 'Baixo risco (móveis, objetos comuns)',
  medioRisco: 'Médio risco (eletrônicos, equipamentos)',
  altoRisco:  'Alto risco (inflamáveis, explosivos)',
}

export const LABEL_OCUPACAO: Record<TipoOcupacao, string> = {
  reduzida: 'Reduzida (raramente ocupada)',
  normal:   'Normal',
  elevada:  'Elevada (sempre ocupada / evacuação difícil)',
}

// Tabela simplificada Ng por região do Brasil (INMET / ELAT)
export const NG_BRASIL: { regiao: string; Ng: number }[] = [
  { regiao: 'Sul (RS, SC, PR)', Ng: 4 },
  { regiao: 'Sudeste litoral (RJ, SP litoral)', Ng: 6 },
  { regiao: 'Sudeste interior (MG, SP interior)', Ng: 10 },
  { regiao: 'Centro-Oeste (GO, MS, MT)', Ng: 14 },
  { regiao: 'Norte / Nordeste interior (PA, TO, PI, MA)', Ng: 16 },
  { regiao: 'Amazonas / Pará interior', Ng: 20 },
  { regiao: 'Mato Grosso (maior densidade do mundo)', Ng: 25 },
]
