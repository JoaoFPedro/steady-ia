# Índice de Decisões

> Consulte antes de propor novas decisões arquiteturais.

## Ativas

| # | Título | Data | Status | Story |
|---|--------|------|--------|-------|
| ADR-000 | Fundação do Steady | 2026-08-09 | Accepted | — |
| ADR-001 | Regra de detecção de sobrecarga combinada (corrida + musculação) | 2026-08-09 | Accepted | STORY-001 |
| ADR-002 | Autenticação via ID token do Google e isolamento de dados por corredor | 2026-08-09 | Accepted | STORY-002 |
| ADR-003 | Chave de idempotência para sincronização offline | 2026-08-15 | Accepted | STORY-003 |
| ADR-004 | Estado de histórico insuficiente no contrato da avaliação de sobrecarga | 2026-08-16 | Accepted | STORY-003 |
| ADR-005 | Destino da fila de registros pendentes ao encerrar a sessão | 2026-08-16 | Accepted | STORY-004 |
| ADR-007 | Persistência do pedido de plano de treino | 2026-08-22 | Accepted | STORY-010 |
| ADR-008 | Roles, vínculo e autorização do personal | 2026-08-24 | Accepted | STORY-013 |
| ADR-009 | Ficha ativa substituível e execução imutável | 2026-08-24 | Accepted | STORY-013 |
| ADR-010 | Ficha com prescrições de corrida por dia | 2026-08-25 | Accepted | STORY-013 |
| ADR-011 | Registro combinado de musculação e corrida | 2026-08-25 | Accepted | STORY-013 |
| ADR-012 | Prescrição de corrida estruturada na ficha do personal | 2026-08-28 | Accepted | STORY-015 |
| ADR-013 | Plano do Steady persistido como fonte de prescrição | 2026-08-28 | Accepted | STORY-016 |
| ADR-014 | Fronteira determinística entre comparação, política e IA | 2026-08-28 | Accepted | STORY-014 |
| ADR-015 | Tolerâncias e políticas de aderência versionadas | 2026-08-28 | Accepted | STORY-014 |
| ADR-016 | Claude API como provedor da explicação da revisão | 2026-08-28 | Accepted | STORY-014 |
| ADR-017 | Cor de erro no Nocturne | 2026-08-29 | Accepted | STORY-017 |
| ADR-018 | Outbox transacional para criação durável da revisão | 2026-08-30 | Accepted | STORY-014 |
| ADR-019 | Identidade histórica estável do exercício | 2026-08-30 | Accepted | STORY-014 |

## Superadas

| # | Título | Superada por | Data |
|---|--------|-------------|------|
| ADR-006 | Interpolação do longão semanal no Plano de Treino mockado | — (escopo corrigido; nenhum ADR novo, ver o próprio ADR-006) | 2026-08-17 |

> Novo ADR? Use `.sdd/templates/adr.md`. Numere: ADR-001, ADR-002...
