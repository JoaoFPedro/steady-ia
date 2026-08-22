# Story: STORY-005 — Menu lateral de perfil

Discovery: — (sem discovery associado, ver *Contexto*)
Análise prévia: [analysis.md](./analysis.md)
Substitui: a tela Conta entregue na [STORY-004](../STORY-004/spec.bdd.md)

## Descrição

Como **corredor que usa o Steady no meu celular**,
Quero **abrir um menu lateral com meu perfil e as ações da minha conta**,
Para que **eu reconheça de imediato em qual conta estou e tenha um lugar previsível
para as opções de conta conforme elas aparecerem**.

## Contexto

A STORY-004 entregou a saída da sessão numa **tela** Conta, alcançada por um botão
no rodapé da home. Funciona, mas é um destino de navegação inteiro para uma ação
só, e não tem para onde crescer: cada opção nova de conta seria outra tela, ou
transformaria a Conta numa lista de links.

Esta story troca a casca por um menu lateral — nasce na borda esquerda e cresce
para a direita, aberto pelo avatar do cabeçalho — que mostra quem está autenticado
(foto, nome e e-mail da conta Google) e concentra as ações de conta, hoje apenas
**Sair**, no rodapé.

Não é uma feature nova de domínio: é mudança de superfície. **Toda a regra do
ADR-005 permanece intacta** — `signOutAccount.ts` e seus testes não mudam uma
linha. É o retorno de ter mantido a regra fora do React na STORY-004.

O `/analyze` confirmou que isso **não custa rebuild do APK**: `reanimated` e
`gesture-handler` já entraram como dependência direta do `expo-router` e estão
autolinkados no development build; o `react-native-drawer-layout` já está
instalado e é JS puro sobre eles.

## Critérios de Aceite

- [ ] Corredor abre o menu pelo **avatar** no cabeçalho da home — único gatilho de toque
- [ ] O menu nasce na borda esquerda e se expande para a direita
- [ ] O menu exibe **foto, nome e e-mail** da conta Google autenticada
- [ ] Sem foto disponível, o avatar mostra a inicial da conta — e continua abrindo o menu
- [ ] Sem nome disponível, o painel mostra apenas o e-mail
- [ ] **Sair** fica no rodapé do painel e preserva integralmente o comportamento do ADR-005
- [ ] O menu fecha antes de o corredor ser levado ao login
- [ ] Com o menu aberto, o voltar do aparelho **fecha o menu** em vez de navegar
- [ ] O menu **não existe** na tela de login nem nas telas de registro
- [ ] A tela Conta (`app/account.tsx`) e sua rota são removidas

## Fora de Escopo

| Item | Razão |
|------|-------|
| Outras opções de perfil | Não existem ainda. Construir o menu para opções hipotéticas é a Abstração Prematura que a Constituição lista como anti-pattern |
| Edição de perfil, troca de foto | O Steady não tem perfil próprio — nome e foto vêm do Google e nunca chegam à API |
| Cache offline da foto | Fallback de iniciais resolve o caso offline sem dependência nova |
| Menu nas telas de registro e histórico | Menu de perfil pertence à home; nas outras o corredor está no meio de uma tarefa |
| `expo-router/drawer` (navegador de rotas) | O painel é conteúdo, não rotas. Justificativa completa em [analysis.md](./analysis.md) §3 |
| Tema, notificações, preferências | Sem requisito |

## Estimativa

- **Tamanho**: P/M
- **Complexidade**: Baixa na regra (nenhuma muda), média na casca — estado do
  drawer, botão voltar e o avatar que precisa ser tocável antes de carregar

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-004 (saída da sessão, `signOutAccount`) | Concluída |
| ADR | ADR-005 — destino da fila pendente ao encerrar a sessão | Accepted — **inalterado** |
| ADR | ADR-002 — identidade do corredor pelo `sub` do token | Accepted |
| Pacote | `react-native-drawer-layout@4.2.10` | Já instalado, JS puro |
