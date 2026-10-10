# RunningSessionEndpoints - Treino-Corrida - Especificação Técnica

Auditoria de fontes: 2026-09-27. Unidade: [RunningSessionEndpoints.cs](../../../src/Steady.Api/Endpoints/RunningSessionEndpoints.cs).

## Índice

- [1. Visão Geral Técnica](#visao)
- [2. Configuração e Dependências](#config)
- [3. Detalhamento por Rota](#rotas)
- [4. Observações Técnicas](#observacoes)
  - [3.1. Registrar corrida](#rota-1)

<a id="visao"></a>
## 1. Visão Geral Técnica

**Propósito**: Registrar a corrida do corredor e sua intenção durável de revisão, sem esperar o provedor de explicação.

**Responsabilidades**: autenticar pelo grupo, aplicar escopo do usuário, executar as rotas abaixo e projetar os contratos.

**Integrações**: ASP.NET Core Minimal APIs, Steady.Domain e Steady.Infrastructure com PostgreSQL. Validação Google pertence ao filtro comum. A explicação externa é posterior ao registro ou solicitada explicitamente no retry.

**Fontes de regras**: [STORY-001](../../../specs/STORY-001/spec.bdd.md), [STORY-002](../../../specs/STORY-002/spec.bdd.md), [STORY-014](../../../specs/STORY-014/spec.bdd.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md), [ADR-018](../../../docs/adr/ADR-018-outbox-transacional-da-revisao.md).

<a id="config"></a>
## 2. Configuração e Dependências

Composição: [Program.cs](../../../src/Steady.Api/Program.cs); persistência: [ServiceCollectionExtensions.cs](../../../src/Steady.Infrastructure/DependencyInjection/ServiceCollectionExtensions.cs). Cada lambda recebe os repositórios listados na rota, CurrentCorredor e CancellationToken quando há I/O. ILogger<CoachingAuditLog> aparece somente nas operações auditadas de vínculo/ficha/histórico.

**Lista de endpoints**:

- **POST** `/api/running-sessions` - Registrar corrida.

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

### Contrato `RunningSessionRequest`

Fonte: [RunningSessionContracts.cs](../../../src/Steady.Api/Contracts/RunningSessionContracts.cs). Os nomes abaixo são os campos HTTP com serialização padrão camelCase.

| Campo | Tipo C# | Opcional/padrão |
|---|---|---|
| `date` | `DateOnly` | não anulável |
| `distanceKm` | `double` | não anulável |
| `durationMinutes` | `int` | não anulável |
| `averagePaceMinPerKm` | `double` | não anulável |
| `perceivedEffort` | `int` | não anulável |
| `painReported` | `bool` | não anulável; padrão `false` |

### Contrato `RunningSessionResponse`

Fonte: [RunningSessionContracts.cs](../../../src/Steady.Api/Contracts/RunningSessionContracts.cs). Os nomes abaixo são os campos HTTP com serialização padrão camelCase.

| Campo | Tipo C# | Opcional/padrão |
|---|---|---|
| `id` | `Guid` | não anulável |
| `date` | `DateOnly` | não anulável |
| `distanceKm` | `double` | não anulável |
| `durationMinutes` | `int` | não anulável |
| `averagePaceMinPerKm` | `double` | não anulável |
| `perceivedEffort` | `int` | não anulável |

<a id="catalogo"></a>
### Catálogo compartilhado de domínio e persistência

RunningSession.Create(Date, DistanceKm, DurationMinutes, AveragePaceMinPerKm, PerceivedEffort); Load = DurationMinutes * PerceivedEffort. A factory não valida a data nem o pace.

RunningSessionRepository.AddAsync consulta (CorredorId, IdempotencyKey); no reenvio devolve a entidade original. Na criação insere RunningSessionEntity, ReviewOutboxEntity com ficha ativa capturada e dor no encerramento; se painReported, insere PainLogEntity com região "Informada no encerramento". Um SaveChangesAsync confirma o conjunto. GetByCorredorIdAsync/GetByIdAsync filtram o dono.

<a id="rotas"></a>
## 3. Detalhamento por Rota

<a id="rota-1"></a>
### 3.1. Registrar corrida

**Rota**: `POST /api/running-sessions`

**Entrada**: RunningSessionRequest; Idempotency-Key obrigatório. Header Authorization: Bearer obrigatório.

**Saída**: RunningSessionResponse. Estruturas e tipos completos constam na seção de contratos.

**Status**: 201 na criação; 200 no reenvio; 400 sem chave ou factory inválida; todas as rotas podem retornar 401 no filtro. Binding inválido pode retornar 400 antes do handler.

#### Fluxo de Execução

```mermaid
sequenceDiagram
    participant Client as Cliente
    participant AuthenticationFilter
    participant Endpoint as RunningSessionEndpoints
    participant Domain as Dominio
    participant Repository as Repositorios
    participant Database as PostgreSQL
    Client->>AuthenticationFilter: POST /api/running-sessions + Bearer
    AuthenticationFilter->>AuthenticationFilter: Validar token Google e audiencia
    alt Token invalido
        AuthenticationFilter-->>Client: 401
    else Token valido
        AuthenticationFilter->>Repository: GetOrCreateBySubAsync
        Repository->>Database: Resolver conta e cache do provedor
        Database-->>Repository: Conta e roles
        Repository-->>AuthenticationFilter: Corredor
        AuthenticationFilter->>Endpoint: CurrentCorredor preenchido
        Endpoint->>Domain: Validar factories e criar snapshot
        Domain-->>Endpoint: Entidade ou ArgumentException (400)
        Endpoint->>Repository: IRunningSessionRepository.AddAsync
        Repository->>Database: Gravar ou devolver registro existente
        Database-->>Repository: Resultado
        Repository-->>Endpoint: Entidade, lista ou estado
        Endpoint-->>Client: Status e contrato descritos nesta rota
    end
```

#### Detalhamento do Fluxo

<a id="e-1"></a>
**E.1. Lambda de rota em MapRunningSessionEndpoints**

Exige chave; valida distância e duração maiores que zero e esforço entre 1 e 10; pace é recebido sem guard clause própria; cria sessão; persiste sob CurrentCorredor.Id com painReported; projeta resposta sem dados de dor.

Navegação: [F. autenticação](#f-auth), [D1. domínio](#d-1), [R1. persistência](#r-1), [U1. suporte](#u-common).

<a id="d-1"></a>
**D1.1. Domínio no fluxo**

RunningSession.Create(Date, DistanceKm, DurationMinutes, AveragePaceMinPerKm, PerceivedEffort); Load = DurationMinutes * PerceivedEffort. A factory não valida a data nem o pace.

<a id="r-1"></a>
**R1.1. Métodos e persistência**

Chamada desta rota: `IRunningSessionRepository.AddAsync`.

A operação específica e seu escopo estão descritos no fluxo acima; detalhes de query, snapshot, transação e reenvio estão no [catálogo de persistência](#catalogo). As consultas próprias filtram o dono no banco; leitura pelo personal exige o vínculo quando indicado. Nenhuma autorização por vínculo é acrescentada implicitamente pelo filtro comum.

[Voltar ao endpoint](#e-1). O [filtro](#f-auth) resolve autenticação antes da lógica; os [utilitários](#u-common) não adicionam autorização por vínculo automaticamente.

<a id="observacoes"></a>
## 4. Observações Técnicas

A revisão é eventual. A resposta não contém reviewId. O worker pode classificar como aderente e não criar revisão. O Location /api/training-sessions/{id} aponta para a rota de detalhe existente.

**Performance**: consultas são assíncronas com CancellationToken; onde a coleção não possui parâmetros de limite, o resultado é materializado integralmente. Não há paralelização de chamadas ao mesmo contexto no handler.

**Tratamento de erros**: status acima descrevem caminhos explícitos; exceções inesperadas não têm tradução local genérica. 404 não deve ser interpretado como permissão de procurar dados de outro corredor.

### Processamento posterior à resposta

`ReviewOutboxWorker` é registrado como serviço hospedado. Com `ReviewProcessing:Enabled` ausente, opera habilitado; `false` desliga o processamento. Drena pendências e volta a consultar a cada 2 segundos. `ReviewOutboxProcessor.ProcessNextAsync` adquire um item via `FOR UPDATE SKIP LOCKED`, lease de 2 minutos e contagem de tentativas. Falha de processamento devolve Pending com backoff exponencial limitado a 60 segundos. Falha da explicação gera revisão com ExplanationStatus Unavailable, sem invalidar a execução.

```mermaid
sequenceDiagram
    participant Worker as ReviewOutboxWorker
    participant Processor as ReviewOutboxProcessor
    participant Domain as Comparador e SafetyPolicy
    participant Provider as IExplanationProvider
    participant External as Anthropic (quando configurado)
    participant Database as PostgreSQL
    Worker->>Processor: ProcessNextAsync
    Processor->>Database: Adquirir outbox e ler execução/prescrição/política
    Database-->>Processor: Snapshot e versões
    Processor->>Domain: Comparar e autorizar ação determinística
    Domain-->>Processor: Classificação e fatos
    alt Aderente
        Processor->>Database: Concluir outbox sem revisão
    else Divergente ou conflito
        opt Ação autorizada
            Processor->>Provider: ExplainAsync (timeout 15 s)
            opt Anthropic:ApiKey configurada
                Provider->>External: POST /v1/messages com fatos mínimos
                External-->>Provider: Explicação estruturada
            end
            Provider-->>Processor: Explicação ou indisponibilidade
            Processor->>Domain: TrySetExplanation
        end
        Processor->>Database: Persistir revisão, recalcular coerência e concluir outbox
    end
```

O comparador usa faixas opcionais, versões de tolerância e ExerciseKey para mediana histórica. Ausência de número não vira zero. Plano e ficha conflitantes não recebem precedência nem recomendação. A dor capturada no encerramento participa da política; PainLog avulso posterior não reabre revisão. Coerência é recalculada pela data de execução quando chega treino posterior ou sincronização tardia.

`Program` escolhe `UnavailableExplanationProvider` sem `Anthropic:ApiKey` e `ClaudeExplanationProvider` quando configurada. O provedor envia fatos/ação autorizados, sem e-mail ou sub, exige ferramenta `submit_review` e permite somente ação do enum. HTTP não bem-sucedido ou saída incompleta pode resultar em explicação indisponível. `Anthropic:Model` pode sobrescrever o modelo padrão presente no código. O modelo não classifica aderência nem autoriza ação.

**Documentos relacionados**: [Regras](../BusinessRulesDocs/Registro-de-Corrida-Treino-Corrida-Rules.md), [Débitos](../TechnicalDebtsDocs/RunningSessionEndpoints-Treino-Corrida-Debts.md), [Índice](README.md).
