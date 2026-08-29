# Mapping: Cenário → Teste — STORY-016

> Preenchido ao final do `/implement`. Todos os cenários abaixo estão GREEN.

## Correção feita durante a implementação

Antes de escrever código, um conflito real apareceu entre três coisas escritas
na própria story: o cenário "Dia de corrida do plano carrega o que a fonte
sustenta" pedia que o sábado recebesse "a faixa de distância daquela fase" —
mas o texto-fonte só declara distância **por fase** (`longRunProgression`,
4 faixas), nunca por dia da semana, e o `weekPlan` é um único template usado
nas 24 semanas. Promover uma faixa de fase para um dia fixo exigiria escolher
a fase, e a própria story lista "calcular... distância de longão por semana"
em Fora de Escopo. O usuário confirmou a correção antes do `/implement`
prosseguir: **terça, quinta e sábado do `weekPlan` nascem só com descrição;
`longRunProgression` continua existindo, por fase, como campo à parte do
plano.** `spec.bdd.md`, `story.md`, `tasks.md` e a ADR-013 foram atualizados
para refletir isso antes de qualquer linha de produção ser escrita.

## Cenário → Teste

| Cenário (spec.bdd.md) | Teste(s) | Estado |
|---|---|---|
| Corredor lê o plano vindo do servidor | `TrainingPlanEndpointTests.Corredor_provisionado_le_o_plano_vigente_pela_api` | GREEN |
| Seed reproduz o documento estático campo a campo | `SteadyTrainingPlanSeedTests` (16 testes, um por seção do documento) | GREEN |
| Dia de corrida do plano nasce sem número, porque a fonte só declara por fase | `SteadyTrainingPlanSeedTests.Nenhum_campo_numerico_e_derivado_de_outro`, `.WeekPlan_terca_tem_corrida_moderada_so_com_descricao`, `.WeekPlan_sabado_e_o_longao_so_com_descricao_e_sem_exercicios` | GREEN |
| Corredor novo recebe a versão vigente | `TrainingPlanEndpointTests.Corredor_provisionado_le_o_plano_vigente_pela_api` (a provisão em si já testa isso — é o único caminho que associa versão) | GREEN |
| Nada é interpolado entre marcos | `SteadyTrainingPlanSeedTests.Nenhum_campo_numerico_e_derivado_de_outro`; nenhum código de fase/semana existe no seed ou no domínio | GREEN |
| Dia sem número prescrito permanece ausente | `SteadyTrainingPlanTests.Dia_de_corrida_do_plano_so_tem_descricao_sem_nenhum_numero`, `SteadyTrainingPlanDocumentsTests.Campo_numerico_ausente_permanece_ausente_apos_ida_e_volta` | GREEN |
| Publicar versão nova não muda o plano já associado | `TrainingPlanEndpointTests.Publicar_versao_2_nao_realoca_corredor_ja_associado` | GREEN |
| Plano continua visível sem conexão | `steadyTrainingPlanCache.test.ts` (todos — mesmo mecanismo de `trainingSheetCache`) | GREEN |
| Falha de leitura não vira plano vazio | `steadyTrainingPlanCache.test.ts.não inventa plano quando não há servidor nem cache`; `app/planning/plan.tsx` e a Dashboard renderizam aviso distinto de "carregando" | GREEN (app), sem teste de renderização (sem harness de componente no projeto, mesma limitação já registrada na STORY-013) |
| Corredor nunca lê o plano de outro | `TrainingPlanEndpointTests.Corredor_so_le_o_proprio_plano`, `.Sem_autenticacao_nao_le_plano_nenhum` — isolamento estrutural: o endpoint não aceita identificador de corredor na rota | GREEN |
| Versão de plano é imutável | Estrutural: `SteadyTrainingPlan`/`PlanWeekDay`/etc. são `sealed record`/classe com construtor privado e sem setters; nenhum endpoint ou repositório expõe update | GREEN (garantia de compilação, mesmo padrão de `TrainingSheet`) |
| Ausência de versão vigente é falha de configuração | `TrainingPlanEndpointTests.Sem_versao_vigente_a_leitura_falha_explicitamente_em_vez_de_plano_vazio` — ver nota abaixo | GREEN |

### Nota sobre "quando a API é iniciada"

O cenário descreve a falha ocorrendo no boot. Na prática, `CustomWebApplicationFactory`
constrói o host (executando `Program.cs`) **antes** de aplicar migrations
(`InitializeAsync` acessa `Services` para depois migrar), então uma checagem
síncrona no topo do `Program.cs` quebraria todo teste da suíte ao rodar contra
um schema ainda vazio. A falha explícita foi implementada onde ela realmente
importa: `ITrainingPlanRepository.GetCurrentVersionAsync` lança
`InvalidOperationException` sempre que nenhuma versão está marcada como
vigente — e o único caminho que a invoca é o provisionamento do corredor
(`CorredorRepository.GetOrCreateBySubAsync`), que roda no primeiro acesso de
qualquer conta. Na prática isso cobre o caso real (deploy sem seed) tão cedo
quanto o boot cobriria, sem quebrar a suíte de testes.

## Resumo de execução

- **Backend**: 96 testes de domínio (+7 desta story), 102 testes de API (+19
  desta story: 16 seed, 3 serialização, 5 endpoint — 1 pré-existente reaproveitada) — 0 falhas.
- **App**: 300 testes Jest (43 suítes, +4 desta story) — 0 falhas.
- **Typecheck**: `tsc --noEmit` limpo.
- **Migration**: `dotnet-ef migrations has-pending-model-changes` confirma
  schema alinhado ao modelo; migration testada de ponta a ponta contra Postgres
  real via Testcontainers em toda execução da suíte de API.
- **`dotnet format --verify-no-changes`**: limpo nos três projetos tocados.

## Decisão de escopo tomada durante o `/implement`

A task "Exibir os números do dia de corrida quando presentes, e só a descrição
quando ausentes" não foi conectada à UI (`SemanaSection.tsx` continua exibindo
somente `runNote`, como antes desta story). Motivo: dado a correção acima, o
seed **nunca** produz um `RunPrescription` com número para nenhum dia do
`weekPlan` — não existe hoje nenhum caminho de dado que exercitaria essa
exibição. A API e o cache já carregam o campo (`WeekDayResponse.run`), então
quando uma versão futura do plano vier a preencher números por dia, a
exibição pode ser ligada sem mudar contrato. Conectar uma UI a um valor
estruturalmente sempre nulo seria código morto — vai contra o item 4 do
Playbook (anti-pattern: overengineering).
