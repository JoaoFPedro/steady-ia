# PainLogEndpoints - Treino-Dor - Especificacao Tecnica

## Indice
- [1. Visao Geral Tecnica](#1-visao-geral-tecnica)
- [2. Configuracao e Dependencias](#2-configuracao-e-dependencias)
- [3. Detalhamento por Rota](#3-detalhamento-por-rota)
  - [3.1. Registrar Dor Pos-Treino](#31-registrar-dor-pos-treino)
- [4. Observacoes Tecnicas](#4-observacoes-tecnicas)

## 1. Visao Geral Tecnica

**Proposito**: Expor via API HTTP o registro de dor/desconforto pos-treino relatado pelo corredor, persistindo em PostgreSQL. Traduz a factory de dominio `Steady.Domain.Training.PainLog` para um endpoint REST.

**Responsabilidades**:
- Receber o payload de um registro de dor via `POST /api/pain-logs`, exigindo o header `Idempotency-Key` (ADR-003) para suportar o reenvio da fila offline do app sem duplicar o registro.
- Delegar a validacao de negocio (regiao do corpo obrigatoria) para a factory `PainLog.Create`.
- Persistir o registro associado ao `CorredorId` do usuario autenticado, sem exigir vinculo com uma Sessao de Treino especifica, escopando a chave de idempotencia por corredor.
- Retornar `201 Created` quando o registro e novo, `200 OK` quando a chave ja foi processada (reenvio), ou `400 Bad Request` quando a validacao de dominio falhar ou o header `Idempotency-Key` estiver ausente.

**Integracoes**: PostgreSQL (via `IPainLogRepository` / EF Core), Google Sign-In indiretamente atraves do `AuthenticationFilter`. Diferente de `RunningSessionEndpoints`/`StrengthSessionEndpoints`, o registro de dor **nao** e consumido pela regra de deteccao de sobrecarga (`OverloadDetectionService`) - serve como sinal de calibracao para revisao futura da regra (ver [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md), secao Riscos).

## 2. Configuracao e Dependencias

Este arquivo (`src/Steady.Api/Endpoints/PainLogEndpoints.cs`) e uma classe estatica que expoe o metodo de extensao `MapPainLogEndpoints(RouteGroupBuilder)`, chamado a partir de `Program.cs` sobre o grupo `/api`.

**Dependencias Injetadas (via parametros do delegate da rota)**:
- `[FromHeader(Name = Idempotency.HeaderName)] Guid? idempotencyKey`: header `Idempotency-Key` (Guid v4), obrigatorio para registrar (ADR-003).
- `IPainLogRepository`: abstracao de persistencia do registro de dor (implementada por `PainLogRepository`, `Steady.Infrastructure`).
- `CurrentCorredor`: contexto do usuario autenticado, preenchido pelo `AuthenticationFilter`.
- `CancellationToken`: propagado a partir do `HttpContext.RequestAborted`.

**Dependencia estatica (nao injetada)**:
- `Steady.Api.Common.DomainFactory` (classe `internal static`): traduz excecoes de guard clause do dominio em `400 Bad Request`.
- `Steady.Api.Common.Idempotency` (classe `internal static`): define o nome do header e a resposta `400` padrao quando ausente - mesmo componente documentado em [RunningSessionEndpoints DevDocs - U1.3](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#u13-idempotency).

**Lista de Endpoints**:
- **POST** `/api/pain-logs` - Registra um novo relato de dor/desconforto para o corredor autenticado.

## 3. Detalhamento por Rota

### 3.1. Registrar Dor Pos-Treino

**Rota**: `POST /api/pain-logs`

**Autenticacao**: obrigatoria (Bearer ID token do Google) - aplicada pelo `AuthenticationFilter` no grupo `/api`.

**Header obrigatorio**: `Idempotency-Key: {guid v4}` (ADR-003). Gerado pelo app no momento em que o registro entra na fila local de sincronizacao offline - garante que um reenvio apos falha de rede nao cria um registro de dor duplicado.

**Entrada** (`PainLogRequest`, `src/Steady.Api/Contracts/PainLogContracts.cs`):
```json
{
  "date": "2026-08-08",
  "region": "Canela"
}
```
`region` e um campo de texto livre (`string`), nao um enum fechado como `MuscleGroup`.

**Saida - 201 Created** (`PainLogResponse`, primeira vez que a chave e processada):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "date": "2026-08-08",
  "region": "Canela"
}
```
Header `Location`: `/api/pain-logs/{id}`. Diferente de `RunningSessionEndpoints`/`StrengthSessionEndpoints`, aqui o `Location` aponta para o proprio namespace de `pain-logs` - porem **nao existe** uma rota `GET /api/pain-logs/{id}` implementada (ver [Observacoes Tecnicas](#4-observacoes-tecnicas)).

**Saida - 200 OK** (`PainLogResponse`, reenvio com a mesma `Idempotency-Key` ja processada para este corredor - ADR-003): mesmo corpo do `201` acima, sem header `Location`, sem criar um segundo registro.

**Saida - 400 Bad Request**:
```json
{
  "error": "A região do corpo é obrigatória para registrar dor."
}
```
```json
{
  "error": "O header Idempotency-Key é obrigatório para registrar."
}
```

**Saida - 401 Unauthorized**: sem header `Authorization: Bearer {token}`, ou token invalido/expirado.

#### Fluxo de Execucao

```mermaid
sequenceDiagram
    participant Client
    participant AuthenticationFilter
    participant Endpoint as PainLogEndpoints
    participant Domain as PainLog (Steady.Domain)
    participant Repository as PainLogRepository
    participant Database as PostgreSQL

    Client->>+AuthenticationFilter: POST /api/pain-logs (Bearer token, header Idempotency-Key, JSON)
    AuthenticationFilter->>AuthenticationFilter: valida token e resolve Corredor (ver F.1)
    alt Token ausente/invalido/expirado
        AuthenticationFilter-->>Client: 401 Unauthorized
    else Token valido
        AuthenticationFilter->>+Endpoint: next() com CurrentCorredor.Id preenchido
        alt Header Idempotency-Key ausente
            Endpoint-->>Client: 400 Bad Request (Idempotency.MissingKey)
        else Header presente
            Endpoint->>+Domain: PainLog.Create(date, region)
            alt Guard clause falha (regiao vazia/nula)
                Domain-->>Endpoint: throw ArgumentException
                Endpoint-->>Client: 400 Bad Request (mensagem de dominio)
            else Dados validos
                Domain-->>-Endpoint: instancia PainLog
                Endpoint->>+Repository: AddAsync(currentCorredor.Id, painLog, idempotencyKey, ct)
                Repository->>+Database: SELECT pain_logs WHERE corredor_id + idempotency_key
                Database-->>-Repository: chave ja existe?
                alt Chave ja processada (reenvio)
                    Repository-->>-Endpoint: SaveResult(entity existente, Created=false)
                    Endpoint-->>-Client: 200 OK (PainLogResponse, sem novo INSERT)
                else Chave nova
                    Repository->>+Database: INSERT INTO pain_logs (com idempotency_key)
                    Database-->>-Repository: linha persistida (Id gerado)
                    Repository-->>-Endpoint: SaveResult(entity nova, Created=true)
                    Endpoint-->>-Client: 201 Created (PainLogResponse)
                end
            end
        end
    end
```

#### Detalhamento do Fluxo

**E. Endpoint (PainLogEndpoints)**

E.1. `MapPainLogEndpoints()` - handler de `POST /pain-logs`
- Recebe `PainLogRequest`, `idempotencyKey` do header, `IPainLogRepository`, `CurrentCorredor` e `CancellationToken` por injecao de parametros.
- Se `idempotencyKey is null`, retorna imediatamente `Idempotency.MissingKey()` - `400 Bad Request`, antes de qualquer validacao de dominio.
- Chama `DomainFactory.TryCreate` passando uma factory que invoca `PainLog.Create(request.Date, request.Region)` -> [U1.1](#u11-domainfactorytrycreate) -> [D1.1](#d11-painlogcreate).
- Se `TryCreate` retornar `false`, devolve o `IResult` de erro (`400 Bad Request`).
- Se `TryCreate` retornar `true`, chama `repository.AddAsync(currentCorredor.Id, painLog!, idempotencyKey.Value, cancellationToken)` -> [R1.1](#r11-painlogrepositoryaddasync), que retorna `SaveResult<PainLogEntity>` (`Entity` + `Created`).
- Monta `PainLogResponse` a partir de `entity`.
- Se `created == true`: `Results.Created($"/api/pain-logs/{entity.Id}", response)` -> `201 Created`. Se `created == false` (reenvio): `Results.Ok(response)` -> `200 OK`.

**F. Endpoint Filter (AuthenticationFilter)**

<a id="f1-authenticationfilterinvokeasync"></a>
F.1. `InvokeAsync()` - aplicado a todo o grupo `/api`. Mesmo comportamento documentado em [RunningSessionEndpoints DevDocs - F.1](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#f1-authenticationfilterinvokeasync): valida o Bearer token do Google, resolve/cria o `Corredor`, preenche `CurrentCorredor.Id`, ou retorna `401`.

**D1. Domain (PainLog, Steady.Domain.Training)**

<a id="d11-painlogcreate"></a>
D1.1. `PainLog.Create(date, region)` - factory estatica, construtor privado.
- Guard clause: `string.IsNullOrWhiteSpace(region)` -> `ArgumentException` ("A região do corpo é obrigatória para registrar dor.").
- Regra de negocio #7 do `specs/STORY-001/spec.bdd.md`: o registro de dor e independente de uma Sessao de Treino especifica - so exige data + regiao do corpo. Pode ser registrado a qualquer momento apos o treino, inclusive dias depois (nenhuma validacao de janela temporal existe no dominio).
- Nao ha validacao de formato/lista fechada para `region` - qualquer string nao vazia e aceita (texto livre).
- Se o guard passar, retorna uma instancia imutavel de `PainLog`.
- Nao existe um indicador booleano "doeu/nao doeu" explicito no modelo atual - a propria existencia do registro representa "doeu" (spec nota: "escala de intensidade de dor fica binaria: doeu/nao doeu no MVP" - o "nao doeu" simplesmente nao gera registro).

**U1. Common/Auth (DomainFactory, CurrentCorredor)**

<a id="u11-domainfactorytrycreate"></a>
U1.1. `DomainFactory.TryCreate<T>(factory, out value, out error)` - identico ao comportamento documentado em [RunningSessionEndpoints DevDocs - U1.1](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#u11-domainfactorytrycreate).

U1.2. `CurrentCorredor` - identico ao documentado em [RunningSessionEndpoints DevDocs](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md): preenchido por [F.1](#f1-authenticationfilterinvokeasync).

U1.3. `Idempotency` - identico ao documentado em [RunningSessionEndpoints DevDocs - U1.3](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#u13-idempotency): `Idempotency.HeaderName` e `Idempotency.MissingKey()` (ADR-003).

**R1. Repository (PainLogRepository, Steady.Infrastructure.Repositories)**

<a id="r11-painlogrepositoryaddasync"></a>
R1.1. `PainLogRepository.AddAsync(corredorId, painLog, idempotencyKey, cancellationToken)` - retorna `Task<SaveResult<PainLogEntity>>`, mesmo padrao documentado em [RunningSessionEndpoints DevDocs - R1.1](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#r11-runningsessionrepositoryaddasync).
- Consulta `dbContext.PainLogs.FindByIdempotencyKeyAsync(corredorId, idempotencyKey, cancellationToken)`; se ja existir, retorna `new SaveResult<PainLogEntity>(existing, Created: false)` sem `INSERT`.
- Se nao existir: monta um `PainLogEntity` com `Id = Guid.NewGuid()`, `CorredorId = corredorId` e `IdempotencyKey = idempotencyKey`.
- Copia `Date` e `Region` da instancia de dominio validada.
- `dbContext.PainLogs.Add(entity)` seguido de `await dbContext.SaveChangesAsync(cancellationToken)` - grava na tabela `pain_logs`.
- Retorna `new SaveResult<PainLogEntity>(entity, Created: true)`. Nota: `IPainLogRepository` expoe **apenas** `AddAsync` - nao ha metodo de leitura (`GetByCorredorIdAsync`/`GetByIdAsync`) nesta interface, ao contrario de `IRunningSessionRepository`/`IStrengthSessionRepository`.

## 4. Observacoes Tecnicas

- **Performance**: `AddAsync` faz uma consulta `SELECT` por `(corredor_id, idempotency_key)` antes do possivel `INSERT` (mesma mudanca documentada em [RunningSessionEndpoints DevDocs](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#4-observacoes-tecnicas)), coberta pelo indice unico composto.
- **Tratamento de Erros**: erros de guard clause do dominio viram `400`. Header `Idempotency-Key` ausente vira `400` via `Idempotency.MissingKey()`. Excecoes fora desses casos nao sao tratadas explicitamente (mesmo debito ja identificado em `RunningSessionEndpoints`).
- **Integracoes Criticas**: PostgreSQL e o `AuthenticationFilter`/Google Sign-In.
- **Idempotencia resolve o risco de duplicata por reenvio (ADR-003)**: mesmo mecanismo documentado em [RunningSessionEndpoints DevDocs](./RunningSessionEndpoints-Treino-Corrida-DevDocs.md#4-observacoes-tecnicas) - reenvio da fila offline devolve `200 OK` com o registro existente. Como `PainLog` nao alimenta a deteccao de sobrecarga (ver abaixo), o principal ganho aqui e a integridade do proprio historico de dor, nao a protecao de um calculo de risco.
- **Ausencia de leitura**: nao existe nenhuma rota `GET` para consultar registros de dor - nem individualmente, nem em lista, nem no historico consolidado (`TrainingHistoryEndpoints` so lista corrida e musculacao). O `Location` do `201 Created` (`/api/pain-logs/{id}`) referencia uma rota que nao existe; a resposta `200 OK` de reenvio tambem nao envia `Location`. Ver [TechnicalDebtsDocs](../TechnicalDebtsDocs/PainLogEndpoints-Treino-Dor-Debts.md).
- **Sem uso na deteccao de sobrecarga**: apesar de ser parte central da motivacao do produto (dor recorrente pos-treino), o `PainLog` nao alimenta `OverloadDetectionService.Evaluate` - a regra atual usa apenas `RunningSession` e `StrengthSession` (ver [ADR-001](../../../docs/adr/ADR-001-regra-sobrecarga-combinada.md)).
