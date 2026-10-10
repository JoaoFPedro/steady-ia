import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { combinedWorkoutDrafts, googleSession, recordQueue, syncEngine, trainingSheetCache, workoutReviewCache } from '../services';
import { goToLogin } from '../auth/goToLogin';
import { presentAccount, type AccountView } from './accountPresentation';
import { applySignOutOutcome, pendingRecordsWarning } from './signOutFeedback';
import { attemptSignOut, discardAndSignOut, type SignOutOutcome } from './signOutAccount';

/**
 * Estado do menu lateral de perfil.
 *
 * Mora fora da tela pelo mesmo motivo do `useRecordLogger`: a home já carrega a
 * avaliação de sobrecarga e a fila, e não deveria também carregar diálogo de
 * confirmação, botão voltar e ciclo de vida de sessão.
 *
 * A regra da saída **não está aqui** — está em `signOutAccount` (ADR-005). Este
 * hook só decide o que a tela faz com cada desfecho.
 */
export function useAccountMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState<AccountView>(presentAccount(null));
  const [saindo, setSaindo] = useState(false);
  const [falhouAoSair, setFalhouAoSair] = useState(false);

  // Identidade é leitura volátil do módulo nativo, nunca persistida (ADR-002).
  useEffect(() => {
    let ativo = true;

    googleSession.currentAccount().then((identity) => {
      if (ativo) setAccount(presentAccount(identity));
    });

    return () => {
      ativo = false;
    };
  }, []);

  // Com o menu aberto, voltar desfaz o menu — não a navegação. Devolver `true`
  // consome o evento; sem isso o corredor sairia da home com o painel aberto.
  useEffect(() => {
    if (!open) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setOpen(false);
      return true;
    });

    return () => subscription.remove();
  }, [open]);

  const concluir = useCallback(
    (outcome: SignOutOutcome) => {
      if (outcome.status === 'signedOut') {
        void trainingSheetCache.clear();
        void workoutReviewCache.clear();
      }
      return applySignOutOutcome(outcome, {
        closeMenu: () => setOpen(false),
        goToLogin: () => goToLogin(router),
        showFailure: () => {
          setFalhouAoSair(true);
          setSaindo(false);
        },
      });
    },
    [router],
  );

  const confirmarDescarte = useCallback(
    (quantidade: number) => {
      Alert.alert(
        'Sair da conta?',
        pendingRecordsWarning(quantidade),
        [
          { text: 'Cancelar', style: 'cancel', onPress: () => setSaindo(false) },
          {
            text: 'Sair mesmo assim',
            style: 'destructive',
            onPress: async () => concluir(await discardAndSignOut(recordQueue, googleSession, combinedWorkoutDrafts)),
          },
        ],
        // Tocar fora do diálogo no Android não dispara botão nenhum: sem isto o
        // botão ficaria travado em "Saindo…" para sempre.
        { cancelable: true, onDismiss: () => setSaindo(false) },
      );
    },
    [concluir],
  );

  const sair = useCallback(async () => {
    if (saindo) return;

    setSaindo(true);
    setFalhouAoSair(false);

    const outcome = await attemptSignOut(recordQueue, syncEngine, googleSession, combinedWorkoutDrafts);

    // A decisão passa a ser do corredor: `saindo` só é liberado no diálogo.
    if (outcome.status === 'pendingRecords') return confirmarDescarte(outcome.count);

    concluir(outcome);
  }, [saindo, confirmarDescarte, concluir]);

  return { open, setOpen, account, saindo, falhouAoSair, sair };
}
