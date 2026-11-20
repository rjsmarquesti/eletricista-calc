import { Share } from 'react-native'

export async function compartilharTexto(titulo: string, texto: string): Promise<void> {
  await Share.share({
    title: titulo,
    message: `⚡ Eletricomtec Pro — ${titulo}\n\n${texto}\n\nGerado pelo app Eletricomtec Pro`,
  })
}
