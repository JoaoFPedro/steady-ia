# TechnicalDebtsDocs - Steady.Api - Indice

Analise de debitos tecnicos por classe de Endpoints do `src/Steady.Api`, com criticidade e plano de acao.

| Arquivo | Descricao |
|---------|-----------|
| [RunningSessionEndpoints-Treino-Corrida-Debts.md](./RunningSessionEndpoints-Treino-Corrida-Debts.md) | Location inconsistente no 201, ausencia de middleware de excecao global |
| [StrengthSessionEndpoints-Treino-Forca-Debts.md](./StrengthSessionEndpoints-Treino-Forca-Debts.md) | Acoplamento enum-string persistido, Location inconsistente, ausencia de middleware de excecao |
| [PainLogEndpoints-Treino-Dor-Debts.md](./PainLogEndpoints-Treino-Dor-Debts.md) | Ausencia total de rotas de leitura para registros de dor, regiao como texto livre nao normalizado |
| [OverloadAssessmentEndpoints-Sobrecarga-Debts.md](./OverloadAssessmentEndpoints-Sobrecarga-Debts.md) | Carga de historico completo sem filtro de data, PainLog nao integrado ao calculo |
| [TrainingHistoryEndpoints-Historico-Debts.md](./TrainingHistoryEndpoints-Historico-Debts.md) | Ausencia de paginacao na listagem, consulta individual ineficiente para musculacao |

## Debitos transversais (repetidos em multiplos arquivos)

- **Ausencia de middleware global de tratamento de excecao**: excecoes fora de `ArgumentException` (ex.: falha do PostgreSQL) nao sao tratadas explicitamente em nenhum endpoint de escrita, retornando erro nao padronizado. Identificado em `RunningSessionEndpoints`, `StrengthSessionEndpoints` e `PainLogEndpoints`.
- **Location inconsistente no 201 Created**: `RunningSessionEndpoints` e `StrengthSessionEndpoints` apontam para `/api/training-sessions/{id}` (rota de outro arquivo); `PainLogEndpoints` aponta para uma rota que nao existe. A resposta `200 OK` de reenvio (ADR-003) nao envia `Location` em nenhum dos tres.
- **Ausencia de paginacao/filtro de data**: identificado tanto em `OverloadAssessmentEndpoints` (carga de historico sem filtro de data) quanto em `TrainingHistoryEndpoints` (listagem sem paginacao) - mesma raiz: repositorios de sessao nao aceitam filtro de data.

## Debito resolvido desde a ultima revisao

- **Risco de duplicata por reenvio da fila offline**: identificado como debito implicito em `RunningSessionEndpoints`, `StrengthSessionEndpoints` e `PainLogEndpoints` antes da STORY-003. Resolvido pela chave de idempotencia obrigatoria (`Idempotency-Key`) e pelo indice unico `(corredor_id, idempotency_key)` - [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md). Nao consta mais como item aberto em nenhum dos tres arquivos.
