import * as Print from 'expo-print'
import * as Sharing from 'expo-sharing'

function header(titulo: string): string {
  return `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
    <div style="border-bottom:3px solid #F59E0B;padding-bottom:12px;margin-bottom:20px">
      <h1 style="margin:0;font-size:22px;color:#111827">⚡ Elétrica NBR</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#6B7280">${titulo}</p>
      <p style="margin:4px 0 0;font-size:11px;color:#9CA3AF">Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  `
}

function footer(): string {
  return `
    <div style="margin-top:32px;padding-top:12px;border-top:1px solid #E5E7EB">
      <p style="font-size:10px;color:#9CA3AF;text-align:center">
        ⚠️ Resultado orientativo — não substitui a responsabilidade técnica de engenheiro ou técnico eletricista habilitado (ART/CREA).<br>
        NBR 5410:2004 • NBR 14136:2012
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
    ${header('Cálculo de Bitola — NBR 5410')}
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
    ${footer()}
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
    ${header('Cálculo de Disjuntor — NBR 5410')}
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
    ${footer()}
    </body></html>
  `
  await imprimirECompartilhar(html, 'Disjuntor-NBR5410')
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
