# TrainingHistoryEndpoints - Historico - Especificação Técnica

Auditoria de fontes: 2026-09-27. Unidade: [TrainingHistoryEndpoints.cs](../../../src/Steady.Api/Endpoints/TrainingHistoryEndpoints.cs).

## Índice

- [1. Visão Geral Técnica](#visao)
- [2. Configuração e Dependências](#config)
- [3. Detalhamento por Rota](#rotas)
- [4. Observações Técnicas](#observacoes)
  - [3.1. Listar histórico](#rota-1)
  - [3.2. Consultar sessão](#rota-2)

<a id="visao"></a>
## 1. Visão Geral Técnica

**Propósito**: Unificar corridas, musculação avulsa e execuções da ficha no histórico do corredor.

**Responsabilidades**: autenticar pelo grupo, aplicar escopo do usuário, executar as rotas abaixo e projetar os contratos.

**Integrações**: ASP.NET Core Minimal APIs, Steady.Domain e Steady.Infrastructure com PostgreSQL. Validação Google pertence ao filtro comum. O handler não chama provedor de explicação.

**Fontes de regras**: [STORY-001](../../../specs/STORY-001/spec.bdd.md), [STORY-002](../../../specs/STORY-002/spec.bdd.md), [STORY-013](../../../specs/STORY-013/spec.bdd.md), [STORY-018](../../../specs/STORY-018/spec.bdd.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-009](../../../docs/adr/ADR-009-ficha-ativa-e-execucao-imutavel.md).

<a id="config"></a>
## 2. Configuração e Dependências

Composição: [Program.cs](../../../src/Steady.Api/Program.cs); persistência: [ServiceCollectionExtensions.cs](../../../src/Steady.Infrastructure/DependencyInjection/ServiceCollectionExtensions.cs). Cada lambda recebe os repositórios listados na rota, CurrentCorredor e CancellationToken quando há I/O. ILogger<CoachingAuditLog> aparece somente nas operações auditadas de vínculo/ficha/histórico.

**Lista de endpoints**:

- **GET** `/api/training-sessions` - Listar histórico.
- **GET** `/api/training-sessions/{id:guid}` - Consultar sessão.

<a id="f-auth"></a>
**F. Endpoint Filter - AuthenticationFilter.InvokeAsync**

1. O grupo `/api` recebe o filtro em `Program.cs`; `/health` fica fora do grupo.
2. `Authorization` deve começar exatamente com `Bearer `; token vazio, inválido ou expirado retorna 401 antes da lógica do handler. O binding do framework pode rejeitar uma requisição malformada antes da execução do filtro.
3. `GoogleTokenValidator.ValidateAsync` usa `GoogleJsonWebSignature.ValidateAsync` com Audience restrita a `Google:ClientId`; assinatura e validade são verificadas pela biblioteca com chaves públicas cacheadas. Sem `Google:ClientId`, Program lança erro ao compor a aplicação.
4. Identidade é `sub`. E-mail e nome opcionais são normalizados e usados como cache de exibição, sem substituir identidade. `ICorredorRepository.GetOrCreateBySubAsync` resolve/provisiona corredor; `CurrentCorredor.Id` e `Roles` são preenchidos para a requisição.
5. `CurrentCorredor.HasRole` compara papel com ordinal exato; um token válido não concede automaticamente `Personal`. Falhas de autenticação registram path, motivo e IP, sem token.

<a id="u-common"></a>
**U1. Common/Auth e conversão**

- `CurrentCorredor`: identidade e papéis resolvidos pelo filtro; o cliente não escolhe o dono dos registros.
- `DomainFactory.TryCreate`: captura apenas `ArgumentException` (inclui guard clauses derivadas) e retorna 400 com `{ "error": "mensagem" }`; não converte todo erro de persistência ou desserialização em erro de validação.
- `Idempotency.HeaderName`: `Idempotency-Key`; quando exigida e ausente, `MissingKey` retorna 400. Guid inválido é rejeitado pelo binding; Guid.Empty não recebe validação específica no helper.
- Records HTTP são serializados em camelCase pelo padrão do framework. Datas `DateOnly` são `yyyy-MM-dd`. Enums de StrengthSession não recebem conversor textual global; enums convertidos explicitamente por `ToString` ou por mapping seguem as strings descritas em cada rota.

```mermaid
graph LR
    Cliente --> Filtro
    Filtro --> Endpoint
    Endpoint --> Dominio
    Endpoint --> Repositorio
    Repositorio --> PostgreSQL
```

### Contrato `TrainingSessionResponse`

Fonte: [TrainingSessionResponse.cs](../../../src/Steady.Api/Contracts/TrainingSessionResponse.cs). Os nomes abaixo são os campos HTTP com serialização padrão camelCase.

| Campo | Tipo C# | Opcional/padrão |
|---|---|---|
| `id` | `Guid` | não anulável |
| `type` | `string` | não anulável |
| `date` | `DateOnly` | não anulável |
| `durationMinutes` | `int?` | null permitido |
| `distanceKm` | `double?` | null permitido |
| `averagePaceMinPerKm` | `double?` | null permitido |
| `perceivedEffort` | `int?` | null permitido |
| `muscleGroup` | `string?` | null permitido |
| `intensity` | `string?` | null permitido |
| `workoutType` | `string?` | null permitido; padrão `null` |

<a id="catalogo"></a>
### Catálogo compartilhado de domínio e persistência

Não invoca factories ou serviços de domínio. A composição é uma projeção dos registros já persistidos. Nenhuma duração ou intensidade é inferida para execução de ficha.

As consultas filtram CorredorId. O histórico de ficha usa GetExecutionsForRunnerAsync sem exigir vínculo atual; o detalhe busca somente RunningSessions e StrengthSessions. A ordenação final é em memória por Date, sem desempate adicional.

<a id="rotas"></a>
## 3. Detalhamento por Rota

<a id="rota-1"></a>
### 3.1. Listar histórico

**Rota**: `GET /api/training-sessions`

**Entrada**: Sem corpo; sem paginação. Header Authorization: Bearer obrigatório.

**Saída**: Lista de TrainingSessionResponse. Estruturas e tipos completos constam na seção de contratos.

**Status**: 200 lista, inclusive vazia; todas as rotas podem retornar 401 no filtro. Binding inválido pode retornar 400 antes do handler.

#### Fluxo de Execução

```mermaid
sequenceDiagram
    participant Client as Cliente
    participant AuthenticationFilter
    participant Endpoint as TrainingHistoryEndpoints
    participant Domain as Dominio
    participant Repository as Repositorios
    participant Database as PostgreSQL
    Client->>AuthenticationFilter: GET /api/training-sessions + Bearer
    AuthenticationFilter->>AuthenticationFilter: Validar token Google e audiencia
    alt Token invalido
        AuthenticationFilter-->>Client: 401
    else Token valido
        AuthenticationFilter->>Repository: GetOrCreateBySubAsync
        Repository->>Database: Resolver conta e cache do provedor
        Database-->>Repository: Conta e roles
        Repository-->>AuthenticationFilter: Corredor
        AuthenticationFilter->>Endpoint: CurrentCorredor preenchido
        Endpoint->>Repository: IRunningSessionRepository.GetByCorredorIdAsync + IStrengthSessionRepository.GetByCorredorIdAsync + ITrainingSheetRepository.GetExecutionsForRunnerAsync
        Repository->>Database: Consultar dados com escopo autorizado
        Database-->>Repository: Resultado
        Repository-->>Endpoint: Entidade, lista ou estado
        Note over Endpoint,Domain: Sem chamada direta de regra de dominio neste handler
        Endpoint-->>Client: Status e contrato descritos nesta rota
    end
```

#### Detalhamento do Fluxo

<a id="e-1"></a>
**E.1. Lambda de rota em MapTrainingHistoryEndpoints**

Lê as três origens sequencialmente; corrida usa Type Corrida, força avulsa e ficha usam Musculacao; ficha tem durationMinutes null e workoutType push/pull/lower; converte sua data yyyy-MM-dd; concatena e ordena data decrescente.

Navegação: [F. autenticação](#f-auth), [D1. domínio](#d-1), [R1. persistência](#r-1), [U1. suporte](#u-common).

<a id="d-1"></a>
**D1.1. Domínio no fluxo**

Não invoca factories ou serviços de domínio. A composição é uma projeção dos registros já persistidos. Nenhuma duração ou intensidade é inferida para execução de ficha.

<a id="r-1"></a>
**R1.1. Métodos e persistência**

Chamada desta rota: `IRunningSessionRepository.GetByCorredorIdAsync + IStrengthSessionRepository.GetByCorredorIdAsync + ITrainingSheetRepository.GetExecutionsForRunnerAsync`.

A operação específica e seu escopo estão descritos no fluxo acima; detalhes de query, snapshot, transação e reenvio estão no [catálogo de persistência](#catalogo). As consultas próprias filtram o dono no banco; leitura pelo personal exige o vínculo quando indicado. Nenhuma autorização por vínculo é acrescentada implicitamente pelo filtro comum.

[Voltar ao endpoint](#e-1). O [filtro](#f-auth) resolve autenticação antes da lógica; os [utilitários](#u-common) não adicionam autorização por vínculo automaticamente.

<a id="rota-2"></a>
### 3.2. Consultar sessão

**Rota**: `GET /api/training-sessions/{id:guid}`

**Entrada**: id: Guid da sessão. Header Authorization: Bearer obrigatório.

**Saída**: TrainingSessionResponse. Estruturas e tipos completos constam na seção de contratos.

**Status**: 200 encontrada; 404 ausente ou de outro corredor; todas as rotas podem retornar 401 no filtro. Binding inválido pode retornar 400 antes do handler.

#### Fluxo de Execução

```mermaid
sequenceDiagram
    participant Client as Cliente
    participant AuthenticationFilter
    participant Endpoint as TrainingHistoryEndpoints
    participant Domain as Dominio
    participant Repository as Repositorios
    participant Database as PostgreSQL
    Client->>AuthenticationFilter: GET /api/training-sessions/{id:guid} + Bearer
    AuthenticationFilter->>AuthenticationFilter: Validar token Google e audiencia
    alt Token invalido
        AuthenticationFilter-->>Client: 401
    else Token valido
        AuthenticationFilter->>Repository: GetOrCreateBySubAsync
        Repository->>Database: Resolver conta e cache do provedor
        Database-->>Repository: Conta e roles
        Repository-->>AuthenticationFilter: Corredor
        AuthenticationFilter->>Endpoint: CurrentCorredor preenchido
        Endpoint->>Repository: IRunningSessionRepository.GetByIdAsync + IStrengthSessionRepository.GetByIdAsync
        Repository->>Database: Consultar dados com escopo autorizado
        Database-->>Repository: Resultado
        Repository-->>Endpoint: Entidade, lista ou estado
        Note over Endpoint,Domain: Sem chamada direta de regra de dominio neste handler
        Endpoint-->>Client: Status e contrato descritos nesta rota
    end
```

#### Detalhamento do Fluxo

<a id="e-2"></a>
**E.2. Lambda de rota em MapTrainingHistoryEndpoints**

Procura corrida com id e dono; se não existe, procura força avulsa; retorna 404 se nenhuma for encontrada. Esta rota não consulta execução de ficha.

Navegação: [F. autenticação](#f-auth), [D1. domínio](#d-2), [R1. persistência](#r-2), [U1. suporte](#u-common).

<a id="d-2"></a>
**D1.2. Domínio no fluxo**

Não invoca factories ou serviços de domínio. A composição é uma projeção dos registros já persistidos. Nenhuma duração ou intensidade é inferida para execução de ficha.

<a id="r-2"></a>
**R1.2. Métodos e persistência**

Chamada desta rota: `IRunningSessionRepository.GetByIdAsync + IStrengthSessionRepository.GetByIdAsync`.

A operação específica e seu escopo estão descritos no fluxo acima; detalhes de query, snapshot, transação e reenvio estão no [catálogo de persistência](#catalogo). As consultas próprias filtram o dono no banco; leitura pelo personal exige o vínculo quando indicado. Nenhuma autorização por vínculo é acrescentada implicitamente pelo filtro comum.

[Voltar ao endpoint](#e-2). O [filtro](#f-auth) resolve autenticação antes da lógica; os [utilitários](#u-common) não adicionam autorização por vínculo automaticamente.

<a id="observacoes"></a>
## 4. Observações Técnicas

Histórico próprio permanece acessível depois do encerramento do vínculo. DTO tem durationMinutes opcional e workoutType opcional. A execução da ficha aparece na lista, mas não possui detalhe nesta rota.

**Performance**: consultas são assíncronas com CancellationToken; onde a coleção não possui parâmetros de limite, o resultado é materializado integralmente. Não há paralelização de chamadas ao mesmo contexto no handler.

**Tratamento de erros**: status acima descrevem caminhos explícitos; exceções inesperadas não têm tradução local genérica. 404 não deve ser interpretado como permissão de procurar dados de outro corredor.

**Documentos relacionados**: [Regras](../BusinessRulesDocs/Historico-de-Treinos-Historico-Rules.md), [Débitos](../TechnicalDebtsDocs/TrainingHistoryEndpoints-Historico-Debts.md), [Índice](README.md).
