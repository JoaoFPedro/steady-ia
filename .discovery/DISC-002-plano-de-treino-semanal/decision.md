# Decisão — DISC-002: Falta um plano de treino dentro do app

> Data: 2026-08-17
> Decidido por: Jefferson
> Referências: `.discovery/DISC-002-plano-de-treino-semanal/problem.md` · `.discovery/DISC-002-plano-de-treino-semanal/hypothesis.md`

---

## Decisão

- [x] **Construir** → Story criada em `specs/STORY-006/`
- [ ] **Validar primeiro** → Experimento / pesquisa necessária antes de construir
- [ ] **Diferir** → Válido, mas não agora
- [ ] **Descartar** → Fora do escopo, problema não confirmado ou hipótese refutada

---

## Rationale

**Por que esta decisão?**

Mesmo dogfooding do DISC-001: o problema é vivido diretamente por quem decide.
O material de referência (`plano-treino-24-semanas.md`) já existe e já é a
fonte que o corredor pretende seguir — não há pesquisa de conteúdo a fazer, só
uma decisão de superfície (colocar dentro do app) e de escopo (mock primeiro,
geração depois). O escopo mínimo é pequeno: não introduz nenhuma regra nova de
domínio, não persiste nada, e a suposição de maior risco (o mock desalinhar da
realidade) é aceitável para um MVP solo — o próprio corredor é quem perceberia
o desalinhamento primeiro.

---

## Se Construir

**Story criada:** `specs/STORY-006/`

**Escopo acordado:**
- Aba Planejamento, ao lado da Dashboard atual — introduz navegação por abas.
- Fase, semana atual e detalhamento dos 4 dias (A/B/C/D), calculados a partir
  de uma data de prova fixa embutida no código.
- Conteúdo mockado/hardcoded a partir de `plano-treino-24-semanas.md`.

**O que fica fora desta versão:**
- Geração dinâmica a partir do `plano-treino-input-schema.md`.
- Objetivo de Corrida como entidade de domínio persistida.
- Adaptação da estrutura A/B/C/D para outro número de dias de treino.
- Qualquer cruzamento com o registro real de sessões.

---

## Adendo de escopo (2026-08-21)

STORY-006 entregou a aba Planejamento, mas o único caminho até ela é a tab
bar — a Dashboard não menciona que ela existe. Pedido do produto: um card na
Dashboard, seguindo o modelo visual já desenhado em `tela.html` (artboard 3a,
bloco "Plano da semana" — Kicker, título, texto mudo, botão), que leva para
`/planning`. Não é problema novo: mesma persona, mesmo objetivo (achar o que
treinar sem sair do fluxo), só um segundo ponto de entrada para o que já foi
construído. Tratado como adição de escopo ao `STORY-006` — sem `problem.md`/
`hypothesis.md` próprios. Conteúdo do card é estático (sem semana/fase
calculada, que segue fora de escopo do DISC-002) — mesma honestidade do
formulário, que já não promete cálculo nenhum.

## Aprendizados

- O material de `.discovery/referencias/` estava pronto havia tempo, esperando
  exatamente esta decisão — o schema de input (`plano-treino-input-schema.md`)
  já antecipava a pergunta "vira feature ou fica só como ferramenta pessoal?"
  e este discovery responde: vira feature, começando pelo caso mais estreito
  possível (mock, sem geração).
- A exclusão de "prescrição detalhada de exercícios de musculação" do DISC-001
  não está sendo revertida como regra de sistema — está sendo tratada como
  **conteúdo estático de uma fonte já vetada**, o que não aciona a exigência de
  ADR da Lei do Domínio #4 (essa exigência é para regras de progressão
  *implementadas*, isto é, calculadas pelo sistema). Se um dia a geração
  dinâmica entrar em escopo, a Lei do Domínio #4 volta a valer e um ADR será
  necessário ali.
