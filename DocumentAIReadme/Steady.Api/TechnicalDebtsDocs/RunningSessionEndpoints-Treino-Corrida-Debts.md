# RunningSessionEndpoints - Treino-Corrida - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: endpoint enxuto e coerente com o padrao do projeto (guard clause no dominio + `DomainFactory.TryCreate` + repository escopado por corredor). Coberto por testes de integracao (`tests/Steady.Api.Tests/RunningSessionEndpointTests.cs`). Nao ha bugs funcionais identificados, mas ha inconsistencias de design de API e ausencia de tratamento para cenarios de erro fora do guard clause de dominio.
- **Principais Problemas**: `Location` do `201 Created` aponta para uma rota (`/api/training-sessions/{id}`) diferente do recurso registrado (`/api/running-sessions`); nao ha rota `GET`/`PUT`/`DELETE` dedicada para uma sessao de corrida individual; excecoes fora de `ArgumentException` (ex.: falha do PostgreSQL) nao tem tratamento explicito e retornam erro generico 500 sem padronizacao.
- **Impacto no Negocio**: baixo no curto prazo (MVP com poucos usuarios), mas o `Location` inconsistente pode confundir qualquer client HTTP que siga o header por convencao REST, e a ausencia de padronizacao de erro 500 dificulta troubleshooting em producao.

## 2. Problemas por Criticidade

### Criticos
- Nenhum problema critico identificado nesta rota especifica no momento da analise.

### Importantes
- **`Location` do `201 Created` nao aponta para o proprio recurso**: `Results.Created($"/api/training-sessions/{entity.Id}", response)` referencia a rota consolidada de `TrainingHistoryEndpoints`, nao existe `GET /api/running-sessions/{id}`. Viola a convencao REST de que o `Location` de um `201` deve resolver o recurso recem-criado atraves do mesmo namespace de rota.
  - **Acao Recomendada**: decidir conscientemente se `running-sessions` e um sub-recurso de `training-sessions` (documentar essa decisao) ou criar `GET /api/running-sessions/{id}` dedicado. Ate la, deixar explicito em comentario o motivo do `Location` cruzado.
- **Sem tratamento para excecoes fora de `ArgumentException`**: uma falha de conexao com o PostgreSQL (`DbUpdateException`, timeout, etc.) durante `repository.AddAsync` propaga sem handler, resultando em resposta 500 sem corpo padronizado (`ProblemDetails`). Nao ha `try/catch` nem middleware global de excecao configurado em `Program.cs`.
  - **Acao Recomendada**: adicionar um middleware/handler global de excecao (`UseExceptionHandler` ou `IExceptionHandler` do .NET) que padronize respostas 500 como `ProblemDetails`, sem vazar detalhes internos (stack trace) ao cliente.

### Menores
- **Duplicacao de padrao entre endpoints**: o bloco `DomainFactory.TryCreate(...) -> repository.AddAsync(...) -> Results.Created(...)` se repete de forma quase identica em `RunningSessionEndpoints`, `StrengthSessionEndpoints` e `PainLogEndpoints`. Nao e um problema funcional, mas e uma oportunidade de reducao de boilerplate se o numero de tipos de sessao crescer.
  - **Acao Recomendada**: considerar um helper generico `MapCreateEndpoint<TRequest, TDomain, TEntity, TResponse>(...)` apenas se um terceiro/quarto tipo de sessao for adicionado (regra DRY apos repeticao 3x, conforme `CLAUDE.md`) - nao antecipar essa abstracao agora.
- **Ausencia de validacao de tamanho/formato na camada de contrato**: `RunningSessionRequest` nao usa Data Annotations nem FluentValidation - toda validacao acontece exclusivamente no dominio. Isso e coerente com a decisao de reuso da spec (STORY-002, nota "Reuso"), mas significa que erros de deserializacao (ex.: string em campo numerico) retornam erro de model binding padrao do ASP.NET Core, com formato de mensagem diferente do erro de dominio (`{"error": "..."}`).
  - **Acao Recomendada**: nenhuma acao imediata - documentar a inconsistencia de formato de erro entre falha de binding e falha de guard clause, para alinhamento futuro com o time de frontend/mobile.

## 3. Plano de Acao
1. **Fase 1 - Criticos**: nao ha itens nesta fase para este endpoint.
2. **Fase 2 - Importantes**: adicionar middleware global de tratamento de excecao (`ProblemDetails` padronizado); revisar/documentar a decisao do `Location` cruzado entre `running-sessions` e `training-sessions`.
3. **Fase 3 - Menores**: monitorar repeticao de padrao de criacao entre endpoints para decidir sobre extracao de helper; alinhar formato de erro de model binding vs. erro de dominio com os consumidores da API.

## 4. User Stories para Implementacao

### Story 1: Padronizar respostas de erro 500 com ProblemDetails

**Contexto Atual**: excecoes nao capturadas (ex.: falha de conexao com o PostgreSQL) propagam sem handler global, resultando em resposta 500 sem corpo padronizado e com risco de vazar detalhes internos em ambientes sem `IsDevelopment()`.

**Objetivo**: garantir que qualquer erro nao tratado explicitamente retorne um corpo `ProblemDetails` consistente, sem vazar stack trace, e logado com contexto suficiente para troubleshooting.

**Regras de Negocio**:
- Erros de validacao de dominio (`ArgumentException`) continuam retornando `400` com a mensagem de dominio (nao mudar esse comportamento).
- Qualquer outra excecao nao tratada deve retornar `500` com um `ProblemDetails` generico (sem mensagem interna exposta) e ser logada com o `traceId` da requisicao.

**Especificacao Tecnica**:
- Adicionar `builder.Services.AddProblemDetails()` e `app.UseExceptionHandler()` em `Program.cs`.
- Garantir que o handler nao intercepte os `400`/`401`/`404` ja retornados explicitamente pelos endpoints e pelo `AuthenticationFilter`.

**Criterios de Aceite**:
- [ ] Uma excecao nao tratada em qualquer endpoint do grupo `/api` retorna `500` com corpo `ProblemDetails` valido.
- [ ] O corpo do erro 500 nao contem stack trace nem mensagem de excecao interna em ambiente de producao.
- [ ] Erros `400` de guard clause de dominio continuam com o formato atual (`{"error": "..."}"`), sem regressao.

**Roteiro de Teste**:
1. **Teste 1**: forcar uma excecao nao mapeada no repository (ex.: mockar falha de banco) e verificar que a resposta e `500` com `ProblemDetails`.
   - **Entrada**: requisicao valida de `POST /api/running-sessions` com o banco indisponivel.
   - **Resultado Esperado**: `500`, corpo `application/problem+json`, sem detalhes internos.
2. **Teste 2**: reenviar o cenario existente de distancia invalida.
   - **Entrada**: `POST /api/running-sessions` com `distanceKm: 0`.
   - **Resultado Esperado**: `400`, corpo `{"error": "A distância deve ser maior que zero."}` (sem regressao de formato).

### Story 2: Resolver a inconsistencia do header Location no 201 Created

**Contexto Atual**: `Results.Created($"/api/training-sessions/{entity.Id}", response)` aponta para uma rota fora do namespace `running-sessions`, sem que exista um `GET /api/running-sessions/{id}` correspondente.

**Objetivo**: alinhar o `Location` retornado com uma rota real e navegavel, documentando a decisao arquitetural se a intencao for manter `training-sessions` como o unico namespace de leitura.

**Regras de Negocio**:
- O recurso de leitura consolidado (`training-sessions`) continua sendo a fonte de consulta unica para corrida + musculacao (decisao ja existente em `TrainingHistoryEndpoints`).
- Nenhuma mudanca de comportamento no `POST` em si (contrato de entrada/saida permanece igual).

**Especificacao Tecnica**:
- Opcao A: manter o `Location` apontando para `training-sessions/{id}` e documentar essa decisao em comentario no codigo e/ou ADR leve, explicitando que nao existe leitura por tipo especifico.
- Opcao B: criar `GET /api/running-sessions/{id}` (e equivalentes para musculacao) e apontar o `Location` para a propria rota do recurso.

**Criterios de Aceite**:
- [ ] Decisao documentada (comentario ou ADR) sobre qual opcao foi escolhida e por que.
- [ ] Se Opcao B: `GET /api/running-sessions/{id}` retorna `200` para sessao existente do corredor autenticado e `404` para sessao de outro corredor (mesmo padrao de `TrainingHistoryEndpoints`).
- [ ] Testes de integracao cobrindo o novo comportamento, se Opcao B for escolhida.

**Roteiro de Teste**:
1. **Teste 1**: `POST /api/running-sessions` com dados validos.
   - **Entrada**: payload valido de corrida.
   - **Resultado Esperado**: `Location` do `201` resolve (`GET`) para um recurso existente, retornando `200` com os mesmos dados.
2. **Teste 2**: acessar o `Location` de um corredor diferente do que criou a sessao (se Opcao B).
   - **Entrada**: `GET` no `Location` retornado, autenticado como outro corredor.
   - **Resultado Esperado**: `404`, sem revelar que a sessao existe (consistente com `AuthorizationTests`).
