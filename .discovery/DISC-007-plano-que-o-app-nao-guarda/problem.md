# Problema — DISC-007: O plano existe na tela, não no Steady

> Criado em: 2026-08-28
> Facilitado por: Claude
> Recorte de: `.discovery/DISC-005-revisao-de-aderencia-pos-treino/`

---

## Persona

Corredor que segue o plano do Steady **sem personal vinculado** — a maioria dos
usuários do piloto, já que o vínculo com personal é opcional e recente.

---

## Situação atual

O corredor abre a aba Planejamento e lê o plano de 24 semanas: fases, split
semanal, exercícios por dia, progressão do longão, regras de ouro. Ele registra
seus treinos normalmente e a Dashboard mostra o avanço.

Esse plano é uma constante TypeScript dentro do aplicativo
(`src/steady-app/src/planning/trainingPlanDocument.ts`). O servidor não o
conhece. `PlanRequest` guarda o formulário que o corredor respondeu, nunca um
plano — `DOMAIN.md` registra "Plano de Treino (gerado): não implementado".

---

## Problema

O plano é a única coisa que o Steady prescreve ao corredor sem personal, e é a
única que o Steady não guarda. Ele existe no bundle do aplicativo, igual para
todos, sem versão, sem dono e fora do alcance de qualquer processamento.

A consequência prática: tudo que o produto queira construir sobre "o que foi
prescrito" funciona para quem tem personal e não funciona para quem não tem —
invertendo a prioridade, já que o corredor sem personal é o caso majoritário.

A consequência estrutural: quando a geração do plano voltar à pauta, ela não
terá onde escrever o resultado.

---

## Impacto

| Dimensão | Impacto |
|----------|---------|
| Frequência | Permanente — é o estado do plano desde a STORY-006 |
| Afetados | Todo corredor sem personal vinculado |
| Custo | Qualquer feature apoiada na prescrição nasce excluindo a maioria dos usuários; o pedido de plano é persistido e o plano não, o que torna o `PlanRequest` um dado sem destino |

---

## Alternativas atuais

| Alternativa | Limitação |
|-------------|-----------|
| O aplicativo enviar a prescrição junto de cada registro | A prescrição passa a vir do cliente e pode ser alterada; viola FF-004 e destrói a reprodutibilidade |
| Duplicar o documento no servidor sem versão | Uma correção de texto reescreveria o passado de todo mundo |
| Só atender corredores com personal | Inverte a prioridade do produto |

---

## Evidências

- `trainingPlanDocument.ts` — o plano inteiro, literal, no aplicativo.
- ADR-007 — o pedido é persistido; a geração ficou fora de escopo.
- Decisão de produto de 2026-08-22: geração de plano adiada.
- DISC-005 exige que a revisão considere plano e ficha, e a comparação roda no
  servidor.

---

## Perguntas em aberto

- [x] Persistir o plano equivale a reabrir a geração adiada? → Não. Transcrever
  um documento existente não é derivá-lo de um `PlanRequest`.
- [x] O conteúdo deve ser personalizado por corredor? → Não nesta rodada; a
  estrutura passa a suportar, o conteúdo continua único.
- [ ] Quando a geração voltar, o formato transcrito aguenta o resultado dela?
