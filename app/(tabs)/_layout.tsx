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
      {/* Módulos técnicos existentes */}
      <Tabs.Screen name="bitola"       options={{ title: 'Bitola',      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'flash' : 'flash-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="disjuntor"   options={{ title: 'Disjuntor',   tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="tomadas"     options={{ title: 'Tomadas',     tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'hardware-chip' : 'hardware-chip-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="circuitos"   options={{ title: 'Circuitos',   tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'git-network' : 'git-network-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="aterramento" options={{ title: 'Aterram.',    tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'earth' : 'earth-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="spda"        options={{ title: 'SPDA',        tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'thunderstorm' : 'thunderstorm-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="motores"     options={{ title: 'Motores',     tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="emergencia"  options={{ title: 'Emergência',  tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'warning' : 'warning-outline'} focused={focused} color={color} /> }} />

      {/* Novas abas v1.4.0 */}
      <Tabs.Screen name="orcamento"   options={{ title: 'Orçamento',   tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'calculator' : 'calculator-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="conversor"   options={{ title: 'Conversor',   tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'swap-horizontal' : 'swap-horizontal-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="iluminacao"  options={{ title: 'Iluminação',  tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'sunny' : 'sunny-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="widget"      options={{ title: 'Referência',  tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'grid' : 'grid-outline'} focused={focused} color={color} /> }} />

      {/* Utilitários */}
      <Tabs.Screen name="historico"   options={{ title: 'Histórico',   tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="normas"      options={{ title: 'Normas',      tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} color={color} /> }} />
      <Tabs.Screen name="sobre"       options={{ title: 'Sobre',       tabBarIcon: ({ focused, color }) => <TabIcon name={focused ? 'information-circle' : 'information-circle-outline'} focused={focused} color={color} /> }} />
    </Tabs>
  )
}
