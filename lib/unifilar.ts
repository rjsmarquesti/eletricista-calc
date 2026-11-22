import { ResultadoCircuitos, TABELA_CAPACIDADE_COBRE } from './nbr5410'

export type IconeUnifilar = 'tomada' | 'luz' | 'motor' | 'aquecimento' | 'ar' | 'geral'

export interface RamoUnifilar {
  nome: string
  amperagem: number
  bitola: string
  isDR: boolean
  icone: IconeUnifilar
}

export interface DadosUnifilar {
  nomeProjeto: string
  tensao: '127V' | '220V' | 'Bifásico 127/220V' | 'Trifásico 220V'
  iGeneral: number
  bitolaPrincipal: string
  ramos: RamoUnifilar[]
}

export interface ConfigUnifilar {
  nomeProjeto: string
  tensao: DadosUnifilar['tensao']
  iGeneral: number
}

// Mapa de corrente padrão por tipo de circuito
const AMPERAGEM_DEFAULT: Record<string, number> = {
  '15A': 15,
  '20A': 20,
  'dedicado': 30,
}

// Mapa de bitola padrão por amperagem
function bitolaPorAmperagem(amp: number): string {
  if (amp <= 15) return '1,5mm²'
  if (amp <= 20) return '2,5mm²'
  if (amp <= 30) return '4mm²'
  if (amp <= 40) return '6mm²'
  if (amp <= 57) return '10mm²'
  return '16mm²'
}

// Detecta DR obrigatório por nome/descrição do circuito
function precisaDR(nome: string, descricao: string): boolean {
  const texto = (nome + ' ' + descricao).toLowerCase()
  return (
    texto.includes('chuveiro') ||
    texto.includes('banheiro') ||
    texto.includes('área de serviço') ||
    texto.includes('area de servi') ||
    texto.includes('lava') ||
    texto.includes('piscina') ||
    texto.includes('jardim') ||
    texto.includes('externo')
  )
}

// Detecta ícone pelo nome/tipo
function detectarIcone(nome: string, tipo: string): IconeUnifilar {
  const n = nome.toLowerCase()
  if (n.includes('ilumina') || n.includes('luz') || n.includes('lamp')) return 'luz'
  if (n.includes('ar cond') || n.includes('ar-cond') || n.includes('split')) return 'ar'
  if (n.includes('chuveiro') || n.includes('aquece') || n.includes('aquec')) return 'aquecimento'
  if (n.includes('motor') || n.includes('bomba')) return 'motor'
  return 'tomada'
}

// Extrai amperagem da descrição (ex: "40A" → 40)
function extrairAmperagem(descricao: string, tipo: string): number {
  const match = descricao.match(/(\d+)A/)
  if (match) return parseInt(match[1], 10)
  return AMPERAGEM_DEFAULT[tipo] ?? 20
}

// Extrai bitola da descrição (ex: "fio 4mm²" → "4mm²")
function extrairBitola(descricao: string, amperagem: number): string {
  const match = descricao.match(/(\d+(?:[.,]\d+)?)\s*mm²/)
  if (match) return `${match[1].replace('.', ',')}mm²`
  return bitolaPorAmperagem(amperagem)
}

export function gerarUnifilar(resultado: ResultadoCircuitos, config: ConfigUnifilar): DadosUnifilar {
  // Campos estruturados (v1.8.0) têm prioridade; resultados salvos por versões anteriores
  // não os têm e continuam sendo lidos pela descrição.
  const ramos: RamoUnifilar[] = resultado.circuitos.map(c => {
    const amp = c.disjuntorA ?? extrairAmperagem(c.descricao, c.tipo)
    return {
      nome: c.nome,
      amperagem: amp,
      bitola: c.bitolaMm2 !== undefined
        ? `${String(c.bitolaMm2).replace('.', ',')}mm²`
        : extrairBitola(c.descricao, amp),
      isDR: c.dr ?? precisaDR(c.nome, c.descricao),
      icone: detectarIcone(c.nome, c.tipo),
    }
  })

  // Corrente geral = soma × 0,65 (fator de demanda residencial NBR 5410)
  const somaAmps = ramos.reduce((acc, r) => acc + r.amperagem, 0)
  const iCalc = Math.ceil(somaAmps * 0.65)
  const iGeneral = config.iGeneral > 0 ? config.iGeneral : iCalc

  return {
    nomeProjeto: config.nomeProjeto || 'Projeto Elétrico',
    tensao: config.tensao,
    iGeneral,
    bitolaPrincipal: bitolaPorAmperagem(iGeneral),
    ramos,
  }
}

export function criarUnifilarManual(config: ConfigUnifilar, ramos: RamoUnifilar[]): DadosUnifilar {
  return {
    nomeProjeto: config.nomeProjeto || 'Projeto Elétrico',
    tensao: config.tensao,
    iGeneral: config.iGeneral,
    bitolaPrincipal: bitolaPorAmperagem(config.iGeneral),
    ramos,
  }
}

// ── Editor: validação de ramos e persistência ────────────────────────────────

export const BITOLAS_DISPONIVEIS: string[] = TABELA_CAPACIDADE_COBRE.map(l => formatarBitola(l.secao))

export function formatarBitola(secao: number): string {
  return `${String(secao).replace('.', ',')}mm²`
}

export function parseBitola(b: string): number | null {
  const m = b.match(/^\s*(\d+(?:[.,]\d+)?)/)
  return m ? parseFloat(m[1].replace(',', '.')) : null
}

// Capacidade em A (Tabela 36 NBR 5410, cobre, método B1, 3 condutores carregados)
export function capacidadeBitola(b: string): number | null {
  const secao = parseBitola(b)
  if (secao === null) return null
  return TABELA_CAPACIDADE_COBRE.find(l => l.secao === secao)?.b1 ?? null
}

export function bitolaMinima(amperagem: number): string | null {
  const linha = TABELA_CAPACIDADE_COBRE.find(l => l.b1 >= amperagem)
  return linha ? formatarBitola(linha.secao) : null
}

export function validarRamo(r: RamoUnifilar): string[] {
  if (!r.nome.trim()) return ['Informe o nome do circuito.']
  if (!Number.isFinite(r.amperagem) || r.amperagem <= 0) return ['Informe a corrente do disjuntor.']
  const cap = capacidadeBitola(r.bitola)
  if (cap === null) return [`Seção ${r.bitola} fora da tabela (Tabela 36 NBR 5410).`]
  if (r.amperagem > cap) {
    const min = bitolaMinima(r.amperagem)
    return [
      `Disjuntor de ${r.amperagem} A excede a capacidade do cabo de ${r.bitola} (${cap} A, método B1).` +
      (min ? ` Use no mínimo ${min}.` : ''),
    ]
  }
  return []
}

const TENSOES_VALIDAS: DadosUnifilar['tensao'][] = ['127V', '220V', 'Bifásico 127/220V', 'Trifásico 220V']
const ICONES_VALIDOS: IconeUnifilar[] = ['tomada', 'luz', 'motor', 'aquecimento', 'ar', 'geral']

export function serializarUnifilar(d: DadosUnifilar): string {
  return JSON.stringify(d)
}

// Nunca lança: dado salvo corrompido deve virar "não carregou", não crash de tela.
export function desserializarUnifilar(json: string): DadosUnifilar | null {
  try {
    const o = JSON.parse(json)
    if (!o || typeof o !== 'object' || !Array.isArray(o.ramos)) return null
    if (!TENSOES_VALIDAS.includes(o.tensao)) return null
    if (typeof o.nomeProjeto !== 'string' || typeof o.bitolaPrincipal !== 'string') return null
    if (typeof o.iGeneral !== 'number' || !Number.isFinite(o.iGeneral)) return null
    const ramos: RamoUnifilar[] = []
    for (const r of o.ramos) {
      if (!r || typeof r.nome !== 'string' || typeof r.bitola !== 'string') return null
      if (typeof r.amperagem !== 'number' || !Number.isFinite(r.amperagem)) return null
      ramos.push({
        nome: r.nome,
        amperagem: r.amperagem,
        bitola: r.bitola,
        isDR: r.isDR === true,
        icone: ICONES_VALIDOS.includes(r.icone) ? r.icone : 'tomada',
      })
    }
    return { nomeProjeto: o.nomeProjeto, tensao: o.tensao, iGeneral: o.iGeneral, bitolaPrincipal: o.bitolaPrincipal, ramos }
  } catch {
    return null
  }
}
