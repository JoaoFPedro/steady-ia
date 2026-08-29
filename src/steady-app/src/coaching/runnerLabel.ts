/**
 * Como o personal identifica o corredor na tela (STORY-019).
 *
 * O nome vem do claim `name` do Google e é cache do provedor: pode faltar por
 * escopo negado, e falta em toda conta que não entrou no app depois desta
 * story. O e-mail é o fallback — nunca deixar o corredor sem identificação.
 */
export function runnerLabel(runner: { name: string | null; email: string }): string {
  const name = runner.name?.trim() ?? '';
  return name === '' ? runner.email : name;
}
