// NBR ISO/CIE 8995-1:2013 — Iluminância por tipo de atividade/ambiente

export interface AmbienteIluminacao {
  key: string
  label: string
  iluminanciaMin: number // lux
  categoria: 'Baixa' | 'Média' | 'Alta' | 'Muito Alta'
}

export const AMBIENTES: AmbienteIluminacao[] = [
  { key: 'garagem',              label: 'Garagem / Estacionamento',     iluminanciaMin: 75,   categoria: 'Baixa'      },
  { key: 'deposito',             label: 'Depósito / Almoxarifado',      iluminanciaMin: 100,  categoria: 'Baixa'      },
  { key: 'corredor',             label: 'Corredor / Circulação',        iluminanciaMin: 100,  categoria: 'Baixa'      },
  { key: 'residencial_sala',     label: 'Sala de Estar (residencial)',   iluminanciaMin: 100,  categoria: 'Baixa'      },
  { key: 'residencial_banheiro', label: 'Banheiro / Lavabo',            iluminanciaMin: 200,  categoria: 'Média'      },
  { key: 'recepcao',             label: 'Recepção / Sala de Espera',    iluminanciaMin: 200,  categoria: 'Média'      },
  { key: 'loja',                 label: 'Área de Vendas / Comércio',    iluminanciaMin: 300,  categoria: 'Média'      },
  { key: 'residencial_cozinha',  label: 'Cozinha (residencial)',        iluminanciaMin: 300,  categoria: 'Média'      },
  { key: 'sala_reuniao',         label: 'Sala de Reunião / Aula',       iluminanciaMin: 300,  categoria: 'Média'      },
  { key: 'fabrica_grossa',       label: 'Fabricação Grosseira / Solda', iluminanciaMin: 200,  categoria: 'Média'      },
  { key: 'escritorio',           label: 'Escritório / Leitura contínua',iluminanciaMin: 500,  categoria: 'Alta'       },
  { key: 'laboratorio',          label: 'Laboratório / Desenho técnico',iluminanciaMin: 500,  categoria: 'Alta'       },
  { key: 'cozinha_industrial',   label: 'Cozinha Industrial',           iluminanciaMin: 500,  categoria: 'Alta'       },
  { key: 'hospitalar',           label: 'Consultório / Sala de Exame',  iluminanciaMin: 500,  categoria: 'Alta'       },
  { key: 'fabrica_fina',         label: 'Montagem Eletrônica / Costura',iluminanciaMin: 500,  categoria: 'Alta'       },
  { key: 'cirurgia',             label: 'Sala Cirúrgica',               iluminanciaMin: 1000, categoria: 'Muito Alta' },
]

export interface EntradaIluminacao {
  tipoAmbiente: string
  area: number          // m²
  alturaPe: number      // m — pé-direito
  alturaPlano: number   // m — plano de trabalho (0.8 padrão)
  fatorManutencao: number // 0.60–0.80
  efiLuminaria: number  // lm/W — eficiência da luminária LED (80–130)
  potLuminaria: number  // W por luminária
}

export interface ResultadoIluminacao {
  iluminanciaMinima: number
  fluxoTotal: number
  quantidadeLuminarias: number
  fluxoPorLuminaria: number
  potenciaTotal: number
  densidadePotencia: number // W/m²
  indiceAmbiente: number    // k
  fatorUtilizacao: number
  observacoes: string[]
}

export function calcularIluminacao(e: EntradaIluminacao): ResultadoIluminacao | null {
  const amb = AMBIENTES.find(a => a.key === e.tipoAmbiente)
  if (!amb || e.area <= 0 || e.alturaPe <= e.alturaPlano || e.potLuminaria <= 0 || e.efiLuminaria <= 0) return null

  const h = e.alturaPe - e.alturaPlano
  const l = Math.sqrt(e.area) // lado equivalente para área quadrada

  // Índice de ambiente k = (comprimento × largura) / (h × (comprimento + largura))
  // Simplificado para sala quadrada: k = l² / (h × 2l) = l / (2h)
  const k = Math.min(5, Math.max(0.6, l / (2 * h)))

  // Fator de utilização estimado por k (tabela simplificada para luminária direta)
  const fu = Math.min(0.85, Math.max(0.35, 0.28 + k * 0.09))

  // Método dos lúmens: φtotal = (E × A) / (fu × fm)
  const fluxoTotal = (amb.iluminanciaMin * e.area) / (fu * e.fatorManutencao)

  const fluxoPorLuminaria = e.potLuminaria * e.efiLuminaria
  const quantidadeLuminarias = Math.ceil(fluxoTotal / fluxoPorLuminaria)

  const potenciaTotal = quantidadeLuminarias * e.potLuminaria
  const densidadePotencia = potenciaTotal / e.area

  const observacoes: string[] = []
  if (densidadePotencia > 12) observacoes.push('Densidade > 12 W/m² — considere luminárias mais eficientes.')
  if (k < 0.7) observacoes.push('Índice de ambiente baixo — pé-direito alto em relação à área.')
  if (e.fatorManutencao < 0.65) observacoes.push('Fator de manutenção baixo — programe limpeza periódica.')
  if (quantidadeLuminarias > 30) observacoes.push('Muitas luminárias — avalie maior potência unitária ou agrupamento.')

  return {
    iluminanciaMinima: amb.iluminanciaMin,
    fluxoTotal: Math.round(fluxoTotal),
    quantidadeLuminarias,
    fluxoPorLuminaria: Math.round(fluxoPorLuminaria),
    potenciaTotal,
    densidadePotencia: Math.round(densidadePotencia * 10) / 10,
    indiceAmbiente: Math.round(k * 100) / 100,
    fatorUtilizacao: Math.round(fu * 100) / 100,
    observacoes,
  }
}
