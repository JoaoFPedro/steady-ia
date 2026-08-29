# Discovery

> Pasta viva de exploração contínua. Cada subpasta é um discovery independente.
> Discovery é contínuo — novos itens entram à medida que o produto evolui.
> Use `/discover` no seu assistente de IA para conduzir e registrar uma sessão.

---

## Como funciona

```
.discovery/
└── {DISC-ID}-{slug}/
    ├── problem.md      → persona, problema, impacto, evidências
    ├── hypothesis.md   → hipótese estruturada + suposições + métricas
    └── decision.md     → Construir / Validar / Diferir / Descartar
```

**Naming convention**: `DISC-{NNN}-{slug-descritivo}`
Exemplos: `DISC-001-login-social`, `DISC-002-notificacoes-push`, `DISC-003-relatorio-financeiro`

### `referencias/`

Material de apoio que ainda não pertence a nenhum discovery — fontes de treino,
estudos, planos de referência. Fica aqui até um `/discover` consumi-lo.

A Lei do Domínio #4 exige que toda regra de progressão implementada seja
rastreável a uma fonte reconhecida. É desta pasta que essas fontes saem: sem
elas, a regra vira julgamento ad-hoc de quem escreve o código.

---

## Status de um discovery

| Status | Definição |
|--------|-----------|
| **Em progresso** | `decision.md` ausente ou decisão não marcada |
| **Construir** | Decisão tomada → story em `specs/` criada |
| **Validar** | Experimento em andamento antes de construir |
| **Diferido** | Válido, mas não agora — condição de revisão registrada |
| **Descartado** | Fora do escopo ou hipótese refutada |

---

## Visualizar status

```bash
./sdd discover
```

---

## Ciclo de vida

```
Problema identificado
  ↓
/discover → .discovery/{DISC-ID}/
  ↓
Decisão = Construir
  ↓
/spec → specs/{story-id}/  (referencia este discovery)
  ↓
/implement → src/ + tests/
```

Discovery não é uma fase que termina. Novos discoveries entram continuamente,
independente de onde o time está na implementação de outros itens.

---

## Índice

<!-- Atualize esta tabela à medida que novos discoveries são criados -->

| ID | Título | Status | Story |
|----|--------|--------|-------|
| DISC-001 | Combinar musculação e corrida sem prejudicar performance | Construir | STORY-001 |
| DISC-002 | Falta um plano de treino dentro do app | Construir | STORY-006 |
| DISC-003 | O plano e o registro não se encontram | Construir | STORY-012 |
| DISC-004 | O personal não recebe a carga realmente executada | Construir | STORY-013 |
| DISC-005 | Revisão de aderência após o treino | Construir | STORY-014 |
| DISC-006 | A prescrição de corrida não é mensurável | Construir | STORY-015 |
| DISC-007 | O plano existe na tela, não no Steady | Construir | STORY-016 |
