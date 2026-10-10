# Pedido de Plano e Historico - Persistencia-Planejamento - Regras de Negócio

## Índice

- [Resumo](#resumo)
- [Jornada](#jornada)
- [Regras e restrições](#regras)
- [Fluxo](#fluxo)
- [Cenários](#cenarios)

<a id="resumo"></a>
## 1. Resumo da funcionalidade

Guardar formulário completo e imutável do pedido. Usuários: corredor e, nos recursos de coaching, personal autorizado por vínculo. A operação acontece nos registros/consultas do aplicativo ou no processamento de revisão. O valor é conservar histórico confiável e restringir acesso aos participantes autorizados.

<a id="jornada"></a>
## 2. Jornada do usuário

```mermaid
journey
    title Pedido de Plano e Historico
    section Preparação
      Acessar conta autenticada: 5: Corredor
      Informar ou consultar dados próprios: 4: Corredor
    section Confirmação
      Receber resultado da operação: 4: Corredor
      Consultar histórico preservado: 5: Corredor
```

Pontos de contato: conta autenticada, funcionalidade de treino/planejamento/coaching e histórico ou revisão. Os repositórios não exibem telas; preservam os dados usados por esses pontos de contato.

<a id="regras"></a>
## 3. Regras de negócio e restrições

- **AddAsync**: Reaproveita (corredor,chave) ou copia RaceDistance, RaceDate yyyy-MM-dd, RaceIsFirstTime, LongestRecentRunKm, TrainingDaysPerWeek, CurrentWeeklyRunningDays, ReferenceDistanceKm, ReferenceDuration, StrengthSessionMinutes, EquipmentAccess, RecurringPainAreas e PriorInjuries; gera Id/CreatedAt UTC e salva.
- **GetByCorredorIdAsync**: Filtra corredor, ordena CreatedAt desc e materializa sem paginação.
- **GetByIdempotencyKeyAsync**: Reusa filtro composto IdempotentRecordQueries; retorna linha ou null. Não há update/delete nem geração de plano.

A conta recebida vem da autenticação na API. Onde há personal, papel e vínculo têm funções diferentes: ter o papel não concede acesso a todo corredor. A regra específica de autorização está descrita acima e na documentação técnica. Inputs do domínio são validados antes da persistência; não há diagnóstico médico nesta camada.

<a id="fluxo"></a>
## 4. Fluxos de processo

```mermaid
flowchart TD
    A[Conta autenticada inicia operação] --> B{Identidade e condições do contrato atendidas?}
    B -->|Não| C[Ausência ou falha conforme cenário]
    B -->|Sim| D[Consulta ou gravação do recurso descrito]
    D --> E{Recurso ou chave já existe?}
    E -->|Sim| F[Usa estado persistido conforme contrato]
    E -->|Não| G[Cria recurso ou retorna ausência]
    F --> H[Resultado para funcionalidade]
    G --> H
```

Integrações: autenticação fornece identidade; domínio valida prescrições/registros; persistência conserva estado; API traduz resultado para resposta.

<a id="cenarios"></a>
## 5. Casos de uso e cenários

| Entrada | Pré-condição/ação | Resultado esperado |
|---|---|---|
| A, K, objetivo Maratona/2027-05-17 e formulário válido | Criar pedido | Created=true; RaceDate="2027-05-17" e input preservado |
| A, K reenviada | Pedido já existe | Created=false e Id original |
| B consulta histórico | A tem pedido | Lista de B exclui pedido de A |

A e B representam contas diferentes; K uma chave de idempotência; P um personal; R/L/F identificadores de revisão, vínculo ou ficha. Cada cenário parte do estado indicado, executa o método citado e verifica tanto o retorno quanto a ausência de mudança em dados alheios.

Referências normativas e técnicas:

- [docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)
- [docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md)
- [docs/adr/ADR-007-persistencia-do-pedido-de-plano-de-treino.md](../../../docs/adr/ADR-007-persistencia-do-pedido-de-plano-de-treino.md)
- [tests/Steady.Api.Tests/PlanRequestEndpointTests.cs](../../../tests/Steady.Api.Tests/PlanRequestEndpointTests.cs)
- [src/Steady.Infrastructure/Persistence/SteadyDbContext.cs](../../../src/Steady.Infrastructure/Persistence/SteadyDbContext.cs)
- [Detalhamento técnico](../DevDocs/PlanRequestRepository-Persistencia-Planejamento-DevDocs.md)

Especificações de comportamento relacionadas:

- [STORY-010](../../../specs/STORY-010/spec.bdd.md)
