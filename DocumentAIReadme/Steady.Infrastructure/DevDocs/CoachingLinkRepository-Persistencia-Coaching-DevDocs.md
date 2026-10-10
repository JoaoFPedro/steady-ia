# CoachingLinkRepository - Persistencia-Coaching - Especificação Técnica

Atualizado em 2026-09-27.

## Índice

- [Visão geral](#visao)
- [Métodos e contratos](#metodos)
- [Mapeamentos](#ctx)
- [Observações](#observacoes)
- [Fontes](#fontes)

<a id="visao"></a>
## 1. Visão geral técnica

Manter consentimento e um único personal ativo por corredor.

Chamada pela camada Steady.Api; ver [índice da API](../../Steady.Api/DevDocs/README.md). Sem rotas próprias: entradas são parâmetros C#, saídas são entidades/objetos ou resultados assíncronos. O token e os papéis são validados na API; parâmetros de identidade precisam vir do contexto autenticado. PostgreSQL é acessado pelo SteadyDbContext com EF Core e Npgsql.


<a id="metodos"></a>
## 2. R. Métodos e contratos

- [RequestAsync](#r-1)
- [GetPendingAsync](#r-2)
- [AcceptAsync](#r-3)
- [EndAsync](#r-4)
- [HasActiveAsync](#r-5)
- [RunnerHasActiveAsync](#r-6)
- [GetActiveForRunnerAsync](#r-7)
- [GetLinkedRunnersAsync](#r-8)

<a id="r-1"></a>
### R. RequestAsync

`public async Task<SaveResult<CoachingLinkEntity>> RequestAsync( Guid personalId, Guid corredorId, CancellationToken cancellationToken)`

Busca Pending pelo par personal/corredor; reaproveita ou cria via CoachingLink.Request. Conflito desanexa candidato e relê Pending vencedor; se não existir, relança.

Entrada: os parâmetros da assinatura, incluindo `CancellationToken` nas operações assíncronas. Saída: o tipo retornado na assinatura; `Task` transporta conclusão, resultado ou falha. Objetos de domínio chegam validados por suas fábricas; o repositório não substitui essa validação.

<a id="r-2"></a>
### R. GetPendingAsync

`public async Task<IReadOnlyList<CoachingLinkEntity>> GetPendingAsync( Guid corredorId, CancellationToken cancellationToken)`

Filtra corredor e Pending, ordena RequestedAt decrescente.

Entrada: os parâmetros da assinatura, incluindo `CancellationToken` nas operações assíncronas. Saída: o tipo retornado na assinatura; `Task` transporta conclusão, resultado ou falha. Objetos de domínio chegam validados por suas fábricas; o repositório não substitui essa validação.

<a id="r-3"></a>
### R. AcceptAsync

`public async Task<AcceptLinkResult> AcceptAsync( Guid linkId, Guid corredorId, CancellationToken cancellationToken)`

Abre transação; busca Id/corredor/Pending. Ausente retorna NotFound; RunnerHasActiveAsync retorna AlreadyLinked; ativa escolhido, registra AcceptedAt e expira outras Pending com EndedAt. Salva e confirma; conflito faz rollback e verifica Active sem rastreamento antes de retornar AlreadyLinked ou relançar.

Entrada: os parâmetros da assinatura, incluindo `CancellationToken` nas operações assíncronas. Saída: o tipo retornado na assinatura; `Task` transporta conclusão, resultado ou falha. Objetos de domínio chegam validados por suas fábricas; o repositório não substitui essa validação.

<a id="r-4"></a>
### R. EndAsync

`public async Task<bool> EndAsync(Guid linkId, Guid actorId, CancellationToken cancellationToken)`

Busca Id onde actorId é personal ou corredor e status Pending/Active; ausência false; grava Ended e EndedAt, retorna true.

Entrada: os parâmetros da assinatura, incluindo `CancellationToken` nas operações assíncronas. Saída: o tipo retornado na assinatura; `Task` transporta conclusão, resultado ou falha. Objetos de domínio chegam validados por suas fábricas; o repositório não substitui essa validação.

<a id="r-5"></a>
### R. HasActiveAsync

`public Task<bool> HasActiveAsync( Guid personalId, Guid corredorId, CancellationToken cancellationToken)`

AnyAsync pelo par e Active.

Entrada: os parâmetros da assinatura, incluindo `CancellationToken` nas operações assíncronas. Saída: o tipo retornado na assinatura; `Task` transporta conclusão, resultado ou falha. Objetos de domínio chegam validados por suas fábricas; o repositório não substitui essa validação.

<a id="r-6"></a>
### R. RunnerHasActiveAsync

`public Task<bool> RunnerHasActiveAsync(Guid corredorId, CancellationToken cancellationToken)`

AnyAsync pelo corredor e Active.

Entrada: os parâmetros da assinatura, incluindo `CancellationToken` nas operações assíncronas. Saída: o tipo retornado na assinatura; `Task` transporta conclusão, resultado ou falha. Objetos de domínio chegam validados por suas fábricas; o repositório não substitui essa validação.

<a id="r-7"></a>
### R. GetActiveForRunnerAsync

`public Task<CoachingLinkEntity?> GetActiveForRunnerAsync( Guid corredorId, CancellationToken cancellationToken)`

FirstOrDefaultAsync por corredor e Active.

Entrada: os parâmetros da assinatura, incluindo `CancellationToken` nas operações assíncronas. Saída: o tipo retornado na assinatura; `Task` transporta conclusão, resultado ou falha. Objetos de domínio chegam validados por suas fábricas; o repositório não substitui essa validação.

<a id="r-8"></a>
### R. GetLinkedRunnersAsync

`public async Task<IReadOnlyList<LinkedRunner>> GetLinkedRunnersAsync( Guid personalId, CancellationToken cancellationToken)`

Join com Corredores, filtra PersonalId/Active, ordena Name ?? Email e projeta LinkedRunner(LinkId,CorredorId,Email,Name).

Entrada: os parâmetros da assinatura, incluindo `CancellationToken` nas operações assíncronas. Saída: o tipo retornado na assinatura; `Task` transporta conclusão, resultado ou falha. Objetos de domínio chegam validados por suas fábricas; o repositório não substitui essa validação.

#### Fluxo de execução

```mermaid
sequenceDiagram
    participant R as CoachingLinkRepository
    participant CTX as SteadyDbContext
    participant DB as PostgreSQL
    R->>CTX: BeginTransactionAsync
    R->>CTX: FirstOrDefaultAsync(Id,CorredorId,Pending)
    CTX->>DB: SELECT solicitação própria
    DB-->>R: Vínculo ou null
    alt Ausente
        R-->>R: AcceptLinkResult.NotFound
    else Pending existente
        R->>CTX: RunnerHasActiveAsync(corredorId)
        CTX->>DB: EXISTS Active do corredor
        DB-->>R: bool
        alt Já vinculado
            R-->>R: AlreadyLinked
        else Sem ativo
            R->>R: Active e AcceptedAt no escolhido
            R->>CTX: ToListAsync outras Pending do corredor
            CTX->>DB: SELECT pendências alternativas
            DB-->>R: Lista
            R->>R: Expired e EndedAt nas alternativas
            R->>CTX: SaveChangesAsync e CommitAsync
            CTX->>DB: UPDATE vínculos
            alt Conflito de gravação
                R->>CTX: RollbackAsync e AnyAsync Active, AsNoTracking
                CTX->>DB: EXISTS vencedor Active
                DB-->>R: bool
                R-->>R: AlreadyLinked se vencedor; senão relança
            else Confirmado
                R-->>R: Accepted
            end
        end
    end
```

<a id="ctx"></a>
## 3. CTX. Mapeamento e integridade

### CTX. coaching_links

Chave primária: `Id` (sem HasColumnName, nome por convenção do modelo).

| Propriedade | Coluna | Configuração explícita |
|---|---|---|
| `PersonalId` | `personal_id` | `Tipo por convenção do provider` |
| `CorredorId` | `corredor_id` | `Tipo por convenção do provider` |
| `Status` | `status` | `HasConversion<string>()` |
| `RequestedAt` | `requested_at` | `Tipo por convenção do provider` |
| `AcceptedAt` | `accepted_at` | `Tipo por convenção do provider` |
| `EndedAt` | `ended_at` | `Tipo por convenção do provider` |

Índices e relações (expressões reais do modelo):

```csharp
HasIndex(link => link.PersonalId);
HasIndex(link => link.CorredorId);
HasIndex(link => link.CorredorId)
                .IsUnique()
                .HasFilter("status = 'Active'");
HasIndex(link => new { link.PersonalId, link.CorredorId })
                .IsUnique()
                .HasFilter("status = 'Pending'");
HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(link => link.PersonalId)
                .OnDelete(DeleteBehavior.Restrict);
HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(link => link.CorredorId)
                .OnDelete(DeleteBehavior.Restrict);
```

### CTX. corredores

Chave primária: `Id` (sem HasColumnName, nome por convenção do modelo).

| Propriedade | Coluna | Configuração explícita |
|---|---|---|
| `GoogleSub` | `google_sub` | `IsRequired()` |
| `Email` | `email` | `Tipo por convenção do provider` |
| `Name` | `name` | `Tipo por convenção do provider` |
| `Roles` | `roles` | `HasColumnType("text[]"); HasDefaultValue(new[] { "Corredor" })` |
| `TrainingPlanVersionId` | `training_plan_version_id` | `Tipo por convenção do provider` |
| `CreatedAt` | `created_at` | `Tipo por convenção do provider` |

Índices e relações (expressões reais do modelo):

```csharp
HasIndex(c => c.GoogleSub).IsUnique();
HasOne<TrainingPlanVersionEntity>()
                .WithMany()
                .HasForeignKey(c => c.TrainingPlanVersionId)
                .OnDelete(DeleteBehavior.Restrict);
```

Coleções usam conversão para `text[]` e ValueComparer com SequenceEqual, hash agregado e cópia ToList, detectando mudança em conteúdo.

<a id="observacoes"></a>
## 4. Observações técnicas

Consultas usam rastreamento padrão salvo AsNoTracking explicitamente indicado. Falhas de persistência e cancelamento propagam quando não houver captura documentada. Cada chave idempotente pertence à conta, não é uma chave global entre corredores. Entidades retornadas incluem os campos persistidos listados em CTX; resultados SaveResult contêm Entity e Created.

<a id="fontes"></a>
## 5. Fontes e verificação

- [docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)
- [docs/adr/ADR-008-roles-vinculo-e-autorizacao-do-personal.md](../../../docs/adr/ADR-008-roles-vinculo-e-autorizacao-do-personal.md)
- [docs/adr/ADR-009-ficha-ativa-e-execucao-imutavel.md](../../../docs/adr/ADR-009-ficha-ativa-e-execucao-imutavel.md)
- [tests/Steady.Api.Tests/CoachingCardinalityEndpointTests.cs](../../../tests/Steady.Api.Tests/CoachingCardinalityEndpointTests.cs)
- [src/Steady.Infrastructure/Persistence/SteadyDbContext.cs](../../../src/Steady.Infrastructure/Persistence/SteadyDbContext.cs)
- [src/Steady.Infrastructure/Repositories/CoachingLinkRepository.cs](../../../src/Steady.Infrastructure/Repositories/CoachingLinkRepository.cs)

Os testes citados foram inspecionados como evidência de comportamento; não foram executados nesta rodada de documentação.

Especificações de comportamento relacionadas:

- [STORY-013](../../../specs/STORY-013/spec.bdd.md)
- [STORY-019](../../../specs/STORY-019/spec.bdd.md)
