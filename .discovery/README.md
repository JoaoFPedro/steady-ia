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
