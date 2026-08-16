# Steady — Índice Mestre de Documentação Técnica

Documentação gerada automaticamente pelo pipeline DocumentAI, cobrindo os três projetos do monorepo **Steady** (app de treino de corrida, .NET 10): `Steady.Api` (endpoints), `Steady.Domain` (regras de negócio) e `Steady.Infrastructure` (persistência).

Cada projeto tem três tipos de documentação, um por audiência:
- **DevDocs** — fluxo técnico completo (Endpoint/Entidade/Repositório → camadas seguintes) com diagramas de sequência Mermaid
- **BusinessRulesDocs** — regras de negócio em linguagem acessível a produto/negócio
- **TechnicalDebtsDocs** — débitos técnicos classificados por criticidade, com plano de ação

> Última geração completa: 2026-08-10, via pipeline autônomo (`documentai-orchestrator` + agentes especialistas `steady-api-docs`, `steady-domain-docs`, `steady-infrastructure-docs`, definidos em `.claude/agents/`).

## Steady.Api — ASP.NET Core 10 Minimal APIs

**5/5 unidades documentadas** (todos os grupos de Endpoints em `src/Steady.Api/Endpoints/`) — [DevDocs](Steady.Api/DevDocs/README.md) · [BusinessRulesDocs](Steady.Api/BusinessRulesDocs/README.md) · [TechnicalDebtsDocs](Steady.Api/TechnicalDebtsDocs/README.md)

| Unidade | Região | DevDocs | Regras de Negócio | Débitos |
|---|---|---|---|---|
| `RunningSessionEndpoints` | Treino-Corrida | [link](Steady.Api/DevDocs/RunningSessionEndpoints-Treino-Corrida-DevDocs.md) | [Registro de Corrida](Steady.Api/BusinessRulesDocs/Registro-de-Corrida-Treino-Corrida-Rules.md) | [link](Steady.Api/TechnicalDebtsDocs/RunningSessionEndpoints-Treino-Corrida-Debts.md) |
| `StrengthSessionEndpoints` | Treino-Forca | [link](Steady.Api/DevDocs/StrengthSessionEndpoints-Treino-Forca-DevDocs.md) | [Registro de Musculação](Steady.Api/BusinessRulesDocs/Registro-de-Musculacao-Treino-Forca-Rules.md) | [link](Steady.Api/TechnicalDebtsDocs/StrengthSessionEndpoints-Treino-Forca-Debts.md) |
| `PainLogEndpoints` | Treino-Dor | [link](Steady.Api/DevDocs/PainLogEndpoints-Treino-Dor-DevDocs.md) | [Registro de Dor](Steady.Api/BusinessRulesDocs/Registro-de-Dor-Treino-Dor-Rules.md) | [link](Steady.Api/TechnicalDebtsDocs/PainLogEndpoints-Treino-Dor-Debts.md) 🔴 |
| `OverloadAssessmentEndpoints` | Sobrecarga | [link](Steady.Api/DevDocs/OverloadAssessmentEndpoints-Sobrecarga-DevDocs.md) | [Avaliação de Sobrecarga](Steady.Api/BusinessRulesDocs/Avaliacao-de-Sobrecarga-Sobrecarga-Rules.md) | [link](Steady.Api/TechnicalDebtsDocs/OverloadAssessmentEndpoints-Sobrecarga-Debts.md) |
| `TrainingHistoryEndpoints` | Historico | [link](Steady.Api/DevDocs/TrainingHistoryEndpoints-Historico-DevDocs.md) | [Histórico de Treinos](Steady.Api/BusinessRulesDocs/Historico-de-Treinos-Historico-Rules.md) | [link](Steady.Api/TechnicalDebtsDocs/TrainingHistoryEndpoints-Historico-Debts.md) |

## Steady.Domain — Modelo de Domínio Rico (C# puro)

**4/4 unidades documentadas** (entidades de `Training/` + serviço de `Overload/`) — [DevDocs](Steady.Domain/DevDocs/README.md) · [BusinessRulesDocs](Steady.Domain/BusinessRulesDocs/README.md) · [TechnicalDebtsDocs](Steady.Domain/TechnicalDebtsDocs/README.md)

| Unidade | Região | DevDocs | Regras de Negócio | Débitos |
|---|---|---|---|---|
| `RunningSession` | Treino-Corrida | [link](Steady.Domain/DevDocs/RunningSession-Treino-Corrida-DevDocs.md) | [Registro de Sessão de Corrida](Steady.Domain/BusinessRulesDocs/Registro-de-Corrida-Treino-Corrida-Rules.md) | [link](Steady.Domain/TechnicalDebtsDocs/RunningSession-Treino-Corrida-Debts.md) |
| `StrengthSession` | Treino-Forca | [link](Steady.Domain/DevDocs/StrengthSession-Treino-Forca-DevDocs.md) | [Registro de Sessão de Musculação](Steady.Domain/BusinessRulesDocs/Registro-de-Musculacao-Treino-Forca-Rules.md) | [link](Steady.Domain/TechnicalDebtsDocs/StrengthSession-Treino-Forca-Debts.md) |
| `PainLog` | Treino-Dor | [link](Steady.Domain/DevDocs/PainLog-Treino-Dor-DevDocs.md) | [Registro de Dor](Steady.Domain/BusinessRulesDocs/Registro-de-Dor-Treino-Dor-Rules.md) | [link](Steady.Domain/TechnicalDebtsDocs/PainLog-Treino-Dor-Debts.md) |
| `OverloadDetectionService` + `OverloadAssessment` | Sobrecarga | [link](Steady.Domain/DevDocs/OverloadDetectionService-Sobrecarga-DevDocs.md) | [Detecção de Sobrecarga](Steady.Domain/BusinessRulesDocs/Deteccao-de-Sobrecarga-Sobrecarga-Rules.md) | [link](Steady.Domain/TechnicalDebtsDocs/OverloadDetectionService-Sobrecarga-Debts.md) |

## Steady.Infrastructure — EF Core 9 + Npgsql/PostgreSQL

**5/5 unidades documentadas** (repositórios + configuração de persistência) — [DevDocs](Steady.Infrastructure/DevDocs/README.md) · [BusinessRulesDocs](Steady.Infrastructure/BusinessRulesDocs/README.md) · [TechnicalDebtsDocs](Steady.Infrastructure/TechnicalDebtsDocs/README.md)

| Unidade | Região | DevDocs | Regras de Negócio | Débitos |
|---|---|---|---|---|
| `CorredorRepository` | Persistencia-Autenticacao | [link](Steady.Infrastructure/DevDocs/CorredorRepository-Persistencia-Autenticacao-DevDocs.md) | [Isolamento de Dados por Corredor](Steady.Infrastructure/BusinessRulesDocs/Isolamento-de-Dados-por-Corredor-Persistencia-Autenticacao-Rules.md) | [link](Steady.Infrastructure/TechnicalDebtsDocs/CorredorRepository-Persistencia-Autenticacao-Debts.md) |
| `RunningSessionRepository` | Persistencia-Treino | [link](Steady.Infrastructure/DevDocs/RunningSessionRepository-Persistencia-Treino-DevDocs.md) | [Registro e Histórico de Corrida](Steady.Infrastructure/BusinessRulesDocs/Registro-e-Historico-de-Corrida-Persistencia-Treino-Rules.md) | [link](Steady.Infrastructure/TechnicalDebtsDocs/RunningSessionRepository-Persistencia-Treino-Debts.md) |
| `StrengthSessionRepository` | Persistencia-Treino | [link](Steady.Infrastructure/DevDocs/StrengthSessionRepository-Persistencia-Treino-DevDocs.md) | [Registro e Histórico de Musculação](Steady.Infrastructure/BusinessRulesDocs/Registro-e-Historico-de-Musculacao-Persistencia-Treino-Rules.md) | [link](Steady.Infrastructure/TechnicalDebtsDocs/StrengthSessionRepository-Persistencia-Treino-Debts.md) |
| `PainLogRepository` | Persistencia-Treino | [link](Steady.Infrastructure/DevDocs/PainLogRepository-Persistencia-Treino-DevDocs.md) | [Registro de Dor Pós-Treino](Steady.Infrastructure/BusinessRulesDocs/Registro-de-Dor-Pos-Treino-Persistencia-Treino-Rules.md) | [link](Steady.Infrastructure/TechnicalDebtsDocs/PainLogRepository-Persistencia-Treino-Debts.md) |
| `SteadyDbContext` + `ServiceCollectionExtensions` | Persistencia-Configuracao | [link](Steady.Infrastructure/DevDocs/SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-DevDocs.md) | [Modelagem e Conexão com o Banco de Dados](Steady.Infrastructure/BusinessRulesDocs/Modelagem-e-Conexao-com-o-Banco-de-Dados-Persistencia-Configuracao-Rules.md) | [link](Steady.Infrastructure/TechnicalDebtsDocs/SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-Debts.md) 🔴 |

## Achados críticos consolidados

Os três agentes especialistas trabalharam de forma independente e paralela; estes dois itens 🔴 foram sinalizados de lados opostos da mesma pilha (Api chamando Infrastructure) e vale lê-los em conjunto:

1. **`PainLogEndpoints` não expõe nenhuma rota `GET`** ([débito](Steady.Api/TechnicalDebtsDocs/PainLogEndpoints-Treino-Dor-Debts.md)) — o `Location` retornado pelo `201 Created` aponta para uma rota que não existe (`GET /api/pain-logs/{id}`), e não há como o corredor consultar seu próprio histórico de dor pela API, mesmo o dado já estando persistido e indexado por `corredor_id` no banco.
2. **Isolamento por Corredor depende só de disciplina manual, sem rede de segurança estrutural** ([débito](Steady.Infrastructure/TechnicalDebtsDocs/SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-Debts.md)) — `SteadyDbContext` não define um `HasQueryFilter` global por `corredor_id`; a regra central de ADR-002 (ver [BusinessRulesDocs](Steady.Infrastructure/BusinessRulesDocs/Isolamento-de-Dados-por-Corredor-Persistencia-Autenticacao-Rules.md)) só é garantida porque cada repositório filtra manualmente. Um novo repositório sem essa filtragem vazaria dados entre corredores sem gerar nenhum erro visível.

Também vale registrar, sem ser crítico: a spec `STORY-001` descreve um indicador booleano "doeu" para `PainLog` que não existe em nenhuma camada do código (Domain, Api ou Infrastructure) — ver [débito no Domain](Steady.Domain/TechnicalDebtsDocs/PainLog-Treino-Dor-Debts.md). Recomenda-se rodar `/sync` para reconciliar spec e código antes de tratar isso como bug.

## Estatísticas

| Projeto | Unidades | Arquivos gerados |
|---|---|---|
| Steady.Api | 5 | 18 |
| Steady.Domain | 4 | 15 |
| Steady.Infrastructure | 5 | 18 |
| **Total** | **14** | **51** |
