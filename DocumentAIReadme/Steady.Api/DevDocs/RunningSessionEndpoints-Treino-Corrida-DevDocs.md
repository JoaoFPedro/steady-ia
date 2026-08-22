# RunningSessionEndpoints - Treino-Corrida - Especificacao Tecnica

## Indice
- [1. Visao Geral Tecnica](#1-visao-geral-tecnica)
- [2. Configuracao e Dependencias](#2-configuracao-e-dependencias)
- [3. Detalhamento por Rota](#3-detalhamento-por-rota)
  - [3.1. Registrar Sessao de Treino de Corrida](#31-registrar-sessao-de-treino-de-corrida)
- [4. Observacoes Tecnicas](#4-observacoes-tecnicas)

## 1. Visao Geral Tecnica

**Proposito**: Expor via API HTTP o registro de Sessoes de Treino de Corrida do corredor autenticado, persistindo os dados em PostgreSQL. Traduz a factory de dominio `Steady.Domain.Training.RunningSession` para um endpoint REST, sem duplicar regras de validacao.

**Responsabilidades**:
- Receber o payload de uma sessao de corrida via `POST /api/running-sessions`, exigindo o header `Idempotency-Key` (ADR-003) para suportar o reenvio da fila offline do app sem duplicar o registro.
- Delegar a validacao de negocio (guard clauses) para a factory `RunningSession.Create`.
- Persistir a sessao associada ao `CorredorId` do usuario autenticado, escopando a chave de idempotencia por corredor.
- Retornar `201 Created` quando o registro e novo, `200 OK` quando a chave ja foi processada (reenvio), ou `400 Bad Request` quando a validacao de dominio falhar ou o header `Idempotency-Key` estiver ausente.

**Integracoes**: PostgreSQL (via `IRunningSessionRepository` / EF Core), Google Sign-In indiretamente atraves do `AuthenticationFilter` aplicado ao grupo `/api`.

## 2. Configuracao e Dependencias

Este arquivo (`src/Steady.Api/Endpoints/RunningSessionEndpoints.cs`) e uma classe estatica que expoe o metodo de extensao `MapRunningSessionEndpoints(RouteGroupBuilder)`, chamado a partir de `Program.cs` sobre o grupo `/api` (que ja tem `AddEndpointFilter<AuthenticationFilter>()` aplicado globalmente).

**Dependencias Injetadas (via parametros do delegate da rota)**:
- `[FromHeader(Name = Idempotency.HeaderName)] Guid? idempotencyKey`: header `Idempotency-Key` (Guid v4), obrigatorio para registrar (ADR-003). Binding nulavel para permitir validacao explicita no handler em vez de erro generico de model binding.
- `IRunningSessionRepository`: abstracao de persistencia da sessao de corrida (implementada por `RunningSessionRepository`, `Steady.Infrastructure`).
- `CurrentCorredor`: contexto do usuario autenticado (`Id` do corredor), preenchido pelo `AuthenticationFilter` antes do handler ser executado.
- `CancellationToken`: propagado pelo ASP.NET Core a partir do `HttpContext.RequestAborted`.

**Dependencia estatica (nao injetada)**:
- `Steady.Api.Common.DomainFactory` (classe `internal static`): traduz excecoes de guard clause do dominio em `400 Bad Request`.
- `Steady.Api.Common.Idempotency` (classe `internal static`, `src/Steady.Api/Common/Idempotency.cs`): define o nome do header (`Idempotency.HeaderName = "Idempotency-Key"`) e a resposta `400` padrao quando o header esta ausente (`Idempotency.MissingKey()`).

**Lista de Endpoints**:
- **POST** `/api/running-sessions` - Registra uma nova Sessao de Treino de Corrida para o corredor autenticado.

## 3. Detalhamento por Rota

### 3.1. Registrar Sessao de Treino de Corrida

**Rota**: `POST /api/running-sessions`

**Autenticacao**: obrigatoria (Bearer ID token do Google) - aplicada pelo `AuthenticationFilter` no grupo `/api` (ver [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)).

**Header obrigatorio**: `Idempotency-Key: {guid v4}` (ADR-003). Gerado pelo app no momento em que o registro entra na fila local de sincronizacao offline, nao a cada tentativa de envio - isso e o que garante que um reenvio apos falha de rede nao cria um treino duplicado.

**Entrada** (`RunningSessionRequest`, `src/Steady.Api/Contracts/RunningSessionContracts.cs`):
```json
{
  "date": "2026-08-10",
  "distanceKm": 10.5,
  "durationMinutes": 55,
  "averagePaceMinPerKm": 5.24,
  "perceivedEffort": 7
}
```

**Saida - 201 Created** (`RunningSessionResponse`, primeira vez que a chave e processada):
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "date": "2026-08-10",
  "distanceKm": 10.5,
  "durationMinutes": 55,
  "averagePaceMinPerKm": 5.24,
  "perceivedEffort": 7
}
```
Header `Location`: `/api/training-sessions/{id}` (nota: aponta para o recurso consolidado de `TrainingHistoryEndpoints`, nao para uma rota `/api/running-sessions/{id}` propria - ver [Observacoes Tecnicas](#4-observacoes-tecnicas)).

**Saida - 200 OK** (`RunningSessionResponse`, reenvio com a mesma `Idempotency-Key` ja processada para este corredor - ADR-003): mesmo corpo do `201` acima, porem sem header `Location` (`Results.Ok` nao define esse header) e sem criar uma segunda linha - devolve o registro ja existente. O app trata `200` e `201` como sucesso equivalente e remove o item da fila local em ambos os casos.

**Saida - 400 Bad Request** (quando a factory de dominio rejeita os dados):
```json
{
  "error": "A distância deve ser maior que zero."
}
```

**Saida - 400 Bad Request** (quando o header `Idempotency-Key` esta ausente - `Idempotency.MissingKey()`):
```json
{
  "error": "O header Idempotency-Key é obrigatório para registrar."
}
```

**Saida - 401 Unauthorized**: sem header `Authorization: Bearer {token}`, ou token invalido/expirado (retornado pelo `AuthenticationFilter` antes do handler ser alcancado).

#### Fluxo de Execucao

```mermaid
sequenceDiagram
    participant Client
    participant AuthenticationFilter
    participant Endpoint as RunningSessionEndpoints
    participant Domain as RunningSession (Steady.Domain)
    participant Repository as RunningSessionRepository
    participant Database as PostgreSQL

    Client->>+AuthenticationFilter: POST /api/running-sessions (Bearer token, header Idempotency-Key, JSON)
    AuthenticationFilter->>AuthenticationFilter: valida token e resolve Corredor (ver F.1)
    alt Token ausente/invalido/expirado
        AuthenticationFilter-->>Client: 401 Unauthorized
    else Token valido
        AuthenticationFilter->>+Endpoint: next() com CurrentCorredor.Id preenchido
        alt Header Idempotency-Key ausente
            Endpoint-->>Client: 400 Bad Request (Idempotency.MissingKey)
        else Header presente
            Endpoint->>+Domain: RunningSession.Create(date, distanceKm, durationMinutes, pace, effort)
            alt Guard clause falha
                Domain-->>Endpoint: throw ArgumentException/ArgumentOutOfRangeException
                Endpoint-->>Client: 400 Bad Request (mensagem de dominio)
            else Dados validos
                Domain-->>-Endpoint: instancia RunningSession
                Endpoint->>+Repository: AddAsync(currentCorredor.Id, session, idempotencyKey, ct)
                Repository->>+Database: SELECT running_sessions WHERE corredor_id + idempotency_key
                Database-->>-Repository: chave ja existe?
                alt Chave ja processada (reenvio)
                    Repository-->>-Endpoint: SaveResult(entity existente, Created=false)
                    Endpoint-->>-Client: 200 OK (RunningSessionResponse, sem novo INSERT)
                else Chave nova
                    Repository->>+Database: INSERT INTO running_sessions (com idempotency_key)
                    Database-->>-Repository: linha persistida (Id gerado)
                    Repository-->>-Endpoint: SaveResult(entity nova, Created=true)
                    Endpoint-->>-Client: 201 Created (RunningSessionResponse)
                end
            end
        end
    end
```

#### Detalhamento do Fluxo

**E. Endpoint (RunningSessionEndpoints)**

E.1. `MapRunningSessionEndpoints()` - handler de `POST /running-sessions`
- Recebe `RunningSessionRequest` desserializado do corpo da requisicao, `idempotencyKey` do header, `IRunningSessionRepository`, `CurrentCorredor` e `CancellationToken` por injecao de parametros do Minimal API.
- Se `idempotencyKey is null` (header `Idempotency-Key` ausente), retorna imediatamente `Idempotency.MissingKey()` -> [U1.3](#u13-idempotency) - `400 Bad Request`, antes de qualquer validacao de dominio.
- Chama `DomainFactory.TryCreate` passando uma factory que invoca `RunningSession.Create(...)` -> [U1.1](#u11-domainfactorytrycreate) -> [D1.1](#d11-runningsessioncreate).
- Se `TryCreate` retornar `false`, devolve imediatamente o `IResult` de erro (`400 Bad Request`) contido em `error`.
- Se `TryCreate` retornar `true`, chama `repository.AddAsync(currentCorredor.Id, session!, idempotencyKey.Value, cancellationToken)` -> [R1.1](#r11-runningsessionrepositoryaddasync), que retorna `SaveResult<RunningSessionEntity>` (`Entity` + `Created`).
- Monta `RunningSessionResponse` a partir de `entity` (a linha persistida agora, ou a ja existente em caso de reenvio).
- Se `created == true`: `Results.Created($"/api/training-sessions/{entity.Id}", response)` -> `201 Created`. Se `created == false` (reenvio com a mesma chave): `Results.Ok(response)` -> `200 OK`, sem header `Location`.

**F. Endpoint Filter (AuthenticationFilter)**

<a id="f1-authenticationfilterinvokeasync"></a>
F.1. `InvokeAsync()` - aplicado a todo o grupo `/api` via `Program.cs` (`api.AddEndpointFilter<AuthenticationFilter>()`), executado antes de qualquer endpoint mapeado neste arquivo.
- Le o header `Authorization`; se nao comecar com `"Bearer "`, retorna `401 Unauthorized` (motivo `missing_bearer_token`, logado via `logger.LogWarning`, nunca com o token em si - OWASP A09).
- Extrai o `idToken` e valida via `IGoogleTokenValidator.ValidateAndGetSubAsync(idToken)` (implementacao real chama a biblioteca oficial `Google.Apis.Auth.GoogleJsonWebSignature`, que valida assinatura/expiracao usando chave publica cacheada - sem round-trip de rede por requisicao).
- **Restricao de audiencia (ADR-002, adendo 2026-08-16)**: `GoogleTokenValidator` passa `ValidationSettings.Audience = [options.ClientId]` (`GoogleAuthOptions.ClientId`) para `GoogleJsonWebSignature.ValidateAsync`. Sem isso, a biblioteca nao checa o claim `aud` e aceitaria qualquer ID token valido do Google, inclusive um emitido para outro aplicativo - a checagem de assinatura sozinha nao cobre esse caso. Com a restricao, um ID token valido mas emitido para outro `ClientId` cai no mesmo caminho de `invalid_or_expired_token` (`sub` retorna `null`).
- **Falha fechada em `Program.cs`**: a API se recusa a subir se `Google:ClientId` nao estiver configurado (`InvalidOperationException` lancada na composicao raiz, `Program.cs` linhas 9-19) - a alternativa (subir sem `Audience` configurado) reabriria a falha de isolamento acima de forma silenciosa em runtime.
- Se o `sub` retornado for `null` (token invalido/expirado/emitido para outra audiencia), retorna `401 Unauthorized` (motivo `invalid_or_expired_token`).
- Com `sub` valido, chama `ICorredorRepository.GetOrCreateBySubAsync(sub, ct)` - upsert automatico do Corredor (ver [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)).
- Preenche `currentCorredor.Id = corredor.Id` (instancia `Scoped`, injetada tambem no handler do endpoint) e invoca `next(context)` para prosseguir ao handler real.

**D1. Domain (RunningSession, Steady.Domain.Training)**

<a id="d11-runningsessioncreate"></a>
D1.1. `RunningSession.Create(date, distanceKm, durationMinutes, averagePaceMinPerKm, perceivedEffort)` - factory estatica, construtor privado.
- Guard clause: `distanceKm <= 0` -> `ArgumentOutOfRangeException` ("A distância deve ser maior que zero.").
- Guard clause: `durationMinutes <= 0` -> `ArgumentOutOfRangeException` ("A duração deve ser maior que zero.").
- Guard clause: `perceivedEffort < 1 || perceivedEffort > 10` -> `ArgumentOutOfRangeException` ("A percepção de esforço deve estar entre 1 e 10.").
- Regras de negocio #1 do `specs/STORY-001/spec.bdd.md`. Ambas `ArgumentOutOfRangeException` e `ArgumentException` derivam de `ArgumentException`, entao sao capturadas por [U1.1](#u11-domainfactorytrycreate).
- Se todos os guards passarem, retorna uma instancia imutavel de `RunningSession` (propriedades somente leitura).
- Expoe tambem a propriedade calculada `Load` (`DurationMinutes * PerceivedEffort` - session-RPE, Foster 2001), nao utilizada diretamente por esta rota, mas consumida pelo fluxo de [OverloadAssessmentEndpoints](./OverloadAssessmentEndpoints-Sobrecarga-DevDocs.md).

**U1. Common/Auth (DomainFactory, CurrentCorredor)**

<a id="u11-domainfactorytrycreate"></a>
U1.1. `DomainFactory.TryCreate<T>(factory, out value, out error)` (`src/Steady.Api/Common/DomainFactory.cs`, classe `internal static`)
- Executa a `Func<T> factory` recebida (neste caso, a chamada a `RunningSession.Create`) dentro de um `try/catch`.
- Sucesso: preenche `value` com a instancia criada, `error = null`, retorna `true`.
- Excecao do tipo `ArgumentException` (inclui `ArgumentOutOfRangeException`): preenche `value = default`, `error = Results.BadRequest(new { error = ex.Message })`, retorna `false`. Reaproveita a mensagem de dominio ja escrita nas guard clauses (spec STORY-002, regra de negocio #5).
- Qualquer outra excecao nao capturada propaga normalmente (nao vira `400` - vira erro nao tratado / `500`).

U1.2. `CurrentCorredor` (`src/Steady.Api/Auth/CurrentCorredor.cs`) - classe simples com propriedade `Guid Id`, registrada como `Scoped` no container de DI. Preenchida por [F.1](#f1-authenticationfilterinvokeasync) e consumida diretamente pelo handler do endpoint para escopar a persistencia por corredor.

<a id="u13-idempotency"></a>
U1.3. `Idempotency` (`src/Steady.Api/Common/Idempotency.cs`, classe `internal static`, ADR-003)
- `Idempotency.HeaderName = "Idempotency-Key"` - nome do header lido via `[FromHeader(Name = Idempotency.HeaderName)] Guid? idempotencyKey` no delegate da rota.
- `Idempotency.MissingKey()` - retorna `Results.BadRequest(new { error = "O header Idempotency-Key é obrigatório para registrar." })`, usado por E.1 quando `idempotencyKey is null`.
- Existe para que a garantia de nao-duplicacao nao dependa da disciplina do cliente em sempre enviar o header - a ausencia e rejeitada explicitamente em vez de, por exemplo, gerar uma chave no servidor (o que anularia a idempotencia).

**R1. Repository (RunningSessionRepository, Steady.Infrastructure.Repositories)**

<a id="r11-runningsessionrepositoryaddasync"></a>
R1.1. `RunningSessionRepository.AddAsync(corredorId, session, idempotencyKey, cancellationToken)` - retorna `Task<SaveResult<RunningSessionEntity>>` (`SaveResult<TEntity>` e um `readonly record struct` com `Entity` + `Created`, `Steady.Infrastructure.Repositories.SaveResult.cs`), nao mais a entidade sozinha.
- Consulta `dbContext.RunningSessions.FindByIdempotencyKeyAsync(corredorId, idempotencyKey, cancellationToken)` - busca por `(corredorId, idempotencyKey)`, o par que forma o indice unico composto criado pela migration do ADR-003.
- Se ja existir um registro com essa chave para este corredor: retorna `new SaveResult<RunningSessionEntity>(existing, Created: false)` **sem** executar `INSERT` - este e o caminho de reenvio da fila offline.
- Se nao existir: monta um `RunningSessionEntity` (modelo de persistencia, distinto da entidade de dominio `RunningSession`) com `Id = Guid.NewGuid()`, `CorredorId = corredorId` (isolamento por corredor conforme [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)) e `IdempotencyKey = idempotencyKey`.
- Copia `Date`, `DistanceKm`, `DurationMinutes`, `AveragePaceMinPerKm`, `PerceivedEffort` da instancia de dominio validada.
- `dbContext.RunningSessions.Add(entity)` seguido de `await dbContext.SaveChangesAsync(cancellationToken)` - grava na tabela `running_sessions` (mapeada em `SteadyDbContext.OnModelCreating`, colunas em snake_case). O indice unico `(corredor_id, idempotency_key)` e a garantia final contra uma corrida (race) entre dois envios simultaneos com a mesma chave - a consulta previa reduz a janela, mas nao a elimina sozinha.
- Retorna `new SaveResult<RunningSessionEntity>(entity, Created: true)`.

## 4. Observacoes Tecnicas

- **Performance**: `AddAsync` agora faz uma consulta `SELECT` por `(corredor_id, idempotency_key)` antes do possivel `INSERT` (uma leitura extra por requisicao em relacao ao comportamento anterior ao ADR-003), mas ambos os campos sao cobertos pelo indice unico composto, entao o custo e baixo. A validacao do token (F.1) e local (chave publica cacheada), sem round-trip de rede.
- **Tratamento de Erros**: erros de guard clause do dominio (`ArgumentException`/`ArgumentOutOfRangeException`) viram `400` com a mensagem original do dominio, via [U1.1](#u11-domainfactorytrycreate). Header `Idempotency-Key` ausente vira `400` via [U1.3](#u13-idempotency), antes de qualquer chamada ao dominio ou ao repositorio. Qualquer excecao fora desses casos (ex.: falha de conexao com PostgreSQL) nao e tratada explicitamente neste endpoint e propaga como erro nao tratado.
- **Integracoes Criticas**: PostgreSQL (via `SteadyDbContext`/Npgsql) e o `AuthenticationFilter` (que por sua vez depende do Google Sign-In para validacao do token). Falha em qualquer um bloqueia o registro do treino.
- **Idempotencia resolve o risco de duplicata por reenvio (ADR-003)**: antes deste mecanismo, um reenvio da fila offline do app apos uma resposta perdida (timeout, app morto pelo SO) criava uma segunda linha em `running_sessions` e inflava artificialmente a carga usada por `OverloadDetectionService` (ADR-001), podendo disparar ou mascarar um alerta de sobrecarga. Com a chave escopada por `(corredor_id, idempotency_key)`, o reenvio devolve `200 OK` com o registro ja existente em vez de criar um novo - o risco esta tratado, nao e mais um debito em aberto para esta rota.
- **Restricao de audiencia do token (ADR-002, adendo 2026-08-16)**: ver [F.1](#f1-authenticationfilterinvokeasync) - a validacao do ID token agora recusa tokens emitidos para outro `ClientId`, fechando uma falha de isolamento que existia na implementacao original do validador.
- **Inconsistencia de rota observada**: o `Location` do `201 Created` aponta para `/api/training-sessions/{id}` (rota de `TrainingHistoryEndpoints`), nao para `/api/running-sessions/{id}` - nao existe uma rota `GET /api/running-sessions/{id}` dedicada. A resposta `200 OK` de reenvio nao envia `Location`. Ver [TechnicalDebtsDocs](../TechnicalDebtsDocs/RunningSessionEndpoints-Treino-Corrida-Debts.md).
