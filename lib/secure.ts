import * as SecureStore from 'expo-secure-store'

export async function getSecure(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key)
}

export async function setSecure(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value)
}

export async function deleteSecure(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key)
}

const TOKEN_KEY = 'activation_token'

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(TOKEN_KEY),
    SecureStore.deleteItemAsync('email'),
  ])
}

const DEVICE_ID_KEY = 'device_id'

function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, char => {
    const rand = (Math.random() * 16) | 0
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8
    return value.toString(16)
  })
}

// Identificador persistente da instalação — gerado uma vez e salvo no SecureStore.
// Usado pelo Activation Service para vincular o código de ativação a um único aparelho.
export async function getDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY)
  if (existing) return existing
  const id = generateDeviceId()
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id)
  return id
}
