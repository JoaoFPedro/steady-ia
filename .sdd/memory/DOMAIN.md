# Domínio do Projeto

> Sincronizado com o código por `/sync` em 2026-08-22 (STORY-001, STORY-003, STORY-004, STORY-009, STORY-010).
> Atualizado manualmente ao fechar a STORY-015 (2026-08-28) — `RunPrescription`/`NumericRange`.
> Atualizado manualmente ao fechar a STORY-016 (2026-08-29) — `SteadyTrainingPlan` sai de "previsto" para implementado.
> Atualizado manualmente ao fechar a STORY-017 (2026-08-29) — `ExercisePrescription` ganha tempo e observação opcionais.
> Atualizado manualmente ao fechar a STORY-018 (2026-08-29) — o histórico de treino do corredor passa a incluir `StrengthWorkoutExecution`.
> Assistentes de IA: consulte para entender o domínio.

## Entidades — implementadas

O domínio vive em `src/Steady.Domain` (C# puro, sem framework). A persistência
espelha cada uma em `src/Steady.Infrastructure/Persistence` com dois campos que
**não pertencem ao domínio**: `CorredorId` (isolamento, ADR-002) e
`IdempotencyKey` (deduplicação da fila offline, ADR-003).

| Entidade | Campos principais | Descrição |
|----------|------------------|-----------|
| **Corredor** | `Id`, `GoogleSub`, `Email`, `Name`, `Roles`, `CreatedAt` | Usuário do app. Identificado pelo claim `sub` do ID token do Google, **nunca por e-mail** — provisionado automaticamente no primeiro acesso (ADR-002). `Email` e `Name` são cache do provedor — `Name` vem do claim `name` e é só exibição (STORY-019), nulo enquanto o corredor não entrar de novo; `Roles` concede as áreas Corredor/Personal (ADR-008). Só existe na camada de persistência |
| **RunningSession** | `Date`, `DistanceKm`, `DurationMinutes`, `AveragePaceMinPerKm`, `PerceivedEffort` · derivado: `Load = DurationMinutes × PerceivedEffort` | Sessão de corrida realizada |
| **StrengthSession** | `Date`, `MuscleGroup`, `Intensity`, `DurationMinutes` · derivado: `Load = DurationMinutes × peso(Intensity)` | Sessão de musculação realizada |
| **PainLog** | `Date`, `Region` | Dor/desconforto pós-treino. **Independente da sessão de treino** — dor costuma surgir horas ou dias depois, e forçar o vínculo seria modelagem incorreta (decisão do `/spec` da STORY-003) |
| **PlanRequest** | `RaceDistance`, `RaceDate`, `RaceIsFirstTime`, `LongestRecentRunKm`, `TrainingDaysPerWeek` · opcionais: `CurrentWeeklyRunningDays`, `ReferenceDistanceKm`, `ReferenceDuration`, `StrengthSessionMinutes`, `EquipmentAccess`, `RecurringPainAreas`, `PriorInjuries` | O que o corredor respondeu ao montar um planejamento (STORY-010, ADR-007). **Não gera plano**: é o insumo da geração, que segue fora de escopo. Imutável — cada "Gerar plano" cria uma linha nova. `RaceDate` é `DateOnly` no domínio e **texto ISO** na persistência |
| **OverloadAssessment** | `HasRisk`, `Suggestion`, `HasSufficientHistory` | Resultado da regra de sobrecarga (ADR-001). Value object, nunca persistido — recalculado a cada consulta. `HasSufficientHistory` distingue "reunindo dados" de "avaliei e não há risco" (ADR-004) |
| **CoachingLink** | `PersonalId`, `CorredorId`, `Status`, datas de transição | Solicitação e vínculo autorizado entre personal e corredor. Só um vínculo ativo por corredor (ADR-008) |
| **ExercisePrescription** | `Id`, `Name`, `Sets`, `Repetitions` · opcionais: `DurationSeconds`, `Observation` | Exercício de um treino de musculação da ficha. Séries e repetições obrigatórias; o tempo (segundos) é um eixo adicional que nunca as substitui, e a observação é instrução do personal — não se confunde com `ExerciseExecution.Note`, que é do corredor. Ambos ausentes quando em branco, nunca zero nem texto vazio (ADR-012, STORY-017) |
| **TrainingSheet** | Empurrada, Puxada, Inferiores e Corrida | Ficha ativa imutável publicada pelo personal. Corrida é um único treino com prescrições para terça, quinta e sábado; nova publicação substitui a ativa sem apagar versões (ADR-009/010) |
| **RunPrescription** | `Description`, `DistanceKm`, `DurationMinutes`, `PerceivedEffort` (os três últimos `NumericRange<T>?`) | Prescrição de corrida de um dia da ficha. Descrição obrigatória; os três campos numéricos são opcionais e independentes — ausência nunca é zero nem é inferida da descrição (ADR-012, STORY-015) |
| **NumericRange\<T\>** | `Min`, `Max?` | Value object genérico em `Steady.Domain.Common`. `Max` ausente = alvo exato; presente = faixa, sempre maior que `Min`. Reaproveitado por `RunPrescription` |
| **StrengthWorkoutExecution** | ficha, tipo, data, exercícios com carga/nota/pulado | Snapshot imutável e idempotente da execução real da ficha, sincronizado como uma unidade |
| **SteadyTrainingPlan** | `Version`, `WeekPlan` (7 dias, `RunPrescription?` opcional), `Content` (título, fases, mobilidade, regras de ouro, etc.) | Plano do Steady persistido, versionado e imutável (ADR-013). Cada corredor aponta para a versão vigente no provisionamento; publicar versão nova não realoca quem já aponta para uma. Seed da v1 é transcrição literal de `trainingPlanDocument.ts` — os três dias de corrida do `weekPlan` nascem só com descrição, porque a fonte só declara número por fase (`LongRunProgression`), nunca por dia |

**Enums**: `RaceDistance` = `FiveK · TenK · HalfMarathon · Marathon · Ultra` ·
`EquipmentAccess` = `AcademiaCompleta · HalteresCasa · PesoCorporal` ·
`PainArea` = `Canela · Joelho · ItBand · Lombar · Tornozelo · Panturrilha · Nenhuma` ·
`MuscleGroup` = `PeitoTriceps · Ombro · PernaFrontal · PernaPosterior · BicepsCostas` ·
`Intensity` = `Leve · Moderado · Pesado`.

> Sessão de treino registrada é **imutável** (Lei do Domínio #2): não há update nem
> delete em nenhum repositório. Correção gera registro novo.

## Entidades — previstas, ainda não existem

Nenhuma destas tem código. Estão aqui porque a Constituição as nomeia e para que
não sejam reinventadas com outro nome quando chegarem.

| Entidade | Situação |
|----------|----------|
| Objetivo/Meta de Corrida | Sem tabela própria. Vive como as colunas `race_*` de `plan_requests`, ambas `NOT NULL` — a Lei do Domínio #3 é satisfeita no nível do campo, não da tabela (ADR-007). Extrair depois é migration mecânica |
| Registro de Desempenho | Não implementado. Hoje `RunningSession`/`StrengthSession` acumulam esse papel — não existe distinção entre planejado e realizado, porque não há plano |

## Fluxos principais

1. **Autenticação** — Google Sign-In no app → ID token → API valida assinatura e
   audiência a cada requisição → `sub` vira `CorredorId`. Sem sessão no backend
   (ADR-002). Token expirado é renovado silenciosamente; falhando, o app volta ao
   login com a fila preservada.
2. **Registro offline-first** — registro entra na fila local com chave de
   idempotência **antes** de qualquer rede e é confirmado ao corredor na hora. O
   envio é oportunista; a fila se esvazia sozinha na volta da conexão (ADR-003).
3. **Avaliação de sobrecarga** — `OverloadDetectionService` compara a carga
   combinada (corrida + musculação) da janela recente com a anterior. Exige 14
   dias de histórico; abaixo disso devolve `InsufficientHistory` (ADR-001,
   ADR-004). O app **nunca** calcula: só exibe (FF-004).
4. **Consulta de histórico** — sessões de corrida e musculação do corredor,
   sempre filtradas por `CorredorId` na query, nunca em memória (ADR-002).
   Desde a STORY-018 inclui também as `StrengthWorkoutExecution` — a
   musculação feita pela ficha do personal, que vive em tabela separada
   (ADR-009) e antes não aparecia para o próprio corredor. Ela não tem duração
   nem grupo muscular: identifica-se pelo treino da ficha. **Não** entra na
   avaliação de sobrecarga, que precisa de duração e intensidade.
5. **Planejamento** — o corredor responde o formulário, o pedido entra na fila
   com chave de idempotência e a aba lista os pedidos dele vindos da API. Cada
   card abre o seu pedido; os treinos exibidos são os mesmos para todos
   (STORY-010). Falha de leitura mostra os pendentes e avisa — nunca lista vazia
   como se não houvesse nenhum (ADR-004).
6. **Encerramento de sessão** — a saída descarta a fila pendente mediante
   confirmação. Registro sem dono não pode atravessar a troca de corredor no
   mesmo aparelho (ADR-005).
7. **Planejamento prescrito** — após vínculo aceito, o personal publica a ficha
   ativa. O app a mantém em cache e substitui os exercícios estáticos em
   Planejamento → Semana → Detalhamento de cada dia. Segunda/sexta usam
   Inferiores; terça Empurrada + corrida; quarta Empurrada; quinta Puxada +
   corrida; sábado corrida; domingo descanso (ADR-010).
8. **Registro pela ficha** — o detalhamento abre um seletor único. Após uma
   musculação em terça, quinta ou sábado, o corredor decide se também registra
   a corrida. Concluindo ambos, um item `combinedWorkout` usa uma chave e uma
   transação; cancelando a corrida, a musculação segue isolada (ADR-011).

## Fronteiras externas

| Tipo | Nome | Situação |
|------|------|----------|
| Identity Provider (OAuth) | Google Sign-In | **Integrado.** `@react-native-google-signin` no app; `Google.Apis.Auth` na API |
| Banco de dados | PostgreSQL | **Integrado.** EF Core; migrations em `src/Steady.Infrastructure/Migrations` |
| Armazenamento local | AsyncStorage | **Integrado.** Fila offline (`@steady/fila-de-registros`) e rascunho temporário do registro combinado |
| Conectividade | NetInfo | **Integrado.** Dispara o auto-sync na volta da conexão |
| API nativa do device | GPS (Expo Location) | **Não integrado.** Não há `expo-location` no projeto. Rastreamento de rota é intenção da Constituição, não código — distância hoje é digitada pelo corredor |
