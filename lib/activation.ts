import { getDeviceId } from './secure'

const API_BASE = 'https://activation.sismeipro.com.br'
const APP_ID = 'eletrica-nbr'

export interface ActivationResult {
  ok: boolean
  token?: string
  error?: string
  trialEndsAt?: string
}

export async function activateOnline(email: string, codigo: string): Promise<ActivationResult> {
  try {
    const device_id = await getDeviceId()
    const res = await fetch(`${API_BASE}/api/ativar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_id: APP_ID,
        email: email.toLowerCase().trim(),
        codigo: codigo.trim().toUpperCase(),
        device_id,
      }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error ?? 'Código inválido.' }
    return { ok: true, token: data.token }
  } catch {
    return { ok: false, error: 'Sem conexão. Verifique sua internet e tente novamente.' }
  }
}

// Teste grátis de 15 dias — só e-mail, sem código. Depois do prazo, verifyTokenOnline
// devolve reason "trial_expired" e o app pede pra ativar com o código de compra.
export async function activateTrial(email: string): Promise<ActivationResult> {
  try {
    const device_id = await getDeviceId()
    const res = await fetch(`${API_BASE}/api/trial`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, email: email.toLowerCase().trim(), device_id }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await res.json()
    if (!res.ok) return { ok: false, error: data.error ?? 'Não foi possível iniciar o teste grátis.' }
    return { ok: true, token: data.token, trialEndsAt: data.trial_ends_at }
  } catch {
    return { ok: false, error: 'Sem conexão. Verifique sua internet e tente novamente.' }
  }
}

export interface VerifyResult {
  valid: boolean
  reason?: string
}

export async function verifyTokenOnline(token: string): Promise<VerifyResult> {
  try {
    const device_id = await getDeviceId()
    const res = await fetch(`${API_BASE}/api/verificar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_id: APP_ID, token, device_id }),
      signal: AbortSignal.timeout(5000),
    })
    if (res.ok) return { valid: true }
    const data = await res.json().catch(() => ({}) as { reason?: string })
    return { valid: false, reason: data.reason }
  } catch {
    return { valid: true }
  }
}
