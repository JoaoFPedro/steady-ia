# Spec BDD: STORY-004 — Tela Conta com saída da sessão

> **Story**: [story.md](./story.md)
> **Análise**: [analysis.md](./analysis.md)
> **Status**: Approved (2026-08-16)
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: Encerrar a sessão no aparelho

Uma tela **Conta**, acessível pela home, que mostra qual conta Google está autenticada e permite
encerrar a sessão voltando à tela de login — sem que nenhum registro pendente de um corredor
atravesse a troca para outro.

### Regras de Negócio

1. A saída acontece **exclusivamente pela tela Conta**. Nenhuma tela de registro oferece "Sair" —
   encerrar sessão nunca pode ser um toque acidental no meio de um treino.
2. A tela Conta identifica a conta autenticada pelo **e-mail** do Google. É o que permite ao
   corredor perceber que está na conta errada **antes** de registrar um treino nela.
3. Ao sair, o app **primeiro tenta sincronizar** a fila de registros pendentes. Se a fila esvaziar,
   a sessão é encerrada direto, sem perguntar nada — não há nada a perder.
4. **Nenhum registro pendente sobrevive à saída.** Se sobrar item na fila, o app informa **quantos**
   serão perdidos e só encerra a sessão mediante confirmação explícita, descartando-os.
   Razão (ADR-005): o item da fila não carrega dono e o token só é anexado no envio — sem esta
   regra, os treinos de um corredor seriam gravados na conta do próximo a entrar no aparelho,
   violando o mandato inviolável da Constituição e corrompendo a avaliação de sobrecarga dos dois
   (ADR-001).
5. Cancelar a confirmação é **inerte**: a sessão continua ativa, a fila continua intacta, o corredor
   permanece na tela Conta.
6. A fila é descartada **antes** de encerrar a sessão no Google. A ordem é deliberada: se o descarte
   falhasse depois de a sessão cair, a fila órfã ficaria exposta ao próximo corredor — o pior
   desfecho possível. Perder o descarte com a sessão ainda ativa é ruim, mas seguro.
7. Sair encerra a sessão **apenas no aparelho**. O consentimento concedido ao Steady na conta Google
   é preservado — voltar não pede autorização de novo.
8. Depois de sair, o corredor **não alcança nenhuma tela autenticada pelo histórico de navegação**,
   e a próxima abertura do app mostra o login: o app não reautentica sozinho com a credencial da
   sessão encerrada.
9. Se o encerramento da sessão falhar, o corredor é informado e **permanece autenticado**. O app
   nunca afirma ter saído quando não saiu — uma falsa sensação de saída é pior que a falha.

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor vê em qual conta está
  Given que estou autenticado no app
  When abro a tela Conta a partir da tela inicial
  Then vejo o e-mail da conta Google com que estou autenticado
  And vejo a ação de sair da conta
```

```gherkin
Scenario: Corredor sai da conta com tudo sincronizado
  Given que estou autenticado e não tenho registros pendentes
  When saio da conta pela tela Conta
  Then nenhuma confirmação me é pedida
  And minha sessão é encerrada no aparelho
  And sou levado à tela de login
```

```gherkin
Scenario: Saída sincroniza os pendentes antes de encerrar
  Given que estou autenticado e com conexão disponível
  And tenho registros pendentes de sincronização
  When saio da conta pela tela Conta
  Then meus registros pendentes são enviados à API antes de a sessão ser encerrada
  And nenhuma confirmação me é pedida
  And sou levado à tela de login
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Corredor sai sem conexão com registros pendentes
  Given que estou autenticado e sem conexão de rede
  And tenho 3 registros pendentes de sincronização
  When saio da conta pela tela Conta
  Then sou avisado de que 3 registros ainda não foram enviados e serão perdidos
  And minha sessão só é encerrada depois que eu confirmar
```

```gherkin
Scenario: Corredor confirma a saída descartando os pendentes
  Given que fui avisado de que tenho registros pendentes ao sair
  When confirmo que quero sair mesmo assim
  Then os registros pendentes são descartados do aparelho
  And minha sessão é encerrada
  And sou levado à tela de login
```

```gherkin
Scenario: Corredor cancela a saída ao ver os registros pendentes
  Given que fui avisado de que tenho registros pendentes ao sair
  When cancelo a saída
  Then continuo autenticado na tela Conta
  And meus registros pendentes permanecem na fila, sem perda
```

```gherkin
Scenario: Nenhum registro pendente atravessa a troca de corredor
  Given que um corredor saiu da conta neste aparelho com registros pendentes
  When outro corredor entra com a conta dele
  And a conexão de rede volta
  Then nenhum registro do corredor anterior é enviado à API
  And nenhum treino é atribuído à conta errada
```

```gherkin
Scenario: Corredor não retorna a telas autenticadas pelo histórico de navegação
  Given que acabei de sair da conta e estou na tela de login
  When aciono o gesto de voltar do aparelho
  Then permaneço na tela de login
  And nenhuma tela autenticada é reexibida
```

```gherkin
Scenario: App não reautentica sozinho depois da saída
  Given que saí da conta neste aparelho
  When abro o app novamente
  Then sou levado à tela de login
  And não sou autenticado automaticamente com a sessão encerrada
```

```gherkin
Scenario: Corredor volta a entrar com a mesma conta
  Given que saí da conta neste aparelho
  When entro novamente com a mesma conta Google
  Then não me é pedida autorização de acesso de novo
  And vejo meu histórico de treinos e minha avaliação de sobrecarga como antes
```

```gherkin
Scenario: Corredor aciona a saída repetidas vezes
  Given que estou autenticado na tela Conta
  When aciono a saída mais de uma vez seguida
  Then apenas um encerramento de sessão acontece
  And sou levado à tela de login uma única vez
```

---

### Cenários — Error Cases

```gherkin
Scenario: Sessão já caiu quando o corredor decide sair
  Given que estou autenticado na tela Conta
  And meu token do Google não pode mais ser renovado
  And tenho registros pendentes de sincronização
  When saio da conta
  Then os registros pendentes não conseguem ser enviados
  And sou avisado de que eles serão perdidos, como em qualquer outra saída
  And minha sessão é encerrada após a confirmação
```

```gherkin
Scenario: Registro pendente é rejeitado durante a sincronização de saída
  Given que estou autenticado e com conexão disponível
  And tenho um registro pendente que a API rejeita por dado inválido
  When saio da conta pela tela Conta
  Then o registro rejeitado é removido da fila pela regra já existente
  And a saída prossegue sem me pedir confirmação por causa dele
```

```gherkin
Scenario: Falha ao encerrar a sessão no Google
  Given que estou autenticado na tela Conta
  When saio da conta e o encerramento da sessão falha
  Then sou informado de que não foi possível sair
  And permaneço autenticado, na tela Conta
  And o app não me apresenta como desconectado
```

---

## Mapping: Cenário → Teste

> Test runner: Jest (`.sdd/STACK.md`).

| Cenário | Arquivo de Teste | Status |
|---------|-----------------|--------|
| Corredor vê em qual conta está | `auth/__tests__/googleSignInSession.test.ts` | 🟢 Green |
| Sai com tudo sincronizado | `account/__tests__/signOutAccount.test.ts` | 🟢 Green |
| Saída sincroniza os pendentes antes de encerrar | `account/__tests__/signOutAccount.test.ts` | 🟢 Green |
| Sai sem conexão com pendentes | `account/__tests__/signOutAccount.test.ts` | 🟢 Green |
| Confirma a saída descartando os pendentes | `account/__tests__/discardOnSignOut.test.ts` | 🟢 Green |
| Cancela a saída | `account/__tests__/discardOnSignOut.test.ts` | 🟢 Green |
| Nenhum pendente atravessa a troca de corredor | `account/__tests__/discardOnSignOut.test.ts` | 🟢 Green |
| Sessão já caiu ao sair | `account/__tests__/signOutAccount.test.ts` | 🟢 Green |
| Registro rejeitado durante a sincronização de saída | `account/__tests__/signOutAccount.test.ts` | 🟢 Green |
| Falha ao encerrar a sessão no Google | `auth/__tests__/googleSignInSession.test.ts` · `account/__tests__/discardOnSignOut.test.ts` | 🟢 Green |

Cobertura além dos cenários, fixando comportamento que o ADR-005 depende:

| Comportamento | Arquivo de Teste | Status |
|---------------|-----------------|--------|
| Pilha de navegação é esvaziada antes de trocar pelo login | `auth/__tests__/goToLogin.test.ts` | 🟢 Green |
| Fila é descartada **antes** de a sessão ser encerrada (ordem) | `account/__tests__/discardOnSignOut.test.ts` | 🟢 Green |
| Falha inesperada na sincronização de saída não impede a saída | `account/__tests__/signOutAccount.test.ts` | 🟢 Green |
| Consulta da conta que falha no aparelho não quebra a tela | `auth/__tests__/googleSignInSession.test.ts` | 🟢 Green |

**Sem cobertura automatizada — verificação manual no aparelho:**

| Cenário | Por quê |
|---------|---------|
| Não retorna a telas autenticadas pelo histórico | A regra (`goToLogin`) está coberta; o que resta sem teste é o gesto nativo de voltar reagir à pilha esvaziada |
| App não reautentica sozinho depois da saída | Depende do cache de credencial do módulo nativo, ausente no Jest |
| Volta a entrar com a mesma conta sem pedir autorização | Comportamento do Google Sign-In no aparelho |
| Saída aciona um único encerramento | Guarda de estado da tela (`saindo`), igual ao `entrando` do `login.tsx` e ao `saving` do `useRecordLogger` — nenhum dos dois é testável sem `@testing-library/react-native` |

> Mesma limitação herdada da STORY-003: `@testing-library/react-native` não instala (exige
> `react-dom@19.2.8`, incompatível com o `react@19.2.3` fixado pelo Expo SDK 57). A lógica de saída
> mora fora do React — em `account/signOutAccount.ts`, no molde de `features/logRecord.ts` — para
> que só a renderização fique descoberta.

---

## Notas de Especificação

- **ADR-005 é pré-requisito do `/implement`**: o descarte da fila é o primeiro caminho do app que
  **apaga dado de treino** — até aqui a fila só perdia item por confirmação do servidor ou rejeição
  400 (STORY-003, regra 4). Soma-se a isso tocar 3 módulos (auth, sync, home): ADR obrigatório pelos
  Acordos do Time (§6 da Constituição do projeto). O ADR deve registrar as saídas **A/B/C** da
  análise, a escolha de **A**, e **C** (carimbar o dono no item da fila) como evolução.
- **Contrato de sessão a corrigir**: a porta `GoogleSession` declara só `currentToken()` e
  `refresh()`, mas `login.tsx` já chama `signIn()` — a tela depende hoje da classe concreta
  `GoogleSignInSession`. Esta story amplia a porta com `signIn`, `signOut` e a identidade da conta,
  reparando a fronteira em vez de aprofundar a erosão.
- **`signOut()` engole exceção hoje** (`googleSignInSession.ts:54`), com o comentário *"Sair
  localmente basta: se o Google falhar, a sessão daqui já se foi"*. A premissa não vale: não existe
  sessão do lado do app — o único estado é o cache da biblioteca nativa. A regra de negócio 9
  substitui esse comportamento.
- **`RecordQueue` ganha `clear()`**: hoje só existe `remove(idempotencyKey)`. Descartar item a item
  deixaria a fila num estado parcial se falhasse no meio.
- **Comportamento correto por acidente, a fixar em teste**: `startAutoSync` continua montado depois
  da saída, mas sem sessão o `HttpRecordApi` devolve `unauthenticated` e o `SyncEngine` para no
  primeiro item. Isso é a segunda linha de defesa do cenário "nenhum pendente atravessa a troca de
  corredor" — hoje é consequência não intencional e precisa de teste que a fixe.
- **Fora do escopo**: barra de abas, `revokeAccess()`, exclusão de conta (LGPD), logout por
  inatividade e preservação da fila por dono. Justificativas em [story.md](./story.md).
