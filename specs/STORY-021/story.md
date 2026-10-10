# Story: STORY-021 — Menu da conta também na aba Planejamento

> Pedido direto do usuário, sem discovery. Estende para Planejamento o menu de
> conta entregue anteriormente na Dashboard.

## Descrição

Como **corredor autenticado consultando meus planejamentos**,
Quero **acessar o ícone da minha conta e a opção de sair sem voltar à
Dashboard**,
Para que **as ações da minha sessão estejam disponíveis também na aba em que
gerencio meus planos**.

## Contexto

Hoje o avatar e o drawer da conta existem somente na Dashboard. A regra de
saída já está isolada e protege registros offline conforme o ADR-005, mas a aba
Planejamento não oferece acesso a ela. Esta story adiciona uma segunda entrada
para o mesmo menu, preservando integralmente identidade, feedback e segurança
da saída.

O escopo é a tela principal da tab Planejamento, acessada pela barra inferior.
As rotas empilhadas de criar e visualizar plano mantêm seus cabeçalhos próprios.

## Critérios de Aceite

- [x] A aba **Planejamento** exibe o avatar da conta no topo direito
- [x] O avatar usa a mesma foto ou inicial de fallback exibida na Dashboard
- [x] Tocar no avatar abre o mesmo menu lateral com nome, e-mail e “Sair da conta”
- [x] A saída iniciada em Planejamento preserva todos os comportamentos do ADR-005
- [x] O botão voltar do Android fecha o menu antes de afetar a navegação
- [x] Falha ao sair mantém a sessão e mostra feedback dentro do menu
- [x] A listagem de planos e a gestão de vínculos permanecem inalteradas
- [x] Login e rotas `/planning/new` e `/planning/plan` não ganham o avatar

## Estimativa

- **Tamanho**: P
- **Complexidade**: Baixa

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-005 — menu lateral de perfil e saída | Implementada |
| Decisão | ADR-005 — destino da fila pendente ao sair | Accepted |

## Notas

- Análise: [analysis.md](./analysis.md)
- Nenhuma mudança de backend, autenticação ou dependência nativa.
