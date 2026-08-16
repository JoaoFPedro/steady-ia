import { useEffect, useState } from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { color } from '../src/theme/nocturne';
import { configureAuth, googleSession, syncEngine } from '../src/services';
import { startAutoSync } from '../src/sync/autoSync';
import { netInfoConnectivity } from '../src/sync/netInfoConnectivity';

configureAuth();

export default function RootLayout() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);

  // Tenta reaproveitar a sessão já autorizada no aparelho antes de mostrar
  // qualquer tela: quem já entrou uma vez não deve ver o login de novo.
  useEffect(() => {
    let ativo = true;

    (async () => {
      const token = (await googleSession.currentToken()) ?? (await googleSession.refresh());
      if (!ativo) return;

      if (!token) router.replace('/login');
      setVerificando(false);
    })();

    return () => {
      ativo = false;
    };
  }, [router]);

  // Enquanto o app estiver aberto, a fila se esvazia sozinha na volta da
  // conexão — o corredor não precisa reabrir nada nem registrar de novo.
  useEffect(() => startAutoSync(netInfoConnectivity, syncEngine), []);

  if (verificando) {
    return (
      <View style={s.carregando}>
        <StatusBar style="light" />
        <ActivityIndicator color={color.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: color.bg },
          headerTintColor: color.text,
          headerTitleStyle: { fontWeight: '500' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: color.bg },
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="index" options={{ title: 'Steady' }} />
        <Stack.Screen name="log/run" options={{ title: 'Registrar corrida' }} />
        <Stack.Screen name="log/strength" options={{ title: 'Registrar musculação' }} />
        <Stack.Screen name="log/pain" options={{ title: 'Registrar dor' }} />
        <Stack.Screen name="history" options={{ title: 'Histórico' }} />
        <Stack.Screen name="account" options={{ title: 'Conta' }} />
      </Stack>
    </>
  );
}

const s = StyleSheet.create({
  carregando: {
    flex: 1,
    backgroundColor: color.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
