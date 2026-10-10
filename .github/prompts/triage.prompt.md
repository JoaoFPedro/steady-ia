---
description: Discovery — problema → hipótese → decisão. Não produz código, produz clareza sobre o problema.
agent: ask
model: Claude Opus 4.7
argument-hint: descrição opcional do problema
---

<!-- GERADO por tools/build.py — edite a fonte em kit/, não este arquivo -->

# /triage — Discovery (Produto & Design)

Sessão de discovery com Produto & Design — entende o problema antes de definir a solução.

> Este comando é para **Produto & Design**, antes do `/shape`.
> Discovery não produz código, não produz BDD — produz **clareza sobre o problema**.
> O output alimenta o `/shape` quando a decisão for "Construir".
> Se não há problema claro, não há spec. Se não há spec, não há implementação.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- [.sdd/memory/PROJECT.md](../../.sdd/memory/PROJECT.md) — contexto e glossário do projeto
- [.sdd/memory/DOMAIN.md](../../.sdd/memory/DOMAIN.md) — entidades e fluxos existentes
- `.discovery/` — discoveries anteriores (padrões e aprendizados)

Se `.sdd/PROJECT-CONSTITUTION.md` ou `.sdd/memory/PROJECT.md` estiverem ausentes, peça `/init` (projeto novo) ou `/onboard` (projeto existente) antes de prosseguir.

---

## Fase 1 — Problema

Conduza uma conversa para entender o problema. Faça **uma pergunta por vez**.

1. **Quem tem o problema?** — Qual persona específica sente essa dor? Seja preciso: não "usuários", mas "gestor financeiro que aprova faturas acima de R$10k".
2. **Qual é o problema hoje?** — Descreva a situação atual. O que acontece? O que falha? O que é lento ou frustrante?
3. **Por que importa agora?** — Qual é o impacto do problema? Financeiro, operacional, de experiência? Por que resolver isso agora e não depois?
4. **Como está sendo resolvido hoje?** — Workarounds? Planilhas? Processos manuais? Outro sistema? Entender as alternativas revela o tamanho real do problema.

Capture em `.discovery/{DISC-ID}/problem.md` usando o template em `.sdd/templates/discovery/problem.md`.

**PARE**: "O problema está claro o suficiente para formular uma hipótese?"

---

## Fase 2 — Hipótese

Formalize o que acreditamos que resolve o problema:

```
Acreditamos que [funcionalidade/mudança]
vai resolver [problema específico]
para [persona]
e saberemos que funcionou quando [métrica observável].
```

Depois:
- **Suposições críticas**: o que precisa ser verdade para isso funcionar? Liste as 3 principais.
- **Maior risco**: qual suposição, se falsa, invalida toda a hipótese?
- **Escopo mínimo**: qual é a menor versão que valida ou refuta a hipótese?

Capture em `.discovery/{DISC-ID}/hypothesis.md` usando o template em `.sdd/templates/discovery/hypothesis.md`.

**PARE**: "A hipótese está clara? Quais suposições precisam ser validadas antes de construir?"

---

## Fase 3 — Decisão

Com base no problema e na hipótese, o PD decide:

| Decisão | Quando usar | Próximo passo |
|---------|-------------|---------------|
| **Construir** | Hipótese clara, suposições aceitáveis, prioridade confirmada | `/shape` cria story + BDD linkando a este discovery |
| **Validar primeiro** | Suposição crítica incerta — precisa de pesquisa ou experimento | Registra o experimento; volta quando tiver dados |
| **Diferir** | Válido, mas não agora — falta capacidade ou dependência | Registra condição de revisão |
| **Descartar** | Problema não é real, hipótese refutada, ou fora do escopo | Registra motivo — útil para não repetir a discussão |

Capture em `.discovery/{DISC-ID}/decision.md`.

Se **Construir**: crie `specs/{story-id}/story.md` com referência ao discovery:
```
Discovery: .discovery/{DISC-ID}/
```

---

## Output

Crie a pasta `.discovery/{DISC-ID}/` usando os templates em `.sdd/templates/discovery/`:

```
.discovery/{DISC-ID}/          ← naming: DISC-{NNN}-{slug-descritivo}
├── problem.md                 ← baseado em .sdd/templates/discovery/problem.md
├── hypothesis.md              ← baseado em .sdd/templates/discovery/hypothesis.md
└── decision.md                ← baseado em .sdd/templates/discovery/decision.md
```

Após criar, atualize a tabela de índice em `.discovery/README.md`.

> **Discovery é contínuo.** Cada sessão gera uma nova subpasta. O `.discovery/` cresce com o projeto — é memória institucional do espaço do problema, não uma fase que termina.

---

## Regras

- Não pule para a solução. Se alguém vier com uma solução, pergunte: "Qual problema isso resolve?"
- Uma descoberta por DISC-ID. Não misture problemas diferentes.
- O discovery é válido mesmo que a decisão seja Descartar — o conhecimento fica registrado.
- Decisão "Construir" sem hipótese clara é sinal de que o discovery não terminou.
