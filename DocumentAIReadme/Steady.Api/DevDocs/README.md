# DevDocs - Steady.Api - Indice

Documentacao tecnica detalhada de cada classe de Endpoints do `src/Steady.Api`, com fluxo completo por camada (Endpoint -> Endpoint Filter -> Domain -> Repository -> Database) e diagramas de sequencia Mermaid.

| Arquivo | Descricao |
|---------|-----------|
| [RunningSessionEndpoints-Treino-Corrida-DevDocs.md](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md) | Registro de Sessao de Treino de Corrida (`POST /api/running-sessions`) |
| [StrengthSessionEndpoints-Treino-Forca-DevDocs.md](./StrengthSessionEndpoints-Treino-Forca-DevDocs.md) | Registro de Sessao de Treino de Musculacao (`POST /api/strength-sessions`) |
| [PainLogEndpoints-Treino-Dor-DevDocs.md](./PainLogEndpoints-Treino-Dor-DevDocs.md) | Registro de dor pos-treino (`POST /api/pain-logs`) |
| [OverloadAssessmentEndpoints-Sobrecarga-DevDocs.md](./OverloadAssessmentEndpoints-Sobrecarga-DevDocs.md) | Avaliacao de risco de sobrecarga combinada (`GET /api/overload-assessment`) |
| [TrainingHistoryEndpoints-Historico-DevDocs.md](./TrainingHistoryEndpoints-Historico-DevDocs.md) | Historico consolidado de treinos (`GET /api/training-sessions`, `GET /api/training-sessions/{id}`) |

## Referencias transversais

- Autenticacao (`AuthenticationFilter`, aplicada a todo o grupo `/api`): detalhada em cada arquivo acima, seção "F. Endpoint Filter" - fonte canonica em [RunningSessionEndpoints DevDocs - F.1](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#f1-authenticationfilterinvokeasync).
- Traducao de erro de dominio para HTTP 400 (`Common.DomainFactory.TryCreate`): detalhada em cada arquivo de rota de escrita, seção "U1. Common/Auth".
- Regra de deteccao de sobrecarga (`OverloadDetectionService`): [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md).
- Autenticacao via Google e isolamento de dados por corredor: [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md).
