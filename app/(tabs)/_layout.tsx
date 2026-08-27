import { useEffect } from 'react'
import { Alert } from 'react-native'
import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS } from '../../constants/theme'
import { useAppTheme } from '../../hooks/useAppTheme'
import { getConfig, setConfig, initDB } from '../../lib/db'
import { getToken, clearAuth } from '../../lib/secure'
import { verifyTokenOnline } from '../../lib/activation'
import { checkNormasAlert, marcarAlertaVisto } from '../../lib/normasAlert'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({ name, color }: { name: IoniconName; focused: boolean; color: any }) {
  return <Ionicons name={name} size={22} color={color} accessible={false} />
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()
  const { colors } = useAppTheme()

  useEffect(() => {
    async function checkAuth() {
      initDB()
      const token = await getToken()
      if (!token) { router.replace('/ativar'); return }

      // Revalida online a cada 7 dias — silencioso
      const lastVerified = parseInt(getConfig('lastTokenVerified') ?? '0')
      if (Date.now() - lastVerified > 7 * 24 * 60 * 60 * 1000) {
        verifyTokenOnline(token).then(valid => {
          if (!valid) {
            clearAuth().then(() => router.replace('/ativar'))
          } else {
            setConfig('lastTokenVerified', String(Date.now()))
          }
        })
      }

      // Alerta de normas — in-app, zero dependências externas
      const alerta = checkNormasAlert()
      if (alerta.hasAlert) {
        Alert.alert('Novidades — Elétrica NBR', alerta.mensagem, [
          { text: 'Ver mais tarde', style: 'cancel' },
          { text: 'OK, entendi', onPress: marcarAlertaVisto },
        ])
      }
    }
    checkAuth()
  }, [])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 4,
          height: 58 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      {/* Abas visíveis — hub + utilitários */}
      <Tabs.Screen name="index"       options={{ title: 'Início',      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'apps' : 'apps-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="historico"   options={{ title: 'Histórico',   tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="normas"      options={{ title: 'Normas',      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="sobre"       options={{ title: 'Sobre',       tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'information-circle' : 'information-circle-outline'} focused={focused} color={color} /> }} />

      {/* Módulos de cálculo — acessados via grid da aba Início, ocultos da tab bar */}
      <Tabs.Screen name="bitola"       options={{ href: null }} />
      <Tabs.Screen name="disjuntor"    options={{ href: null }} />
      <Tabs.Screen name="tomadas"      options={{ href: null }} />
      <Tabs.Screen name="circuitos"    options={{ href: null }} />
      <Tabs.Screen name="aterramento"  options={{ href: null }} />
      <Tabs.Screen name="spda"         options={{ href: null }} />
      <Tabs.Screen name="motores"      options={{ href: null }} />
      <Tabs.Screen name="emergencia"   options={{ href: null }} />
      <Tabs.Screen name="esquemas"     options={{ href: null }} />
      <Tabs.Screen name="orcamento"    options={{ href: null }} />
      <Tabs.Screen name="conversor"    options={{ href: null }} />
      <Tabs.Screen name="iluminacao"   options={{ href: null }} />
      <Tabs.Screen name="widget"       options={{ href: null }} />
      <Tabs.Screen name="unifilar"     options={{ href: null }} />
    </Tabs>
  )
}
