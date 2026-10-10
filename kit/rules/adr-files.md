---
name: adr-files
title: ADRs — Architecture Decision Records
description: Regras de ADR ao trabalhar em docs/adr/
applies: docs/adr/**
---

Você está em `docs/adr/`. Cada arquivo documenta uma decisão arquitetural.

## Nomenclatura

`ADR-{NNN}-{titulo-em-kebab}.md` — ex: `ADR-001-escolha-do-banco.md`

## Template obrigatório

Use `.sdd/templates/adr.md`. Seções: Contexto, Opções, Decisão, Consequências.

## Quando criar

- Mudança de tecnologia ou dependência
- Decisão de estrutura, padrão ou arquitetura
- Integração com serviço externo
- Qualquer decisão que afete múltiplos módulos

## Após criar

Atualize `.sdd/memory/DECISIONS.md` com o novo ADR.

## Status válidos

`Proposed` → `Accepted` → `Deprecated` → `Superseded by ADR-{NNN}`
