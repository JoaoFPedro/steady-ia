/**
 * A saudação do cabeçalho da Dashboard (specs/STORY-011, regras 1 e 2).
 *
 * Só o primeiro nome: "Bom dia, João Pedro Silva" é um crachá, não um
 * cumprimento. Sem nome informado, saúda sem nome — nunca pelo e-mail, que
 * identifica a conta no menu (STORY-004) mas não é como se chama alguém.
 */
export function greeting(hour: number, displayName: string | null): string {
  const nome = firstName(displayName);
  const periodo = periodOf(hour);

  return nome ? `${periodo}, ${nome}` : periodo;
}

/** A madrugada é noite: quem abre o app às 3h não está começando o dia. */
function periodOf(hour: number): string {
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

function firstName(displayName: string | null): string | null {
  return displayName?.trim().split(/\s+/)[0] || null;
}
