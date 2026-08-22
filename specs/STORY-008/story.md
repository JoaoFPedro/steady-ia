# Story: STORY-008 — Aba Planejamento vira lista de planos criados

Discovery: .discovery/DISC-002-plano-de-treino-semanal/

> Substitui o `generated` booleano da aba Planejamento (STORY-006) por um
> histórico de planos gerados na sessão. A aba deixa de alternar entre
> formulário/documento por dentro e passa a **ser** a lista desses planos;
> criar e visualizar um plano viram rotas próprias (`/planning/new`,
> `/planning/plan`), do mesmo jeito que `log/run` etc. já empilham sobre
> uma aba. A Dashboard usa a mesma lista para ir direto ao mais recente.
>
> Layout e cópia da lista seguem o protótipo importado do Claude Design —
> `Steady - Marathon App.dc.html`, turno 2, artboard 2c.

## Descrição

Como **corredor que já gerou um ou mais planos**,
Quero **ver, na aba Planejamento, os planejamentos que já criei — e um
botão pra criar mais um — em vez de cair sempre num formulário ou perder de
vista o que já gerei**,
Para que **a aba seja o lugar onde eu revejo meus planos, não uma tela que
esconde isso atrás de um estado que só existe enquanto estou nela**.

## Contexto

Antes desta story, `generated` era um booleano local à aba: só lembrava
"form ou documento", sem noção de "qual plano" nem de mais de um gerado. Ao
tentar corrigir isso hoje, duas versões erradas passaram por aqui antes
desta: uma tornou a lista a tela padrão da aba mas manteve form/documento
como estado interno alternado; outra fez o oposto (documento como padrão).
As duas confundiam a mesma coisa: "o que a aba mostra sempre" (a lista) com
"para onde a navegação leva" (criar → `/planning/new`; ver →
`/planning/plan`) — que são conceitos diferentes e não deveriam compartilhar
uma variável de estado.

**Nota de persistência (2026-08-21, decisão de produto)**: a lista vive só
em memória, no processo do app (não sobrevive a fechar o app — mesma
limitação de estado do resto do `STORY-006`). A intenção de produto é, no
futuro, persistir os planos no backend — outra story, só faz sentido quando
a geração deixar de ser mockada.

## Critérios de Aceite

- [x] A aba Planejamento **é** a lista de planos criados — não alterna
      internamente entre formulário/lista/documento
- [x] Sem nenhum plano gerado, a aba mostra uma mensagem e o botão **"Criar
      planejamento"**
- [x] Com um ou mais planos, a aba mostra um card por entrada (mais recente
      primeiro) e o mesmo botão abaixo — selo "Ativo"/"Anterior", distância
      da prova como título, "Prova em {data}" como subtítulo, `›`. **Sem**
      barra de progresso nem "semana X de Y" (exigiria calcular
      progressão, fora de escopo do DISC-002, mesmo o protótipo mostrando)
- [x] "Criar planejamento" e tocar num card navegam para rotas próprias —
      `/planning/new` (formulário, cabeçalho nativo do `Stack`) e
      `/planning/plan` (documento, cabeçalho próprio) — registradas no
      `Stack` raiz, mesmo padrão de `log/run`/`log/strength`/`log/pain`
- [x] Gerar em `/planning/new` substitui a rota (`router.replace`) pelo
      documento; "Editar dados" no documento empurra o formulário de novo
      (`router.push`) — enviar de novo cria mais uma entrada
- [x] Cada vez que o corredor toca em "Gerar plano", uma **entrada nova** é
      adicionada à lista — mesmo o documento sendo sempre o mesmo conteúdo
      estático
- [x] O botão **"Ver plano da semana"** da Dashboard: com algum plano
      gerado, empurra direto `/planning/plan` (o mais recente); sem
      nenhum, empurra `/planning/new`

## Estimativa

- **Tamanho**: M
- **Complexidade**: Média — sem lógica de negócio nova (nenhum cálculo),
  mas duas rotas novas irmãs de `log/*` e um módulo de estado compartilhado
  entre Dashboard e Planejamento (abas irmãs, sem contexto comum hoje).

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-006 — formulário e documento do plano | ✅ Implementada |
| Story | STORY-007 — card "Plano da semana" na Dashboard | ✅ Implementada |

## Notas

A regra 2 do `STORY-006` ("a aba sempre abre no formulário") fica
implicitamente superada por esta story — a aba agora sempre abre na lista,
e o formulário é uma rota alcançada a partir dela ou da Dashboard.
