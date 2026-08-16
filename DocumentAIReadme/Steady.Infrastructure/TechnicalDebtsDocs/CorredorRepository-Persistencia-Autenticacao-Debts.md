# CorredorRepository - Persistencia-Autenticacao - Debitos Tecnicos

## Indice
- [1. Resumo Executivo](#1-resumo-executivo)
- [2. Problemas por Criticidade](#2-problemas-por-criticidade)
- [3. Plano de Acao](#3-plano-de-acao)
- [4. User Stories para Implementacao](#4-user-stories-para-implementacao)

## 1. Resumo Executivo
- **Estado Atual**: implementacao pequena e objetiva, com tratamento correto de condicao de corrida no provisionamento (via `DbUpdateException` + retry de leitura), apoiado no indice unico `google_sub`. Nao ha teste unitario dedicado a este repositorio (apenas cobertura indireta via `tests/Steady.Api.Tests/AuthenticationTests.cs`, que sobe a API inteira com Testcontainers).
- **Principais Problemas**: ausencia de logging estruturado no caminho de provisionamento (diferente do `AuthenticationFilter`, que loga falhas de auth), e ausencia de tratamento explicito para falhas de infraestrutura genericas (timeout de conexao, banco indisponivel).
- **Impacto no Negocio**: baixo no dia a dia (o fluxo funciona corretamente), mas a falta de observabilidade dificulta diagnosticar problemas de provisionamento em producao (ex.: taxa de retry por corrida acima do esperado indicaria um pico de logins simultaneos ou um problema de latencia).

## 2. Problemas por Criticidade

### Amarelo Importantes
- **Sem teste unitario dedicado ao repositorio**: a logica de retry em corrida (`DbUpdateException` -> `Detach` -> `FirstAsync`) so e exercitada indiretamente pelos testes de integracao de `Steady.Api.Tests`, que nao forcam deliberadamente a condicao de corrida (dois inserts concorrentes do mesmo `google_sub`). Um teste de integracao dedicado ao `CorredorRepository` (com Testcontainers) que dispare duas chamadas concorrentes a `GetOrCreateBySubAsync` com o mesmo `sub` daria confianca real nesse caminho.
  - **Acao Recomendada**: criar `tests/Steady.Infrastructure.Tests` (ou pasta equivalente) com teste de integracao que chame `GetOrCreateBySubAsync` duas vezes em paralelo (`Task.WhenAll`) com o mesmo `sub` e valide que apenas um `CorredorEntity` foi persistido.
- **Excecoes de infraestrutura nao tratadas**: se `SaveChangesAsync` falhar por um motivo diferente de violacao de indice unico (ex.: timeout, conexao perdida), a excecao propaga sem tratamento especifico ate o `AuthenticationFilter`, que tambem nao tem try/catch para esse caso -- resultando em erro 500 generico do ASP.NET Core sem log de dominio.
  - **Acao Recomendada**: avaliar (com o time) se vale um catch mais amplo com log estruturado antes de propagar, ou se o comportamento atual (deixar o middleware de erro padrao tratar) e aceitavel para o estagio atual do MVP.

### Verde Menores
- **Sem log no caminho de provisionamento**: a criacao de um novo Corredor (evento de negocio relevante -- "novo usuario no sistema") nao gera nenhum log, diferente do `AuthenticationFilter` que loga falhas de autenticacao explicitamente.
  - **Acao Recomendada**: adicionar um log informativo (`ILogger<CorredorRepository>` ou equivalente) quando um novo Corredor e criado, util para metricas de crescimento de usuarios sem precisar de uma query analitica no banco.
- **CreatedAt gerado em codigo (DateTime.UtcNow), nao pelo banco**: funciona corretamente, mas depende do relogio do processo da aplicacao estar sincronizado (NTP). Nao e um problema pratico hoje, mas um `DEFAULT now()` no banco seria mais robusto a diferencas de relogio entre instancias da aplicacao.
  - **Acao Recomendada**: nenhuma acao imediata necessaria; registrar como nota para quando houver multiplas instancias da API em producao.

## 3. Plano de Acao
1. **Fase 1 - Importantes**: criar teste de integracao dedicado para a condicao de corrida do provisionamento; decidir a politica de tratamento de excecao de infraestrutura no `CorredorRepository`/`AuthenticationFilter`.
2. **Fase 2 - Menores**: adicionar log de criacao de novo Corredor; avaliar `DEFAULT now()` no banco para `created_at` quando houver mais de uma instancia da API em producao.

## 4. User Stories para Implementacao

### Story 1: Cobrir com teste de integracao a condicao de corrida do primeiro login

**Contexto Atual**: `CorredorRepository.GetOrCreateBySubAsync` trata `DbUpdateException` por violacao do indice unico `google_sub`, mas nenhum teste automatizado dispara deliberadamente essa condicao -- a cobertura hoje e apenas incidental via testes de integracao da API que nao emitem chamadas concorrentes.

**Objetivo**: garantir, com um teste automatizado e reproduzivel, que duas chamadas concorrentes a `GetOrCreateBySubAsync` com o mesmo `sub` resultam em exatamente um `CorredorEntity` persistido.

**Regras de Negocio**:
- Nenhum `sub` pode gerar mais de um Corredor, mesmo sob concorrencia.

**Especificacao Tecnica**:
- Criar (ou reaproveitar, se ja existir) um projeto de teste de integracao para `Steady.Infrastructure` usando Testcontainers com PostgreSQL real (mesmo padrao ja usado em `Steady.Api.Tests`, conforme nota em `specs/STORY-002/spec.bdd.md`).
- Disparar `Task.WhenAll` com duas chamadas a `GetOrCreateBySubAsync` para o mesmo `googleSub` inedito.
- Apos a execucao, consultar `Corredores.CountAsync(c => c.GoogleSub == googleSub)` e validar que o resultado e 1.

**Criterios de Aceite**:
- [ ] Teste falha antes da correcao (ou documenta que ja passa, servindo como regressao) e passa apos garantir a unicidade.
- [ ] Teste usa banco real via Testcontainers, nao provider in-memory do EF Core.
- [ ] Teste roda no pipeline de CI junto com a suite existente.

**Roteiro de Teste**:
1. **Teste 1**: Duas chamadas concorrentes com o mesmo `sub` novo.
   - **Entrada**: `sub = "google-sub-concorrencia-teste"`, duas tasks paralelas chamando `GetOrCreateBySubAsync`.
   - **Resultado Esperado**: apenas um `CorredorEntity` no banco ao final; ambas as chamadas retornam o mesmo `Id`.
2. **Teste 2**: Chamada unica com `sub` ja existente.
   - **Entrada**: `sub` de um Corredor previamente criado.
   - **Resultado Esperado**: nenhum novo registro criado; `CorredorEntity` retornado e o existente.

### Story 2: Adicionar observabilidade ao provisionamento automatico de Corredor

**Contexto Atual**: a criacao de um novo Corredor (evento relevante de negocio) nao produz nenhum log, diferentemente das falhas de autenticacao no `AuthenticationFilter`, que sao logadas com `ILogger`.

**Objetivo**: permitir observar, via logs estruturados, a taxa de novos corredores provisionados e a frequencia de retries por corrida no `CorredorRepository`.

**Regras de Negocio**:
- O log nao deve conter o `sub` do Google em texto livre sem necessidade (evitar exposicao de identificador pessoal em logs, alinhado ao cuidado ja aplicado em `AuthenticationFilter`, que nunca loga o token em si).

**Especificacao Tecnica**:
- Injetar `ILogger<CorredorRepository>` no construtor primario.
- Logar em nivel `Information` quando um novo `CorredorEntity` e criado (sem expor o `sub` completo -- considerar logar apenas o `Id` gerado).
- Logar em nivel `Warning` quando o caminho de retry por `DbUpdateException` e acionado (indicando corrida detectada).

**Criterios de Aceite**:
- [ ] Novo Corredor gera exatamente um log `Information` por criacao bem-sucedida.
- [ ] Corrida detectada (retry) gera um log `Warning` distinto do log de criacao.
- [ ] Nenhum log expoe o valor bruto do `sub` do Google.

**Roteiro de Teste**:
1. **Teste 1**: Criacao de novo Corredor gera log esperado.
   - **Entrada**: `sub` inedito.
   - **Resultado Esperado**: log `Information` capturado com o `Id` do Corredor criado.
2. **Teste 2**: Corrida detectada gera log de warning.
   - **Entrada**: duas chamadas concorrentes com o mesmo `sub` novo.
   - **Resultado Esperado**: pelo menos um log `Warning` indicando retry por corrida.
