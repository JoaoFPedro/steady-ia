# CorredorRepository - Persistencia-Autenticacao - Especificacao Tecnica

## Indice
- [1. Visao Geral Tecnica](#1-visao-geral-tecnica)
- [2. Configuracao e Dependencias](#2-configuracao-e-dependencias)
- [3. Detalhamento por Metodo](#3-detalhamento-por-metodo)
  - [3.1. GetOrCreateBySubAsync - Resolve ou provisiona o Corredor autenticado](#31-getorcreatebysubasync---resolve-ou-provisiona-o-corredor-autenticado)
- [4. Observacoes Tecnicas](#4-observacoes-tecnicas)

## 1. Visao Geral Tecnica

**Proposito**: `CorredorRepository` resolve a identidade do corredor autenticado a partir do `sub` (subject) do ID token do Google, criando o registro automaticamente na primeira vez que esse `sub` aparece (provisionamento implicito, sem tela de cadastro).

**Responsabilidades**:
- Buscar um `CorredorEntity` existente pelo `GoogleSub`.
- Criar um novo `CorredorEntity` quando o `sub` ainda nao existe no banco.
- Tratar a condicao de corrida entre requisicoes concorrentes com o mesmo `sub` novo (duas requisicoes simultaneas do primeiro login) sem duplicar o Corredor, apoiando-se no indice unico `IX_corredores_google_sub`.

**Integracoes**: chamado por `Steady.Api.Auth.AuthenticationFilter` (nao um Endpoint, mas um `IEndpointFilter` aplicado a todo o grupo de rotas `/api` antes de qualquer logica de negocio) -- ver `DocumentAIReadme/Steady.Api/DevDocs/RunningSessionEndpoints-Treino-Corrida-DevDocs.md#f1-authenticationfilterinvokeasync` (secao "F. Endpoint Filter", fonte canonica do `AuthenticationFilter` na documentacao de `Steady.Api`). Fundamentado em [ADR-002](../../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md) e `specs/STORY-002/spec.bdd.md` (regra de negocio 2: "Se nao existir um Corredor com esse sub, um novo e criado automaticamente antes de processar a requisicao").

## 2. Configuracao e Dependencias

**Dependencias Injetadas**:
- `SteadyDbContext dbContext`: contexto EF Core injetado via construtor primario (`sealed class CorredorRepository(SteadyDbContext dbContext) : ICorredorRepository`), ciclo de vida `Scoped` (ver `SteadyDbContext-ServiceCollectionExtensions-Persistencia-Configuracao-DevDocs.md`).

**Interface implementada**: `ICorredorRepository` (`Repositories/ICorredorRepository.cs`).

**Metodos Publicos**:
- `Task<CorredorEntity> GetOrCreateBySubAsync(string googleSub, CancellationToken cancellationToken)` - unico metodo da interface.

## 3. Detalhamento por Metodo

### 3.1. GetOrCreateBySubAsync - Resolve ou provisiona o Corredor autenticado

**Assinatura**: `Task<CorredorEntity> GetOrCreateBySubAsync(string googleSub, CancellationToken cancellationToken)`

**Entrada**:
```json
{
  "googleSub": "string - claim 'sub' do ID token do Google, ja validado pelo AuthenticationFilter",
  "cancellationToken": "CancellationToken - propagado de HttpContext.RequestAborted"
}
```

**Saida**:
```json
{
  "CorredorEntity": {
    "Id": "Guid - identificador interno do corredor, usado como corredor_id em todas as demais tabelas",
    "GoogleSub": "string - claim 'sub' original",
    "CreatedAt": "DateTime (UTC) - momento do primeiro provisionamento"
  }
}
```

#### Fluxo de Execucao

```mermaid
sequenceDiagram
    participant Filter as Steady.Api.Auth.AuthenticationFilter
    participant Repository as CorredorRepository
    participant Context as SteadyDbContext
    participant Database as PostgreSQL (corredores)

    Filter->>+Repository: GetOrCreateBySubAsync(googleSub, ct)
    Repository->>+Context: Corredores.FirstOrDefaultAsync(c => c.GoogleSub == googleSub)
    Context->>+Database: SELECT * FROM corredores WHERE google_sub = @googleSub
    Database-->>-Context: linha existente ou nenhuma
    Context-->>-Repository: CorredorEntity ou null
    alt Corredor ja existe
        Repository-->>Filter: existing
    else Corredor nao existe
        Repository->>Repository: novo CorredorEntity (Id = Guid.NewGuid(), CreatedAt = DateTime.UtcNow)
        Repository->>+Context: Corredores.Add(corredor)
        Repository->>+Context: SaveChangesAsync(ct)
        Context->>+Database: INSERT INTO corredores (Id, google_sub, created_at) VALUES (...)
        alt Insercao bem-sucedida
            Database-->>-Context: 1 linha afetada
            Context-->>-Repository: ok
            Repository-->>-Filter: corredor recem-criado
        else Violacao do indice unico IX_corredores_google_sub
            Database-->>Context: DbUpdateException
            Context-->>Repository: propaga DbUpdateException
            Repository->>Repository: Entry(corredor).State = EntityState.Detached
            Repository->>+Context: Corredores.FirstAsync(c => c.GoogleSub == googleSub)
            Context->>+Database: SELECT * FROM corredores WHERE google_sub = @googleSub
            Database-->>-Context: linha criada pela requisicao concorrente
            Context-->>-Repository: CorredorEntity
            Repository-->>-Filter: corredor da requisicao concorrente
        end
    end
```

#### Detalhamento do Fluxo

**R. Repository (CorredorRepository)**

R.1. GetOrCreateBySubAsync()
- Busca um `CorredorEntity` existente com `GoogleSub == googleSub` via `FirstOrDefaultAsync` -> [CTX.1](#ctx1-corredores-dbset)
- Se encontrado, retorna imediatamente sem escrever no banco (caminho de login recorrente).
- Se nao encontrado, monta um novo `CorredorEntity` com `Id = Guid.NewGuid()` e `CreatedAt = DateTime.UtcNow` (gerados em memoria, nao pelo banco).
- Adiciona a entidade ao `DbSet<CorredorEntity>` e chama `SaveChangesAsync` -> [CTX.2](#ctx2-savechangesasync)
- **Tratamento de concorrencia**: se `SaveChangesAsync` lancar `DbUpdateException` (violacao do indice unico `google_sub`, cenario de duas requisicoes simultaneas do primeiro login do mesmo usuario), o repositorio desanexa a entidade local (`EntityState.Detached`, para nao reenviar um INSERT invalido em uma proxima operacao no mesmo `DbContext`) e busca novamente o registro -- agora garantido existente, pois foi a outra requisicao concorrente que o criou -- via `FirstAsync` -> [CTX.1](#ctx1-corredores-dbset). Isso evita expor uma excecao de infraestrutura ao chamador e evita duplicidade de Corredor para o mesmo `sub`.
- Retorna o `CorredorEntity` (existente ou recem-criado/recem-resolvido) para o `AuthenticationFilter`, que usa `corredor.Id` para popular `CurrentCorredor.Id` do escopo da requisicao.

**CTX. SteadyDbContext**

<a id="ctx1-corredores-dbset"></a>
CTX.1. Corredores (DbSet&lt;CorredorEntity&gt;)
- Exposto como propriedade `DbSet<CorredorEntity> Corredores => Set<CorredorEntity>()`.
- Mapeado em `OnModelCreating` para a tabela `corredores`: `Id` como chave primaria, `GoogleSub` mapeado para a coluna `google_sub` (obrigatoria) com indice unico (`IX_corredores_google_sub`), `CreatedAt` mapeado para `created_at`.
- O indice unico em `google_sub` e a garantia de integridade no nivel do banco que sustenta o tratamento de concorrencia em R.1 -- sem ele, duas requisicoes simultaneas criariam dois Corredores para o mesmo usuario.

<a id="ctx2-savechangesasync"></a>
CTX.2. SaveChangesAsync(CancellationToken)
- Metodo padrao do `DbContext` do EF Core; persiste o changeset pendente (aqui, um unico INSERT) em uma transacao implicita.
- Propaga `DbUpdateException` quando uma constraint do banco (aqui, o indice unico) e violada.

## 4. Observacoes Tecnicas

- **Performance**: caminho de login recorrente (corredor ja existe) faz apenas 1 SELECT indexado por `google_sub` -- baixo custo. Caminho de primeiro login faz 1 SELECT + 1 INSERT, e no pior caso (corrida) mais 1 SELECT de recuperacao.
- **Tratamento de Erros**: a unica excecao tratada explicitamente e `DbUpdateException` por violacao do indice unico. Outras falhas de banco (timeout, conexao indisponivel) nao sao capturadas aqui e propagam para cima -- o `AuthenticationFilter` nao trata excecoes de infraestrutura, entao uma falha de banco neste ponto resultaria em erro 500 nao tratado explicitamente (ver TechnicalDebtsDocs).
- **Integracoes Criticas**: este repositorio e o unico ponto de origem do `CorredorId` usado por todos os demais repositorios (`RunningSessionRepository`, `StrengthSessionRepository`, `PainLogRepository`) para isolamento de dados -- ver `Isolamento-de-Dados-por-Corredor-Persistencia-Autenticacao-Rules.md`. Um bug aqui (ex.: duplicar Corredor) comprometeria a integridade do isolamento em toda a aplicacao.
