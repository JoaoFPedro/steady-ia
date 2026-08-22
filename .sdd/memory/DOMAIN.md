# Domínio do Projeto

> Sincronizado com o código por `/sync` em 2026-08-22 (STORY-001, STORY-003, STORY-004, STORY-009, STORY-010).
> Assistentes de IA: consulte para entender o domínio.

## Entidades — implementadas

O domínio vive em `src/Steady.Domain` (C# puro, sem framework). A persistência
espelha cada uma em `src/Steady.Infrastructure/Persistence` com dois campos que
**não pertencem ao domínio**: `CorredorId` (isolamento, ADR-002) e
`IdempotencyKey` (deduplicação da fila offline, ADR-003).

| Entidade | Campos principais | Descrição |
|----------|------------------|-----------|
| **Corredor** | `Id`, `GoogleSub`, `Email`, `CreatedAt` | Usuário do app. Identificado pelo claim `sub` do ID token do Google, **nunca por e-mail** — provisionado automaticamente no primeiro acesso (ADR-002). `Email` é cache do provedor (anulável, sem índice único), gravado e atualizado a cada acesso, apenas para leitura operacional do banco (STORY-009). Só existe na camada de persistência: o domínio não o conhece |
| **RunningSession** | `Date`, `DistanceKm`, `DurationMinutes`, `AveragePaceMinPerKm`, `PerceivedEffort` · derivado: `Load = DurationMinutes × PerceivedEffort` | Sessão de corrida realizada |
| **StrengthSession** | `Date`, `MuscleGroup`, `Intensity`, `DurationMinutes` · derivado: `Load = DurationMinutes × peso(Intensity)` | Sessão de musculação realizada |
| **PainLog** | `Date`, `Region` | Dor/desconforto pós-treino. **Independente da sessão de treino** — dor costuma surgir horas ou dias depois, e forçar o vínculo seria modelagem incorreta (decisão do `/spec` da STORY-003) |
| **PlanRequest** | `RaceDistance`, `RaceDate`, `RaceIsFirstTime`, `LongestRecentRunKm`, `TrainingDaysPerWeek` · opcionais: `CurrentWeeklyRunningDays`, `ReferenceDistanceKm`, `ReferenceDuration`, `StrengthSessionMinutes`, `EquipmentAccess`, `RecurringPainAreas`, `PriorInjuries` | O que o corredor respondeu ao montar um planejamento (STORY-010, ADR-007). **Não gera plano**: é o insumo da geração, que segue fora de escopo. Imutável — cada "Gerar plano" cria uma linha nova. `RaceDate` é `DateOnly` no domínio e **texto ISO** na persistência |
| **OverloadAssessment** | `HasRisk`, `Suggestion`, `HasSufficientHistory` | Resultado da regra de sobrecarga (ADR-001). Value object, nunca persistido — recalculado a cada consulta. `HasSufficientHistory` distingue "reunindo dados" de "avaliei e não há risco" (ADR-004) |

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
| Plano de Treino (gerado) | Não implementado. O **pedido** já é persistido (`PlanRequest`); o que falta é gerar os exercícios a partir dele. Conteúdo hoje é estático em `trainingPlanDocument.ts`. Decisão de produto de 2026-08-22: geração fica para depois |
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
5. **Planejamento** — o corredor responde o formulário, o pedido entra na fila
   com chave de idempotência e a aba lista os pedidos dele vindos da API. Cada
   card abre o seu pedido; os treinos exibidos são os mesmos para todos
   (STORY-010). Falha de leitura mostra os pendentes e avisa — nunca lista vazia
   como se não houvesse nenhum (ADR-004).
6. **Encerramento de sessão** — a saída descarta a fila pendente mediante
   confirmação. Registro sem dono não pode atravessar a troca de corredor no
   mesmo aparelho (ADR-005).

## Fronteiras externas

| Tipo | Nome | Situação |
|------|------|----------|
| Identity Provider (OAuth) | Google Sign-In | **Integrado.** `@react-native-google-signin` no app; `Google.Apis.Auth` na API |
| Banco de dados | PostgreSQL | **Integrado.** EF Core; migrations em `src/Steady.Infrastructure/Migrations` |
| Armazenamento local | AsyncStorage | **Integrado.** Fila offline (`@steady/fila-de-registros`) |
| Conectividade | NetInfo | **Integrado.** Dispara o auto-sync na volta da conexão |
| API nativa do device | GPS (Expo Location) | **Não integrado.** Não há `expo-location` no projeto. Rastreamento de rota é intenção da Constituição, não código — distância hoje é digitada pelo corredor |
