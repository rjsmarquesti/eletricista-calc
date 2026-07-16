import { getConfig, setConfig } from './db'

// Incrementar esta versão quando houver atualização real de tabelas de normas
const NORMAS_ALERT_VERSION = '2026-07-15'

const MENSAGEM = [
  'Elétrica NBR v1.4.0 — Novidades:',
  '',
  '• Calculadora de Orçamento (material + MO)',
  '• Conversor de unidades (kW↔CV↔kVA, mm²↔AWG)',
  '• Calculadora de Iluminação (NBR ISO/CIE 8995-1)',
  '• Referência Rápida com modo escuro',
  '',
  'Tabelas NBR atualizadas: jul/2026.',
].join('\n')

export function checkNormasAlert(): { hasAlert: boolean; mensagem: string } {
  const seen = getConfig('norma_alert_seen')
  if (seen === NORMAS_ALERT_VERSION) return { hasAlert: false, mensagem: '' }
  return { hasAlert: true, mensagem: MENSAGEM }
}

export function marcarAlertaVisto(): void {
  setConfig('norma_alert_seen', NORMAS_ALERT_VERSION)
}
