# Hipótese — DISC-003: O plano e o registro não se encontram

> Referência ao problema: `.discovery/DISC-003-do-treino-do-dia-ao-registro/problem.md`

---

## Hipótese

> Acreditamos que **um caminho direto do treino de hoje até o registro dele — o
> card da Dashboard abrindo o planejamento já na aba Semana com o dia de hoje
> expandido, e um botão nesse dia que leva ao formulário de registro já sabendo
> qual treino era — somado a uma leitura de "dia cumprido" derivada dos
> registros que já existem**
> vai resolver **o fato de o caminho entre o que o plano mandou e o que foi
> feito passar por fora do app, pela memória do corredor**
> para **o corredor amador que segue o plano de 24 semanas rumo à sua prova**,
> e saberemos que funcionou quando **ele registrar o treino direto do dia
> aberto, sem voltar à Dashboard, e a % de avanço do plano subir sozinha a
> partir desses registros — sem nenhum gesto extra de "marcar como feito"**.

**A decisão que dá forma a tudo:** o dia **não é carimbado, é derivado**. Não
existe um botão "concluí" que grava um fato novo. O botão leva ao registro que
já existe, e o dia se fecha porque os registros daquela data satisfazem o que o
plano pedia. Isso elimina uma entidade, elimina dupla entrada e não toca na Lei
do Domínio #2 — `RunningSession` e `StrengthSession` já são imutáveis, e uma
leitura derivada delas herda a imutabilidade de graça.

---

## Suposições críticas

| # | Suposição | Certeza | Como validar |
|---|-----------|---------|--------------|
| 1 | O denominador da % pode ser definido de um jeito que não minta para quem entra no plano no meio | **Baixa** | Escolher a regra no `/spec` e conferir a conta contra os dois casos extremos: plano gerado a 24 semanas da prova e a 6 semanas. Ver *Maior risco* |
| 2 | Exigir **todas** as modalidades do dia para fechá-lo produz uma % que motiva em vez de desanimar | **Baixa** | Uso real: se depois de 3 semanas a % estiver muito abaixo da percepção do corredor sobre o próprio esforço, a regra está errada |
| 3 | Data + dia da semana bastam para saber o que o plano pedia — sem entidade nova, sem plano persistido por dia | Média-Alta | A grade (`weekPlan`) é fixa e igual para todos. Verdade hoje; deixa de ser quando a geração dinâmica chegar |
| 4 | O corredor treina na grade que o plano define (corre terça/quinta/sábado, não domingo) | Média | Observar quantos registros caem em dias que o plano não previa. Muitos = a derivação está descartando esforço real |
| 5 | Pré-preencher o formulário com o treino do dia não muda nada no domínio — continua o mesmo `RunningSession`/`StrengthSession` | Alta | Revisitado no `/spec`: nenhuma coluna nova nas tabelas de sessão |

---

## Maior risco

**Suposição #1, agravada pela #2.**

`src/planning/trainingProgress.ts` conta o plano **de trás para frente a partir
da data da prova** — é o modelo que a STORY-011 já implementou e o único que faz
o taper cair nas 4 semanas certas. A consequência: quem gera o plano a 10
semanas da prova entra direto na semana 15 de 24. As 84 diárias das semanas 1–14
nunca existiram para essa pessoa.

Com denominador fixo em 144 dias (24 semanas × 6 dias com treino), esse corredor
**termina o plano inteiro exibindo ~42%**. A tela diria que ele percorreu menos
da metade no dia em que cruza a linha de chegada.

E a suposição #2 puxa na mesma direção: exigir as duas modalidades num dia
combinado significa que terça e quinta só contam inteiras. Um corredor que faz
toda a musculação e metade das corridas vê uma % bem menor do que a sua noção de
esforço — e uma barra de progresso que não sobe é pior do que barra nenhuma.

As duas juntas produzem exatamente o fracasso que o DISC-002 já nomeou: uma tela
dentro do app que passa **confiança falsa**, pior do que não existir.

> Isto **não bloqueia a construção** — bloqueia a conta. O caminho curto
> (Dashboard → dia de hoje aberto → registrar) entrega valor sozinho, hoje,
> independente de qualquer porcentagem. O `/spec` precisa fechar a regra do
> denominador antes de escrever o cenário da %.

---

## Escopo mínimo

**Dentro do escopo:**

- O botão do card *Plano da semana* passa a abrir o planejamento mais recente
  **na aba Semana, com o dia de hoje já expandido** (hoje cai em Dados, tudo
  fechado).
- No dia expandido, botão(ões) que levam ao formulário de registro **já cientes
  do treino do dia** — `/log/strength` nos dias de musculação, `/log/run` nos de
  corrida, os dois nos dias combinados.
- **Dia cumprido derivado**: para cada data, a grade diz quais modalidades eram
  previstas; o dia fecha quando **todas** têm registro naquela data. Sem tabela
  nova, sem carimbo, sem gesto extra.
- Marca visual de cumprido / parcial / não feito no detalhamento dos dias.
- **% de avanço** — dias cumpridos sobre dias previstos — calculada **na API**
  (FF-004: o app exibe, nunca calcula) e exibida na Dashboard.

**Fora do escopo (explicitamente):**

| Item | Razão |
|------|-------|
| Carga e séries por exercício (`Agachamento 4x6–10 → 80kg ✓`) | Foi o pedido original e continua sendo um desejo real — mas é **outro problema** (progressão de força), com outra persona-momento (durante o treino, não depois) e entidade própria. Diferido por decisão de produto nesta sessão. Merece o seu próprio discovery |
| Check por exercício / estado ao vivo durante o treino | Mesma razão. E colidiria de frente com a Lei do Domínio #2 — estado mutável em progresso é coisa que o domínio hoje não admite |
| Desmarcar um dia; marcar dias retroativos | Decisão desta sessão: imutável e só pra frente. Como a conclusão é derivada de registros imutáveis, isso sai de graça |
| **Aderência** (% que começa em 100 e cai) | Escolhido **avanço**, não aderência. São contas e mensagens diferentes; aderência pode voltar como story própria |
| Casar `MuscleGroup` registrado com o grupo que o plano pedia | Registrado como pergunta aberta no `problem.md`. Começar tolerante é mais barato e menos punitivo |
| Geração dinâmica do plano a partir do `PlanRequest` | Segue fora de escopo desde o DISC-002; decisão de produto reafirmada em 2026-08-22 |

---

## Métricas de validação

| Métrica | Baseline atual | Meta para considerar válido |
|---------|---------------|----------------------------|
| Toques da Dashboard até o formulário de registro **com os exercícios do dia já vistos** | 5 toques + 1 rolagem, e o formulário abre em branco | 2 toques, formulário ciente do treino |
| Dias de treino com registro, por semana | Não mensurável hoje — registro é avulso, sem vínculo com o plano | ≥ 5 dos 6 dias previstos |
| "Quanto do plano eu já cumpri?" | Impossível responder dentro do app | Visível na Dashboard, sem gesto extra do corredor |
| Registros que caem fora da grade do plano (sinal da suposição #4) | Não mensurável hoje | Se for alto, a regra de derivação está descartando esforço real |

---

## Impacto mapeado

```
Meta: o corredor chega à prova tendo cumprido o plano — e sabendo que cumpriu
└── Corredor amador seguindo as 24 semanas
    ├── Impacto: registra o treino porque registrar ficou barato
    │   └── Entregável: card → dia de hoje aberto → registro pré-ciente
    ├── Impacto: enxerga o plano avançando sem fazer nada além de treinar
    │   └── Entregável: dia cumprido derivado + % de avanço calculada na API
    └── Impacto: alimenta a detecção de sobrecarga sem esforço adicional
        └── Entregável: o mesmo registro de sempre — só que fácil de chegar
```
