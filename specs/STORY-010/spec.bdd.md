# Spec BDD: STORY-010 — Planejamentos persistidos no banco

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-002-plano-de-treino-semanal/](../../.discovery/DISC-002-plano-de-treino-semanal/)
> **ADR**: [ADR-007](../../docs/adr/ADR-007-persistencia-do-pedido-de-plano-de-treino.md) (Proposed)
> **Status**: Implementado — cenários automatizados 🟢
> **Autor**: Jefferson (Produto & Design)
> **Revisores**: Jefferson (Three Amigos — solo)

---

## Feature: O planejamento do corredor sobrevive ao app

O que o corredor responde ao montar um planejamento passa a ser gravado no
banco, por corredor. A aba Planejamento deixa de ler um singleton em memória e
passa a listar os pedidos vindos da API; cada card abre **aquele** pedido, com
os dados que ele guardou.

O conteúdo de treino continua estático e igual para todos os pedidos — esta
story guarda **os inputs**, não gera exercícios.

### Regras de Negócio

#### Persistência e identidade

1. Cada toque em "Gerar plano" cria um **pedido novo**. Não existe update nem
   delete: corrigir os dados gera outra linha (Lei do Domínio #2). "Editar
   dados" no documento continua levando ao formulário, e reenviar cria mais
   uma entrada — comportamento já estabelecido pela STORY-008.
2. Todo pedido pertence a um corredor. Listagem e leitura filtram por
   `corredor_id` **na query**, nunca em memória (ADR-002). Pedir um pedido de
   outro corredor devolve **404**, não 403 — não revela que existe
   (Playbook A01).
3. O pedido tem uma identidade estável desde o instante em que é criado, antes
   de qualquer rede: é a **chave de idempotência** gerada na entrada da fila
   (ADR-003). É por ela que a tela navega e que a lista reconcilia pendente com
   enviado — sem isso, um pedido criado offline não teria como ser aberto até
   sincronizar.

#### Campos

4. São gravados os campos que o formulário coleta hoje:

   | Campo | Tipo | Obrigatório |
   |---|---|---|
   | Distância da prova | `5 \| 10 \| 21.1 \| 42.2 \| ultra` | sim |
   | Data da prova | texto `AAAA-MM-DD` | sim |
   | Primeira vez nesta distância | booleano | sim (falso por padrão) |
   | Maior corrida recente (km) | número | sim |
   | Dias de treino por semana | `3 \| 4 \| 5 \| 6` | sim |
   | Corridas por semana hoje | inteiro | não |
   | Distância de referência (km) | número | não |
   | Duração de referência | texto `HH:MM:SS` | não |
   | Sessão de força (minutos) | inteiro | não |
   | Acesso a equipamento | `academia_completa \| halteres_casa \| peso_corporal` | não |
   | Dores recorrentes | lista de enum (vazia por padrão) | não |
   | Lesões anteriores | texto livre | não |

   Os obrigatórios são exatamente os quatro que o botão "Gerar plano" já exige
   hoje (`PlanningForm.tsx:53-57`) — esta story **não aperta** a exigência da
   tela; o schema de referência pede mais campos, divergência registrada nas
   notas.

5. **Data da prova**: o corredor digita `dd/mm/aaaa` (ano com 4 dígitos). O app
   valida e converte para `AAAA-MM-DD` antes de enviar; é essa string que vai
   ao banco, como texto. O formato ISO ordena e compara corretamente como
   texto — e é o que a geração vai precisar quando deixar de ser mock.
6. A data da prova precisa estar **no futuro**. Um plano é contado de trás para
   frente a partir dela; data passada produziria um plano sem semanas.
7. A API **revalida** tudo na borda com Guard Clause, e nunca confia só no app:
   a fila offline guarda um payload que pode chegar depois de uma atualização
   do app. Payload inválido devolve **400**.

#### Offline

8. O pedido entra na fila local com chave de idempotência **antes** de qualquer
   rede e é confirmado ao corredor na hora (ADR-003). Gerar plano nunca depende
   de sinal.
9. Um pedido ainda na fila **aparece na lista**, marcado como pendente, e abre
   normalmente com os dados locais. O corredor não fica sem ver o que acabou
   de criar.
10. Quando a fila esvazia, o pedido pendente e o pedido vindo da API são o
    **mesmo** item na lista — reconciliados pela chave de idempotência, sem
    duplicar.
11. Reenviar a mesma chave não cria pedido novo (ADR-003).

#### Leitura da lista

12. A lista mostra os pedidos do corredor, **mais recente primeiro**. Selo
    "Ativo" no mais recente, "Anterior" nos demais; título é a distância da
    prova, subtítulo é "Prova em {data}" — tudo como a STORY-008 já definiu.
    Segue **sem** barra de progresso e sem "semana X de Y".
13. Sem nenhum pedido, a aba mostra a mensagem e o botão "Criar planejamento"
    (STORY-008 mantida).
14. Quando a API não responde, a aba mostra os pendentes da fila e **avisa que
    não conseguiu carregar os já enviados**. Nunca apresenta lista vazia como
    se fosse "você não tem planejamentos" — a mesma distinção entre "não sei" e
    "não há" que o ADR-004 estabeleceu para a avaliação de sobrecarga.

#### Tela do pedido

15. Tocar num card abre aquele pedido. A tela mostra os dados gravados **dele**:
    distância, data da prova, se é a primeira vez na distância, e as respostas
    que o corredor deu.
16. Campo opcional não respondido simplesmente **não aparece** na tela — sem
    "—", sem "não informado".
17. Abaixo dos dados, o conteúdo de treino continua sendo
    `TRAINING_PLAN_DOCUMENT`, **idêntico para todos os pedidos**. A tela não
    insinua que os treinos foram calculados a partir das respostas.

#### Dado sensível

18. "Lesões anteriores" é texto livre onde o corredor descreve lesão — dado de
    saúde sob LGPD (Constituição §3). Nunca aparece em log, em telemetria nem
    em mensagem de erro.

---

### Cenários — Happy Path

```gherkin
Scenario: Gerar um planejamento grava o pedido e ele aparece na lista
  Given que estou autenticado e com conexão
  And não tenho nenhum planejamento
  When preencho o formulário e toco em "Gerar plano"
  Then vejo o documento do plano
  And ao voltar para a aba Planejamento vejo um card com a distância e a data que informei
  And o card está marcado como "Ativo"
```

```gherkin
Scenario: Abrir um card mostra os dados daquele pedido
  Given que criei um planejamento para 42km em 17/05/2027, marcando primeira vez na distância
  When toco no card desse planejamento
  Then vejo "42km (maratona)" e a data da prova
  And vejo que é a primeira vez nessa distância
  And vejo as demais respostas que dei no formulário
```

```gherkin
Scenario: Um segundo planejamento cria entrada nova sem alterar a primeira
  Given que já tenho um planejamento para 21km
  When crio outro planejamento, agora para 42km
  Then a lista mostra dois cards
  And o de 42km está marcado como "Ativo"
  And o de 21km está marcado como "Anterior", com os dados originais intactos
```

```gherkin
Scenario: A lista sobrevive a fechar o app
  Given que criei um planejamento e ele foi enviado ao servidor
  When fecho o app completamente e abro de novo
  Then a aba Planejamento continua mostrando esse planejamento
```

```gherkin
Scenario: Cada corredor vê apenas os seus planejamentos
  Given que outro corredor criou planejamentos na mesma instalação do Steady
  When abro a aba Planejamento na minha conta
  Then vejo apenas os planejamentos que eu criei
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Gerar planejamento sem sinal é aceito na hora
  Given que estou sem conexão
  When preencho o formulário e toco em "Gerar plano"
  Then vejo o documento do plano
  And a aba Planejamento mostra o planejamento marcado como pendente
```

```gherkin
Scenario: Planejamento pendente abre normalmente
  Given que criei um planejamento sem conexão e ele ainda está pendente
  When toco no card dele
  Then vejo os dados que preenchi
```

```gherkin
Scenario: A volta da conexão sincroniza sem duplicar
  Given que tenho um planejamento pendente
  When a conexão volta e a fila é enviada
  Then o aviso de pendente some
  And a lista continua mostrando um único card para esse planejamento
```

```gherkin
Scenario: Campos opcionais em branco geram um pedido válido
  Given que preencho apenas distância, data, maior corrida recente e dias por semana
  When toco em "Gerar plano"
  Then o planejamento é criado
  And ao abri-lo, os campos que deixei em branco não aparecem na tela
```

```gherkin
Scenario: Sem nenhum planejamento, a aba convida a criar
  Given que estou autenticado e nunca criei um planejamento
  When abro a aba Planejamento
  Then vejo a mensagem de que ainda não criei nenhum
  And vejo o botão "Criar planejamento"
```

```gherkin
Scenario: Sem rede, a aba não finge que a lista está vazia
  Given que tenho planejamentos já enviados ao servidor
  And estou sem conexão
  When abro a aba Planejamento
  Then vejo um aviso de que não foi possível carregar os planejamentos
  And não vejo a mensagem de "você ainda não criou nenhum planejamento"
```

---

### Cenários — Error Cases

```gherkin
Scenario: Data em formato inválido bloqueia o envio
  Given que estou no formulário
  When informo a data da prova como "17/05" ou "2027-05-17"
  Then não consigo gerar o plano
  And vejo que a data precisa estar no formato dd/mm/aaaa
```

```gherkin
Scenario: Data que não existe no calendário bloqueia o envio
  Given que estou no formulário
  When informo a data da prova como "31/02/2027"
  Then não consigo gerar o plano
  And vejo que a data é inválida
```

```gherkin
Scenario: Data no passado bloqueia o envio
  Given que estou no formulário
  When informo uma data da prova anterior a hoje
  Then não consigo gerar o plano
  And vejo que a prova precisa ser numa data futura
```

```gherkin
Scenario: A API recusa um pedido inválido sem deixá-lo preso na fila
  Given que um pedido na fila tem conteúdo que a API considera inválido
  When a fila é enviada
  Then a API responde 400
  And o corredor é avisado de que aquele pedido foi recusado
  And o pedido sai da fila, em vez de ser retentado para sempre
```

```gherkin
Scenario: Pedido de outro corredor não é acessível
  Given que existe um planejamento criado por outro corredor
  When peço esse planejamento pelo identificador dele
  Then recebo 404
```

```gherkin
Scenario: Sessão perdida preserva a fila
  Given que tenho um planejamento pendente na fila
  When a renovação do token falha e o app volta ao login
  Then o planejamento pendente continua na fila, intacto
```

---

## Mapping: Cenário → Teste

> Test runners: xUnit para API/Infra (banco real via Testcontainers) e Jest
> para o app (`.sdd/STACK.md`).

| Cenário | Camada | Teste sugerido |
|---------|--------|----------------|
| Gerar grava e aparece na lista | API | `PlanRequestEndpointTests` |
| Abrir um card mostra os dados dele | API + app | `PlanRequestEndpointTests` · `planning/__tests__/planRequestView.test.ts` |
| Segundo pedido não altera o primeiro | API | `PlanRequestEndpointTests` |
| Lista sobrevive a fechar o app | API | coberto por listagem + `🔵 Manual` no aparelho |
| Cada corredor vê só os seus | API | `AuthorizationTests` (mesmo padrão dos outros recursos) |
| Gerar sem sinal é aceito | app | `planning/__tests__/logPlanRequest.test.ts` |
| Pendente abre normalmente | app | `planning/__tests__/planListState.test.ts` |
| Volta da conexão não duplica | app + API | `planListState.test.ts` · `IdempotencyTests` |
| Opcionais em branco | API + app | `PlanRequestEndpointTests` · `planRequestView.test.ts` |
| Lista vazia convida a criar | app | `planListState.test.ts` |
| Sem rede não finge lista vazia | app | `planListState.test.ts` |
| Data inválida / inexistente / passada | app | `planning/__tests__/raceDate.test.ts` |
| API recusa inválido sem prender na fila | API + app | `PlanRequestEndpointTests` · fluxo já coberto por `logRecord` (`rejected`) |
| Pedido de outro corredor → 404 | API | `AuthorizationTests` |
| Sessão perdida preserva a fila | app | já coberto por `logRecord` (`sessionLost`) |
| Treinos idênticos entre pedidos | — | 🔵 Estrutural — `TRAINING_PLAN_DOCUMENT` é constante; não há caminho que a varie |
| Lesões anteriores fora do log | — | 🔵 `/review` — item de checklist (A09/LGPD), não asserção |

---

## Notas de Especificação

- **`preferred_weekdays` fica de fora.** O `MultiChoice` está comentado em
  `PlanningForm.tsx:142`; a coluna nasceria sempre vazia. Entra junto com o
  input, numa migration de uma linha.
- **Divergência conhecida com o schema de referência.**
  `plano-treino-input-schema.md` marca `referenceTime`, `strengthSessionMinutes`
  e `equipment.access` como obrigatórios; o formulário implementado não os
  exige. Esta story segue o formulário — apertar a exigência é decisão de
  produto, e mudaria a UX de quem já usa. Fica registrado para quando a geração
  real precisar desses campos.
- **Rota do documento passa a carregar identificador.** Hoje é
  `router.push('/planning/plan')` sem parâmetro. Forma final (query param,
  rota dinâmica) fica a critério do `/implement`.
- **Fila offline ganha um `RecordKind` novo.** Hoje são `'running' | 'strength'
  | 'pain'` (`sync/types.ts`). O endpoint correspondente entra em
  `ENDPOINT_BY_KIND`.
- **Fora do escopo, explicitamente**: gerar exercícios a partir dos inputs
  (decisão de produto de 2026-08-22 — "vamos focar nos exercícios do plano no
  futuro"); calcular fase, semana atual ou progressão do longão; adaptar o
  split A/B/C/D a um número de dias diferente de 4 (sem fonte reconhecida, e a
  Lei do Domínio #4 exigiria ADR); cruzar o pedido com sessões realmente
  registradas.
- **Chave estrangeira**: o ADR-007 registra que `plan_requests` seria o primeiro
  `REFERENCES corredores(id)` do projeto, e que as três tabelas existentes não
  têm essa constraint. Corrigi-las é item desta story, não efeito colateral.
