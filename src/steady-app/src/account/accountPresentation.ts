import type { AccountIdentity } from '../auth/googleSession';

/**
 * O que o menu de perfil desenha, já resolvido.
 *
 * `initial` nunca é nulo, mesmo quando há foto: o avatar é o **gatilho** do menu
 * e precisa ser desenhável e tocável desde o primeiro frame — antes de a imagem
 * chegar, e também quando ela nunca chega (offline é o estado normal do corredor
 * na rua, STORY-003).
 */
export type AccountView = {
  /** `null` quando a conta não informa nome — o menu mostra só o e-mail. */
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
  initial: string;
};

/** Usada quando nem o aparelho sabe dizer quem está autenticado. */
const UNKNOWN_INITIAL = '?';

export function presentAccount(identity: AccountIdentity | null): AccountView {
  const displayName = textOrNull(identity?.name);
  const email = textOrNull(identity?.email);

  return {
    displayName,
    email,
    photoUrl: textOrNull(identity?.photoUrl),
    initial: initialOf(displayName ?? email),
  };
}

/** Espaço em branco é ausência: um nome de espaços viraria uma inicial vazia. */
function textOrNull(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function initialOf(source: string | null): string {
  return source ? source.charAt(0).toUpperCase() : UNKNOWN_INITIAL;
}
