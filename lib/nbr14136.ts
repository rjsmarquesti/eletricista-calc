/**
 * NBR 14136:2012 — Plugues e tomadas para uso doméstico e análogo
 * NBR 5410:2004 — Regras de instalação de tomadas
 * AVISO: este app é orientativo — não substitui ART/CREA.
 */

export type TipoAmbienteTomada =
  | 'sala' | 'dormitorio' | 'escritorio'
  | 'cozinha' | 'banheiro' | 'lavabo'
  | 'area_servico' | 'garagem' | 'varanda'
  | 'corredor' | 'hall'

export interface EntradaTomadas {
  ambiente: TipoAmbienteTomada
  area: number          // m²
  comprimentoParedes?: number  // m total de parede livre (alternativo à área)
}

export interface ResultadoTomadas {
  qtdMinima: number
  alturaRecomendada: string    // ex: "0,40 m"
  tipo: '10A' | '20A' | 'misto'
  drObrigatorio: boolean
  regra: string
  observacoes: string[]
}

// Alturas de referência por ambiente (NBR 5410 e ABNT NBR 5410 comentada)
const ALTURA_TOMADA: Record<TipoAmbienteTomada, string> = {
  sala:         '0,40 m (uso geral) ou 1,10 m (bancada/mesa)',
  dormitorio:   '0,40 m (uso geral) ou 1,10 m (mesa de cabeceira)',
  escritorio:   '0,40 m ou conforme layout de mobiliário',
  cozinha:      '1,00 m a 1,20 m (sobre bancada)',
  banheiro:     '1,10 m (fora do volume de proteção — mín. 60 cm do chuveiro)',
  lavabo:       '1,10 m (lateral ao espelho)',
  area_servico: '1,00 m a 1,20 m (sobre bancada da máquina)',
  garagem:      '1,10 m (protegida de respingos)',
  varanda:      '0,40 m (uso geral, protegida de intempéries — IP44)',
  corredor:     '0,40 m',
  hall:         '0,40 m',
}

// Ambientes que exigem DR (NBR 5410 item 6.3.6)
const EXIGE_DR: TipoAmbienteTomada[] = ['banheiro', 'lavabo', 'cozinha', 'area_servico', 'garagem', 'varanda']

export function calcularTomadas(e: EntradaTomadas): ResultadoTomadas {
  const observacoes: string[] = []
  const drObrigatorio = EXIGE_DR.includes(e.ambiente)

  // Qtd mínima NBR 5410 item 9.1.1.2:
  // Para cômodos ≤ 6m²: 1 tomada
  // Para cômodos > 6m²: 1 tomada + 1 a cada 3,5m de comprimento de parede
  let qtdMinima: number
  let regra: string

  if (e.comprimentoParedes) {
    // Cálculo pelo perímetro real de parede livre
    qtdMinima = Math.max(1, Math.ceil(e.comprimentoParedes / 3.5))
    regra = `1 tomada a cada 3,5 m de parede livre (NBR 5410 item 9.1.1.2). Perímetro informado: ${e.comprimentoParedes} m.`
  } else {
    if (e.area <= 6) {
      qtdMinima = 1
      regra = `Cômodo ≤ 6 m²: mínimo 1 tomada (NBR 5410 item 9.1.1.2).`
    } else {
      // Estimativa: perímetro ≈ 2 × (√area + √area) — simplificado
      const ladoEst = Math.sqrt(e.area)
      const perimetroEst = 4 * ladoEst
      qtdMinima = Math.max(2, Math.ceil(perimetroEst / 3.5))
      regra = `Área ${e.area} m² → perímetro estimado ${perimetroEst.toFixed(1)} m → 1 tomada a cada 3,5 m de parede (NBR 5410 item 9.1.1.2).`
    }
  }

  // Tipo de tomada por ambiente
  let tipo: '10A' | '20A' | 'misto'
  if (['cozinha', 'area_servico'].includes(e.ambiente)) {
    tipo = 'misto'
    observacoes.push('Bancadas de cozinha e área de serviço: alternar tomadas 10A e 20A para equipamentos de maior potência.')
  } else if (['garagem'].includes(e.ambiente)) {
    tipo = '20A'
    observacoes.push('Garagem: recomenda-se tomadas 20A (pinos grossos) para equipamentos elétricos pesados.')
  } else {
    tipo = '10A'
  }

  // Observações específicas por ambiente
  if (e.ambiente === 'banheiro') {
    observacoes.push('Tomadas em banheiro devem estar fora do volume de proteção (mín. 60 cm horizontal do chuveiro/banheira).')
    observacoes.push('Obrigatório: proteção DR 30mA e aterramento.')
  }

  if (e.ambiente === 'cozinha') {
    observacoes.push('Circuito dedicado para forno elétrico, micro-ondas e geladeira (TUE 20A cada).')
    observacoes.push('Bancada: mínimo 1 tomada a cada 1,2 m (boa prática).')
  }

  if (e.ambiente === 'varanda') {
    observacoes.push('Tomadas externas: grau de proteção mínimo IP44.')
  }

  if (drObrigatorio) {
    observacoes.push('DR 30mA obrigatório (NBR 5410 item 6.3.6). Recomenda-se DR tipo A para cargas eletrônicas.')
  }

  observacoes.push('Todas as tomadas devem ter aterramento (pino T).')
  observacoes.push('Tomadas 10A: pinos redondos finos (NBR 14136). Tomadas 20A: pinos redondos grossos.')

  return {
    qtdMinima,
    alturaRecomendada: ALTURA_TOMADA[e.ambiente],
    tipo,
    drObrigatorio,
    regra,
    observacoes,
  }
}

// ── Tabela de referência NBR 14136 ───────────────────────────────────────────

export const TABELA_NBR14136 = [
  {
    tipo: '10A (padrão residencial)',
    pinos: '2P+T redondos — diâmetro 4 mm',
    uso: 'Iluminação, eletrodomésticos leves (televisão, carregadores, ventiladores)',
    corrente: 'Até 10A (2.200 W em 220V / 1.270 W em 127V)',
  },
  {
    tipo: '20A (uso pesado)',
    pinos: '2P+T redondos — diâmetro 4,8 mm',
    uso: 'Chuveiro, ar-condicionado, máquina de lavar, forno elétrico',
    corrente: 'Até 20A (4.400 W em 220V / 2.540 W em 127V)',
  },
]

// ── Nomes amigáveis dos ambientes ─────────────────────────────────────────────

export const NOME_AMBIENTE_TOMADA: Record<TipoAmbienteTomada, string> = {
  sala:         'Sala',
  dormitorio:   'Dormitório',
  escritorio:   'Escritório',
  cozinha:      'Cozinha',
  banheiro:     'Banheiro',
  lavabo:       'Lavabo',
  area_servico: 'Área de Serviço',
  garagem:      'Garagem',
  varanda:      'Varanda',
  corredor:     'Corredor',
  hall:         'Hall',
}
