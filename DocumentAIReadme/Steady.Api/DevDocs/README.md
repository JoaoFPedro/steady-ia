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

- Autenticacao (`AuthenticationFilter`, aplicada a todo o grupo `/api`): detalhada em cada arquivo acima, seção "F. Endpoint Filter" - fonte canonica em [RunningSessionEndpoints DevDocs - F.1](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#f1-authenticationfilterinvokeasync), incluindo a restricao de audiencia do ID token (ADR-002, adendo 2026-08-16).
- Traducao de erro de dominio para HTTP 400 (`Common.DomainFactory.TryCreate`): detalhada em cada arquivo de rota de escrita, seção "U1. Common/Auth".
- Idempotencia nos tres endpoints de registro (`Common.Idempotency`, header `Idempotency-Key`, `SaveResult<TEntity>`): fonte canonica em [RunningSessionEndpoints DevDocs - U1.3](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#u13-idempotency) e [R1.1](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#r11-runningsessionrepositoryaddasync) - [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md).
- Regra de deteccao de sobrecarga (`OverloadDetectionService`): [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md).
- Autenticacao via Google e isolamento de dados por corredor: [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md).
- Estado de historico insuficiente exposto no contrato de `OverloadAssessmentResponse` (`hasSufficientHistory`): [ADR-004](../../../docs/adr/ADR-004-estado-de-historico-insuficiente-no-contrato-de-avaliacao.md).
