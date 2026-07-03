import { useEffect } from 'react'
import { Tabs, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { COLORS } from '../../constants/theme'
import { getConfig, setConfig, initDB } from '../../lib/db'
import { getToken, clearAuth } from '../../lib/secure'
import { verifyTokenOnline } from '../../lib/activation'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function TabIcon({ name, focused }: { name: IoniconName; focused: boolean }) {
  return <Ionicons name={name} size={22} color={focused ? COLORS.primary : COLORS.textLight} />
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets()

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
    }
    checkAuth()
  }, [])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.card,
          borderTopColor: COLORS.border,
          paddingBottom: insets.bottom + 4,
          height: 58 + insets.bottom,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="bitola"       options={{ title: 'Bitola',      tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'flash' : 'flash-outline'} focused={focused} /> }} />
      <Tabs.Screen name="disjuntor"   options={{ title: 'Disjuntor',   tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'shield' : 'shield-outline'} focused={focused} /> }} />
      <Tabs.Screen name="tomadas"     options={{ title: 'Tomadas',     tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'hardware-chip' : 'hardware-chip-outline'} focused={focused} /> }} />
      <Tabs.Screen name="circuitos"   options={{ title: 'Circuitos',   tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'git-network' : 'git-network-outline'} focused={focused} /> }} />
      <Tabs.Screen name="aterramento" options={{ title: 'Aterram.',    tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'earth' : 'earth-outline'} focused={focused} /> }} />
      <Tabs.Screen name="spda"        options={{ title: 'SPDA',        tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'thunderstorm' : 'thunderstorm-outline'} focused={focused} /> }} />
      <Tabs.Screen name="motores"     options={{ title: 'Motores',     tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'settings' : 'settings-outline'} focused={focused} /> }} />
      <Tabs.Screen name="emergencia"  options={{ title: 'Emergência',  tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'warning' : 'warning-outline'} focused={focused} /> }} />
      <Tabs.Screen name="historico"   options={{ title: 'Histórico',   tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'time' : 'time-outline'} focused={focused} /> }} />
      <Tabs.Screen name="normas"      options={{ title: 'Normas',      tabBarIcon: ({ focused }) => <TabIcon name={focused ? 'book' : 'book-outline'} focused={focused} /> }} />
    </Tabs>
  )
}
