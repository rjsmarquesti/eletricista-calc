import { ResultadoCircuitos } from './nbr5410'

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
  const ramos: RamoUnifilar[] = resultado.circuitos.map(c => {
    const amp = extrairAmperagem(c.descricao, c.tipo)
    return {
      nome: c.nome,
      amperagem: amp,
      bitola: extrairBitola(c.descricao, amp),
      isDR: precisaDR(c.nome, c.descricao),
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
