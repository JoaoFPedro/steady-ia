import { useEffect, useState } from 'react';
import { Tabs } from 'expo-router';
import { color, textAlpha } from '../../src/theme/nocturne';
import { coachingApi } from '../../src/services';
import { hasPersonalArea } from '../../src/coaching/roleNavigation';

/**
 * Dashboard e Planejamento (STORY-006). Cada aba desenha o próprio cabeçalho
 * — header do navegador desligado aqui, não só no Stack raiz.
 */
export default function TabsLayout() {
  const [isPersonal, setIsPersonal] = useState(false);

  useEffect(() => {
    let active = true;
    coachingApi.account().then((result) => {
      if (active && result.status === 'ok') setIsPersonal(hasPersonalArea(result.data.roles));
    });
    return () => { active = false; };
  }, []);

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
      <Tabs.Screen name="workouts" options={{ title: 'Treinos' }} />
      <Tabs.Screen name="personal" options={{ title: 'Personal', href: isPersonal ? undefined : null }} />
    </Tabs>
  );
}
