# Review automático — STORY-016

Data: 2026-08-29
Resultado: **Aprovada**

## Correção pré-implementação

Antes de escrever código, um conflito real apareceu entre a spec escrita na
fase de planejamento e a fonte que ela dizia transcrever: o cenário pedia que
o sábado do `weekPlan` recebesse "a faixa de distância daquela fase", mas o
texto-fonte só declara distância **por fase** (4 faixas em `longRunProgression`),
nunca por dia — e a própria story lista "calcular... distância de longão por
semana" em Fora de Escopo. Promover uma faixa de fase para o dia fixo do
template exigiria escolher a fase, que é cálculo de progressão. O usuário
confirmou a correção (terça/quinta/sábado nascem só com descrição;
`longRunProgression` fica à parte, por fase) antes de qualquer linha de
produção — `spec.bdd.md`, `story.md`, `tasks.md` e ADR-013 foram corrigidos
primeiro. Ver `mapping.md` para o detalhe completo.

## Código e arquitetura

- KISS: `SteadyTrainingPlan` só valida o que é invariante de domínio real —
  versão positiva, sete dias, e `HasRun`/`Run` consistentes entre si. Todo o
  conteúdo de exibição (fases, mobilidade, regras) vive em `PlanStaticContent`,
  um record sem regra nenhuma — não há validação inventada para texto que só
  é transcrito.
- SOLID: `TrainingPlanMapping.cs` separa a conversão de payload do roteamento/
  autorização em `TrainingPlanEndpoints.cs`, mesmo padrão de
  `TrainingSheetMapping.cs` (STORY-015).
- DRY: `RunPrescription`/`NumericRange<T>` (STORY-015) são reaproveitados sem
  duplicação nos dias de corrida do plano — é exatamente o motivo de terem sido
  extraídos antes desta story.
- Sem interpolação: `SteadyTrainingPlanSeed.Version1()` é transcrição literal;
  nenhum campo é calculado a partir de outro (testado explicitamente).
- Persistência não é geração: `SteadyTrainingPlanSeed` não lê `PlanRequest`,
  não calcula fase nem progressão — só monta o documento estático em C#.
- App: `useWeekPlan()` centraliza a leitura para as telas de registro direto
  (`log/run.tsx`, `log/strength.tsx`), evitando duplicar o efeito de
  carregamento em cada uma (3ª+4ª ocorrência do mesmo padrão — limiar da regra
  de três já ultrapassado).
- Nenhuma tela de produção depende mais do fallback padrão de
  `TRAINING_PLAN_DOCUMENT.weekPlan` nas funções puras (`planDayParam.ts`,
  `planProgress.ts`) — o valor default continua existindo só para os testes
  dessas funções, nunca alcançado por um caminho real do app.

## Testes

- Todo cenário do `spec.bdd.md` (já corrigido) está mapeado em `mapping.md`
  com o teste real que o cobre.
- O cenário "Ausência de versão vigente é falha de configuração" foi validado
  no primeiro uso real (provisionamento do corredor), não no boot síncrono do
  `Program.cs` — `CustomWebApplicationFactory` constrói o host antes de rodar
  migrations, então uma checagem no topo do `Program.cs` quebraria toda a
  suíte contra um schema vazio. A falha continua explícita e nunca vira plano
  vazio; o desvio do "When" literal está documentado em `mapping.md`.
- Um bug de teste real foi encontrado e corrigido durante o próprio
  `/implement`: alternar `is_current` entre duas linhas em um único
  `SaveChanges`/`ExecuteUpdate` viola o índice único parcial mesmo quando o
  resultado final seria válido, porque o Postgres não posterga a checagem de
  unicidade para o fim da instrução. Corrigido com duas atualizações
  sequenciais (desmarcar tudo, depois marcar a vencedora).

## Error handling

- `TrainingPlanRepository.GetCurrentVersionAsync` lança
  `InvalidOperationException` com mensagem que aponta a causa provável e a
  ADR — nunca devolve `null` silenciosamente para esse caso.
- `GetForRunnerAsync` devolve `null` (não exceção) quando o corredor ou a
  versão associada não existem — o endpoint traduz isso em 404, nunca em
  plano vazio com 200.
- App: `SteadyTrainingPlanCache` nunca inventa plano; `failure` chega ao
  chamador, que decide como avisar (nunca lista/semana vazia).

## OWASP Top 10

| Categoria | Resultado |
|-----------|-----------|
| A01 — Access control | `GetForRunnerAsync` filtra por `CorredorId` no banco; o endpoint não aceita nenhum identificador de corredor na rota — não há parâmetro para atacar. `corredorId` vem sempre de `CurrentCorredor` (token validado, ADR-002). |
| A02 — Cryptography | Nenhum secret novo. |
| A03 — Injection | EF/LINQ parametrizado; nenhum SQL cru em código de produção (o único `SqlQueryRaw` usado durante a depuração do teste de concorrência foi removido antes do commit). |
| A04 — Insecure design | Falha de configuração (sem versão vigente) é explícita e não inventa recomendação nem plano. |
| A05 — Misconfiguration | Nenhuma configuração nova; migration testada de ponta a ponta contra Postgres real. |
| A06 — Components | Nenhuma dependência adicionada. |
| A07 — Authentication | Inalterado; endpoint atrás do mesmo `AuthenticationFilter`. |
| A08 — Data integrity | Versão imutável (sem setters expostos, sem endpoint de update); índice único garante uma vigente por vez; FK `Restrict` impede apagar uma versão referenciada por corredores. |
| A09 — Logging | Nenhum dado novo em log. |
| A10 — SSRF | Não aplicável. |

## Fitness functions e riscos residuais

- FF-002/FF-003: todos os arquivos tocados ficam abaixo dos limiares
  (maior é `SteadyDbContext.cs` com 249 linhas, já grande antes desta story).
- FF-004: o app não acessa banco diretamente; a leitura de plano passa pela API.
- FF-005: `mapping.md` cobre 100% dos cenários (já corrigidos) com teste real.
- Risco residual aceito conscientemente: a exibição de números por dia no
  plano (`SemanaSection.tsx`) não foi conectada à UI porque, após a correção,
  o seed nunca produz um número por dia — conectar UI a um dado
  estruturalmente sempre nulo seria código morto. API e cache já carregam o
  campo; ligar a exibição quando uma versão futura do plano vier a preenchê-lo
  é mudança local, sem mudança de contrato.

## Sensores desta revisão

- 96 testes de domínio (+7) e 102 testes de API (+19) verdes.
- 43 suítes Jest e 300 testes verdes (+4 suítes, +19 testes); `tsc --noEmit` verde.
- `dotnet format --verify-no-changes --no-restore` verde nos três projetos tocados.
- `dotnet-ef migrations has-pending-model-changes` confirma schema alinhado;
  a migration foi exercitada de ponta a ponta pela suíte de API (Postgres real
  via Testcontainers), incluindo o seed da versão 1 e o backfill de
  `corredores.training_plan_version_id`.
- Build sem warnings nos três projetos .NET tocados.

Nenhum achado bloqueante. A única correção feita durante a própria revisão foi
de teste (ordem das atualizações de `is_current`), já refletida no código —
não é um item pendente.
