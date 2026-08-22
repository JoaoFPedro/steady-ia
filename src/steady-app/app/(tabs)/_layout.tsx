import { Tabs } from 'expo-router';
import { color, textAlpha } from '../../src/theme/nocturne';

/**
 * Dashboard e Planejamento (STORY-006). Cada aba desenha o próprio cabeçalho
 * — header do navegador desligado aqui, não só no Stack raiz.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: color.surface, borderTopColor: textAlpha.divider },
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: textAlpha.muted,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
      <Tabs.Screen name="planning" options={{ title: 'Planejamento' }} />
    </Tabs>
  );
}
