# Steady - Índice mestre de documentação

O Steady é um aplicativo de treino para corredores amadores que buscam chegar à primeira maratona, com registro de corrida, musculação e dor e avaliação de sobrecarga combinada.

Última execução do orquestrador: **2026-09-27**, em modo autônomo, com delegação sequencial aos especialistas de cada camada.

Esta documentação cobre o código atual dos três projetos .NET, incluindo alterações presentes no worktree na data da auditoria. Cada unidade tem documentação técnica com diagramas Mermaid, regras de negócio e débitos técnicos com evidências e propostas de ação. Especificações e decisões arquiteturais são vinculadas nos documentos; quando diferem do código, a diferença é registrada sem alterar a implementação.

## Steady.Api

**10/10 unidades documentadas**, cobrindo **29 rotas** em ASP.NET Core 10 Minimal APIs. Contratos, autenticação, filtros, mapeamentos e serviços são descritos nos fluxos dos respectivos endpoints.

- [DevDocs](Steady.Api/DevDocs/README.md) - rotas, contratos, status e fluxo entre camadas.
- [BusinessRulesDocs](Steady.Api/BusinessRulesDocs/README.md) - jornadas, permissões e regras dos fluxos da aplicação.
- [TechnicalDebtsDocs](Steady.Api/TechnicalDebtsDocs/README.md) - limitações observadas, criticidade e propostas de correção.

Unidades: `RunningSessionEndpoints`, `StrengthSessionEndpoints`, `PainLogEndpoints`, `OverloadAssessmentEndpoints`, `TrainingHistoryEndpoints`, `PlanRequestEndpoints`, `TrainingPlanEndpoints`, `CoachingLinkEndpoints`, `TrainingSheetEndpoints` e `WorkoutReviewEndpoints`.

## Steady.Domain

**12/12 unidades documentadas**, em C# puro. Enums, objetos de valor e interfaces de apoio são agrupados com a entidade ou serviço correspondente.

- [DevDocs](Steady.Domain/DevDocs/README.md) - métodos, invariantes, limites numéricos e transições de estado.
- [BusinessRulesDocs](Steady.Domain/BusinessRulesDocs/README.md) - regras de treino, prescrição, acompanhamento e revisão com exemplos concretos.
- [TechnicalDebtsDocs](Steady.Domain/TechnicalDebtsDocs/README.md) - lacunas comprovadas e propostas de evolução do domínio.

Unidades: `RunningSession`, `StrengthSession`, `PainLog`, `OverloadDetectionService` + `OverloadAssessment`, `PlanRequest`, `SteadyTrainingPlan`, `CoachingLink`, `TrainingSheet`, `WorkoutExecution`, `AdherencePolicyVersion`, `WorkoutAdherence` e `WorkoutReview`.

## Steady.Infrastructure

**12/12 unidades documentadas**, com EF Core 9 e Npgsql/PostgreSQL. Modelos de persistência, documentos serializados, seeds e migrations são tratados nas unidades que os utilizam.

- [DevDocs](Steady.Infrastructure/DevDocs/README.md) - consultas, transações, idempotência, mapeamentos, índices e processamento da outbox.
- [BusinessRulesDocs](Steady.Infrastructure/BusinessRulesDocs/README.md) - isolamento de acesso, preservação de versões e consistência dos registros.
- [TechnicalDebtsDocs](Steady.Infrastructure/TechnicalDebtsDocs/README.md) - riscos de persistência e processamento com evidências e cenários de validação.

Unidades: `CorredorRepository`, `RunningSessionRepository`, `StrengthSessionRepository`, `PainLogRepository`, `CoachingLinkRepository`, `PlanRequestRepository`, `TrainingPlanRepository`, `TrainingSheetRepository`, `WorkoutReviewRepository`, `SteadyDbContext` + `ServiceCollectionExtensions`, `ReviewOutboxProcessor` e `ReviewExplanationRetryService`.

## Resultado desta execução

| Projeto | Novas | Atualizadas | Já em dia sem alteração | Cobertura | Documentos de unidade |
|---|---:|---:|---:|---:|---:|
| Steady.Api | 5 | 5 | 0 | 10/10 | 30 |
| Steady.Domain | 8 | 4 | 0 | 12/12 | 36 |
| Steady.Infrastructure | 7 | 5 | 0 | 12/12 | 36 |
| **Total** | **20** | **14** | **0** | **34/34** | **102** |

São **112 arquivos Markdown**: 102 documentos de unidade, nove índices por tipo e este índice mestre. As atualizações incluem precisão de conteúdo, referências, navegação e normalização de formato; não significam que todas as unidades tiveram mudanças de comportamento no código.

Não foi encontrado projeto `src/Steady.*` sem especialista. O aplicativo `src/steady-app` existe no monorepo e está fora do escopo de três camadas deste pipeline.

## Verificação e limites

Os especialistas analisaram fontes, especificações, decisões arquiteturais e testes existentes. A auditoria verificou cobertura das unidades, documentos nos índices, links relativos, âncoras, diagramas de sequência e compatibilidade da pontuação com o padrão documental.

O pipeline altera somente `DocumentAIReadme/`. Testes de produto não foram executados nesta rodada de documentação; os débitos técnicos são achados de leitura do código, sem implementação das propostas.

Skills utilizadas: [orquestrador](../.codex/agents/skills/documentai-orchestrator/SKILL.md), [API](../.codex/agents/skills/steady-api-docs/SKILL.md), [domínio](../.codex/agents/skills/steady-domain-docs/SKILL.md) e [infraestrutura](../.codex/agents/skills/steady-infrastructure-docs/SKILL.md). Padrão canônico: [documenta-ai.md](../.codex/prompts/documenta-ai.md).
