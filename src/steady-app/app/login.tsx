import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { HeroCard, Kicker, Muted, NoticeStrip, PrimaryButton } from '../src/ui/Nocturne';
import { color, space, type } from '../src/theme/nocturne';
import { googleSession, isGoogleConfigured } from '../src/services';

/**
 * Entrada do app. Login exclusivamente pelo Google — a Constituição do projeto
 * proíbe senha própria, o que tira do MVP toda a superfície de ataque de
 * armazenamento de credencial.
 */
export default function LoginScreen() {
  const router = useRouter();
  const [entrando, setEntrando] = useState(false);
  const [falhou, setFalhou] = useState(false);

  async function entrar() {
    setEntrando(true);
    setFalhou(false);

    const token = await googleSession.signIn();

    setEntrando(false);

    if (token) router.replace('/');
    else setFalhou(true);
  }

  return (
    <View style={s.screen}>
      <View style={s.top}>
        <Kicker accent>Steady</Kicker>
        <Text style={s.title}>Treine forte{'\n'}sem se machucar</Text>
        <Muted>
          Registre suas corridas e treinos de musculação. O Steady avisa quando a combinação
          da semana indica risco de sobrecarga.
        </Muted>
      </View>

      <HeroCard>
        <Kicker accent>Entrar</Kicker>
        <Text style={s.heroText}>
          Seus treinos ficam ligados à sua conta Google. O Steady nunca guarda senha.
        </Text>
      </HeroCard>

      {!isGoogleConfigured && (
        <View style={s.aviso}>
          <NoticeStrip>
            <Text style={s.avisoTexto}>
              <Text style={s.avisoForte}>Login não configurado. </Text>
              Falta definir EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID com o Client ID do Google.
            </Text>
          </NoticeStrip>
        </View>
      )}

      {falhou && (
        <View style={s.aviso}>
          <NoticeStrip>
            <Text style={s.avisoTexto}>
              <Text style={s.avisoForte}>Não foi possível entrar. </Text>
              Tente novamente.
            </Text>
          </NoticeStrip>
        </View>
      )}

      <View style={s.acao}>
        <PrimaryButton
          label={entrando ? 'Entrando…' : 'Entrar com o Google'}
          onPress={entrar}
          disabled={entrando || !isGoogleConfigured}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: space[8],
    justifyContent: 'center',
  },
  top: { marginBottom: space[8] },
  title: {
    color: color.text,
    fontSize: type.title,
    lineHeight: type.title * 1.15,
    marginTop: space[3],
    marginBottom: space[4],
  },
  heroText: {
    color: color.text,
    fontSize: type.bodySm,
    lineHeight: 20,
    marginTop: space[3],
  },
  aviso: { marginTop: space[6] },
  avisoTexto: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 19 },
  avisoForte: { color: color.text },
  acao: { marginTop: space[8] },
});
