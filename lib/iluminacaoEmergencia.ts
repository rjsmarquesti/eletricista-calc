// Iluminação de emergência — NBR 10898:2013

export type TipoEdificio =
  | 'residencial'
  | 'comercialPequeno'   // <750m²
  | 'comercialGrande'    // ≥750m²
  | 'industrial'
  | 'hospitalar'
  | 'escolar'
  | 'hoteleiro'
  | 'garagem'

export interface EntradaEmergencia {
  areaTotalM2: number
  tipoEdificio: TipoEdificio
  numRotasFuga: number
  alturaInstalacao: number  // m (pé-direito ou altura do teto)
}

export interface ResultadoEmergencia {
  blocosMinimos: number
  autonomiaMinima: number    // horas
  fluxoMinRota: number       // lux (rota de fuga)
  fluxoMinArea: number       // lux (área geral)
  alturaMaxFixacao: number   // m
  potenciaMinBlocoW: number  // W por bloco (referência)
  obrigatorio: boolean
  observacoes: string[]
}

// NBR 10898 Tabela 1 — parâmetros por tipo de edificação
const PARAMETROS: Record<TipoEdificio, {
  obrigatorio: boolean
  autonomiaH: number
  areaM2PorBloco: number    // 1 bloco a cada X m²
  fluxoRota: number         // lux mínimo na rota de fuga
  fluxoArea: number         // lux mínimo na área geral
  alturaMax: number         // m
  potenciaMinW: number      // W mínimo por bloco
}> = {
  residencial: {
    obrigatorio: false,     // recomendado para >8 andares
    autonomiaH: 1,
    areaM2PorBloco: 500,
    fluxoRota: 1,
    fluxoArea: 1,
    alturaMax: 2.5,
    potenciaMinW: 30,
  },
  comercialPequeno: {
    obrigatorio: true,
    autonomiaH: 1,
    areaM2PorBloco: 500,
    fluxoRota: 1,
    fluxoArea: 1,
    alturaMax: 3.0,
    potenciaMinW: 30,
  },
  comercialGrande: {
    obrigatorio: true,
    autonomiaH: 2,
    areaM2PorBloco: 500,
    fluxoRota: 1,
    fluxoArea: 5,
    alturaMax: 3.0,
    potenciaMinW: 30,
  },
  industrial: {
    obrigatorio: true,
    autonomiaH: 2,
    areaM2PorBloco: 300,
    fluxoRota: 1,
    fluxoArea: 5,
    alturaMax: 4.0,
    potenciaMinW: 30,
  },
  hospitalar: {
    obrigatorio: true,
    autonomiaH: 2,
    areaM2PorBloco: 200,
    fluxoRota: 1,
    fluxoArea: 10,
    alturaMax: 2.5,
    potenciaMinW: 30,
  },
  escolar: {
    obrigatorio: true,
    autonomiaH: 1,
    areaM2PorBloco: 500,
    fluxoRota: 1,
    fluxoArea: 1,
    alturaMax: 3.0,
    potenciaMinW: 30,
  },
  hoteleiro: {
    obrigatorio: true,
    autonomiaH: 2,
    areaM2PorBloco: 500,
    fluxoRota: 1,
    fluxoArea: 1,
    alturaMax: 2.5,
    potenciaMinW: 30,
  },
  garagem: {
    obrigatorio: true,
    autonomiaH: 1,
    areaM2PorBloco: 300,
    fluxoRota: 1,
    fluxoArea: 1,
    alturaMax: 3.0,
    potenciaMinW: 30,
  },
}

export function calcularEmergencia(e: EntradaEmergencia): ResultadoEmergencia {
  const p = PARAMETROS[e.tipoEdificio]
  const observacoes: string[] = []

  // Blocos por área + 1 por rota de fuga (mínimo por rota)
  const blocosPorArea = Math.ceil(e.areaTotalM2 / p.areaM2PorBloco)
  const blocosPorRota = e.numRotasFuga  // ao menos 1 por rota de fuga
  const blocos = Math.max(blocosPorArea, blocosPorRota, 1)

  if (!p.obrigatorio) {
    observacoes.push('NBR 10898: iluminação de emergência não obrigatória para este tipo de edificação, mas recomendada em áreas comuns e escadas.')
  }
  if (e.tipoEdificio === 'residencial' && e.areaTotalM2 > 750) {
    observacoes.push('Edificação residencial > 750m²: verificar exigência do Corpo de Bombeiros local — pode ser obrigatória.')
  }
  if (e.alturaInstalacao > p.alturaMax) {
    observacoes.push(`Altura de instalação ${e.alturaInstalacao}m excede o máximo de ${p.alturaMax}m para este tipo. Blocos de alta eficiência ou LED são necessários.`)
  }
  observacoes.push('Posicionar blocos: saídas, escadas, corredores, quadros elétricos e casas de máquinas.')
  observacoes.push('Testar autonomia a cada 6 meses e manutenção anual (NBR 10898 seção 6.4).')

  return {
    blocosMinimos: blocos,
    autonomiaMinima: p.autonomiaH,
    fluxoMinRota: p.fluxoRota,
    fluxoMinArea: p.fluxoArea,
    alturaMaxFixacao: p.alturaMax,
    potenciaMinBlocoW: p.potenciaMinW,
    obrigatorio: p.obrigatorio,
    observacoes,
  }
}

export const LABEL_EDIFICIO: Record<TipoEdificio, string> = {
  residencial:       'Residencial',
  comercialPequeno:  'Comercial pequeno (<750m²)',
  comercialGrande:   'Comercial grande (≥750m²)',
  industrial:        'Industrial / Galpão',
  hospitalar:        'Hospitalar / Clínica',
  escolar:           'Escolar / Creche',
  hoteleiro:         'Hoteleiro / Pousada',
  garagem:           'Garagem / Estacionamento',
}
