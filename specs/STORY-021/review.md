# Review — STORY-021: Menu da conta também na aba Planejamento

> Revisão automática do `/implement` em 2026-08-29.

## Resultado

**APROVADA.** Planejamento ganhou acesso ao menu existente sem duplicar a regra
de saída e sem ampliar o menu para login ou rotas fora do escopo.

## Aderência à spec

| Regra | Evidência | Status |
|-------|----------|--------|
| Avatar no topo direito de Planejamento | `planning.tsx` compõe cabeçalho em linha com `AccountMenuButton` à direita | Conforme por inspeção |
| Mesma identidade e fallback | Dashboard e Planejamento recebem `menu.account` do mesmo `useAccountMenu`; botão compartilhado usa `Avatar` | Conforme |
| Mesmo drawer e ação de saída | As duas tabs usam `AccountMenuDrawer`, que renderiza o único `AccountMenu` | Conforme |
| ADR-005 preservado | A nova entrada chama o mesmo `menu.sair`; `signOutAccount.ts` não foi alterado | Conforme |
| Voltar fecha o drawer | Cada tela instancia o mesmo hook com `BackHandler` condicionado a `open` | Conforme |
| Falha mantém sessão e mostra feedback | `AccountMenuDrawer` repassa `falhouAoSair`; testes de saída permanecem verdes | Conforme |
| Planejamento funcionalmente intacto | Carregamento, planos e vínculos só foram envolvidos pela casca; handlers não mudaram | Conforme |
| Escopo restrito | Imports da nova casca existem apenas nas tabs Dashboard e Planejamento | Conforme |

## Código e testes

- KISS: um container e um botão compartilhados; nenhuma mudança no domínio.
- SOLID: drawer compõe, hook orquestra e `signOutAccount` mantém a regra pura.
- DRY: configuração do drawer, conteúdo e gatilho não foram copiados.
- Anti-patterns: nenhum Context global, provider ou abstração para telas futuras.
- `npx tsc --noEmit`: verde.
- Jest completo: **47 suítes e 347 testes, todos verdes**.
- A lógica crítica da conta tem 25 testes verdes.
- Limitação conhecida: a versão atual não possui harness de renderização React
  Native compatível. Posição, gesto e botão voltar foram validados por inspeção;
  recomenda-se smoke test no aparelho.

## Error handling e segurança

- A saída destrutiva continua exigindo confirmação quando há registros locais
  pendentes; a ordem limpar → sair permanece testada.
- Falha do provedor mantém o usuário autenticado e permite nova tentativa.
- Nenhum token, secret, log, dado pessoal persistido ou mensagem interna foi
  adicionado.
- OWASP A01–A10: sem nova superfície de rede, endpoint, query, HTML, URL de input
  ou comando. O único fluxo sensível é logout e ele reutiliza as proteções já
  revisadas do ADR-005.
- Componentes vulneráveis: nenhuma dependência adicionada ou atualizada.

## Processo

- Spec aprovada antes do código.
- Cenários críticos reutilizam a suíte automatizada existente; cenários novos
  são de composição visual e seguem a exceção manual explicitamente aprovada na
  spec devido ao harness.
- ADR desnecessário: a decisão de sessão permanece ADR-005.
- Blueprint desnecessário: não há fluxo novo, apenas uma nova entrada para o
  fluxo já documentado e testado.
