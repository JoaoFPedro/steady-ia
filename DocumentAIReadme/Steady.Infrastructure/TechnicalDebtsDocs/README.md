# TechnicalDebtsDocs - Steady.Infrastructure

Indice da analise de debitos tecnicos da camada `src/Steady.Infrastructure`.

| Arquivo | Descricao | Criticidade mais alta encontrada |
|---|---|---|
| [CorredorRepository-Persistencia-Autenticacao-Debts.md](./CorredorRepository-Persistencia-Autenticacao-Debts.md) | Falta de teste dedicado a condicao de corrida do provisionamento; ausencia de observabilidade no provisionamento. | Amarelo Importante |
| [RunningSessionRepository-Persistencia-Treino-Debts.md](./RunningSessionRepository-Persistencia-Treino-Debts.md) | Ausencia de paginacao no historico; ausencia de indice composto por data; sem teste dedicado. | Amarelo Importante |
| [StrengthSessionRepository-Persistencia-Treino-Debts.md](./StrengthSessionRepository-Persistencia-Treino-Debts.md) | Risco de renomeacao de valores de enum persistidos como texto; mesmos debitos de paginacao/indice de RunningSessionRepository. | Amarelo Importante |
| [PainLogRepository-Persistencia-Treino-Debts.md](./PainLogRepository-Persistencia-Treino-Debts.md) | Nenhuma forma de consultar registros de dor ja persistidos; regiao do corpo sem normalizacao. | Amarelo Importante |
| [SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-Debts.md](./SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-Debts.md) | Isolamento por `corredor_id` depende inteiramente de disciplina manual em cada repositorio, sem filtro global (`HasQueryFilter`) no `DbContext` como rede de seguranca estrutural. | **Vermelho Critico** |

## Cobertura

5/5 unidades documentadas, uma TechnicalDebtsDocs por unidade de `Steady.Infrastructure`.

## Destaque de maior criticidade

O item mais critico de toda a camada esta em `SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-Debts.md`: a ausencia de um filtro global de isolamento por `CorredorId` no `SteadyDbContext` significa que o isolamento de dados (regra de seguranca central do produto, ver [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)) depende inteiramente de cada metodo de repositorio, presente e futuro, lembrar de filtrar manualmente por `corredor_id`. Recomenda-se avaliar `HasQueryFilter` como proxima prioridade de hardening desta camada.

## Debitos recorrentes entre unidades

- **Ausencia de testes dedicados ao Infrastructure**: nenhum dos cinco componentes tem teste de integracao proprio -- toda a cobertura vem indiretamente de `tests/Steady.Api.Tests` (via Testcontainers). Um projeto `Steady.Infrastructure.Tests` dedicado reduziria o acoplamento dos testes de repositorio ao pipeline HTTP completo.
- **Ausencia de paginacao e de indices compostos por data**: recorrente em `RunningSessionRepository` e `StrengthSessionRepository`, com plano de acao equivalente sugerido em ambos.
