// Catálogo de esquemas de ligação elétrica — dados estruturados para renderização SVG

export type EsquemaPathType = 'line' | 'circle' | 'rect' | 'dot' | 'label' | 'arc' | 'path'

export interface EsquemaPath {
  type: EsquemaPathType
  // line
  x1?: number; y1?: number; x2?: number; y2?: number
  strokeWidth?: number
  // circle / dot
  cx?: number; cy?: number; r?: number
  fill?: 'primary' | 'text' | 'card' | 'danger' | 'none'
  // rect
  x?: number; y?: number; width?: number; height?: number
  // path (SVG d string)
  d?: string
  // label
  text?: string
  fontSize?: number
  textAnchor?: 'start' | 'middle' | 'end'
  fontWeight?: 'normal' | 'bold'
  color?: 'primary' | 'text' | 'textMuted' | 'danger'
  // shared
  stroke?: 'primary' | 'text' | 'textMuted' | 'danger' | 'none'
}

export interface Esquema {
  key: string
  titulo: string
  subtitulo: string
  norma: string
  dificuldade: 'Básico' | 'Intermediário' | 'Avançado'
  descricao: string
  passos: string[]
  paths: EsquemaPath[]
  viewBox: string
}

// ──────────────────────────────────────────────────────────────────────────────
// Helpers internos de construção de paths
// ──────────────────────────────────────────────────────────────────────────────

function wire(x1: number, y1: number, x2: number, y2: number): EsquemaPath {
  return { type: 'line', x1, y1, x2, y2, strokeWidth: 1.5, stroke: 'text' }
}

function bus(x1: number, y1: number, x2: number, y2: number): EsquemaPath {
  return { type: 'line', x1, y1, x2, y2, strokeWidth: 4, stroke: 'primary' }
}

function dot(cx: number, cy: number): EsquemaPath {
  return { type: 'dot', cx, cy, r: 3, fill: 'text', stroke: 'none' }
}

function lbl(text: string, x: number, y: number, opts?: Partial<EsquemaPath>): EsquemaPath {
  return { type: 'label', text, cx: x, cy: y, fontSize: 11, textAnchor: 'middle', color: 'textMuted', ...opts }
}

function phaseLbl(text: string, x: number, y: number): EsquemaPath {
  return lbl(text, x, y, { fontSize: 10, color: 'primary', fontWeight: 'bold' })
}

// Símbolo de interruptor simples (x, y = centro do símbolo; tam ~20px)
function switchSymbol(x: number, y: number): EsquemaPath[] {
  // Linha de entrada, circulo pivô, braço aberto 45°, circulo saída
  const r = 4
  return [
    { type: 'circle', cx: x - 14, cy: y, r, fill: 'none', stroke: 'text' },
    { type: 'line', x1: x - 14 + r, y1: y, x2: x + 10, y2: y - 14, strokeWidth: 1.5, stroke: 'text' },
    { type: 'circle', cx: x + 14, cy: y, r, fill: 'none', stroke: 'text' },
  ]
}

// Símbolo de luminária (círculo com X)
function lampSymbol(cx: number, cy: number, r = 14): EsquemaPath[] {
  const off = r * 0.7
  return [
    { type: 'circle', cx, cy, r, fill: 'none', stroke: 'primary' },
    { type: 'line', x1: cx - off, y1: cy - off, x2: cx + off, y2: cy + off, strokeWidth: 1.5, stroke: 'primary' },
    { type: 'line', x1: cx + off, y1: cy - off, x2: cx - off, y2: cy + off, strokeWidth: 1.5, stroke: 'primary' },
  ]
}

// Símbolo de tomada 2P+T
function outletSymbol(cx: number, cy: number): EsquemaPath[] {
  return [
    { type: 'circle', cx, cy, r: 14, fill: 'none', stroke: 'primary' },
    // pino fase
    { type: 'line', x1: cx - 5, y1: cy - 6, x2: cx - 5, y2: cy + 4, strokeWidth: 2, stroke: 'primary' },
    // pino neutro
    { type: 'line', x1: cx + 5, y1: cy - 6, x2: cx + 5, y2: cy + 4, strokeWidth: 2, stroke: 'primary' },
    // pino terra (T)
    { type: 'line', x1: cx, y1: cy + 3, x2: cx, y2: cy + 10, strokeWidth: 2, stroke: 'text' },
  ]
}

// Símbolo de disjuntor (retângulo + diagonal)
function breakerSymbol(x: number, y: number, label: string): EsquemaPath[] {
  const w = 24, h = 36
  return [
    { type: 'rect', x: x - w / 2, y: y - h / 2, width: w, height: h, fill: 'none', stroke: 'text' },
    { type: 'line', x1: x - w / 2, y1: y + h / 2, x2: x + w / 2, y2: y - h / 2, strokeWidth: 1.5, stroke: 'primary' },
    lbl(label, x, y + h / 2 + 12, { fontSize: 10, color: 'primary', fontWeight: 'bold' }),
  ]
}

// Símbolo DR (retângulo + diagonal + "DR")
function drSymbol(x: number, y: number, label: string): EsquemaPath[] {
  const w = 24, h = 36
  return [
    { type: 'rect', x: x - w / 2, y: y - h / 2, width: w, height: h, fill: 'none', stroke: 'danger' },
    { type: 'line', x1: x - w / 2, y1: y + h / 2, x2: x + w / 2, y2: y - h / 2, strokeWidth: 1.5, stroke: 'danger' },
    lbl('DR', x, y - h / 2 - 4, { fontSize: 9, color: 'danger', fontWeight: 'bold' }),
    lbl(label, x, y + h / 2 + 12, { fontSize: 10, color: 'danger', fontWeight: 'bold' }),
  ]
}

// ──────────────────────────────────────────────────────────────────────────────
// Catálogo de esquemas
// ──────────────────────────────────────────────────────────────────────────────

export const ESQUEMAS: Esquema[] = [

  // 1. Interruptor simples
  {
    key: 'interruptor_simples',
    titulo: 'Interruptor Simples (1 tecla)',
    subtitulo: 'Liga/desliga 1 ponto de luz',
    norma: 'NBR 5410',
    dificuldade: 'Básico',
    descricao: 'O interruptor simples controla um único ponto de luz a partir de uma posição. É o esquema mais comum em residências, usado em quartos, corredores e banheiros. A fase sempre passa pelo interruptor; o neutro vai direto para a luminária.',
    passos: [
      'Desligar o disjuntor do circuito antes de qualquer conexão.',
      'Identificar os fios: FASE (vermelho/preto), NEUTRO (azul) e TERRA (verde/amarelo).',
      'A FASE entra no borne "entrada" do interruptor.',
      'A saída do interruptor ("retorno") vai ao terminal de fase da luminária.',
      'O NEUTRO vai diretamente ao terminal neutro da luminária (sem passar pelo interruptor).',
      'O TERRA conecta ao terminal terra da luminária e ao condutor de proteção.',
      'Testar com voltímetro antes de fechar a caixa.',
    ],
    viewBox: '0 0 320 160',
    paths: [
      // Barramento de entrada (esquerda)
      bus(20, 30, 20, 130),
      phaseLbl('F', 10, 45),
      phaseLbl('N', 10, 85),

      // Fase → interruptor
      wire(20, 40, 100, 40),
      ...switchSymbol(140, 40),
      wire(160, 40, 220, 40),

      // Neutro → luminária diretamente
      wire(20, 80, 220, 80),

      // Luminária
      ...lampSymbol(260, 60),
      wire(220, 40, 240, 40), wire(240, 40, 240, 46),
      wire(220, 80, 240, 80), wire(240, 80, 240, 74),

      lbl('Interruptor', 140, 70, { fontSize: 10 }),
      lbl('Luminária', 260, 90, { fontSize: 10 }),
      lbl('Fase', 60, 32, { fontSize: 9, color: 'primary' }),
      lbl('Retorno', 190, 32, { fontSize: 9, color: 'primary' }),
      lbl('Neutro', 110, 92, { fontSize: 9 }),
    ],
  },

  // 2. Interruptor paralelo (3 tempos)
  {
    key: 'interruptor_paralelo',
    titulo: 'Interruptor Paralelo (3 tempos)',
    subtitulo: 'Controle de 1 luz em 2 posições',
    norma: 'NBR 5410',
    dificuldade: 'Intermediário',
    descricao: 'O esquema de 3 tempos (paralelo) permite acionar a mesma luminária de dois pontos diferentes — ex.: início e fim de um corredor, escada ou entrada/saída de quarto. São necessários dois interruptores de 3 tempos e 3 fios entre eles (fase, retorno 1, retorno 2).',
    passos: [
      'Desligar o disjuntor do circuito.',
      'Usar dois interruptores marcados "3 tempos" ou "paralelo" (possuem 3 bornes cada).',
      'A FASE entra no borne central do 1º interruptor.',
      'Ligar o borne "L1" do 1º interruptor ao borne "L1" do 2º interruptor.',
      'Ligar o borne "L2" do 1º interruptor ao borne "L2" do 2º interruptor.',
      'A saída do borne central do 2º interruptor é o RETORNO que vai à fase da luminária.',
      'O NEUTRO vai direto à luminária.',
      'Verificar que há 3 condutores entre os interruptores (fase + L1 + L2).',
    ],
    viewBox: '0 0 320 180',
    paths: [
      bus(20, 30, 20, 150),
      phaseLbl('F', 10, 45),

      // Fase → S1 central
      wire(20, 40, 80, 40),
      // S1 symbol (3 bornes: central esquerdo, L1 topo, L2 base)
      { type: 'circle', cx: 80, cy: 40, r: 4, fill: 'none', stroke: 'text' },
      { type: 'circle', cx: 120, cy: 20, r: 4, fill: 'none', stroke: 'text' },
      { type: 'circle', cx: 120, cy: 60, r: 4, fill: 'none', stroke: 'text' },
      { type: 'line', x1: 84, y1: 40, x2: 116, y2: 22, strokeWidth: 1.5, stroke: 'text' },

      // Travessas L1 e L2 entre S1 e S2
      wire(120, 20, 200, 20),
      wire(120, 60, 200, 60),
      lbl('L1', 160, 14, { fontSize: 9, color: 'primary' }),
      lbl('L2', 160, 72, { fontSize: 9, color: 'primary' }),

      // S2 symbol
      { type: 'circle', cx: 200, cy: 20, r: 4, fill: 'none', stroke: 'text' },
      { type: 'circle', cx: 200, cy: 60, r: 4, fill: 'none', stroke: 'text' },
      { type: 'circle', cx: 240, cy: 40, r: 4, fill: 'none', stroke: 'text' },
      { type: 'line', x1: 204, y1: 20, x2: 236, y2: 38, strokeWidth: 1.5, stroke: 'text' },

      // Retorno S2 → luminária
      wire(244, 40, 270, 40),
      ...lampSymbol(284, 60),
      wire(270, 40, 270, 46),
      wire(270, 80, 270, 74),

      // Neutro direto
      wire(20, 80, 270, 80),

      lbl('S1 (3 tempos)', 100, 100, { fontSize: 10 }),
      lbl('S2 (3 tempos)', 220, 100, { fontSize: 10 }),
      lbl('Luminária', 284, 86, { fontSize: 10 }),
    ],
  },

  // 3. Interruptor intermediário (4 tempos)
  {
    key: 'interruptor_intermediario',
    titulo: 'Interruptor Intermediário (4 tempos)',
    subtitulo: 'Controle de 1 luz em 3+ posições',
    norma: 'NBR 5410',
    dificuldade: 'Avançado',
    descricao: 'Para controlar uma luminária de três ou mais pontos, usa-se dois interruptores de 3 tempos nas extremidades e um (ou mais) interruptor de 4 tempos no meio. O interruptor de 4 tempos tem 4 bornes e cruza as travessas L1 e L2 quando acionado.',
    passos: [
      'Desligar o disjuntor.',
      'Nas extremidades: dois interruptores de 3 tempos (como no esquema paralelo).',
      'No meio: um interruptor de 4 tempos (marcado "intermediário").',
      'As travessas L1 e L2 do S1 chegam ao S_intermediário nos bornes L1 e L2 (entrada).',
      'As saídas do S_intermediário (L1\' e L2\') seguem para o S2.',
      'O S_intermediário cruza ou não cruza L1/L2 dependendo da posição — isso permite desfazer o estado sem importar quantas vezes os outros foram acionados.',
      'Neutro vai direto à luminária.',
    ],
    viewBox: '0 0 320 160',
    paths: [
      bus(10, 20, 10, 140),
      phaseLbl('F', 18, 35),

      wire(10, 30, 50, 30),
      { type: 'circle', cx: 50, cy: 30, r: 3, fill: 'none', stroke: 'text' },
      { type: 'circle', cx: 80, cy: 18, r: 3, fill: 'none', stroke: 'text' },
      { type: 'circle', cx: 80, cy: 42, r: 3, fill: 'none', stroke: 'text' },
      { type: 'line', x1: 53, y1: 30, x2: 77, y2: 20, strokeWidth: 1.5, stroke: 'text' },

      wire(80, 18, 120, 18), wire(80, 42, 120, 42),

      // S intermediário (caixa 4 bornes)
      { type: 'rect', x: 120, y: 10, width: 40, height: 40, fill: 'none', stroke: 'text' },
      lbl('4T', 140, 32, { fontSize: 10, color: 'primary', fontWeight: 'bold' }),
      wire(160, 18, 200, 18), wire(160, 42, 200, 42),

      { type: 'circle', cx: 200, cy: 18, r: 3, fill: 'none', stroke: 'text' },
      { type: 'circle', cx: 200, cy: 42, r: 3, fill: 'none', stroke: 'text' },
      { type: 'circle', cx: 232, cy: 30, r: 3, fill: 'none', stroke: 'text' },
      { type: 'line', x1: 204, y1: 18, x2: 229, y2: 28, strokeWidth: 1.5, stroke: 'text' },

      wire(236, 30, 264, 30),
      ...lampSymbol(278, 50),
      wire(264, 30, 264, 36),
      wire(264, 70, 264, 64),
      wire(10, 70, 264, 70),

      lbl('S1', 65, 60, { fontSize: 9 }),
      lbl('S interm.', 140, 60, { fontSize: 9 }),
      lbl('S2', 217, 60, { fontSize: 9 }),
      lbl('L1', 100, 12, { fontSize: 9, color: 'primary' }),
      lbl('L2', 100, 52, { fontSize: 9, color: 'primary' }),
      lbl('L1\'', 180, 12, { fontSize: 9, color: 'primary' }),
      lbl('L2\'', 180, 52, { fontSize: 9, color: 'primary' }),
    ],
  },

  // 4. Tomada 2P+T 10A
  {
    key: 'tomada_10a',
    titulo: 'Tomada 2P+T 10A',
    subtitulo: 'Ligação padrão NBR 14136 — uso geral',
    norma: 'NBR 14136',
    dificuldade: 'Básico',
    descricao: 'Tomada de uso geral com padrão brasileiro NBR 14136 em 10A. Usada em quartos, salas e escritórios para equipamentos de até 1.100W em 127V ou 2.200W em 220V. Requer 3 condutores: fase, neutro e proteção (terra).',
    passos: [
      'Desligar o disjuntor do circuito de tomadas.',
      'Identificar os fios: FASE (vermelho/preto/cinza), NEUTRO (azul) e TERRA (verde/amarelo).',
      'Conectar a FASE ao pino da esquerda (olhando de frente para a tomada).',
      'Conectar o NEUTRO ao pino da direita.',
      'Conectar o TERRA ao pino central arredondado (borne específico de terra).',
      'Apertar os bornes com torque adequado (evitar superaquecimento).',
      'Testar com voltímetro: fase-neutro ~127V ou ~220V; fase-terra ~127V ou ~220V; neutro-terra <3V.',
      'Altura mínima: 0,40m do piso (NBR 14136).',
    ],
    viewBox: '0 0 280 160',
    paths: [
      bus(20, 20, 20, 140),
      phaseLbl('F', 10, 40),
      phaseLbl('N', 10, 80),
      phaseLbl('T', 10, 120),

      wire(20, 40, 130, 40),
      wire(20, 80, 130, 80),
      wire(20, 120, 130, 120),

      ...outletSymbol(180, 80),

      wire(130, 40, 160, 40), wire(160, 40, 160, 74), wire(160, 74, 166, 74),
      wire(130, 80, 155, 80), wire(155, 80, 155, 74), wire(155, 74, 166, 74),
      wire(130, 120, 150, 120), wire(150, 120, 150, 92), wire(150, 92, 180, 92),

      lbl('Fase (L)', 60, 32, { fontSize: 9, color: 'primary' }),
      lbl('Neutro (N)', 60, 92, { fontSize: 9 }),
      lbl('Terra (T)', 60, 132, { fontSize: 9 }),
      lbl('10A / 127V ou 220V', 180, 115, { fontSize: 9, color: 'textMuted' }),
    ],
  },

  // 5. Tomada 2P+T 20A
  {
    key: 'tomada_20a',
    titulo: 'Tomada 2P+T 20A',
    subtitulo: 'Ligação para alta carga — NBR 14136',
    norma: 'NBR 14136',
    dificuldade: 'Básico',
    descricao: 'Tomada de 20A para equipamentos de alta potência: microondas, geladeira, ar-condicionado split, máquina de lavar. Deve ter circuito exclusivo e disjuntor de 20A. A diferença visual da tomada 10A é o pino redondo menor (formato específico NBR 14136 20A).',
    passos: [
      'Desligar o disjuntor do circuito exclusivo de 20A.',
      'Usar cabo 2,5mm² ou conforme resultado da calculadora de bitola.',
      'O circuito deve ser EXCLUSIVO para cada equipamento de alta carga.',
      'Identificar: FASE (vermelho/preto), NEUTRO (azul), TERRA (verde/amarelo).',
      'Conectar FASE ao borne "L" da tomada 20A.',
      'Conectar NEUTRO ao borne "N".',
      'Conectar TERRA ao borne terra (pino central redondo menor).',
      'Verificar tensão do equipamento antes de energizar (127V ou 220V).',
    ],
    viewBox: '0 0 280 160',
    paths: [
      bus(20, 20, 20, 140),
      phaseLbl('F', 10, 40),
      phaseLbl('N', 10, 80),
      phaseLbl('T', 10, 120),

      wire(20, 40, 130, 40),
      wire(20, 80, 130, 80),
      wire(20, 120, 130, 120),

      ...outletSymbol(180, 80),
      // Indicação 20A
      { type: 'rect', x: 164, y: 64, width: 32, height: 32, fill: 'none', stroke: 'primary' },
      lbl('20A', 180, 80, { fontSize: 9, color: 'primary', fontWeight: 'bold' }),

      wire(130, 40, 160, 40), wire(160, 40, 160, 74), wire(160, 74, 166, 74),
      wire(130, 80, 155, 80), wire(155, 80, 155, 74), wire(155, 74, 166, 74),
      wire(130, 120, 150, 120), wire(150, 120, 150, 92), wire(150, 92, 180, 92),

      lbl('Circuito exclusivo', 75, 112, { fontSize: 9, color: 'danger' }),
      lbl('Fio 2,5mm² mín.', 75, 124, { fontSize: 9 }),
      lbl('20A / 127V ou 220V', 180, 115, { fontSize: 9, color: 'textMuted' }),
    ],
  },

  // 6. Campainha com botão pulsador
  {
    key: 'campainha',
    titulo: 'Campainha com Botão Pulsador',
    subtitulo: 'Ligação de campainha residencial',
    norma: 'NBR 5410',
    dificuldade: 'Básico',
    descricao: 'A campainha residencial opera em baixa tensão (8–12V AC) por meio de um transformador abaixador. O botão pulsador (normalmente aberto) fecha o circuito de secundário do transformador ao ser pressionado. O primário do transformador é ligado diretamente à rede (127V ou 220V).',
    passos: [
      'Desligar o disjuntor do circuito.',
      'Identificar a tensão da campainha (geralmente 8V ou 12V — ver plaqueta).',
      'Instalar o transformador de campainha próximo ao quadro elétrico.',
      'Ligar o primário do transformador à fase e neutro da rede (127V ou 220V).',
      'Do secundário do transformador, ligar um fio ao botão pulsador.',
      'Do outro terminal do botão, ligar um fio à campainha.',
      'Do outro terminal da campainha, retornar ao secundário do transformador (circuito fechado em baixa tensão).',
      'Não é necessário terra no circuito de baixa tensão do secundário.',
    ],
    viewBox: '0 0 320 160',
    paths: [
      bus(20, 20, 20, 140),
      phaseLbl('F', 10, 40),
      phaseLbl('N', 10, 80),

      wire(20, 40, 80, 40),
      wire(20, 80, 80, 80),

      // Transformador (caixa)
      { type: 'rect', x: 80, y: 20, width: 36, height: 80, fill: 'none', stroke: 'text' },
      lbl('TR', 98, 60, { fontSize: 9, color: 'primary', fontWeight: 'bold' }),
      lbl('127/8V', 98, 72, { fontSize: 8 }),

      // Secundário (baixa tensão)
      wire(116, 35, 160, 35),
      wire(116, 65, 160, 65),

      // Botão pulsador
      { type: 'circle', cx: 175, cy: 35, r: 6, fill: 'none', stroke: 'text' },
      { type: 'line', x1: 169, y1: 35, x2: 181, y2: 29, strokeWidth: 1.5, stroke: 'text' },

      wire(181, 35, 220, 35),

      // Campainha (círculo com ondas)
      { type: 'circle', cx: 250, cy: 50, r: 16, fill: 'none', stroke: 'primary' },
      { type: 'line', x1: 243, y1: 44, x2: 257, y2: 56, strokeWidth: 2, stroke: 'primary' },
      { type: 'line', x1: 257, y1: 44, x2: 243, y2: 56, strokeWidth: 2, stroke: 'primary' },

      wire(220, 35, 234, 35), wire(234, 35, 234, 34),
      wire(220, 65, 250, 65), wire(250, 65, 250, 66),

      lbl('Transformador', 98, 112, { fontSize: 9 }),
      lbl('Botão', 175, 52, { fontSize: 9 }),
      lbl('Campainha', 250, 78, { fontSize: 9 }),
      lbl('Baixa tensão', 175, 80, { fontSize: 8, color: 'primary' }),
    ],
  },

  // 7. Minuteria
  {
    key: 'minuteria',
    titulo: 'Minuteria (Temporizador)',
    subtitulo: 'Luz automática com desligamento temporizado',
    norma: 'NBR 5410',
    dificuldade: 'Intermediário',
    descricao: 'A minuteria é um dispositivo temporizador que mantém a luz acesa por um tempo pré-definido após o acionamento. Muito usada em escadas e corredores de condomínios. O botão pulsador (NA) aciona a minuteria; ela mantém a saída energizada pelo tempo configurado (geralmente 1–5 minutos).',
    passos: [
      'Desligar o disjuntor.',
      'A minuteria possui bornes: Fase (entrada), Neutro, Saída (para luminária) e Botão.',
      'Ligar FASE ao borne "L" ou "Fase" da minuteria.',
      'Ligar NEUTRO ao borne "N" da minuteria.',
      'Do borne "Saída" da minuteria, ligar ao terminal de fase da luminária.',
      'O neutro vai diretamente à luminária.',
      'O botão pulsador (NA) liga entre o borne "Botão" da minuteria e o neutro.',
      'Configurar o tempo desejado no potenciômetro da minuteria.',
      'Múltiplos botões podem ser ligados em paralelo para acionar de vários pontos.',
    ],
    viewBox: '0 0 320 160',
    paths: [
      bus(20, 20, 20, 140),
      phaseLbl('F', 10, 40),
      phaseLbl('N', 10, 80),

      wire(20, 40, 80, 40),
      wire(20, 80, 120, 80),

      // Minuteria (caixa)
      { type: 'rect', x: 80, y: 20, width: 60, height: 70, fill: 'none', stroke: 'text' },
      lbl('MIN', 110, 50, { fontSize: 10, color: 'primary', fontWeight: 'bold' }),
      lbl('⏱', 110, 65, { fontSize: 12, color: 'primary' }),

      // Botão externo
      wire(20, 120, 100, 120),
      { type: 'circle', cx: 110, cy: 120, r: 6, fill: 'none', stroke: 'text' },
      { type: 'line', x1: 104, y1: 120, x2: 116, y2: 114, strokeWidth: 1.5, stroke: 'text' },
      wire(116, 120, 140, 120), wire(140, 120, 140, 90),

      // Saída → luminária
      wire(140, 40, 220, 40),
      wire(140, 80, 220, 80),
      ...lampSymbol(254, 60),
      wire(220, 40, 240, 40), wire(240, 40, 240, 46),
      wire(220, 80, 240, 80), wire(240, 80, 240, 74),

      lbl('Botão NA', 110, 138, { fontSize: 9 }),
      lbl('Minuteria', 110, 100, { fontSize: 9 }),
      lbl('Luminária', 254, 84, { fontSize: 9 }),
    ],
  },

  // 8. Sensor de presença
  {
    key: 'sensor_presenca',
    titulo: 'Sensor de Presença',
    subtitulo: 'Acionamento automático por infravermelho',
    norma: 'NBR 5410',
    dificuldade: 'Intermediário',
    descricao: 'O sensor de presença (PIR) detecta movimento por infravermelho e aciona automaticamente a luminária, desligando após o tempo configurado sem movimento. Possui ajuste de sensibilidade e tempo de retardo. Requer fase, neutro e saída para carga. Alguns modelos incluem fotocélula para operar apenas à noite.',
    passos: [
      'Desligar o disjuntor.',
      'O sensor possui 3 terminais: Fase (L), Neutro (N) e Saída (Load).',
      'Ligar FASE ao terminal L do sensor.',
      'Ligar NEUTRO ao terminal N do sensor.',
      'Do terminal Load (saída), ligar ao terminal de fase da luminária.',
      'O neutro vai direto à luminária (sem passar pelo sensor).',
      'Configurar o ângulo de detecção (geralmente 180°) e tempo de retardo.',
      'Instalar a uma altura de 2,2–3,0m para melhor cobertura.',
      'Verificar que cargas dentro do limite do sensor (geralmente máx. 1.000W).',
    ],
    viewBox: '0 0 320 160',
    paths: [
      bus(20, 20, 20, 140),
      phaseLbl('F', 10, 40),
      phaseLbl('N', 10, 80),

      wire(20, 40, 80, 40),
      wire(20, 80, 120, 80),

      // Sensor (meio-círculo = cúpula PIR)
      { type: 'rect', x: 80, y: 20, width: 60, height: 60, fill: 'none', stroke: 'text' },
      { type: 'arc', cx: 110, cy: 80, r: 20, fill: 'none', stroke: 'primary' },
      lbl('PIR', 110, 47, { fontSize: 10, color: 'primary', fontWeight: 'bold' }),
      lbl('🔍', 110, 62, { fontSize: 11, color: 'primary' }),

      wire(140, 40, 220, 40),
      wire(140, 80, 220, 80),

      ...lampSymbol(254, 60),
      wire(220, 40, 240, 40), wire(240, 40, 240, 46),
      wire(220, 80, 240, 80), wire(240, 80, 240, 74),

      lbl('Sensor PIR', 110, 94, { fontSize: 9 }),
      lbl('Load', 110, 106, { fontSize: 8, color: 'textMuted' }),
      lbl('Luminária', 254, 84, { fontSize: 9 }),
      lbl('Máx. 1.000W', 254, 96, { fontSize: 8, color: 'textMuted' }),
    ],
  },

  // 9. DR (Dispositivo Diferencial-Residual)
  {
    key: 'dr_ligacao',
    titulo: 'DR — Dispositivo Diferencial-Residual',
    subtitulo: 'Proteção contra choque elétrico',
    norma: 'NBR 5410 seç. 6.3',
    dificuldade: 'Intermediário',
    descricao: 'O DR (ou DDR) protege contra choques elétricos ao detectar correntes de fuga superiores a 30mA. É obrigatório em circuitos de tomadas de banheiro, área de serviço, piscinas e ambientes molhados. Pode ser DR standalone (acoplado ao disjuntor) ou DPDT (DR + disjuntor em módulo único).',
    passos: [
      'Desligar o QDC principal.',
      'O DR possui 4 bornes: entrada Fase (L), entrada Neutro (N), saída Fase e saída Neutro.',
      'Ligar a entrada do DR ao barramento do quadro (Fase e Neutro).',
      'As saídas do DR alimentam os circuitos protegidos.',
      'O condutor de proteção (TERRA) NÃO passa pelo DR — vai direto ao barramento de terra.',
      'Apertar os bornes com torque especificado pelo fabricante.',
      'Após energizar: pressionar o botão de TESTE — o DR deve desarmar em <0,3s.',
      'Re-armar o DR e verificar que os circuitos voltaram.',
      'Repetir o teste mensal para verificar funcionamento.',
    ],
    viewBox: '0 0 300 180',
    paths: [
      bus(20, 20, 20, 160),
      phaseLbl('F', 10, 40),
      phaseLbl('N', 10, 80),

      wire(20, 40, 80, 40),
      wire(20, 80, 80, 80),

      // DR (retângulo vermelho + diagonal)
      { type: 'rect', x: 80, y: 20, width: 60, height: 80, fill: 'none', stroke: 'danger' },
      { type: 'line', x1: 80, y1: 100, x2: 140, y2: 20, strokeWidth: 2, stroke: 'danger' },
      lbl('DR', 110, 55, { fontSize: 13, color: 'danger', fontWeight: 'bold' }),
      lbl('30mA', 110, 72, { fontSize: 10, color: 'danger' }),

      // Botão de teste
      { type: 'rect', x: 93, y: 96, width: 34, height: 12, fill: 'none', stroke: 'danger' },
      lbl('TESTE', 110, 106, { fontSize: 8, color: 'danger', fontWeight: 'bold' }),

      // Saídas
      wire(140, 40, 220, 40),
      wire(140, 80, 220, 80),

      // Terra direto (não passa pelo DR)
      wire(20, 120, 220, 120),
      lbl('TERRA (não passa pelo DR)', 120, 134, { fontSize: 8, color: 'text' }),

      // Carga
      { type: 'rect', x: 220, y: 20, width: 60, height: 80, fill: 'none', stroke: 'text' },
      lbl('Circuitos', 250, 55, { fontSize: 9 }),
      lbl('protegidos', 250, 68, { fontSize: 9 }),

      wire(20, 160, 100, 160),
      lbl('Terra → barramento aterramento', 150, 160, { fontSize: 8, color: 'primary' }),

      lbl('Entrada', 60, 115, { fontSize: 9 }),
      lbl('Saída', 180, 115, { fontSize: 9 }),
    ],
  },

  // 10. Circuito de tomadas em anel
  {
    key: 'circuito_tomadas',
    titulo: 'Circuito de Tomadas em Anel',
    subtitulo: 'Distribuição em loop — NBR 5410',
    norma: 'NBR 5410 seç. 9.1',
    dificuldade: 'Intermediário',
    descricao: 'No circuito em anel (loop), os condutores partem do quadro, passam pelas tomadas em série e retornam ao quadro. Isso divide a corrente em dois caminhos, reduzindo a queda de tensão e permitindo usar cabo de seção menor. Muito usado em quartos e salas com múltiplas tomadas.',
    passos: [
      'Desligar o disjuntor do circuito.',
      'Partir do quadro com 2 vias (ida e retorno) do mesmo cabo.',
      'Na primeira tomada, derivar (empalmar) fase, neutro e terra — os fios continuam para a próxima tomada.',
      'Repetir o processo em cada tomada intermediária.',
      'Na última tomada, os fios retornam ao mesmo disjuntor no quadro (completando o anel).',
      'Nunca usar o anel como extensão aberta — o circuito deve ser um laço fechado.',
      'Usar caixas de derivação adequadas em cada ponto.',
      'Verificar continuidade do anel com multímetro antes de energizar.',
    ],
    viewBox: '0 0 320 160',
    paths: [
      // QDC
      { type: 'rect', x: 10, y: 50, width: 36, height: 60, fill: 'none', stroke: 'text' },
      lbl('QDC', 28, 82, { fontSize: 9, fontWeight: 'bold' }),

      // Anel superior (ida)
      wire(46, 60, 100, 60), wire(100, 60, 180, 60), wire(180, 60, 260, 60),
      wire(260, 60, 280, 60), wire(280, 60, 280, 100), wire(280, 100, 260, 100),
      wire(260, 100, 180, 100), wire(180, 100, 100, 100), wire(100, 100, 46, 100),

      // Tomadas
      ...outletSymbol(100, 80),
      ...outletSymbol(180, 80),
      ...outletSymbol(260, 80),

      dot(100, 60), dot(100, 100),
      dot(180, 60), dot(180, 100),
      dot(260, 60), dot(260, 100),

      lbl('T1', 100, 118, { fontSize: 9 }),
      lbl('T2', 180, 118, { fontSize: 9 }),
      lbl('T3', 260, 118, { fontSize: 9 }),
      lbl('Anel = menos queda de tensão', 160, 140, { fontSize: 9, color: 'primary' }),
      lbl('Fase', 70, 54, { fontSize: 8, color: 'primary' }),
      lbl('Neutro', 70, 108, { fontSize: 8 }),
    ],
  },

  // 11. Chuveiro elétrico 220V
  {
    key: 'chuveiro',
    titulo: 'Chuveiro Elétrico (220V — Dedicado)',
    subtitulo: 'Circuito exclusivo com DR obrigatório',
    norma: 'NBR 5410 seç. 9.1.3',
    dificuldade: 'Intermediário',
    descricao: 'O chuveiro elétrico exige circuito exclusivo com disjuntor bipolar, DR 30mA e cabo de bitola adequada (mínimo 4mm² para 6.800W/220V). Em 220V a corrente é menor, reduzindo perdas. O aterramento é obrigatório. A ligação usa apenas fase e neutro (sem pino terra no chuveiro — o terra vai ao boiler pela blindagem).',
    passos: [
      'Desligar o disjuntor principal do quadro.',
      'Calcular a corrente: I = P/V → ex. 6.800W ÷ 220V = 30,9A → disjuntor 40A bipolar.',
      'Usar bitola mínima de 4mm² para até 7.500W em 220V.',
      'Instalar DR 30mA bipolar antes do chuveiro (obrigatório por NBR 5410).',
      'A ligação do chuveiro usa apenas FASE e NEUTRO (220V entre os dois).',
      'O TERRA conecta ao anel de equalização do banheiro (canos, box, grade).',
      'Nunca usar tomada convencional — a saída deve ser ponto fixo (caixa 4x4 com supressor de arco).',
      'Seguir instrução do fabricante quanto à seleção de potência (verão/inverno).',
    ],
    viewBox: '0 0 300 180',
    paths: [
      bus(20, 20, 20, 160),
      phaseLbl('F', 10, 40),
      phaseLbl('N', 10, 80),
      phaseLbl('T', 10, 130),

      wire(20, 40, 60, 40),
      wire(20, 80, 60, 80),

      // DR bipolar
      ...drSymbol(90, 60, '40A'),

      wire(110, 40, 160, 40),
      wire(110, 80, 160, 80),

      // Chuveiro (retângulo + espiral)
      { type: 'rect', x: 160, y: 30, width: 80, height: 80, fill: 'none', stroke: 'primary' },
      lbl('CHUVEIRO', 200, 62, { fontSize: 9, color: 'primary', fontWeight: 'bold' }),
      lbl('220V', 200, 76, { fontSize: 11, color: 'primary', fontWeight: 'bold' }),
      lbl('6.800W', 200, 88, { fontSize: 9, color: 'textMuted' }),

      wire(20, 130, 200, 130), wire(200, 130, 200, 110),

      lbl('DR 30mA', 90, 118, { fontSize: 8, color: 'danger' }),
      lbl('Terra → equalização do banheiro', 200, 148, { fontSize: 8 }),
      lbl('Cabo mín. 4mm²', 100, 32, { fontSize: 8, color: 'primary' }),
      lbl('Circuito EXCLUSIVO', 100, 20, { fontSize: 9, color: 'danger', fontWeight: 'bold' }),
    ],
  },

  // 12. Luminária com dimmer
  {
    key: 'lampada_pendente',
    titulo: 'Luminária com Dimmer',
    subtitulo: 'Controle de intensidade luminosa',
    norma: 'NBR 5410',
    dificuldade: 'Intermediário',
    descricao: 'O dimmer substitui o interruptor simples e controla a intensidade da luminária por corte de onda (TRIAC). Funciona apenas com lâmpadas compatíveis (incandescente, halógena e LED dimerizável). Verificar sempre a carga máxima do dimmer (geralmente 300W ou 500W) e compatibilidade com a lâmpada.',
    passos: [
      'Desligar o disjuntor.',
      'Verificar que as lâmpadas são dimerizáveis (constar "dimmer" ou símbolo na embalagem).',
      'O dimmer possui 2 bornes principais (entrada e saída de fase) — alguns têm borne de neutro.',
      'Ligar a FASE ao borne "entrada" (L) do dimmer.',
      'A "saída" do dimmer vai ao terminal de fase da luminária.',
      'O NEUTRO vai direto à luminária (sem passar pelo dimmer, na maioria dos modelos).',
      'Não instalar dimmer em tomadas, apenas em luminárias.',
      'Respeitar a carga mínima do dimmer (geralmente 40–60W mínimo) para evitar flickering.',
      'Não usar dimmer em lâmpadas fluorescentes convencionais.',
    ],
    viewBox: '0 0 320 160',
    paths: [
      bus(20, 20, 20, 140),
      phaseLbl('F', 10, 40),
      phaseLbl('N', 10, 80),

      wire(20, 40, 80, 40),
      wire(20, 80, 200, 80),

      // Dimmer (retângulo com símbolo de reostat)
      { type: 'rect', x: 80, y: 20, width: 60, height: 40, fill: 'none', stroke: 'text' },
      { type: 'line', x1: 90, y1: 48, x2: 130, y2: 22, strokeWidth: 1, stroke: 'textMuted' },
      lbl('DIM', 110, 36, { fontSize: 10, color: 'primary', fontWeight: 'bold' }),
      lbl('≤500W', 110, 50, { fontSize: 8, color: 'textMuted' }),

      wire(140, 40, 200, 40),
      ...lampSymbol(240, 60),
      wire(200, 40, 220, 40), wire(220, 40, 220, 46),
      wire(200, 80, 220, 80), wire(220, 80, 220, 74),

      lbl('Dimmer', 110, 76, { fontSize: 9 }),
      lbl('Luminária LED', 240, 86, { fontSize: 9 }),
      lbl('dimerizável', 240, 96, { fontSize: 8, color: 'textMuted' }),
      lbl('Neutro direto', 130, 92, { fontSize: 8 }),
    ],
  },
]
