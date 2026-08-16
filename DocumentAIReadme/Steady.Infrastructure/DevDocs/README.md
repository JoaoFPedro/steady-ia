# DevDocs - Steady.Infrastructure

Indice da documentacao tecnica detalhada da camada `src/Steady.Infrastructure` (EF Core 9 + Npgsql/PostgreSQL, Repository pattern, DI).

| Arquivo | Descricao |
|---|---|
| [CorredorRepository-Persistencia-Autenticacao-DevDocs.md](./CorredorRepository-Persistencia-Autenticacao-DevDocs.md) | Resolucao e provisionamento automatico do Corredor a partir do `sub` do Google, incluindo tratamento de corrida entre requisicoes concorrentes no primeiro login. |
| [RunningSessionRepository-Persistencia-Treino-DevDocs.md](./RunningSessionRepository-Persistencia-Treino-DevDocs.md) | Persistencia e consulta de sessoes de corrida (`AddAsync`, `GetByCorredorIdAsync`, `GetByIdAsync`), escopadas por corredor. |
| [StrengthSessionRepository-Persistencia-Treino-DevDocs.md](./StrengthSessionRepository-Persistencia-Treino-DevDocs.md) | Persistencia e consulta de sessoes de musculacao, incluindo a conversao dos enums `MuscleGroup`/`Intensity` para texto no banco. |
| [PainLogRepository-Persistencia-Treino-DevDocs.md](./PainLogRepository-Persistencia-Treino-DevDocs.md) | Persistencia de registros de dor pos-treino (`AddAsync` apenas -- sem metodo de leitura implementado). |
| [SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-DevDocs.md](./SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-DevDocs.md) | Mapeamento objeto-relacional completo (`OnModelCreating`) e registro de DI (`AddSteadyInfrastructure`), incluindo a resolucao tardia da connection string. |

## Cobertura

5/5 unidades documentadas: `CorredorRepository`, `RunningSessionRepository`, `StrengthSessionRepository`, `PainLogRepository`, `SteadyDbContext` + `ServiceCollectionExtensions` (documentados juntos como "Configuracao e Persistencia").

## Referencias cruzadas

- Consumidor desta camada: `Steady.Api.Endpoints.*` e `Steady.Api.Auth.AuthenticationFilter` -- ver `DocumentAIReadme/Steady.Api/DevDocs/README.md`.
- Regras de dominio persistidas por estes repositorios: `Steady.Domain.Training.*` -- ver `DocumentAIReadme/Steady.Domain/DevDocs/README.md`.
- Decisao arquitetural que fundamenta o isolamento de dados: [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md).
