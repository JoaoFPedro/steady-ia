# PainLogEndpoints - Treino-Dor - Especificação Técnica

Auditoria de fontes: 2026-09-27. Unidade: [PainLogEndpoints.cs](../../../src/Steady.Api/Endpoints/PainLogEndpoints.cs).

## Índice

- [1. Visão Geral Técnica](#visao)
- [2. Configuração e Dependências](#config)
- [3. Detalhamento por Rota](#rotas)
- [4. Observações Técnicas](#observacoes)
  - [3.1. Registrar dor](#rota-1)

<a id="visao"></a>
## 1. Visão Geral Técnica

**Propósito**: Registrar região e data de dor de forma idempotente, sem diagnóstico ou reabertura de revisão publicada.

**Responsabilidades**: autenticar pelo grupo, aplicar escopo do usuário, executar as rotas abaixo e projetar os contratos.

**Integrações**: ASP.NET Core Minimal APIs, Steady.Domain e Steady.Infrastructure com PostgreSQL. Validação Google pertence ao filtro comum. O handler não chama provedor de explicação.

**Fontes de regras**: [STORY-001](../../../specs/STORY-001/spec.bdd.md), [STORY-002](../../../specs/STORY-002/spec.bdd.md), [STORY-014](../../../specs/STORY-014/spec.bdd.md), [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md), [ADR-003](../../../docs/adr/ADR-003-chave-de-idempotencia-para-sincronizacao-offline.md).

<a id="config"></a>
## 2. Configuração e Dependências

Composição: [Program.cs](../../../src/Steady.Api/Program.cs); persistência: [ServiceCollectionExtensions.cs](../../../src/Steady.Infrastructure/DependencyInjection/ServiceCollectionExtensions.cs). Cada lambda recebe os repositórios listados na rota, CurrentCorredor e CancellationToken quando há I/O. ILogger<CoachingAuditLog> aparece somente nas operações auditadas de vínculo/ficha/histórico.

**Lista de endpoints**:

- **POST** `/api/pain-logs` - Registrar dor.

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

### Contrato `PainLogRequest`

Fonte: [PainLogContracts.cs](../../../src/Steady.Api/Contracts/PainLogContracts.cs). Os nomes abaixo são os campos HTTP com serialização padrão camelCase.

| Campo | Tipo C# | Opcional/padrão |
|---|---|---|
| `date` | `DateOnly` | não anulável |
| `region` | `string` | não anulável |

### Contrato `PainLogResponse`

Fonte: [PainLogContracts.cs](../../../src/Steady.Api/Contracts/PainLogContracts.cs). Os nomes abaixo são os campos HTTP com serialização padrão camelCase.

| Campo | Tipo C# | Opcional/padrão |
|---|---|---|
| `id` | `Guid` | não anulável |
| `date` | `DateOnly` | não anulável |
| `region` | `string` | não anulável |

<a id="catalogo"></a>
### Catálogo compartilhado de domínio e persistência

PainLog.Create(Date, Region) usa IsNullOrWhiteSpace; não remove espaços nem valida catálogo de regiões ou data. A operação não chama política de segurança e não cria outbox.

PainLogRepository.AddAsync encontra por corredor e chave antes da inserção em PainLogs; reenvio retorna o registro original e não substitui região/data. SaveChangesAsync persiste uma nova entidade.

<a id="rotas"></a>
## 3. Detalhamento por Rota

<a id="rota-1"></a>
### 3.1. Registrar dor

**Rota**: `POST /api/pain-logs`

**Entrada**: PainLogRequest; Idempotency-Key obrigatório. Header Authorization: Bearer obrigatório.

**Saída**: PainLogResponse. Estruturas e tipos completos constam na seção de contratos.

**Status**: 201 novo; 200 reenvio; 400 sem chave ou região; todas as rotas podem retornar 401 no filtro. Binding inválido pode retornar 400 antes do handler.

#### Fluxo de Execução

```mermaid
sequenceDiagram
    participant Client as Cliente
    participant AuthenticationFilter
    participant Endpoint as PainLogEndpoints
    participant Domain as Dominio
    participant Repository as Repositorios
    participant Database as PostgreSQL
    Client->>AuthenticationFilter: POST /api/pain-logs + Bearer
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
        Endpoint->>Repository: IPainLogRepository.AddAsync
        Repository->>Database: Gravar ou devolver registro existente
        Database-->>Repository: Resultado
        Repository-->>Endpoint: Entidade, lista ou estado
        Endpoint-->>Client: Status e contrato descritos nesta rota
    end
```

#### Detalhamento do Fluxo

<a id="e-1"></a>
**E.1. Lambda de rota em MapPainLogEndpoints**

Exige chave; PainLog.Create rejeita região nula, vazia ou em branco; preserva texto e data recebidos; salva apenas no escopo autenticado.

Navegação: [F. autenticação](#f-auth), [D1. domínio](#d-1), [R1. persistência](#r-1), [U1. suporte](#u-common).

<a id="d-1"></a>
**D1.1. Domínio no fluxo**

PainLog.Create(Date, Region) usa IsNullOrWhiteSpace; não remove espaços nem valida catálogo de regiões ou data. A operação não chama política de segurança e não cria outbox.

<a id="r-1"></a>
**R1.1. Métodos e persistência**

Chamada desta rota: `IPainLogRepository.AddAsync`.

A operação específica e seu escopo estão descritos no fluxo acima; detalhes de query, snapshot, transação e reenvio estão no [catálogo de persistência](#catalogo). As consultas próprias filtram o dono no banco; leitura pelo personal exige o vínculo quando indicado. Nenhuma autorização por vínculo é acrescentada implicitamente pelo filtro comum.

[Voltar ao endpoint](#e-1). O [filtro](#f-auth) resolve autenticação antes da lógica; os [utilitários](#u-common) não adicionam autorização por vínculo automaticamente.

<a id="observacoes"></a>
## 4. Observações Técnicas

Location /api/pain-logs/{id} não tem MapGet correspondente neste arquivo nem nos demais endpoints. Dor avulsa posterior não reclassifica revisão, conforme STORY-014. Autenticação agora também atualiza o cache de nome/e-mail do provedor.

**Performance**: consultas são assíncronas com CancellationToken; onde a coleção não possui parâmetros de limite, o resultado é materializado integralmente. Não há paralelização de chamadas ao mesmo contexto no handler.

**Tratamento de erros**: status acima descrevem caminhos explícitos; exceções inesperadas não têm tradução local genérica. 404 não deve ser interpretado como permissão de procurar dados de outro corredor.

**Documentos relacionados**: [Regras](../BusinessRulesDocs/Registro-de-Dor-Treino-Dor-Rules.md), [Débitos](../TechnicalDebtsDocs/PainLogEndpoints-Treino-Dor-Debts.md), [Índice](README.md).
