# Story: STORY-010 — Planejamentos persistidos no banco

Discovery: .discovery/DISC-002-plano-de-treino-semanal/
ADR: [ADR-007](../../docs/adr/ADR-007-persistencia-do-pedido-de-plano-de-treino.md)

> Fecha a pendência que a [STORY-008](../STORY-008/story.md) registrou por
> escrito: "a lista vive só em memória, no processo do app (não sobrevive a
> fechar o app)". Os 13 campos que o corredor responde hoje são **descartados
> no submit** — só `raceDistance` e `raceDate` sobrevivem, e mesmo esses só
> até o app fechar.

## Descrição

Como **corredor que monta planejamentos no Steady**,
Quero **que os planejamentos que eu criei continuem lá quando eu fechar o app,
e que abrir um deles me mostre os dados que eu respondi naquele pedido**,
Para que **eu possa voltar a um planejamento que fiz semanas atrás e lembrar
com que premissas ele foi montado — em vez de perder tudo ao fechar o app**.

## Contexto

Hoje `generatedPlansStore.ts` é um singleton de módulo JS: guarda
`{id, raceDistance, raceDate, createdAt}` na memória do processo. Os outros 11
campos do formulário (`PlanningForm.tsx:39-51`) ficam presos no `useState` e
nunca saem do componente. Fechar o app perde a lista inteira.

Além disso, todo card navega para `router.push('/planning/plan')` — sem id, sem
parâmetro. Dez planejamentos com distâncias e datas diferentes abrem exatamente
a mesma tela. Esta story faz cada card abrir **o seu** pedido.

**O conteúdo de treino continua estático.** `TRAINING_PLAN_DOCUMENT` segue
sendo a mesma transcrição para todos os pedidos — a geração dinâmica dos
exercícios a partir dos inputs fica para depois (decisão de produto,
2026-08-22). Esta story guarda e mostra **os inputs**; é o insumo de que a
geração vai precisar quando chegar.

## Critérios de Aceite

- [x] Tabela `plan_requests` em Postgres, com os campos do formulário
- [x] Cada toque em "Gerar plano" cria um pedido novo — nunca atualiza
- [x] A aba Planejamento lista os pedidos **do corredor**, vindos da API
- [x] A lista sobrevive a fechar o app e aparece em qualquer aparelho
- [x] Tocar num card abre **aquele** pedido, com os dados que ele guardou
- [x] A data da prova é digitada em `dd/mm/aaaa` e guardada como `AAAA-MM-DD`
- [x] Gerar plano funciona sem sinal e sobe sozinho na volta da conexão
- [x] Pedido de outro corredor devolve 404

## Estimativa

- **Tamanho**: L
- **Complexidade**: Média-alta — não há regra de negócio nova (nenhum cálculo),
  mas atravessa as quatro camadas: migration, repositório, três endpoints, e no
  app o formulário completo, a fila offline e duas telas.

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| ADR | ADR-007 — modelagem do pedido | ✅ Accepted |
| ADR | ADR-002 — isolamento por corredor | ✅ Accepted |
| ADR | ADR-003 — chave de idempotência | ✅ Accepted |
| Story | STORY-008 — lista e rotas próprias | ✅ Implementada |

## Notas

O `preferred_weekdays` do schema de referência **fica de fora**: o `MultiChoice`
está comentado em `PlanningForm.tsx:142`, então a coluna nasceria sempre vazia.
Entra junto com o input, numa migration de uma linha.
