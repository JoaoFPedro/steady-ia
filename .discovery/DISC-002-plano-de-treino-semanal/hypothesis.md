# Hipótese — DISC-002: Falta um plano de treino dentro do app

> Referência ao problema: `.discovery/DISC-002-plano-de-treino-semanal/problem.md`

> **Correção de escopo (2026-08-17, durante o `/implement`).** A primeira
> versão desta hipótese (abaixo, "semana atual calculada") respondeu errado à
> pergunta do próprio autor do produto: o pedido original já dizia para usar
> `plano-treino-input-schema.md` para **criar a feature** e que o output
> deveria ser **o arquivo `plano-treino-24-semanas.md` inteiro**. A sessão de
> `/discover` introduziu uma dicotomia falsa (semana atual × referência
> navegável) que não incluía a leitura correta: **formulário com os campos do
> `TrainingPlanRequest` → botão "Gerar plano" → o documento completo do plano
> de referência**, sem geração dinâmica de verdade (isso continua fora de
> escopo — só o formulário existir já é suficiente). O texto original segue
> abaixo, riscado onde a correção se aplica, como registro do que foi mal
> entendido e por quê.

---

## Hipótese

> Acreditamos que **uma aba Planejamento, separada da aba atual (Dashboard),
> ~~mostrando a fase e a semana atuais do plano de 24 semanas e o detalhamento
> dos 4 dias (A/B/C/D) dessa semana — com conteúdo mockado a partir do
> `plano-treino-24-semanas.md`, calculado a partir de uma data de prova fixa
> embutida no mock~~ → **corrigido**: com um formulário (campos do
> `TrainingPlanRequest`) que, ao ser enviado, mostra o **documento inteiro**
> de `plano-treino-24-semanas.md` — todas as fases, os 4 dias, mobilidade,
> regras de ouro, tudo — sempre o mesmo conteúdo, já que geração dinâmica
> continua fora de escopo**
> vai resolver **a ausência de um lugar dentro do app que diga o que treinar
> hoje/nesta semana**
> para **o corredor amador que segue um plano estruturado rumo à sua prova-alvo**,
> e saberemos que funcionou quando **o corredor conseguir gerar e consultar o
> plano dentro do app sem precisar abrir o documento de referência fora dele**.

---

## Suposições críticas

| # | Suposição | Certeza (Alta/Média/Baixa) | Como validar |
|---|-----------|---------------------------|--------------|
| 1 | ~~Uma data de prova-alvo fixa...~~ **Obsoleta pela correção de escopo** — não há mais cálculo de semana/fase; o documento é sempre completo e estático | — | — |
| 2 | Conteúdo estático (sem geração a partir do `TrainingPlanRequest`, sem se adaptar a outro corredor) já entrega valor percebido enquanto corresponder ao plano real em uso | Média — só é verdade enquanto o mock não desalinhar da realidade (mudança de prova, lesão, ajuste) | Observar, nas primeiras semanas de uso, se o corredor volta a abrir a aba antes de cada sessão em vez do documento externo |
| 3 | Apresentar o plano como conteúdo somente-leitura, sem persistir Objetivo de Corrida como entidade, não conflita com a Lei do Domínio #3 nesta fase | Alta — a Lei fala de Plano de Treino como entidade de domínio persistida; um mock de tela não persiste nada | Revisitado no `/spec`: nenhuma escrita em Objetivo/Plano nesta versão |

---

## Maior risco

**Suposição #2** — se o mock não acompanhar a realidade do corredor (prova
muda, plano é ajustado, lesão altera a rota), a aba vira uma segunda fonte
desatualizada **dentro do próprio app**, pior do que não ter a tela: hoje o
corredor sabe que o documento externo é estático; uma tela do app que erra o
que treinar hoje passa confiança falsa.

---

## Escopo mínimo

**Qual é a menor versão que valida ou refuta a hipótese?**

**Dentro do escopo:**
- Navegação por abas no app — hoje é só Stack (`app/_layout.tsx`); a Dashboard
  atual (`index.tsx`) vira uma aba, Planejamento é a segunda.
- Formulário com os campos do `TrainingPlanRequest`
  (`plano-treino-input-schema.md`) — prova-alvo, base atual, disponibilidade,
  equipamento, histórico de saúde — e um botão "Gerar plano".
- Ao gerar: o documento **completo** de `plano-treino-24-semanas.md` —
  princípio central, as 4 fases, a estrutura semanal, o detalhamento de cada
  um dos 4 dias, progressão do longão, mobilidade, regras de ouro e a nota
  sobre ritmos. Nada resumido, nada cortado.
- Conteúdo 100% mockado/hardcoded no app — sem API, sem persistência. O
  formulário não alimenta o documento (nenhuma geração de verdade); existe
  para a experiência ser honesta sobre o fluxo real.

**Fora do escopo (explicitamente):**
- Geração dinâmica de verdade — usar os valores do formulário para calcular
  um plano diferente do documento de referência. O formulário existe; o
  cálculo, não. Fica para um discovery futuro, só se esta hipótese validar.
- Persistir Objetivo de Corrida como entidade de domínio (Lei do Domínio #3) —
  os campos do formulário não são salvos em lugar nenhum.
- Adaptar a estrutura A/B/C/D para `trainingDaysPerWeek` diferente de 4 —
  ponto em aberto herdado do input-schema, não resolvido aqui (o campo existe
  no formulário, mas não muda o documento gerado).
- Cruzar o plano com o registro real de sessões (ex.: marcar dia como
  concluído, avisar atraso) — a tela é só leitura por ora.
- Prescrição de exercícios de musculação além do que já está no plano de
  referência (séries/cargas específicas por corredor) — o DISC-001 excluiu
  isso do produto; aqui ele reaparece só como **conteúdo estático copiado da
  fonte já existente**, não como regra nova gerada pelo sistema. Nenhuma nova
  fonte de fisiologia entra além da já registrada em `referencias/`.

---

## Métricas de validação

| Métrica | Baseline atual | Meta para considerar válido |
|---------|---------------|----------------------------|
| Consulta ao documento externo antes de treinar | 100% das vezes (única fonte hoje) | Corredor passa a abrir a aba Planejamento em vez do documento, de forma consistente, nas primeiras semanas de uso |

---

## Impacto mapeado (opcional)

```
Meta: Corredor amador completa sua primeira maratona sem interrupção por lesão
├── Corredor que segue um plano estruturado de 24 semanas
│   ├── Impacto: Sabe o que treinar a cada sessão sem sair do app
│   │   └── Entregável: Aba Planejamento com fase/semana atual e detalhe dos 4 dias
│   └── Impacto: Planejamento e registro passam a viver no mesmo lugar
│       └── Entregável: Base para, no futuro, cruzar o que foi planejado com o que foi registrado
```
