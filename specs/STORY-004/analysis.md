# Análise: botão "Sair" que retorna à tela de login

> Gerada por `/analyze` em 2026-08-16 · Feature ainda **sem story e sem spec BDD**
> Precede: `/spec` (STORY-004)

---

## 1. Scan de código relevante

### Módulos afetados

| Arquivo | Papel na feature |
|---------|-----------------|
| `src/steady-app/app/index.tsx` | Home — onde o botão deve nascer |
| `src/steady-app/app/_layout.tsx` | Guarda de sessão na abertura + monta o auto-sync |
| `src/steady-app/src/auth/googleSession.ts` | **Porta** `GoogleSession` — hoje só `currentToken()` e `refresh()` |
| `src/steady-app/src/auth/googleSignInSession.ts` | Implementação — **já tem `signOut()` pronto** (linha 51) |
| `src/steady-app/src/auth/nativeGoogleSignInClient.ts` | Adaptador do módulo nativo — `GoogleSignin.signOut()` |
| `src/steady-app/src/services.ts` | Composition root — expõe `googleSession`, `recordQueue`, `syncEngine` |
| `src/steady-app/src/sync/recordQueue.ts` · `asyncStorageQueue.ts` | Fila local de registros pendentes |
| `src/steady-app/src/sync/autoSync.ts` | Esvazia a fila na volta da conexão — continua vivo após o logout |
| `src/steady-app/src/ui/Nocturne.tsx` | `SecondaryButton`, `Rule` — peças do design system |

### Dependências envolvidas

`@react-native-google-signin/google-signin` (módulo nativo, só existe em development build),
`@react-native-async-storage/async-storage`, `expo-router`.

### Padrões em uso nesta área

- **Porta/adaptador para plataforma** — `GoogleSession` / `GoogleSignInClient`. Todo módulo nativo fica atrás de uma interface para o Jest rodar sem development build.
- **Composition root único** (`services.ts`) — telas nunca instanciam nada.
- **Lógica de tela em função pura testável** — `loadHomeState`, `logRecord`. A tela só renderiza e navega.
- **`router.replace`** para transições de sessão (login ↔ home), nunca `push`.

### Achado do scan

`GoogleSignInSession.signOut()` **já existe e já é o comportamento certo**. O que falta não é a
mecânica de sair do Google — é decidir o que acontece com a fila e ligar o botão. Porém a porta
`GoogleSession` **não declara `signOut` nem `signIn`**: o `login.tsx` só consegue chamar
`googleSession.signIn()` porque `services.ts` exporta a instância concreta. A fronteira já está
erodida; esta feature ou a repara ou a aprofunda.

---

## 2. Análise de domínio

### Conceitos existentes

- **Corredor** é identificado pelo claim `sub` do ID token do Google (ADR-002). Não existe entidade
  de sessão no backend — a API é stateless e valida o token a cada requisição.
- **Sessão do Google** é o único estado de identidade do app, e ele vive **inteiramente dentro da
  biblioteca nativa**. O app não guarda token em AsyncStorage nem em lugar nenhum.
- **Fila de registros pendentes** — `PendingRecord = { idempotencyKey, kind, payload, queuedAt }`,
  numa chave global do AsyncStorage (`@steady/fila-de-registros`).

### Conceitos novos

**Encerramento de sessão.** No backend, nada: ADR-002 escolheu deliberadamente não ter sessão
própria, então não há o que revogar do lado da API. Logout aqui é 100% client-side — limpar a
credencial no aparelho e navegar. Isso torna a feature pequena em superfície e grande em
consequência: o único ponto onde o app decide "estes dados não são mais deste corredor".

### Regras de negócio que o código revela

1. **O item da fila não tem dono.** O token é anexado só no momento do envio
   (`HttpRecordApi.send` → `session.currentToken()`, linha 28). Quem estiver logado quando a fila
   drenar é quem recebe os registros.
2. **Mandato inviolável da Constituição**: dados de saúde e localização nunca são expostos entre
   usuários.
3. **Regra 5 da spec da STORY-003**: o corredor só é levado ao login quando a renovação do token
   falha — e **a fila permanece intacta** nesse caso. O logout voluntário é um caminho novo que
   essa regra não previu.
4. **ADR-001**: carga de treino inflada gera alerta de sobrecarga falso. Registro atribuído ao
   corredor errado corrompe a avaliação dos **dois**.

---

## 3. Direção estratégica

### Abordagem: extensão, não módulo novo

Três peças, nesta ordem:

1. **Ampliar a porta `GoogleSession`** com `signOut(): Promise<void>` (e, de quebra, `signIn`, que
   já é usado fora do contrato). Implementação já existe — é só declarar.
2. **Uma função orquestradora pura** em `src/auth/`, no molde de `logRecord.ts` / `loadHomeState`:
   recebe `session` + `recordQueue`, decide o que fazer com os pendentes, chama `signOut()`, devolve
   um resultado que a tela traduz em navegação. É o que permite cobrir a regra da fila em Jest sem
   development build.
3. **Botão "Sair" na home**, `SecondaryButton` do Nocturne, abaixo de "Ver histórico" e separado por
   `Rule()`, seguido de `router.replace('/login')`.

### Padrão de design

O mesmo porta/adaptador já em uso — nenhum pattern novo. `replace` e não `push` é regra, não gosto:
com `push`, o botão físico de voltar do Android devolve o corredor à home de uma sessão encerrada.

### Alternativa considerada e descartada

Botão no `headerRight` do `Stack.Screen name="index"`. Fica mais fora do caminho, mas exige
configurar o header no `_layout.tsx` (longe da home, onde o estado da fila é conhecido) e é mais
difícil de testar. Para um MVP com uma tela, o corpo da home é mais simples e mais honesto.

### Fronteiras

**Dentro do escopo**: botão, confirmação, `signOut()`, destino dos registros pendentes, navegação.

**Fora do escopo**: `revokeAccess()` (revogar o consentimento no Google), exclusão de conta / direito
ao apagamento (LGPD), logout automático por inatividade, troca rápida entre contas, exibir qual
conta está logada.

---

## 4. Riscos e edge cases

### 🔴 Risco crítico — a fila pendente atravessa a troca de usuário

A fila é global e sem dono; o token é anexado no envio. Sequência inteiramente plausível no
dogfooding:

```
Corredor A registra 3 treinos sem sinal  →  ficam na fila
Corredor A toca em "Sair"                →  vai para o login
Corredor B entra no mesmo aparelho       →  home
A conexão volta  →  startAutoSync dispara  →  os 3 treinos de A
                                              são enviados com o token de B
```

Resultado: dados de saúde de A gravados na conta de B. Viola o **mandato inviolável** da
Constituição e corrompe a avaliação de sobrecarga dos dois (ADR-001). O `/review` marcaria isso em
A01 (Broken Access Control).

Hoje esse cenário é inalcançável só porque não existe botão de sair — **é esta feature que o abre**.
Saídas consideradas:

| # | Saída | Custo | Problema |
|---|-------|-------|----------|
| **A** | **Sincronizar antes de sair; se sobrar pendente, avisar e pedir confirmação explícita para descartar** | Baixo-médio | Perde registro feito na rua, mas com consentimento informado |
| B | Bloquear a saída enquanto houver pendentes | Baixo | Prende o corredor offline dentro da própria conta |
| C | Carimbar cada item da fila com o `sub` do dono; o envio descarta o que não é do usuário atual | Médio | Faz o app guardar identidade, que hoje ele não guarda |

#### ✅ Decisão: **A** (Jefferson, 2026-08-16)

Ao tocar em "Sair", nesta ordem:

1. Tenta sincronizar a fila. Esvaziou → sai direto, sem perguntar nada.
2. Sobrou pendente → confirmação com o número explícito
   (*"3 registros ainda não foram enviados. Se sair agora, eles serão perdidos."*).
3. Confirmou → **descarta a fila**, `signOut()`, `replace('/login')`.

Razão: é KISS, nunca atribui dado de saúde ao corredor errado, e a perda é uma escolha informada em
vez de um efeito colateral invisível. **C** fica registrada como evolução para quando um aparelho
passar a ter mais de um corredor de verdade.

Limpar a fila é o primeiro caminho do app que **apaga dado de treino** — até aqui a fila só perdia
item por confirmação do servidor ou rejeição 400. Isso mais o fato de a mudança tocar 3 módulos
(auth, sync, home) faz um **ADR-005** obrigatório pelos Acordos do Time da Constituição.

### 🟡 Risco — `signOut()` engole a exceção e o corredor volta sozinho

`GoogleSignInSession.signOut()` (linha 54) captura qualquer erro com o comentário *"Sair localmente
basta: se o Google falhar, a sessão daqui já se foi"*. A premissa não se sustenta: **não existe
"sessão daqui"** — o único estado de sessão é o cache da biblioteca nativa. Se
`GoogleSignin.signOut()` lançar, a credencial continua no aparelho, e na próxima abertura o
`_layout.tsx` chama `refresh()` → `signInSilently()` → o corredor entra sem passar pelo login.
O comentário precisa ser revisto junto com a feature.

### 🟡 Risco — a guarda de sessão roda uma única vez

O `useEffect` do `_layout.tsx` (linha 18) tem `[router]` como dependência: verifica a sessão no
mount e nunca mais. Depois do logout, a navegação explícita é a **única** proteção — se ela falhar,
o app fica numa home autenticada sem sessão, mostrando "Sem conexão" em vez de mandar para o login.
Aceitável para o MVP, mas é o motivo de o `replace` ser obrigatório.

### 🟢 Comportamento correto por acidente

`startAutoSync` continua montado depois do logout (o root layout não desmonta). Sem sessão,
`HttpRecordApi.send` devolve `unauthenticated`, o `SyncEngine` para no primeiro item e a fila fica
intacta — exatamente o desejado. Vale um teste que fixe esse comportamento, porque hoje ele é
consequência não intencional.

### Edge cases

- **Sair sem conexão** — `GoogleSignin.signOut()` é local, funciona offline. Mas combinado com a
  fila pendente, é justamente o pior caso do risco crítico.
- **Sair a partir de uma tela empilhada** (`/log/run`, `/history`) — `replace` troca só a rota
  atual; o restante da pilha pode sobreviver. No fluxo real o botão está na home (raiz), mas vale
  fechar isso na spec.
- **Toque duplo em "Sair"** — precisa de estado `saindo` como o `entrando` do `login.tsx`.
- **Botão físico de voltar do Android depois de sair** — não pode retornar à home.
- **Sair e entrar com a mesma conta** — caso benigno; a fila (se preservada) volta para o dono
  certo. É o cenário mais provável no dogfooding e não pode virar dano colateral da regra da fila.

### Ambiguidades — resolvidas antes do `/spec`

| # | Pergunta | Resolução |
|---|----------|-----------|
| 1 | O que acontece com os registros pendentes? | **Saída A** — sincroniza, avisa, descarta mediante confirmação (decidido) |
| 2 | Sair revoga o acesso no Google? | **Não.** Só `signOut()`. `revokeAccess()` faria o Google pedir consentimento de novo no próximo login — sair deve ser barato de desfazer |
| 3 | Onde o botão fica? | **Na home**, `SecondaryButton` abaixo de "Ver histórico", separado por `Rule()` |
| 4 | Confirmação antes de sair? | **Só quando há pendentes.** Fila vazia sai direto — perguntar sem ter o que perder é atrito à toa |
| 5 | A home mostra qual conta está logada? | **Fora de escopo.** O app não armazena nem exibe identidade hoje; entra numa tela "Conta" futura |
