import { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Kicker, Muted, NoticeStrip, SecondaryButton } from '../src/ui/Nocturne';
import { color, space, type } from '../src/theme/nocturne';
import { googleSession, recordQueue, syncEngine } from '../src/services';
import { attemptSignOut, discardAndSignOut, type SignOutOutcome } from '../src/account/signOutAccount';

/**
 * Tela Conta — mostra em qual conta o corredor está e é o único lugar de onde se
 * sai dela.
 *
 * A saída não fica junto das ações de registro de propósito: encerrar sessão não
 * pode ser um toque acidental no meio de um treino.
 */
export default function AccountScreen() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [saindo, setSaindo] = useState(false);
  const [falhou, setFalhou] = useState(false);

  useEffect(() => {
    let ativo = true;

    googleSession.currentAccount().then((conta) => {
      if (ativo) setEmail(conta?.email ?? null);
    });

    return () => {
      ativo = false;
    };
  }, []);

  async function sair() {
    if (saindo) return;

    setSaindo(true);
    setFalhou(false);

    const outcome = await attemptSignOut(recordQueue, syncEngine, googleSession);

    // A decisão passa a ser do corredor: `saindo` só é liberado no diálogo.
    if (outcome.status === 'pendingRecords') return confirmarDescarte(outcome.count);

    concluir(outcome);
  }

  function confirmarDescarte(quantidade: number) {
    Alert.alert(
      'Sair da conta?',
      avisoDePendentes(quantidade),
      [
        { text: 'Cancelar', style: 'cancel', onPress: () => setSaindo(false) },
        {
          text: 'Sair mesmo assim',
          style: 'destructive',
          onPress: async () => concluir(await discardAndSignOut(recordQueue, googleSession)),
        },
      ],
      // Tocar fora do diálogo no Android não dispara botão nenhum: sem isto o
      // botão ficaria travado em "Saindo…" para sempre.
      { cancelable: true, onDismiss: () => setSaindo(false) },
    );
  }

  function concluir(outcome: SignOutOutcome) {
    if (outcome.status !== 'signedOut') {
      setFalhou(true);
      setSaindo(false);
      return;
    }

    // `replace` sozinho trocaria só esta tela, deixando a home alcançável pelo
    // botão voltar do aparelho. Voltar ao topo primeiro esvazia a pilha.
    if (router.canDismiss()) router.dismissAll();
    router.replace('/login');
  }

  return (
    <View style={s.screen}>
      <Card>
        <Kicker>Autenticado como</Kicker>
        <Text style={s.email}>{email ?? '—'}</Text>
      </Card>

      <View style={s.explicacao}>
        <Muted>
          Sair encerra a sessão apenas neste aparelho. Seus treinos continuam guardados na sua
          conta e voltam quando você entrar de novo.
        </Muted>
      </View>

      {falhou && (
        <View style={s.aviso}>
          <NoticeStrip>
            <Text style={s.avisoTexto}>
              <Text style={s.avisoForte}>Não foi possível sair. </Text>
              Você continua conectado. Tente novamente.
            </Text>
          </NoticeStrip>
        </View>
      )}

      <View style={s.acao}>
        <SecondaryButton
          label={saindo ? 'Saindo…' : 'Sair da conta'}
          onPress={sair}
          disabled={saindo}
        />
      </View>
    </View>
  );
}

/** O corredor precisa do número exato para decidir — "alguns registros" não decide nada. */
function avisoDePendentes(quantidade: number): string {
  return quantidade === 1
    ? '1 registro ainda não foi enviado e será perdido se você sair agora.'
    : `${quantidade} registros ainda não foram enviados e serão perdidos se você sair agora.`;
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: color.bg,
    paddingHorizontal: space[8],
    paddingTop: space[6],
  },
  email: {
    color: color.text,
    fontSize: type.cardTitle,
    marginTop: space[3],
  },
  explicacao: { marginTop: space[6] },
  aviso: { marginTop: space[6] },
  avisoTexto: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 19 },
  avisoForte: { color: color.text },
  acao: { marginTop: space[8] },
});
