# PainLogRepository - Persistencia-Treino - Especificacao Tecnica

## Indice
- [1. Visao Geral Tecnica](#1-visao-geral-tecnica)
- [2. Configuracao e Dependencias](#2-configuracao-e-dependencias)
- [3. Detalhamento por Metodo](#3-detalhamento-por-metodo)
  - [3.1. AddAsync - Persiste um novo registro de dor](#31-addasync---persiste-um-novo-registro-de-dor)
- [4. Observacoes Tecnicas](#4-observacoes-tecnicas)

## 1. Visao Geral Tecnica

**Proposito**: `PainLogRepository` persiste registros de dor pos-treino (`PainLogEntity`), sempre associados ao `CorredorId` do corredor autenticado.

**Responsabilidades**:
- Converter um objeto de dominio `Steady.Domain.Training.PainLog` (ja validado por `PainLog.Create`) em `PainLogEntity` e persisti-lo associado a um `CorredorId`.
- Aplicar a chave de idempotencia recebida do cliente antes de gravar, devolvendo o registro ja existente em vez de duplicar em caso de reenvio -- [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md).

**Integracoes**: chamado por `Steady.Api.Endpoints.PainLogEndpoints` (POST `/api/pain-logs`) -- ver `DocumentAIReadme/Steady.Api/DevDocs/PainLogEndpoints-Treino-Dor-DevDocs.md`. Regras fundamentadas em `specs/STORY-001/spec.bdd.md` (regra de negocio 7: "o registro de dor e independente de sessao especifica: data + regiao do corpo + doeu/nao doeu"), `specs/STORY-002/spec.bdd.md` (persistencia e isolamento) e `specs/STORY-003/spec.bdd.md` (idempotencia, [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md)). O utilitario `IIdempotentRecord`/`SaveResult<TEntity>` usado por `AddAsync` esta documentado em `SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-DevDocs.md#33-iidempotentrecord-e-saveresult---utilitario-de-idempotencia-adr-003`.

**Nota de escopo**: diferente de `RunningSessionRepository` e `StrengthSessionRepository`, este repositorio expoe **apenas escrita** (`AddAsync`) -- nao ha metodo de leitura (`GetByCorredorIdAsync` ou `GetByIdAsync`) nem endpoint de consulta de dor em `Steady.Api`. Isso e coerente com o escopo atual do MVP (a STORY-001 define o registro de dor, sem mencionar uma tela de consulta de historico de dor), mas e uma assimetria real em relacao aos outros dois repositorios de treino -- sinalizada em TechnicalDebtsDocs.

## 2. Configuracao e Dependencias

**Dependencias Injetadas**:
- `SteadyDbContext dbContext`: contexto EF Core injetado via construtor primario, ciclo de vida `Scoped`.

**Interface implementada**: `IPainLogRepository` (`Repositories/IPainLogRepository.cs`).

**Metodos Publicos**:
- `Task<SaveResult<PainLogEntity>> AddAsync(Guid corredorId, PainLog painLog, Guid idempotencyKey, CancellationToken cancellationToken)` -- unico metodo da interface; assinatura alterada pelo [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md), antes retornava `PainLogEntity` direto e nao recebia `idempotencyKey`.

## 3. Detalhamento por Metodo

### 3.1. AddAsync - Persiste um novo registro de dor

**Entrada**:
```json
{
  "corredorId": "Guid - dono do registro, resolvido pelo AuthenticationFilter",
  "painLog": {
    "Date": "DateOnly - data em que a dor foi sentida, pode ser dias apos o treino",
    "Region": "string (obrigatoria, validada em PainLog.Create) - regiao do corpo onde doeu"
  },
  "idempotencyKey": "Guid - lido do header 'Idempotency-Key' pelo Endpoint (ADR-003); gerado pelo cliente no momento em que o item entra na fila local, nao a cada tentativa de envio"
}
```

**Saida**:
```json
{
  "SaveResult<PainLogEntity>": {
    "Entity": {
      "Id": "Guid - gerado pelo repositorio (Guid.NewGuid()) se novo, ou o Id ja existente se reenvio",
      "CorredorId": "Guid",
      "Date": "DateOnly",
      "Region": "string",
      "IdempotencyKey": "Guid"
    },
    "Created": "bool - true se gravou uma linha nova (Endpoint responde 201); false se devolveu um registro ja existente por reenvio da mesma chave (Endpoint responde 200)"
  }
}
```

#### Fluxo de Execucao

```mermaid
sequenceDiagram
    participant Endpoint as Steady.Api.Endpoints.PainLogEndpoints
    participant Repository as PainLogRepository
    participant Context as SteadyDbContext
    participant Database as PostgreSQL (pain_logs)

    Endpoint->>+Repository: AddAsync(corredorId, painLog, idempotencyKey, ct)
    Repository->>+Context: PainLogs.FindByIdempotencyKeyAsync(corredorId, idempotencyKey, ct)
    Context->>+Database: SELECT * FROM pain_logs WHERE corredor_id = @corredorId AND idempotency_key = @idempotencyKey
    Database-->>-Context: 0 ou 1 linha
    Context-->>-Repository: PainLogEntity ou null
    alt Ja existe registro com esta chave (reenvio)
        Repository-->>Endpoint: SaveResult(entity: existente, Created: false)
    else Registro novo
        Repository->>Repository: monta PainLogEntity (Id = NewGuid, CorredorId = corredorId, IdempotencyKey = idempotencyKey, Date, Region)
        Repository->>+Context: PainLogs.Add(entity)
        Repository->>+Context: SaveChangesAsync(ct)
        Context->>+Database: INSERT INTO pain_logs (Id, corredor_id, date, region, idempotency_key) VALUES (...)
        Database-->>-Context: 1 linha afetada
        Context-->>-Repository: ok
        Repository-->>-Endpoint: SaveResult(entity: nova, Created: true)
    end
```

#### Detalhamento do Fluxo

**R. Repository (PainLogRepository)**

R.1. AddAsync()
- Recebe o objeto de dominio `PainLog` ja validado (regiao do corpo obrigatoria, nao vazia -- ver `PainLog.Create` e `specs/STORY-001/spec.bdd.md`), o `corredorId` do contexto de autenticacao e a `idempotencyKey` do header `Idempotency-Key` ([ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md)).
- **Passo 1 -- busca por chave existente**: chama `dbContext.PainLogs.FindByIdempotencyKeyAsync(corredorId, idempotencyKey, ct)` -- documentado em `SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-DevDocs.md#u1-iidempotentrecord-e-saveresult` (U1.1) -> [CTX.1](#ctx1-painlogs-dbset)
- **Se ja existe** (`existing is not null`): retorna imediatamente `new SaveResult<PainLogEntity>(existing, Created: false)` -- **nao grava nada novo**. Caminho de reenvio da fila offline.
- **Se nao existe -- Mapeamento Dominio -> Persistencia (U1)**: monta um novo `PainLogEntity` copiando `Date` e `Region` de `PainLog`, atribuindo `Id = Guid.NewGuid()`, `CorredorId = corredorId` e `IdempotencyKey = idempotencyKey`.
- Adiciona ao `DbSet<PainLogEntity>` e persiste via `SaveChangesAsync` -> [CTX.1](#ctx1-painlogs-dbset)
- Retorna `new SaveResult<PainLogEntity>(entity, Created: true)`. O Endpoint usa `Created` para decidir entre HTTP 201 (novo) e HTTP 200 (reenvio).
- Nota de dominio: o registro de dor **nao referencia** uma `RunningSessionEntity` ou `StrengthSessionEntity` especifica -- e independente de sessao, podendo ser registrado dias depois do treino que (supostamente) o causou, conforme regra de negocio 7 da `specs/STORY-001/spec.bdd.md`.

**CTX. SteadyDbContext**

<a id="ctx1-painlogs-dbset"></a>
CTX.1. PainLogs (DbSet&lt;PainLogEntity&gt;)
- Mapeado para a tabela `pain_logs`: `Id` como chave primaria; `CorredorId` -> `corredor_id` (indexada via `IX_pain_logs_corredor_id`, ainda que hoje nenhuma query de leitura use esse indice, ja que nao ha metodo de consulta); `Date` -> `date`; `Region` -> `region` (obrigatoria, `IsRequired()`); `IdempotencyKey` -> `idempotency_key` (indice UNICO composto `IX_pain_logs_corredor_id_idempotency_key` em `(corredor_id, idempotency_key)`, [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md) -- este indice, diferente do indice simples `corredor_id`, e efetivamente usado pela busca em `FindByIdempotencyKeyAsync`).
- `Region` e persistida como `text` livre (nao um enum fechado como `MuscleGroup`) -- o dominio (`PainLog.Create`) so garante que nao e vazia/nula, sem uma lista fechada de regioes validas.

## 4. Observacoes Tecnicas

- **Performance**: `AddAsync` agora faz 1 SELECT (busca por chave de idempotencia, via `IX_pain_logs_corredor_id_idempotency_key`) antes do INSERT no caminho de registro novo -- primeiro uso efetivo de um indice em `pain_logs` alem do indice simples `corredor_id`, que continua sem consumidor de leitura.
- **Tratamento de Erros**: nenhum tratamento de excecao de infraestrutura explicito, mesmo padrao dos demais repositorios, incluindo o cenario raro de corrida entre dois envios simultaneos com a mesma `idempotencyKey` (mesma observacao feita em `RunningSessionRepository-Persistencia-Treino-DevDocs.md` e `StrengthSessionRepository-Persistencia-Treino-DevDocs.md`).
- **Integracoes Criticas**: apesar de o indice `IX_pain_logs_corredor_id` existir (criado no `OnModelCreating`/migration, coerente com o padrao de isolamento por `corredor_id` de toda a base), ele continua sem uso por nenhuma query, pois nao ha metodo de leitura implementado -- e um indice "pronto para o futuro", nao um desperdicio, mas vale registrar a assimetria (ver TechnicalDebtsDocs). `AddAsync` depende do utilitario `IIdempotentRecord`/`SaveResult<TEntity>` compartilhado com `RunningSessionRepository` e `StrengthSessionRepository`, documentado uma unica vez em `SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-DevDocs.md`.
