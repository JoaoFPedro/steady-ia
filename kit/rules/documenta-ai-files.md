---
name: documenta-ai-files
title: Documenta-ai — localização e rastreabilidade
description: Regras de localização, frontmatter e ciclo de vida dos documentos gerados pelo /documenta-ai
applies: docs/documenta-ai/**
---

Você está em `docs/documenta-ai/`. Estes arquivos são **documentação contínua do produto**: registram o comportamento entregue em projetos novos e existentes e acompanham suas alterações.

```
docs/documenta-ai/
├── INDEX.md                                   # rastreio: alvo -> docs -> commit -> story
├── dev/{Controller}-{Regiao}-DevDocs.md       # devs
├── business/{Nome-Amigavel}-{Regiao}-Rules.md # produto e stakeholders
└── debts/{Controller}-{Regiao}-Debts.md       # tech leads e arquitetos
```

## Frontmatter obrigatório

Todo arquivo aqui abre com:

```yaml
---
source: src/Controllers/PedidoController.cs
commit: <sha completo de git log -1 --format=%H -- {source}, ou - se ainda não houver commit>
generated: YYYY-MM-DD
layers: Controller -> Business -> Repository -> Utils
story: STORY-NNN
---
```

O `session-healthcheck` compara `commit:` com o SHA atual do `source`. Divergiu, o doc está velho. SHA igual não garante atualização quando há mudanças não commitadas ou em outras camadas; confira também o código atual. Editar o conteúdo sem atualizar o frontmatter quebra o sensor.

## Regras

- Gere e atualize por `/documenta-ai` — edição manual é permitida, mas atualize `generated:` e `commit:`.
- Crie a documentação após a primeira implementação do módulo; em projeto existente, crie uma linha de base no onboarding. Atualize os documentos afetados após cada mudança de comportamento.
- Nunca escreva em `DocumentAIReadme/`; a saída canônica é `docs/documenta-ai/`.
- Documente o que o código faz, não o que deveria fazer.
- Sigla desconhecida vira `[Sigla não definida no contexto - verificar com a equipe]` e uma pendência no glossário de `.sdd/memory/PROJECT.md` — nunca um palpite.
- A Matriz de Cenários do `*-Rules.md` é a entrada do `/shape`. Cada linha vira um `Scenario:` Gherkin.
- A seção 4 do `*-Debts.md` é backlog real: 🔴 vira discovery, 🟡 vira story em `specs/`.
- Débito de segurança leva `**Categoria**: OWASP A0N` para o `/check` não reportar duas vezes.
- Estes documentos não substituem `spec.bdd.md` nem ADR — são insumo, não contrato.
