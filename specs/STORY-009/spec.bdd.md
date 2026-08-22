# Spec BDD: STORY-009 — E-mail do corredor persistido no backend

> **Story**: [story.md](./story.md)
> **Discovery**: — (dado operacional, sem discovery)
> **Status**: Implementado — todos os cenários 🟢
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: E-mail da conta Google guardado junto do corredor

A API já valida o ID token do Google a cada requisição e resolve o corredor
pelo claim `sub` (ADR-002). Esta story faz o mesmo token entregar também o
claim `email`, que passa a ser gravado em `corredores.email` como **cache do
provedor** — nunca como identidade.

### Regras de Negócio

1. **O `google_sub` continua sendo a identidade.** A busca e a criação do
   corredor continuam sendo por `sub`; o e-mail nunca é usado para
   localizar, comparar ou desambiguar corredor. A coluna `email` **não tem
   índice único** — e-mail repetido entre linhas é estado válido, não erro.
   Isso é ADR-002 e esta story não o altera.
2. A coluna `email` é **anulável**. Linhas anteriores a esta story não têm
   e-mail, e um ID token pode legitimamente não trazer o claim (o escopo
   `email` é concedido pelo corredor, não garantido pelo protocolo).
3. No **primeiro acesso** de um `sub`, o corredor é criado com o e-mail do
   claim.
4. Em acesso de um `sub` **já existente**, o e-mail guardado é atualizado
   quando o claim traz um valor **diferente** do gravado. Igual não escreve:
   o filtro roda em toda requisição e um UPDATE por requisição seria custo
   sem informação.
5. Claim de e-mail **ausente não apaga** o e-mail já guardado. Perder o dado
   por causa de um token mais pobre seria destruir informação boa com
   informação faltante.
6. Um corredor sem e-mail é um corredor válido: nenhuma requisição falha,
   nenhum endpoint muda de comportamento por causa disso.
7. **O e-mail nunca é logado.** O log de falha de autenticação continua
   registrando path, motivo e IP — nunca o token e nunca o e-mail
   (OWASP A09; dado pessoal sob LGPD, Constituição §3).

---

### Cenários — Happy Path

```gherkin
Scenario: Primeiro acesso grava o e-mail do token
  Given um corredor que nunca acessou o Steady
  And o ID token dele traz o e-mail "corredor@exemplo.test"
  When ele faz a primeira requisição autenticada
  Then existe um corredor com esse "sub"
  And o e-mail guardado é "corredor@exemplo.test"
```

```gherkin
Scenario: E-mail trocado na conta Google é atualizado no acesso seguinte
  Given um corredor já criado com o e-mail "antigo@exemplo.test"
  When ele faz uma requisição cujo ID token traz "novo@exemplo.test"
  Then o e-mail guardado passa a ser "novo@exemplo.test"
  And continua existindo apenas um corredor para esse "sub"
```

```gherkin
Scenario: E-mail igual não gera escrita
  Given um corredor já criado com o e-mail "corredor@exemplo.test"
  When ele faz outra requisição com o mesmo e-mail no token
  Then o e-mail guardado continua "corredor@exemplo.test"
  And continua existindo apenas um corredor para esse "sub"
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Token sem claim de e-mail cria corredor sem e-mail
  Given um corredor que nunca acessou o Steady
  And o ID token dele não traz claim de e-mail
  When ele faz a primeira requisição autenticada
  Then a requisição é bem-sucedida
  And existe um corredor com esse "sub"
  And o e-mail guardado é nulo
```

```gherkin
Scenario: Token sem e-mail não apaga o e-mail já guardado
  Given um corredor já criado com o e-mail "corredor@exemplo.test"
  When ele faz uma requisição cujo ID token não traz claim de e-mail
  Then o e-mail guardado continua "corredor@exemplo.test"
```

```gherkin
Scenario: E-mail não é identidade — dois "sub" com o mesmo e-mail são dois corredores
  Given dois "sub" diferentes que trazem o mesmo e-mail "mesmo@exemplo.test"
  When cada um faz uma requisição autenticada
  Then existem dois corredores distintos
  And cada um guarda o mesmo e-mail, sem conflito
```

---

### Cenários — Error Cases

```gherkin
Scenario: Token inválido continua sem criar corredor
  Given um ID token inválido ou expirado
  When uma requisição autenticada é feita com ele
  Then a resposta é 401
  And nenhum corredor é criado
  And o e-mail não aparece em nenhum log
```

---

## Mapping: Cenário → Teste

> Test runner: xUnit (`.sdd/STACK.md`). Banco real por Testcontainers
> (`CustomWebApplicationFactory`) — a regra 4 é sobre estado no banco, e um
> dublê de repositório não provaria nada aqui.

| Cenário | Teste | Status |
|---------|-------|--------|
| Primeiro acesso grava o e-mail | `AuthenticationTests.PrimeiroLogin_GravaEmailDoToken` | 🟢 Green |
| E-mail trocado é atualizado | `AuthenticationTests.EmailMudouNoGoogle_AtualizaOGuardado` | 🟢 Green |
| E-mail igual não gera escrita | `AuthenticationTests.MesmoEmail_NaoDuplicaNemAltera` | 🟢 Green — verifica o estado observável (valor intacto, sem duplicata); a ausência do UPDATE em si é garantida pela guarda em `SincronizarEmailAsync`, não por asserção |
| Token sem e-mail cria corredor sem e-mail | `AuthenticationTests.TokenSemEmail_CriaCorredorSemEmail` | 🟢 Green |
| Token sem e-mail não apaga o guardado | `AuthenticationTests.TokenSemEmail_NaoApagaEmailJaGuardado` | 🟢 Green |
| Mesmo e-mail em dois `sub` | `AuthenticationTests.MesmoEmailEmDoisSubs_SaoDoisCorredores` | 🟢 Green |
| Token inválido não cria corredor | `AuthenticationTests.TokenInvalido_Retorna401` + `TokenInvalido_NaoCriaCorredor` | 🟢 Green |
| E-mail nunca em log | — | 🔵 Estrutural — o log de falha (`AuthenticationFilter.Unauthorized`) registra path/motivo/IP e roda **antes** de existir identidade; não há caminho em que o e-mail o alcance |

---

## Notas de Especificação

- **Contrato do validador muda**: `IGoogleTokenValidator.ValidateAndGetSubAsync`
  devolve hoje só uma string. Para carregar o e-mail junto sem inventar uma
  segunda chamada (que revalidaria o token), o retorno passa a ser um tipo
  com `Sub` e `Email`. Nome e forma finais ficam a critério do `/implement`.
- **Fora do escopo**: nome e foto. São os outros dois campos de
  `AccountIdentity` e caberiam na mesma migration, mas nada nesta story pede
  por eles — e cada campo pessoal a mais é superfície de LGPD sem uso
  correspondente. Entram quando houver motivo, pela mesma porta.
- **Sem mudança no app**: o ID token já carrega o claim `email` pelos escopos
  padrão do Google Sign-In. Nenhum dado novo trafega.
