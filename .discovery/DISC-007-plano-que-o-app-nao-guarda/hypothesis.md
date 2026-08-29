# Hipótese — DISC-007: O plano existe na tela, não no Steady

> Referência ao problema: `.discovery/DISC-007-plano-que-o-app-nao-guarda/problem.md`

---

## Hipótese

> Acreditamos que **persistir o plano no servidor como documento versionado e
> imutável associado a cada corredor, transcrevendo literalmente o conteúdo
> atual**
> vai resolver **a ausência de prescrição processável para o corredor sem
> personal**
> para **todos os corredores do Steady**,
> e saberemos que funcionou quando **o corredor ler exatamente o mesmo plano de
> antes, agora vindo da API, e o servidor conseguir responder o que estava
> prescrito para uma data sem depender do aplicativo**.

---

## Suposições críticas

| # | Suposição | Certeza | Como validar |
|---|-----------|---------|--------------|
| 1 | Transcrever o documento não deriva nenhum número novo — o seed é fiel à fonte. | Média | Teste de equivalência campo a campo com `TRAINING_PLAN_DOCUMENT` e teste que falha se algum campo numérico for função de outros dois. |
| 2 | O texto-fonte sustenta campos numéricos suficientes para o plano ser comparável em algum dia. | Baixa | Contar quantos dias de corrida recebem faixa de distância ou esforço a partir apenas do que a fonte declara. |
| 3 | Trocar a constante local pela API não degrada a experiência offline atual. | Média | Abrir Planejamento sem conexão após primeira leitura; comparar com o comportamento de hoje. |
| 4 | Versionar agora evita retrabalho quando a geração do plano voltar. | Média | Revisar o contrato quando a geração for especificada. |

---

## Maior risco

**Suposição #1.** É o risco da ADR-006, que foi superada minutos depois de
aceita por interpolar a distância do longão entre marcos que a fonte declarava
apenas por fase. Ali o número interpolado era exibido; aqui ele seria
prescrição comparável, base de recomendação de carga. Um número inventado com
aparência de prescrição é pior que um número inventado com aparência de texto.

A mitigação não é cuidado: é um teste que falha se qualquer campo numérico do
seed puder ser derivado de outros dois.

---

## Escopo mínimo

**Dentro do escopo:**

- `SteadyTrainingPlan` versionado e imutável, com associação corredor → versão.
- Seed transcrevendo o documento atual, campo a campo.
- Campos numéricos apenas onde o texto-fonte os declara; o restante ausente.
- Dias de corrida usando a mesma prescrição estruturada da ficha (DISC-006).
- Leitura pela API, com cache offline e estado de falha distinto de vazio.

**Fora do escopo:**

- Gerar o plano a partir do `PlanRequest`.
- Personalizar conteúdo por corredor.
- Calcular progressão, volume semanal ou longão por semana.
- Editar o plano pelo aplicativo.
- Comparar execução com o plano (DISC-005 / STORY-014).

---

## Métricas de validação

| Métrica | Baseline atual | Meta inicial |
|---------|---------------|--------------|
| Diferença entre o plano lido antes e depois da migração | — | Zero campo divergente |
| Campos numéricos derivados por cálculo no seed | — | Zero, verificado por teste |
| Dias de corrida do plano com ao menos um campo comparável | 0 | Registrar o número real; sem meta, é medida da fonte |
| Falhas de leitura exibidas como plano vazio | — | Zero |
