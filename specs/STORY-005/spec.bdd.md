# Spec BDD: STORY-005 — Menu lateral de perfil

> **Story**: [story.md](./story.md)
> **Análise**: [analysis.md](./analysis.md)
> **Status**: Draft — aguardando aprovação de Produto & Design
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)
> **Substitui**: cenários de tela Conta da [STORY-004](../STORY-004/spec.bdd.md)

---

## Feature: Menu lateral de perfil

Um menu que desliza da borda esquerda da tela inicial, mostrando quem está
autenticado — foto, nome e e-mail da conta Google — e concentrando as ações de
conta. Hoje há uma: **Sair**, no rodapé.

### Regras de Negócio

1. O menu existe **apenas na tela inicial**. Login e telas de registro não o têm:
   menu de perfil numa tela sem sessão não faz sentido, e no meio de um registro
   de treino seria distração.
2. O menu abre por **dois caminhos equivalentes**: o avatar no cabeçalho da home e
   o gesto de arrastar da borda esquerda. Nasce à esquerda e se expande para a
   direita. **Não há ícone de hambúrguer**: o avatar já diz de quem é a conta, e um
   segundo gatilho ao lado dele apenas repetiria o mesmo toque.
3. O avatar identifica a conta pela **foto do Google**. Sem foto, mostra a inicial
   da conta sobre o accent do Nocturne.
4. **O avatar é gatilho antes de ser imagem.** Tocá-lo abre o menu mesmo sem a foto
   ter carregado — inclusive offline, que é o estado normal do corredor na rua
   (STORY-003). Foto ausente e foto que falhou ao carregar são o mesmo caso.
5. O painel exibe **nome e e-mail**. Conta sem nome exibe apenas o e-mail — nunca
   espaço vazio nem texto de preenchimento.
6. **Sair fica no rodapé**, separado do restante do painel. É a única ação hoje, e
   ainda assim o rodapé é o lugar dela: encerrar sessão não deve competir por
   atenção com navegação de perfil.
7. Sair preserva **integralmente** o comportamento do ADR-005 — sincroniza a fila,
   avisa quantos registros serão perdidos, e só descarta mediante confirmação. O
   menu é casca; a regra não muda.
8. O menu **fecha antes** de o corredor ser levado ao login. Nunca fica montado
   sobre a tela de login.
9. Com o menu aberto, o voltar do aparelho **fecha o menu** em vez de navegar. Um
   painel aberto é o estado que o voltar deve desfazer primeiro.
10. Nenhum dado de perfil é persistido nem enviado à API. Foto, nome e e-mail são
    leitura volátil do módulo nativo — somem ao sair, sem nada a limpar (ADR-002).

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor abre o menu pelo avatar
  Given que estou autenticado na tela inicial
  When toco no meu avatar no cabeçalho
  Then o menu lateral se expande a partir da borda esquerda
  And vejo as ações da minha conta
```

```gherkin
Scenario: Corredor reconhece em qual conta está
  Given que estou autenticado com uma conta Google que tem foto e nome
  When abro o menu lateral
  Then vejo minha foto de perfil
  And vejo meu nome e meu e-mail
```

```gherkin
Scenario: Corredor sai da conta pelo rodapé do menu
  Given que estou autenticado e não tenho registros pendentes
  When abro o menu lateral e escolho sair
  Then o menu se fecha
  And minha sessão é encerrada no aparelho
  And sou levado à tela de login
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Conta Google sem foto
  Given que estou autenticado com uma conta Google sem foto de perfil
  When abro o menu lateral
  Then vejo a inicial da minha conta no lugar da foto
  And meu nome e e-mail continuam visíveis
```

```gherkin
Scenario: Foto não carrega por falta de conexão
  Given que estou autenticado e sem conexão de rede
  When abro o menu lateral
  Then vejo a inicial da minha conta no lugar da foto
  And nenhum erro é apresentado por causa disso
```

```gherkin
Scenario: Avatar abre o menu mesmo sem a foto ter carregado
  Given que estou na tela inicial e minha foto de perfil ainda não carregou
  When toco no avatar
  Then o menu lateral se expande normalmente
```

```gherkin
Scenario: Conta Google sem nome
  Given que estou autenticado com uma conta Google que não informa nome
  When abro o menu lateral
  Then vejo apenas o meu e-mail
  And nenhum espaço vazio ocupa o lugar do nome
```

```gherkin
Scenario: Corredor fecha o menu com o voltar do aparelho
  Given que estou com o menu lateral aberto
  When aciono o voltar do aparelho
  Then o menu se fecha
  And permaneço na tela inicial
```

```gherkin
Scenario: Corredor fecha o menu tocando fora dele
  Given que estou com o menu lateral aberto
  When toco na área da tela inicial fora do menu
  Then o menu se fecha
  And nenhuma ação da tela inicial é acionada por esse toque
```

```gherkin
Scenario: Corredor sai pelo menu tendo registros pendentes
  Given que estou autenticado e sem conexão
  And tenho 2 registros pendentes de sincronização
  When abro o menu lateral e escolho sair
  Then sou avisado de que 2 registros ainda não foram enviados e serão perdidos
  And minha sessão só é encerrada depois que eu confirmar
```

```gherkin
Scenario: Corredor cancela a saída a partir do menu
  Given que fui avisado de que tenho registros pendentes ao sair pelo menu
  When cancelo a saída
  Then continuo autenticado na tela inicial
  And meus registros pendentes permanecem na fila, sem perda
```

```gherkin
Scenario: Menu não existe fora da tela inicial
  Given que estou autenticado
  When abro a tela de registrar corrida ou o histórico
  Then não há menu lateral para abrir
  And o gesto de arrastar da borda não revela nenhum painel
```

```gherkin
Scenario: Menu não existe na tela de login
  Given que não estou autenticado e estou na tela de login
  When aciono o gesto de arrastar da borda esquerda
  Then nenhum menu de perfil é revelado
```

---

### Cenários — Error Cases

```gherkin
Scenario: Falha ao encerrar a sessão a partir do menu
  Given que estou com o menu lateral aberto
  When escolho sair e o encerramento da sessão falha
  Then sou informado de que não foi possível sair
  And permaneço autenticado, com o menu aberto
  And o app não me apresenta como desconectado
```

```gherkin
Scenario: Aparelho não informa qual conta está autenticada
  Given que estou autenticado mas o aparelho não consegue informar os dados da conta
  When abro o menu lateral
  Then o menu abre normalmente
  And a ação de sair continua disponível
  And nenhum erro bloqueia o uso do menu
```

---

## Mapping: Cenário → Teste

> Test runner: Jest (`.sdd/STACK.md`).

Duas partes do menu têm lógica que pode estar errada em silêncio, e por isso saem
do React: `accountPresentation.ts` (nome, e-mail, foto, inicial) e
`signOutFeedback.ts` (a **ordem** entre fechar o menu e navegar, e o número no
aviso de descarte). O resto é estado de tela.

| Cenário | Arquivo de Teste | Status |
|---------|-----------------|--------|
| Reconhece em qual conta está | `account/__tests__/accountPresentation.test.ts` · `auth/__tests__/googleSignInSession.test.ts` | 🟢 Green |
| Conta Google sem foto | `account/__tests__/accountPresentation.test.ts` | 🟢 Green |
| Foto não carrega por falta de conexão | `account/__tests__/accountPresentation.test.ts` | 🟢 Green |
| Conta Google sem nome | `account/__tests__/accountPresentation.test.ts` | 🟢 Green |
| Aparelho não informa a conta | `account/__tests__/accountPresentation.test.ts` · `auth/__tests__/googleSignInSession.test.ts` | 🟢 Green |
| Sai pelo rodapé do menu — menu fecha, depois navega | `account/__tests__/signOutFeedback.test.ts` · `auth/__tests__/goToLogin.test.ts` | 🟢 Green |
| Sai tendo registros pendentes — número exato no aviso | `account/__tests__/signOutFeedback.test.ts` · `account/__tests__/signOutAccount.test.ts` | 🟢 Green |
| Cancela a saída | `account/__tests__/discardOnSignOut.test.ts` | 🟢 Green — **herdado, sem alteração** |
| Falha ao encerrar a sessão — avisa, não navega | `account/__tests__/signOutFeedback.test.ts` · `auth/__tests__/googleSignInSession.test.ts` | 🟢 Green |

**Sem cobertura automatizada — verificação manual no aparelho:**

| Cenário | Por quê |
|---------|---------|
| Abre pelo avatar | Toque e estado de tela — `@testing-library/react-native` não instala neste projeto |
| Menu se expande a partir da borda esquerda | Animação do `react-native-drawer-layout` sobre reanimated |
| Avatar abre o menu sem a foto ter carregado | Depende do ciclo de carregamento do `Image` nativo |
| Fecha com o voltar do aparelho | `BackHandler` — evento nativo do Android |
| Fecha tocando fora | Gesto sobre o overlay do drawer |
| Menu não existe fora da home / no login | Composição de rotas do `expo-router` |

> **FF-001 fica abaixo da meta nesta story**: 64,96% (meta ≥70%). A causa é
> `useAccountMenu.ts` — cola de React que não é testável sem
> `@testing-library/react-native`. Optou-se por **não** contorcer o código para
> bater o número; a correção estrutural é destravar a RTL, hoje bloqueada pelo
> conflito `react-dom@19.2.8` × `react@19.2.3` do Expo SDK 57. FF-001 é
> *Desejável* na Constituição, não bloqueador.

> Limitação herdada da STORY-003: `@testing-library/react-native` exige
> `react-dom@19.2.8`, incompatível com o `react@19.2.3` que o Expo SDK 57 fixa.

---

## Notas de Especificação

- **Nenhum ADR novo.** A feature não toma decisão arquitetural: troca a superfície
  de uma regra já decidida no ADR-005, que permanece válido e inalterado. A
  escolha entre navegador de drawer e componente de drawer está justificada na
  [analysis.md](./analysis.md) §3 e não tem trade-off a revisitar.
- **Nenhuma dependência nova.** `react-native-drawer-layout@4.2.10` já está
  instalado; `reanimated` e `gesture-handler` já são autolinkados via
  `expo-router`. **Sem rebuild do APK** — só JS pelo dev server.
- **O drawer mora dentro da home, não no `_layout.tsx`.** Dois motivos convergem:
  envolvendo o `<Stack>` ele cobriria também a tela de login (regra 1), e ficaria
  fora do `GestureHandlerRootView` que o `StackView` do expo-router já monta —
  os gestos não responderiam no Android.
- **`signOutAccount.ts` não muda.** Os 13 testes de `account/__tests__/` seguem
  válidos como estão. Se a implementação precisar tocá-los, é sinal de que a
  casca vazou para a regra.
- **`AccountIdentity` cresce** de `{ email }` para `{ email, name, photoUrl }`,
  todos vindos do mesmo `getCurrentUser()`. `name` e `photoUrl` são
  `string | null` na biblioteca — a spec trata os dois nulos como caso normal,
  não excepcional.
- **Remoções**: `app/account.tsx`, seu `Stack.Screen` no `_layout.tsx` e o botão
  "Conta" no rodapé da home. Os cenários de tela Conta da STORY-004 ficam
  superados por esta spec.
- **O hambúrguer foi descartado durante a implementação.** Chegou a existir como
  `MenuIcon` no Nocturne e saiu junto com o segundo `Pressable` do cabeçalho:
  dois gatilhos lado a lado para a mesma ação são um só, e o avatar é o que
  carrega significado. O cabeçalho ficou com o avatar alinhado à direita.
