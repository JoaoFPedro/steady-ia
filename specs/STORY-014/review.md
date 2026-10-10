# Review — STORY-014

Data: 2026-08-30

## Resultado

Implementação funcional e suítes verdes, com **uma pendência de regra** e duas
pendências de fechamento registradas em `tasks.md`.

## Achados

### Pendente — escala de carga da musculação

O comparador detalhado usa a mediana de `LoadKg` por `ExerciseKey` e a coerência
usa a soma das cargas. A tarefa previa carga prescrita/executada em session-RPE
conforme ADR-001, mas a execução detalhada da ficha não captura duração nem RPE.
Não foi inventada uma conversão sem dados. É necessário especificar se o produto
vai capturar duração/RPE nesse fluxo ou formalizar outra escala para musculação.

### Corrigido durante o review — isolamento do cache

O cache offline da revisão mais recente poderia sobreviver à troca de conta.
Agora ele é apagado no logout junto com a ficha, evitando exposição de dados de
saúde ao próximo usuário do aparelho.

### Corrigido durante o review — documentação do provedor

A ADR-016 dizia SDK oficial, mas o adaptador usa a Messages API oficial por
`HttpClient`. A ADR foi alinhada à implementação, que não adiciona dependência.

## Segurança — OWASP Top 10

- A01: consultas de corredor filtram `CorredorId`; personal exige vínculo ativo
  a cada leitura e recebe `404` sem vínculo; cache sensível é limpo no logout.
- A02/A05: chave Anthropic vem de configuração; nenhum segredo foi adicionado.
- A03: SQL da aquisição da outbox usa interpolação parametrizada do EF Core;
  não há concatenação de input.
- A04: revisão não altera plano/ficha e a IA não escolhe ação.
- A06: nenhuma dependência nova foi adicionada.
- A09: falhas/rejeições registram ids e versão, sem prompt, resposta, identidade
  ou conteúdo de saúde.
- A10: URL do provedor é constante e não recebe input do usuário.

## Qualidade

- Separação preservada entre comparação, política, provedor, persistência e UI.
- Outbox possui lease, retomada, backoff e unicidade por corredor/chave.
- `ExerciseKey` separa identidade histórica de nome e id da versão da ficha.
- `git diff --check` não encontrou whitespace inválido.

## Evidências

- .NET API: 128 testes verdes.
- .NET domínio: 138 testes verdes.
- App: 49 suítes / 353 testes verdes.
- TypeScript: `tsc --noEmit` verde.
- Mapeamento completo: `mapping.md`.
