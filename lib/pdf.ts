import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'
import type { DadosUnifilar } from './unifilar'

let _responsavel = ''
let _obra = ''

export function configurarPDF(responsavel: string, obra: string): void {
  _responsavel = responsavel
  _obra = obra
}

export function getResponsavel(): string { return _responsavel }
export function getObra(): string { return _obra }

function gerarRef(): string {
  const d = new Date()
  return `ENBR-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}-${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}`
}

function header(titulo: string, norma: string): string {
  const agora = new Date()
  const dataHora = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  const ref = gerarRef()
  return `
    <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:24px">
    <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:4px solid #F59E0B;padding-bottom:14px;margin-bottom:20px">
      <div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:26px">⚡</span>
          <span style="font-size:22px;font-weight:900;color:#111827">Elétrica NBR</span>
        </div>
        <p style="margin:2px 0 0;font-size:13px;font-weight:700;color:#374151">${titulo}</p>
        <p style="margin:2px 0 0;font-size:11px;color:#9CA3AF">Ref. normativa: ${norma}</p>
      </div>
      <div style="text-align:right">
        <p style="margin:0;font-size:10px;color:#9CA3AF">Ref. doc: <b style="color:#6B7280">${ref}</b></p>
        <p style="margin:2px 0 0;font-size:10px;color:#9CA3AF">${dataHora}</p>
        ${_responsavel ? `<p style="margin:4px 0 0;font-size:11px;font-weight:700;color:#374151">Resp.: ${_responsavel}</p>` : ''}
        ${_obra ? `<p style="margin:2px 0 0;font-size:11px;color:#6B7280">Obra: ${_obra}</p>` : ''}
      </div>
    </div>
  `
}

function footer(normas: string): string {
  return `
    <div style="margin-top:32px;padding-top:12px;border-top:1px solid #E5E7EB">
      <p style="font-size:9px;color:#9CA3AF;text-align:center;line-height:16px">
        ⚠️ Documento orientativo gerado pelo app Elétrica NBR — não substitui a responsabilidade técnica de engenheiro ou técnico eletricista habilitado (ART/CREA/CFT).<br>
        ${normas}
      </p>
    </div>
    </div>
  `
}

function rowHtml(label: string, value: string): string {
  return `<tr><td style="padding:6px 8px;color:#6B7280;font-size:13px">${label}</td><td style="padding:6px 8px;font-weight:700;color:#111827;font-size:13px">${value}</td></tr>`
}

function table(rows: string[]): string {
  return `<table style="width:100%;border-collapse:collapse;margin:12px 0">${rows.join('')}</table>`
}

// ── PDF — Bitola ─────────────────────────────────────────────────────────────

interface DadosBitolaPDF {
  potenciaOuCorrente: string
  tensao: string
  comprimento: string
  metodo: string
  material: string
  bitolaRecomendada: string
  correnteCalc: string
  capacidadeNominal: string
  quedaTensao: string
  quedaAlerta: boolean
  aviso?: string
}

export async function exportarBitolaPDF(dados: DadosBitolaPDF): Promise<void> {
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:sans-serif;margin:0;padding:0;background:#fff}
      @page{size:A4;margin:20mm}
    </style></head><body>
    ${header('Cálculo de Bitola — NBR 5410', 'NBR 5410:2004 item 6.2')}
    <h3 style="color:#F59E0B;font-size:14px;margin-bottom:4px">Dados de entrada</h3>
    ${table([
      rowHtml('Potência / Corrente', dados.potenciaOuCorrente),
      rowHtml('Tensão', dados.tensao),
      rowHtml('Comprimento do circuito', dados.comprimento),
      rowHtml('Método de instalação', dados.metodo),
      rowHtml('Material', dados.material),
    ])}
    <h3 style="color:#F59E0B;font-size:14px;margin-top:20px;margin-bottom:4px">Resultado</h3>
    <div style="background:#FEF3C7;border-radius:8px;padding:16px;text-align:center;margin-bottom:12px">
      <p style="margin:0;color:#92400E;font-size:13px">Bitola recomendada</p>
      <p style="margin:4px 0 0;color:#92400E;font-size:32px;font-weight:900">${dados.bitolaRecomendada} mm²</p>
    </div>
    ${table([
      rowHtml('Corrente de projeto', dados.correnteCalc),
      rowHtml('Capacidade nominal (${dados.metodo})', dados.capacidadeNominal),
      rowHtml('Queda de tensão', dados.quedaTensao + (dados.quedaAlerta ? ' ⚠️ ACIMA DE 4%' : ' ✓')),
    ])}
    ${dados.quedaAlerta ? `<div style="background:#FFFBEB;border:1px solid #F59E0B;border-radius:6px;padding:10px;margin:8px 0"><p style="margin:0;font-size:12px;color:#92400E">⚠️ Queda de tensão acima de 4% (limite NBR 5410 item 6.2.7). Considere aumentar a seção do cabo ou reduzir o comprimento.</p></div>` : ''}
    ${dados.aviso ? `<div style="background:#FEF2F2;border:1px solid #DC2626;border-radius:6px;padding:10px;margin:8px 0"><p style="margin:0;font-size:12px;color:#DC2626">${dados.aviso}</p></div>` : ''}
    ${footer('NBR 5410:2004 • NBR 14136:2012')}
    </body></html>
  `
  await imprimirECompartilhar(html, 'Bitola-NBR5410')
}

// ── PDF — Disjuntor ──────────────────────────────────────────────────────────

interface DadosDisjuntorPDF {
  potencia: string
  tensao: string
  tipoCarga: string
  ambientes: string
  corrente: string
  disjuntorIn: string
  fatorPotencia: string
  drObrigatorio: boolean
  motivoDR?: string
}

export async function exportarDisjuntorPDF(dados: DadosDisjuntorPDF): Promise<void> {
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:sans-serif;margin:0;padding:0;background:#fff}
      @page{size:A4;margin:20mm}
    </style></head><body>
    ${header('Cálculo de Disjuntor — NBR 5410', 'NBR 5410:2004 seção 5.3')}
    <h3 style="color:#F59E0B;font-size:14px;margin-bottom:4px">Dados de entrada</h3>
    ${table([
      rowHtml('Potência', dados.potencia),
      rowHtml('Tensão', dados.tensao),
      rowHtml('Tipo de carga', dados.tipoCarga),
      rowHtml('Ambientes', dados.ambientes || '—'),
    ])}
    <h3 style="color:#F59E0B;font-size:14px;margin-top:20px;margin-bottom:4px">Resultado</h3>
    <div style="background:#FEF3C7;border-radius:8px;padding:16px;text-align:center;margin-bottom:12px">
      <p style="margin:0;color:#92400E;font-size:13px">Disjuntor recomendado</p>
      <p style="margin:4px 0 0;color:#92400E;font-size:32px;font-weight:900">${dados.disjuntorIn}A</p>
    </div>
    ${table([
      rowHtml('Corrente de projeto', dados.corrente + ' A'),
      rowHtml('Fator de potência (cosφ)', dados.fatorPotencia),
    ])}
    <div style="background:${dados.drObrigatorio ? '#FFFBEB' : '#F0FDF4'};border:1px solid ${dados.drObrigatorio ? '#F59E0B' : '#16A34A'};border-radius:6px;padding:12px;margin:12px 0">
      <p style="margin:0;font-size:13px;font-weight:700;color:${dados.drObrigatorio ? '#92400E' : '#15803D'}">
        ${dados.drObrigatorio ? '⚠️ DR Obrigatório' : '✓ DR Não Obrigatório'}
      </p>
      ${dados.motivoDR ? `<p style="margin:4px 0 0;font-size:12px;color:#92400E">${dados.motivoDR}</p>` : ''}
    </div>
    ${footer('NBR 5410:2004 • NBR 14136:2012')}
    </body></html>
  `
  await imprimirECompartilhar(html, 'Disjuntor-NBR5410')
}

// ── PDF — Aterramento ────────────────────────────────────────────────────────

interface DadosAterramentoPDF {
  terreno: string
  aplicacao: string
  comprimentoHaste: string
  diametroHaste: string
  numHastes: string
  secaoFase: string
  resistividadeSolo: string
  resistenciaUmaHaste: string
  resistenciaResultante: string
  limiteNorma: string
  aprovado: boolean
  hastesNecessarias: string
  secaoCaboTerra: string
  secaoEquipotencializacao: string
  observacoes: string[]
}

export async function exportarAterramentoPDF(dados: DadosAterramentoPDF): Promise<void> {
  const corStatus = dados.aprovado ? '#15803D' : '#DC2626'
  const bgStatus = dados.aprovado ? '#F0FDF4' : '#FEF2F2'
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:sans-serif;margin:0;padding:0;background:#fff}
      @page{size:A4;margin:20mm}
    </style></head><body>
    ${header('Aterramento Elétrico — NBR 5410', 'NBR 5410:2004 seção 5.4 • Fórmula de Dwight')}
    <h3 style="color:#F59E0B;font-size:14px;margin-bottom:4px">Dados de entrada</h3>
    ${table([
      rowHtml('Tipo de solo', dados.terreno),
      rowHtml('Aplicação', dados.aplicacao),
      rowHtml('Comprimento da haste', dados.comprimentoHaste + ' m'),
      rowHtml('Diâmetro da haste', dados.diametroHaste + ' mm'),
      rowHtml('Número de hastes', dados.numHastes),
      rowHtml('Seção do fase', dados.secaoFase + ' mm²'),
    ])}
    <h3 style="color:#F59E0B;font-size:14px;margin-top:20px;margin-bottom:4px">Resultado</h3>
    <div style="background:${bgStatus};border:2px solid ${corStatus};border-radius:8px;padding:14px;text-align:center;margin-bottom:12px">
      <p style="margin:0;font-size:20px;font-weight:900;color:${corStatus}">${dados.aprovado ? '✓ APROVADO' : '✗ REPROVADO'}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#6B7280">${dados.resistenciaResultante} Ω (limite: ${dados.limiteNorma} Ω)</p>
    </div>
    ${table([
      rowHtml('Resistividade do solo', dados.resistividadeSolo + ' Ω·m'),
      rowHtml('Resistência (1 haste)', dados.resistenciaUmaHaste + ' Ω'),
      rowHtml('Resistência resultante', dados.resistenciaResultante + ' Ω'),
      rowHtml('Hastes necessárias (mínimo)', dados.hastesNecessarias),
      rowHtml('Condutor de proteção (PE)', dados.secaoCaboTerra + ' mm²'),
      rowHtml('Equipotencialização', dados.secaoEquipotencializacao + ' mm²'),
    ])}
    ${dados.observacoes.map(o => `<p style="font-size:12px;color:#92400E;margin:4px 0">• ${o}</p>`).join('')}
    ${footer('NBR 5410:2004 seção 5.4 • NBR 5419:2015')}
    </body></html>
  `
  await imprimirECompartilhar(html, 'Aterramento-NBR5410')
}

// ── PDF — SPDA ───────────────────────────────────────────────────────────────

interface DadosSPDAPDF {
  dimensoes: string
  fatorForma: string
  Ng: string
  tipoUso: string
  Nd: string
  Nc: string
  relacao: string
  spda: boolean
  nivelProtecao: string
  eficiencia: string
  raioEsfera: string
  numDescidas: string
  observacoes: string[]
}

export async function exportarSPDAPDF(dados: DadosSPDAPDF): Promise<void> {
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:sans-serif;margin:0;padding:0;background:#fff}
      @page{size:A4;margin:20mm}
    </style></head><body>
    ${header('SPDA — Para-Raios', 'NBR 5419:2015 partes 1–4')}
    <h3 style="color:#F59E0B;font-size:14px;margin-bottom:4px">Dados de entrada</h3>
    ${table([
      rowHtml('Dimensões', dados.dimensoes),
      rowHtml('Posição', dados.fatorForma),
      rowHtml('Densidade de descargas (Ng)', dados.Ng + ' descargas/km²/ano'),
      rowHtml('Tipo de uso', dados.tipoUso),
    ])}
    <h3 style="color:#F59E0B;font-size:14px;margin-top:20px;margin-bottom:4px">Resultado</h3>
    <div style="background:${dados.spda ? '#FEF2F2' : '#F0FDF4'};border:2px solid ${dados.spda ? '#DC2626' : '#16A34A'};border-radius:8px;padding:14px;text-align:center;margin-bottom:12px">
      <p style="margin:0;font-size:18px;font-weight:900;color:${dados.spda ? '#DC2626' : '#15803D'}">${dados.spda ? '⚡ SPDA NECESSÁRIO' : '✓ SPDA NÃO OBRIGATÓRIO'}</p>
      <p style="margin:4px 0 0;font-size:13px;color:#6B7280">Nd/Nc = ${dados.relacao}</p>
    </div>
    ${dados.spda ? `
    <div style="background:#FEF3C7;border-radius:8px;padding:12px;text-align:center;margin-bottom:12px">
      <p style="margin:0;font-size:13px;color:#92400E">Nível de Proteção</p>
      <p style="margin:4px 0 0;font-size:36px;font-weight:900;color:#92400E">NP ${dados.nivelProtecao}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#92400E">Eficiência mínima: ${dados.eficiencia}%</p>
    </div>` : ''}
    ${table([
      rowHtml('Nd (freq. esperada)', dados.Nd + ' /ano'),
      rowHtml('Nc (freq. aceitável)', dados.Nc + ' /ano'),
      rowHtml('Raio da esfera rolante', dados.raioEsfera + ' m'),
      rowHtml('Nº mínimo de descidas', dados.numDescidas),
    ])}
    ${dados.observacoes.map(o => `<p style="font-size:12px;color:#92400E;margin:4px 0">• ${o}</p>`).join('')}
    ${footer('NBR 5419:2015 partes 1–4 • NBR IEC 62305')}
    </body></html>
  `
  await imprimirECompartilhar(html, 'SPDA-NBR5419')
}

// ── PDF — Motor ──────────────────────────────────────────────────────────────

interface DadosMotorPDF {
  potencia: string
  tensao: string
  fases: string
  tipoPartida: string
  correnteNominal: string
  correntePartida: string
  fatorPartida: string
  disjuntorMotor: string
  contator: string
  releMin: string
  releMax: string
  secaoCabo: string
  observacoes: string[]
}

export async function exportarMotorPDF(dados: DadosMotorPDF): Promise<void> {
  const html = `
    <!DOCTYPE html><html><head><meta charset="utf-8"><style>
      body{font-family:sans-serif;margin:0;padding:0;background:#fff}
      @page{size:A4;margin:20mm}
    </style></head><body>
    ${header('Dimensionamento de Motor', 'NBR IEC 60947 • NBR IEC 60034')}
    <h3 style="color:#F59E0B;font-size:14px;margin-bottom:4px">Dados do motor</h3>
    ${table([
      rowHtml('Potência', dados.potencia + ' kW'),
      rowHtml('Tensão', dados.tensao + ' V'),
      rowHtml('Alimentação', dados.fases),
      rowHtml('Tipo de partida', dados.tipoPartida),
    ])}
    <h3 style="color:#F59E0B;font-size:14px;margin-top:20px;margin-bottom:4px">Correntes</h3>
    <div style="display:flex;gap:12px;margin-bottom:12px">
      <div style="flex:1;background:#FEF3C7;border-radius:8px;padding:12px;text-align:center">
        <p style="margin:0;font-size:12px;color:#92400E">Corrente Nominal (In)</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#92400E">${dados.correnteNominal} A</p>
      </div>
      <div style="flex:1;background:#FFF7ED;border-radius:8px;padding:12px;text-align:center">
        <p style="margin:0;font-size:12px;color:#C2410C">Corrente de Partida (${dados.fatorPartida}×In)</p>
        <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#C2410C">${dados.correntePartida} A</p>
      </div>
    </div>
    <h3 style="color:#F59E0B;font-size:14px;margin-bottom:4px">Componentes selecionados</h3>
    ${table([
      rowHtml('Disjuntor motor (curva D)', dados.disjuntorMotor + ' A'),
      rowHtml('Contator (AC-3)', dados.contator + ' A'),
      rowHtml('Relé térmico (faixa)', dados.releMin + ' – ' + dados.releMax + ' A'),
      rowHtml('Seção do cabo de alimentação', dados.secaoCabo + ' mm²'),
    ])}
    ${dados.observacoes.map(o => `<p style="font-size:12px;color:#92400E;margin:4px 0">• ${o}</p>`).join('')}
    ${footer('NBR IEC 60947 • NBR IEC 60034 • NBR 5410:2004')}
    </body></html>
  `
  await imprimirECompartilhar(html, 'Motor-IEC60947')
}

// ── Utilitário ────────────────────────────────────────────────────────────────

async function imprimirECompartilhar(html: string, nomeBase: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: `Compartilhar ${nomeBase}`,
    })
  }
}

// ── PDF — Diagrama Unifilar ──────────────────────────────────────────────────

export async function exportarUnifilarPDF(dados: DadosUnifilar): Promise<void> {
  const agora = new Date()
  const refUnf = `ENBR-UNF-${agora.getFullYear()}${String(agora.getMonth()+1).padStart(2,'0')}${String(agora.getDate()).padStart(2,'0')}-${String(agora.getHours()).padStart(2,'0')}${String(agora.getMinutes()).padStart(2,'0')}`

  const ramosSVG = dados.ramos.map((r, i) => {
    const cx = 20 + i * 72
    const isDR = r.isDR
    const cor = isDR ? '#DC2626' : '#374151'
    return `
      <line x1="${cx}" y1="60" x2="${cx}" y2="76" stroke="#374151" stroke-width="1.5"/>
      <rect x="${cx-14}" y="76" width="28" height="44" fill="none" stroke="${cor}" stroke-width="1.5" rx="2"/>
      <line x1="${cx-14}" y1="120" x2="${cx+14}" y2="76" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="${cx}" y="102" text-anchor="middle" fill="${cor}" font-size="10" font-weight="bold">${r.amperagem}A</text>
      ${isDR ? `<text x="${cx}" y="72" text-anchor="middle" fill="#DC2626" font-size="9" font-weight="bold">DR</text>` : ''}
      <line x1="${cx}" y1="120" x2="${cx}" y2="140" stroke="#374151" stroke-width="1.5"/>
      <circle cx="${cx}" cy="154" r="14" fill="none" stroke="#F59E0B" stroke-width="1.5"/>
      <text x="${cx}" y="180" text-anchor="middle" fill="#374151" font-size="9">${r.nome.length > 10 ? r.nome.slice(0,9) + '…' : r.nome}</text>
      <text x="${cx}" y="192" text-anchor="middle" fill="#6B7280" font-size="8">${r.bitola}</text>
    `
  }).join('')

  const svgW = Math.max(400, dados.ramos.length * 72 + 40)
  const svgH = 210

  const html = `
    ${header(`Diagrama Unifilar — ${dados.nomeProjeto}`, 'NBR 5410')}
    <div style="background:#FEF3C7;border-radius:8px;padding:12px 16px;margin-bottom:16px">
      <p style="margin:0;font-size:13px;color:#374151"><b>Projeto:</b> ${dados.nomeProjeto}</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6B7280">Tensão: ${dados.tensao} | Corrente geral: ${dados.iGeneral}A | Bitola principal: ${dados.bitolaPrincipal}</p>
      <p style="margin:2px 0 0;font-size:10px;color:#9CA3AF">Ref.: ${refUnf}</p>
    </div>
    <div style="overflow-x:auto;margin-bottom:20px">
      <svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" style="display:block;max-width:100%">
        <rect x="4" y="4" width="${svgW-8}" height="52" fill="none" stroke="#F59E0B" stroke-width="2" rx="6"/>
        <text x="${svgW/2}" y="24" text-anchor="middle" fill="#111827" font-size="13" font-weight="bold">QDC — ${dados.nomeProjeto}</text>
        <text x="${svgW/2}" y="44" text-anchor="middle" fill="#F59E0B" font-size="11">${dados.tensao} | ${dados.iGeneral}A — ${dados.bitolaPrincipal}</text>
        <line x1="12" y1="60" x2="${svgW-12}" y2="60" stroke="#F59E0B" stroke-width="5" stroke-linecap="round"/>
        ${ramosSVG}
      </svg>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#F59E0B">
          <th style="padding:8px;text-align:left;color:#fff">#</th>
          <th style="padding:8px;text-align:left;color:#fff">Circuito</th>
          <th style="padding:8px;text-align:center;color:#fff">Amperagem</th>
          <th style="padding:8px;text-align:center;color:#fff">Bitola</th>
          <th style="padding:8px;text-align:center;color:#fff">DR</th>
        </tr>
      </thead>
      <tbody>
        ${dados.ramos.map((r, i) => `
          <tr style="background:${i%2===0?'#FAFAF9':'#fff'}">
            <td style="padding:6px 8px;color:#6B7280">${i+1}</td>
            <td style="padding:6px 8px;font-weight:600;color:#111827">${r.nome}</td>
            <td style="padding:6px 8px;text-align:center;font-weight:700;color:#D97706">${r.amperagem}A</td>
            <td style="padding:6px 8px;text-align:center;color:#374151">${r.bitola}</td>
            <td style="padding:6px 8px;text-align:center;color:${r.isDR?'#DC2626':'#9CA3AF'};font-weight:700">${r.isDR ? 'SIM' : '—'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    ${footer('NBR 5410:2004 — Instalações Elétricas de Baixa Tensão')}
  `

  const { uri } = await Print.printToFileAsync({ html, base64: false })
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, {
      UTI: '.pdf',
      mimeType: 'application/pdf',
      dialogTitle: 'Compartilhar Diagrama Unifilar',
    })
  }
}
