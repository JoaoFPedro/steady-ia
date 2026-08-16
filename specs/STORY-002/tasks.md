# Tasks: STORY-002 — Expor a lógica de treino via API e persistir dados

> **Story**: [story.md](./story.md)
> **Spec**: [spec.bdd.md](./spec.bdd.md)

## Tasks

### Task 1: Criar projeto Steady.Infrastructure (EF Core + PostgreSQL)

- **Cenários BDD**: (setup — suporta todos)
- **Tipo**: setup
- **Dependência**: nenhuma
- **Critério de conclusão**: `Steady.Infrastructure` criado, referenciando `Steady.Domain`, com `SteadyDbContext`, entidades de persistência (`CorredorEntity`, `RunningSessionEntity`, `StrengthSessionEntity`, `PainLogEntity`) mapeadas conforme o modelo de dados do blueprint, connection string lida de variável de ambiente
- **Status**: ✅ Concluída

### Task 2: Migration inicial do EF Core

- **Cenários BDD**: (setup)
- **Tipo**: setup
- **Dependência**: Task 1
- **Critério de conclusão**: migration criada e aplicável (`dotnet ef database update`) contra um PostgreSQL local; `google_sub` único em Corredor
- **Status**: ✅ Concluída

### Task 3: Criar projeto Steady.Api (ASP.NET Core Minimal API)

- **Cenários BDD**: (setup)
- **Tipo**: setup
- **Dependência**: Task 1
- **Critério de conclusão**: `Steady.Api` criado, referenciando `Steady.Domain` e `Steady.Infrastructure`, endpoint de health-check respondendo
- **Status**: ✅ Concluída

### Task 4: Middleware de autenticação (validação do ID token do Google)

- **Cenários BDD**: Novo corredor no primeiro login, Login repetido não duplica corredor, Sem token — 401, Token inválido/expirado — 401
- **Tipo**: feature
- **Dependência**: Task 3
- **Critério de conclusão**: middleware valida `Authorization: Bearer {token}` via `Google.Apis.Auth.GoogleJsonWebSignature`; resolve/cria Corredor por `sub` (upsert); requisições sem token válido retornam 401 antes de qualquer lógica de negócio
- **Status**: ✅ Concluída

### Task 5: Repositórios com isolamento por CorredorId

- **Cenários BDD**: Acesso a dado de outro corredor — 404 (base para todos os endpoints)
- **Tipo**: feature
- **Dependência**: Task 1
- **Critério de conclusão**: `IRunningSessionRepository`, `IStrengthSessionRepository`, `IPainLogRepository` implementados; toda query recebe `CorredorId` como parâmetro obrigatório e filtra no banco (nunca em memória)
- **Status**: ✅ Concluída

### Task 6: Endpoints de registro (corrida, musculação, dor)

- **Cenários BDD**: Registrar sessão de corrida via API, Registrar sessão de musculação via API, Registrar dor via API, Corpo inválido — 400
- **Tipo**: feature
- **Dependência**: Task 4, Task 5
- **Critério de conclusão**: `POST /api/running-sessions`, `POST /api/strength-sessions`, `POST /api/pain-logs`; exceções de `Steady.Domain` (`ArgumentException`/`ArgumentOutOfRangeException`) mapeadas para 400 com a mensagem original
- **Status**: ✅ Concluída

### Task 7: Endpoint de avaliação de sobrecarga

- **Cenários BDD**: Consultar avaliação de sobrecarga, Sem histórico — avaliação sem risco
- **Tipo**: feature
- **Dependência**: Task 5
- **Critério de conclusão**: `GET /api/overload-assessment` busca sessões do corredor autenticado e delega para `OverloadDetectionService.Evaluate` (ADR-001)
- **Status**: ✅ Concluída

### Task 8: Endpoint de histórico de treinos

- **Cenários BDD**: Consultar histórico de treinos, Sem histórico — lista vazia, Acesso a dado de outro corredor — 404
- **Tipo**: feature
- **Dependência**: Task 5
- **Critério de conclusão**: `GET /api/training-sessions` retorna apenas sessões do corredor autenticado; acesso a um ID de sessão de outro corredor retorna 404
- **Status**: ✅ Concluída

### Task 9: Testes de integração cobrindo a spec

- **Cenários BDD**: todos os 13 cenários de `spec.bdd.md`
- **Tipo**: test
- **Dependência**: Task 6, Task 7, Task 8
- **Critério de conclusão**: `Steady.Api.Tests` com `WebApplicationFactory`; decidir banco de teste (Testcontainers com PostgreSQL real recomendado — evita divergência de comportamento do provider in-memory do EF Core); todos os cenários mapeados na spec verdes
- **Status**: ✅ Concluída

### Task 10: Atualizar mapping cenário→teste na spec

- **Cenários BDD**: (fechamento)
- **Tipo**: docs
- **Dependência**: Task 9
- **Critério de conclusão**: `spec.bdd.md` com status 🟢 Green em todos os cenários; `/review` automático executado (OWASP A01/A02/A05/A07 aplicam-se agora)
- **Status**: ✅ Concluída

---

## Ordem de Execução

```
Task 1 → Task 2 → Task 3 → Task 4 → Task 5 → Task 6 → Task 7 → Task 8 → Task 9 → Task 10
                                        (Task 6, 7, 8 podem rodar em paralelo após Task 4+5)
```

## Progresso

- Total: 10 tasks
- Concluídas: 10/10
- Cenários BDD cobertos: 13/13
