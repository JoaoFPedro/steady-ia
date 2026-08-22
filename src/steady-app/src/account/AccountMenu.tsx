import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Muted, NoticeStrip, Rule, SecondaryButton } from '../ui/Nocturne';
import { Avatar } from '../ui/Avatar';
import { color, space, type } from '../theme/nocturne';
import type { AccountView } from './accountPresentation';

const AVATAR_SIZE = 56;

/**
 * Conteúdo do menu lateral de perfil.
 *
 * Recebe tudo pronto e não decide nada: quem resolve identidade é
 * `presentAccount`, quem resolve a saída é `signOutAccount`. Isso é o que
 * permite trocar a casca sem tocar na regra do ADR-005.
 *
 * A saída fica no rodapé, empurrada pelo `flex: 1` do meio — separada das
 * opções de perfil que virão. Encerrar sessão não compete com navegação.
 */
export function AccountMenu({
  account,
  saindo,
  falhouAoSair,
  onSignOut,
}: {
  account: AccountView;
  saindo: boolean;
  falhouAoSair: boolean;
  onSignOut: () => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.panel, { paddingTop: insets.top + space[8], paddingBottom: insets.bottom + space[6] }]}>
      <View style={s.identity}>
        <Avatar initial={account.initial} photoUrl={account.photoUrl} size={AVATAR_SIZE} />

        {account.displayName !== null && (
          <Text style={s.name} numberOfLines={1}>
            {account.displayName}
          </Text>
        )}

        {account.email !== null && (
          <Text style={s.email} numberOfLines={1}>
            {account.email}
          </Text>
        )}
      </View>

      <Rule />

      {/* Onde entram as próximas opções de perfil. Vazio hoje, e é o que empurra
          a saída para o rodapé. */}
      <View style={s.options} />

      {falhouAoSair && (
        <View style={s.aviso}>
          <NoticeStrip>
            <Text style={s.avisoTexto}>
              <Text style={s.avisoForte}>Não foi possível sair. </Text>
              Você continua conectado. Tente novamente.
            </Text>
          </NoticeStrip>
        </View>
      )}

      <View style={s.footer}>
        <Muted>Sair encerra a sessão apenas neste aparelho.</Muted>
        <View style={s.footerAction}>
          <SecondaryButton
            label={saindo ? 'Saindo…' : 'Sair da conta'}
            onPress={onSignOut}
            disabled={saindo}
          />
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: color.surface,
    paddingHorizontal: space[6],
  },
  identity: { gap: space[3] },
  name: {
    color: color.text,
    fontSize: type.cardTitle,
    marginTop: space[2],
  },
  email: {
    color: color.text,
    fontSize: type.meta,
    opacity: 0.55,
  },
  options: { flex: 1 },
  aviso: { marginBottom: space[6] },
  avisoTexto: { color: color.accentRamp[400], fontSize: type.meta, lineHeight: 19 },
  avisoForte: { color: color.text },
  footer: { gap: space[4] },
  footerAction: { marginTop: space[2] },
});
