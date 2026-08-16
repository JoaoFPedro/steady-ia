# Spec BDD: STORY-002 — Expor a lógica de treino via API e persistir dados

> **Story**: [story.md](./story.md)
> **Status**: Approved
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: API de registro de treino com persistência e isolamento por corredor

Expõe as regras de domínio da STORY-001 (`Steady.Domain`) via API HTTP, persistindo em PostgreSQL, autenticando cada requisição via ID token do Google e garantindo que nenhum corredor acesse dados de outro.

### Regras de Negócio

1. Toda requisição à API exige um ID token do Google válido no header `Authorization: Bearer {token}` — requisições sem token ou com token inválido/expirado são rejeitadas com **401**.
2. Um Corredor é identificado pelo `sub` (subject) do token Google. Se não existir um Corredor com esse `sub`, um novo é criado automaticamente antes de processar a requisição (ver [ADR-002](../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md)).
3. Toda query que retorna dados de treino filtra por `CorredorId` diretamente no banco — nunca busca todos os registros e filtra depois em memória (Playbook A01).
4. Tentativa de acessar um recurso de outro corredor retorna **404** (não revela que o recurso existe).
5. Os endpoints de registro reutilizam as regras de validação já implementadas em `Steady.Domain` (guard clauses da STORY-001) — erros de validação retornam **400** com a mensagem de domínio.
6. O endpoint de avaliação de sobrecarga usa `Steady.Domain.Overload.OverloadDetectionService` sobre os dados persistidos do corredor autenticado, respeitando a janela de 7 dias e o limiar de 14 dias de histórico (ADR-001).

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor registra sessão de corrida via API
  Given que sou um corredor autenticado com um ID token do Google válido
  When envio uma requisição para registrar uma Sessão de Treino de Corrida válida
  Then a sessão é persistida no banco associada a mim
  And a API responde com sucesso e os dados da sessão criada
```

```gherkin
Scenario: Corredor registra sessão de musculação via API
  Given que sou um corredor autenticado com um ID token do Google válido
  When envio uma requisição para registrar uma Sessão de Treino de Musculação válida
  Then a sessão é persistida no banco associada a mim
  And a API responde com sucesso e os dados da sessão criada
```

```gherkin
Scenario: Corredor registra dor pós-treino via API
  Given que sou um corredor autenticado com um ID token do Google válido
  When envio uma requisição para registrar dor, informando data e região
  Then o registro de dor é persistido no banco associado a mim
```

```gherkin
Scenario: Corredor consulta sua avaliação de sobrecarga
  Given que sou um corredor autenticado com histórico de treino persistido
  When consulto a avaliação de sobrecarga atual
  Then a API calcula o resultado a partir do meu histórico persistido
  And retorna se há risco e, se houver, a sugestão de ajuste
```

```gherkin
Scenario: Corredor consulta seu histórico de treinos
  Given que sou um corredor autenticado com sessões de treino persistidas
  When consulto meu histórico de treinos
  Then recebo apenas as sessões associadas a mim
```

```gherkin
Scenario: Novo corredor faz login pela primeira vez
  Given que meu Google `sub` ainda não existe como Corredor no banco
  When envio uma requisição autenticada com um ID token do Google válido
  Then um novo Corredor é criado automaticamente associado ao meu `sub`
  And a requisição é processada normalmente na sequência
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Corredor sem histórico consulta avaliação de sobrecarga
  Given que sou um corredor autenticado sem nenhuma sessão registrada
  When consulto a avaliação de sobrecarga atual
  Then a API responde sem risco, sem erro
```

```gherkin
Scenario: Corredor sem histórico consulta seu histórico de treinos
  Given que sou um corredor autenticado sem nenhuma sessão registrada
  When consulto meu histórico de treinos
  Then recebo uma lista vazia, não um erro
```

```gherkin
Scenario: Corredor já existente faz login novamente
  Given que meu Google `sub` já existe como Corredor no banco
  When envio uma nova requisição autenticada com um ID token do Google válido
  Then nenhum Corredor duplicado é criado
  And a requisição usa o Corredor já existente
```

---

### Cenários — Error Cases

```gherkin
Scenario: Requisição sem token de autenticação
  Given que não envio nenhum header Authorization
  When envio uma requisição para qualquer endpoint da API
  Then a API rejeita com 401
```

```gherkin
Scenario: Requisição com token do Google inválido ou expirado
  Given que envio um ID token do Google inválido ou expirado
  When envio uma requisição para qualquer endpoint da API
  Then a API rejeita com 401
```

```gherkin
Scenario: Requisição com corpo de registro inválido
  Given que sou um corredor autenticado com um ID token do Google válido
  When envio uma requisição para registrar uma Sessão de Treino de Corrida com distância zero ou negativa
  Then a API rejeita com 400
  And a mensagem de erro reflete a validação do domínio (Steady.Domain)
```

```gherkin
Scenario: Corredor tenta acessar sessão de treino de outro corredor
  Given que sou um corredor autenticado
  And existe uma sessão de treino que pertence a outro corredor
  When tento consultar essa sessão pelo seu ID diretamente
  Then a API responde 404
  And não revela que a sessão existe
```

---

## Mapping: Cenário → Teste

| Cenário | Arquivo de Teste | Status |
|---------|-----------------|--------|
| Registrar sessão de corrida via API | `tests/Steady.Api.Tests/RunningSessionEndpointTests.cs` | 🟢 Green |
| Registrar sessão de musculação via API | `tests/Steady.Api.Tests/StrengthSessionEndpointTests.cs` | 🟢 Green |
| Registrar dor via API | `tests/Steady.Api.Tests/PainLogEndpointTests.cs` | 🟢 Green |
| Consultar avaliação de sobrecarga | `tests/Steady.Api.Tests/OverloadAssessmentEndpointTests.cs` | 🟢 Green |
| Consultar histórico de treinos | `tests/Steady.Api.Tests/TrainingHistoryEndpointTests.cs` | 🟢 Green |
| Novo corredor no primeiro login | `tests/Steady.Api.Tests/AuthenticationTests.cs` | 🟢 Green |
| Sem histórico — avaliação sem risco | `tests/Steady.Api.Tests/OverloadAssessmentEndpointTests.cs` | 🟢 Green |
| Sem histórico — lista vazia | `tests/Steady.Api.Tests/TrainingHistoryEndpointTests.cs` | 🟢 Green |
| Login repetido não duplica corredor | `tests/Steady.Api.Tests/AuthenticationTests.cs` | 🟢 Green |
| Sem token — 401 | `tests/Steady.Api.Tests/AuthenticationTests.cs` | 🟢 Green |
| Token inválido/expirado — 401 | `tests/Steady.Api.Tests/AuthenticationTests.cs` | 🟢 Green |
| Corpo inválido — 400 | `tests/Steady.Api.Tests/RunningSessionEndpointTests.cs` | 🟢 Green |
| Acesso a dado de outro corredor — 404 | `tests/Steady.Api.Tests/AuthorizationTests.cs` | 🟢 Green |

---

## Notas de Especificação

- **Fora do escopo desta story** (decisão do `/plan`): app mobile consumindo a API — fica para STORY-003.
- **Reuso**: as regras de validação (distância, duração, RPE, campos obrigatórios) não são reescritas na API — a API delega para as factories `Create` de `Steady.Domain`, capturando as exceções de domínio e traduzindo para 400.
- **Autenticação**: decisão detalhada em [ADR-002](../../docs/adr/ADR-002-autenticacao-e-isolamento-de-dados.md).
- **Resolvido no `/implement`**: teste de integração usa Testcontainers com PostgreSQL real (não o provider in-memory do EF Core) — evita divergência de comportamento, conforme recomendado em `tasks.md`. Container compartilhado entre as classes de teste via `ICollectionFixture` para manter a suíte rápida.
- **Resolvido no `/implement`**: a connection string é resolvida via DI no momento da criação do `DbContext` (não lida eagerly no `Program.cs`) — necessário para que `WebApplicationFactory` consiga sobrescrevê-la em teste antes do host ser efetivamente construído.
