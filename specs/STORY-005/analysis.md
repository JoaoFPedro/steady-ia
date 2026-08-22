# Análise: menu lateral de perfil com foto e saída

> Gerada por `/analyze` em 2026-08-16 · Feature ainda **sem story e sem spec BDD**
> Substitui a tela Conta entregue na [STORY-004](../STORY-004/spec.bdd.md)
> Precede: `/spec` (STORY-005)

---

## 1. Scan de código relevante

### Módulos afetados

| Arquivo | Papel na feature |
|---------|-----------------|
| `app/account.tsx` | **A ser removido** — é a tela que o menu substitui |
| `app/index.tsx` | Ganha o gatilho do menu (avatar) e hospeda o drawer |
| `app/_layout.tsx` | Registro da rota `account` sai; a guarda de sessão continua |
| `src/account/signOutAccount.ts` | **Intacto** — a regra do ADR-005 não sabe qual é a tela |
| `src/auth/googleSession.ts` | `AccountIdentity` ganha a foto |
| `src/auth/googleSignInSession.ts` · `nativeGoogleSignInClient.ts` | `currentUser()` passa a ler `user.photo` |
| `src/auth/goToLogin.ts` | **Intacto** |
| `src/ui/Nocturne.tsx` | Ganha o avatar; o painel usa `Card`/`Rule`/`SecondaryButton` que já existem |

### Dependências — o achado que muda o custo da feature

**Nenhum módulo nativo novo. Nenhum rebuild de APK.**

| Pacote | Situação |
|---|---|
| `react-native-reanimated@4.5.3` | Já instalado — **dependência direta do `expo-router`** |
| `react-native-gesture-handler@3.2.1` | Já instalado — idem |
| `react-native-worklets` | Já instalado (exigência do reanimated 4) |
| `react-native-drawer-layout@4.2.10` | **Já instalado.** Exporta o componente `Drawer`, JS puro sobre os dois acima |
| `@react-navigation/drawer` | Não instalado, e **não é necessário** — o `expo-router` 57 traz a própria navegação vendorizada |

Os dois módulos nativos entraram junto com o `expo-router`, então já foram
autolinkados no development build que está no seu aparelho. O que falta é código
JS, que vem do dev server. Pelo `CLAUDE.md`, rebuild só é necessário para
mudança nativa — não é o caso.

### Padrões em uso na área

- Porta/adaptador para plataforma (`GoogleSession` / `GoogleSignInClient`), com o
  módulo nativo isolado em um único arquivo.
- Regra fora do React, tela só renderiza e navega (`signOutAccount`, `goToLogin`,
  `loadHomeState`, `logRecord`).
- Composition root único (`services.ts`).
- Design system Nocturne com tokens — nunca hex solto (`.sdd/STACK.md`).

### Achado estrutural

`expo-router/build/react-navigation/stack/views/StackView.js` já envolve o
conteúdo do `Stack` em `GestureHandlerRootView`. Ou seja: **um drawer colocado
dentro de uma tela herda o wrapper e os gestos funcionam**; um drawer que
envolvesse o `<Stack>` no `_layout.tsx` ficaria *fora* dele, e o gesto de arrastar
não responderia no Android. Isso decide onde o drawer mora.

---

## 2. Análise de domínio

### Conceitos existentes

- **`AccountIdentity`** — hoje `{ email }`. É o único dado de identidade que o app
  manuseia, e ele não é persistido em lugar nenhum: vem do cache do módulo nativo
  a cada leitura.
- **Regra do ADR-005** — a saída sincroniza, avisa e descarta mediante
  confirmação. Vive inteiramente em `signOutAccount.ts`, sem React.
- **Corredor** — no backend é o `sub` do token (ADR-002). Nome e foto **nunca
  chegam à API** e não são persistidos: o Steady não tem perfil de usuário.

### Conceitos novos

**Foto de perfil.** `GoogleSignin.getCurrentUser()` devolve
`user.photo: string | null` — uma URL do CDN do Google, não a imagem. Renderizar
significa uma requisição de rede a cada abertura do menu.

**Menu de perfil.** Um agrupador de ações que hoje tem um item só. É a primeira
superfície do app que existe para *crescer* — o que é justamente o que a
Constituição chama de Abstração Prematura se for construída para o futuro
hipotético em vez do item presente.

### Regras de negócio que o código revela

1. O app **não guarda identidade**. Foto e e-mail são leitura volátil do módulo
   nativo — some ao sair, sem precisar limpar nada.
2. A saída continua sendo a única operação destrutiva do app (ADR-005): descarta
   registro de treino não sincronizado.
3. Nada de perfil trafega para a API. Um menu de perfil **não** cria necessidade
   de endpoint novo.

---

## 3. Direção estratégica

### Abordagem: painel sobreposto, não navegador de rotas

Existem dois caminhos, e o óbvio é o errado:

| | `expo-router/drawer` (navegador) | `react-native-drawer-layout` (componente) |
|---|---|---|
| O que é | Layout de rotas: cada item do menu é uma rota do `app/` | Componente de UI que sobrepõe um painel |
| Custo | Reestrutura o `app/`, exige decidir quais rotas ficam dentro e fora | Envolve o conteúdo de uma tela, zero mudança de rota |
| Encaixe | "Sair" não é rota — é uma ação. Hoje seria um navegador com zero rotas | O painel é conteúdo, que é o que a feature pede |
| Gestos | Fora do `GestureHandlerRootView` do Stack | Dentro dele |

**Recomendo `react-native-drawer-layout`.** O conteúdo do menu é um painel de
ações, não um conjunto de telas. Quando surgir uma opção que *seja* tela
("Notificações", "Meus dados"), ela vira uma rota normal do Stack que o painel
abre com `router.push` — sem precisar de navegador de drawer.

### Estrutura proposta

```
src/account/
  accountMenu.tsx      ← o painel: avatar + e-mail + Rule + Sair no rodapé
  signOutAccount.ts    ← intacto, já testado
src/ui/
  Avatar.tsx           ← foto com fallback de iniciais, peça do Nocturne
app/
  index.tsx            ← <Drawer open renderDrawerContent={...}> envolvendo a home
  account.tsx          ← removido
```

### Padrão de design

Nenhum novo. O painel é composição de peças do Nocturne; a lógica de saída já
está atrás de uma função pura. **O ganho aqui é a prova de que a STORY-004 foi
bem separada**: trocar a tela inteira por um drawer não toca uma linha de
`signOutAccount.ts` nem dos seus 13 testes.

### Fronteiras

**Dentro**: drawer com gesto e toque, avatar com fallback, e-mail, "Sair" no
rodapé com todo o comportamento do ADR-005 preservado, remoção da tela Conta.

**Fora**: outras opções de perfil (não existem ainda), edição de perfil, upload de
foto, cache offline da imagem, tema/preferências, drawer nas demais telas.

---

## 4. Riscos e edge cases

### 🔴 O drawer não pode existir na tela de login

Se o drawer envolver o `<Stack>` no `_layout.tsx`, ele cobre **todas** as rotas —
inclusive `login`. Um menu de perfil arrastável numa tela sem sessão é, na melhor
das hipóteses, um bug visual; na pior, expõe "Sair" para quem já não está dentro.
Somado ao achado do `GestureHandlerRootView`, isso fecha a decisão: **o drawer
mora dentro da home**, não no layout raiz.

### 🟡 Foto depende de rede, e o app é offline-first

`user.photo` é URL, não imagem. O corredor que abre o menu sem sinal — o cenário
central da STORY-003 — veria um buraco onde deveria estar o avatar. Precisa de
fallback determinístico (inicial do e-mail sobre `accentRamp[900]`), tratando
`onError` e `photo === null` pelo mesmo caminho. O avatar provavelmente também é
o gatilho do menu, então ele **não pode** depender de carregar para ser tocável.

### 🟡 Botão voltar do Android com o menu aberto

`react-native-drawer-layout` não intercepta o botão físico. Sem tratamento, voltar
com o menu aberto sai da home em vez de fechar o menu — quebra a expectativa de
qualquer usuário de Android. Exige `BackHandler` enquanto `open === true`.

### 🟡 Menu aberto no momento da saída

O fluxo do ADR-005 pode abrir um `Alert` de confirmação **por cima** do drawer, e
depois navegar para o login. Se o drawer não fechar antes do `goToLogin`, ele pode
ficar montado sobre a tela de login por um frame. A saída precisa fechar o menu
antes de navegar.

### 🟢 Regra de negócio intocada

`signOutAccount.ts`, `goToLogin.ts` e os testes de `account/__tests__/`
continuam válidos sem uma linha alterada. O risco de regressão na regra do
ADR-005 é praticamente zero — o que muda é a casca.

### Edge cases

- Conta Google **sem foto** (`photo: null`) — comum em conta corporativa.
- E-mail longo estourando a largura do painel (precisa `numberOfLines`).
- Abrir o menu enquanto a home ainda carrega a avaliação de sobrecarga.
- Arrastar o menu no meio de uma sincronização automática.
- Toque repetido no avatar.
- Girar o aparelho com o menu aberto — o `app.json` fixa `"orientation": "portrait"`, então não se aplica.

### Ambiguidades — resolvidas antes do `/spec` (Jefferson, 2026-08-16)

| # | Pergunta | Resolução |
|---|----------|-----------|
| 1 | Qual borda? | **Hambúrguer clássico** — painel nasce na borda esquerda e cresce para a direita (`drawerPosition: 'left'`) |
| 2 | O que abre o menu? | ~~Ícone de hambúrguer e avatar~~ → **revisto na implementação (2026-08-17): só o avatar.** Dois gatilhos lado a lado para a mesma ação são um só. O gesto de arrastar vem de graça com o componente |
| 3 | `app/account.tsx` | **Removida**, junto com a rota no `_layout.tsx` |
| 4 | Avatar na home? | **Sim** — é o gatilho de toque, além de aparecer dentro do painel |
| 5 | Mostrar o nome? | **Sim**, nome + e-mail. `user.name` vem no mesmo objeto |

Consequência do #2 que a spec precisa cobrir: o avatar é **gatilho**, então tocá-lo
não pode depender de a foto ter carregado. O fallback de iniciais precisa ocupar a
mesma área tocável desde o primeiro frame.

Consequência do #5: `user.name` é `string | null` na biblioteca. Conta sem nome
cai para só o e-mail — não para um espaço vazio nem para "null".
