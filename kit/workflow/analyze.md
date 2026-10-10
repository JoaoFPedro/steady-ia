---
name: analyze
title: Análise estratégica
role: Engineer & QA
description: Análise estratégica do código antes de implementar — riscos, edge cases, direção.
model: strategy
agent: agent
argument-hint: story-id ou descrição da feature
instructions: []
---

Analise o código existente e produza contexto estratégico antes de implementar.

> Use antes de `/feature` ou `/build` quando a mudança toca áreas do código que você não domina,
> ou quando a feature é complexa o suficiente para merecer uma análise prévia.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- `.sdd/STACK.md` — stack e convenções
- `.sdd/memory/PROJECT.md` — contexto do projeto
- `.sdd/memory/DOMAIN.md` — entidades e fluxos
- `.sdd/memory/DECISIONS.md` — ADRs existentes
- `docs/documenta-ai/INDEX.md` — se a área já foi documentada, o DevDocs correspondente
- O código-fonte relevante à feature

---

## O que fazer

A partir da descrição da feature, execute:

### 1. Scan de código relevante

Identifique no código existente:
- Quais módulos, classes e funções são afetados
- Quais dependências estão envolvidas
- Quais padrões estão em uso na área (Repository? Service layer? Middleware?)

Não leia o projeto inteiro. Extraia palavras-chave da feature e use para navegar até o código relevante.

**Antes de abrir o código, cheque `docs/documenta-ai/INDEX.md`.** Se existe DevDocs para o controller ou módulo afetado, leia-o primeiro: o fluxo entre camadas, as dependências injetadas e as estruturas de entrada/saída já estão mapeados. Custa uma fração do contexto de ler os arquivos de todas as camadas. Confirme no frontmatter do doc que `commit:` bate com `git log -1 --format=%H -- {source}` — se divergir, o doc está velho e o código é a verdade.

Se a área é crítica e não está documentada, sugira `/documenta-ai {Controller}` antes de seguir.

### 2. Análise de domínio

Documente:
- **Conceitos existentes**: entidades e regras que já estão no código
- **Conceitos novos**: o que a feature introduz que ainda não existe
- **Regras de negócio**: lógica que governa a feature (explícita ou implícita no código)

### 3. Direção estratégica

Proponha:
- **Abordagem**: como resolver (novo módulo? Extensão de existente? Refactor primeiro?)
- **Padrão de design**: qual pattern se encaixa (Strategy? Repository? Facade?)
- **Fronteiras**: o que está dentro do escopo e o que está fora

### 4. Riscos e edge cases

Identifique:
- **Riscos técnicos**: performance, concorrência, breaking changes
- **Edge cases**: cenários de borda que a descrição não menciona mas o código revela
- **Ambiguidades**: pontos onde a feature não é clara o suficiente

---

## Output

Salve como `specs/{story-id}/analysis.md` com as quatro seções acima.

**PARE e apresente:**
- Resumo da análise
- Riscos encontrados
- Direção proposta
- Pergunte: "Análise OK? Posso avançar para spec/implementação?"

---

## Quando usar

- Feature toca 3+ módulos
- Área do código que você não escreveu
- Feature envolve integração com sistema externo
- Mudança pode ter efeitos colaterais
- Você quer entender antes de planejar

## Quando NÃO usar

- Feature é simples e isolada (1 módulo, sem dependências)
- Você já domina a área — vá direto para `/feature` ou `/shape`
