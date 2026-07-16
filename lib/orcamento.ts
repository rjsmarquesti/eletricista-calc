// Preços médios de referência — SINAPI região Centro-Oeste (jul/2026)

export interface ItemOrcamento {
  descricao: string
  qtd: number
  unidade: string
  unitario: number
  total: number
}

export interface EntradaOrcamento {
  bitola: number
  comprimento: number
  quantidadeCircuitos: number
  incluirEletroduto: boolean
  diametroEletroduto: '20mm' | '25mm' | '32mm'
  quantidadeDisjuntores: number
  amperagemDisjuntor: number
  quantidadeTomadas: number
  quantidadeInterruptores: number
  percentualMaoDeObra: number
}

export interface ResultadoOrcamento {
  itens: ItemOrcamento[]
  subtotalMaterial: number
  maoDeObra: number
  total: number
}

// R$/100m de rolo — fio cobre flexível
const PRECO_FIO_ROLO: Record<number, number> = {
  1.5: 89,
  2.5: 139,
  4: 219,
  6: 319,
  10: 489,
  16: 759,
  25: 1189,
  35: 1589,
  50: 2189,
  70: 2989,
  95: 3989,
}

const PRECO_ELETRODUTO: Record<string, number> = {
  '20mm': 4.5,
  '25mm': 6.5,
  '32mm': 9.5,
}

const PRECO_DISJUNTOR: Record<number, number> = {
  10: 12, 16: 13, 20: 14, 25: 15, 32: 18, 40: 22, 50: 28, 63: 35,
}

const PRECO_TOMADA = 18
const PRECO_INTERRUPTOR = 14

function precoFioPorMetro(bitola: number): number {
  const bits = Object.keys(PRECO_FIO_ROLO).map(Number).sort((a, b) => a - b)
  const found = bits.find(b => b >= bitola) ?? bits[bits.length - 1]
  return PRECO_FIO_ROLO[found] / 100
}

function precoDisj(amp: number): number {
  const amps = Object.keys(PRECO_DISJUNTOR).map(Number).sort((a, b) => a - b)
  const found = amps.find(a => a >= amp) ?? amps[amps.length - 1]
  return PRECO_DISJUNTOR[found]
}

export const BITOLAS_DISPONIVEIS = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95]
export const AMPERAGENS_DISPONIVEIS = [10, 16, 20, 25, 32, 40, 50, 63]

export function calcularOrcamento(e: EntradaOrcamento): ResultadoOrcamento {
  const itens: ItemOrcamento[] = []

  // 3 condutores por circuito (fase + neutro + terra)
  const metrosFio = Math.ceil(e.comprimento * 3 * e.quantidadeCircuitos)
  const unitFio = precoFioPorMetro(e.bitola)
  itens.push({
    descricao: `Fio cobre flexível ${e.bitola}mm²`,
    qtd: metrosFio,
    unidade: 'm',
    unitario: unitFio,
    total: metrosFio * unitFio,
  })

  if (e.incluirEletroduto) {
    const barras = Math.ceil((e.comprimento * e.quantidadeCircuitos) / 3)
    const unitElet = PRECO_ELETRODUTO[e.diametroEletroduto]
    itens.push({
      descricao: `Eletroduto PVC corrugado ${e.diametroEletroduto}`,
      qtd: barras,
      unidade: 'barra 3m',
      unitario: unitElet,
      total: barras * unitElet,
    })
  }

  if (e.quantidadeDisjuntores > 0) {
    const unitDisj = precoDisj(e.amperagemDisjuntor)
    itens.push({
      descricao: `Disjuntor ${e.amperagemDisjuntor}A curva C`,
      qtd: e.quantidadeDisjuntores,
      unidade: 'un',
      unitario: unitDisj,
      total: e.quantidadeDisjuntores * unitDisj,
    })
  }

  if (e.quantidadeTomadas > 0) {
    itens.push({
      descricao: 'Tomada 2P+T 10A NBR 14136',
      qtd: e.quantidadeTomadas,
      unidade: 'un',
      unitario: PRECO_TOMADA,
      total: e.quantidadeTomadas * PRECO_TOMADA,
    })
  }

  if (e.quantidadeInterruptores > 0) {
    itens.push({
      descricao: 'Interruptor simples',
      qtd: e.quantidadeInterruptores,
      unidade: 'un',
      unitario: PRECO_INTERRUPTOR,
      total: e.quantidadeInterruptores * PRECO_INTERRUPTOR,
    })
  }

  const subtotalMaterial = itens.reduce((s, i) => s + i.total, 0)
  const maoDeObra = subtotalMaterial * (e.percentualMaoDeObra / 100)
  return { itens, subtotalMaterial, maoDeObra, total: subtotalMaterial + maoDeObra }
}

export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
