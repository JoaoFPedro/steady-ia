---
name: sdd-analyze
description: Analisa código e domínio para produzir direção estratégica, riscos e plano antes de uma feature ou implementação complexa. Use quando o usuário pedir /analyze, análise prévia ou investigação de impacto sem implementar.
---
## /analyze

Analise o código existente e produza contexto estratégico antes de implementar.

> Use antes de `/feature` ou `/implement` quando a mudança toca áreas do código que você não domina,
> ou quando a feature é complexa o suficiente para merecer uma análise prévia.

### Contexto

1. `.sdd/STACK.md` — stack e convenções
2. `.sdd/memory/PROJECT.md` — contexto do projeto
3. `.sdd/memory/DOMAIN.md` — entidades e fluxos
4. `.sdd/memory/DECISIONS.md` — ADRs existentes
5. O código-fonte relevante à feature

### O que fazer

A partir da descrição da feature, execute:

#### 1. Scan de código relevante

Identifique no código existente:
- Quais módulos, classes e funções são afetados
- Quais dependências estão envolvidas
- Quais padrões estão em uso na área (Repository? Service layer? Middleware?)

Não leia o projeto inteiro. Extraia palavras-chave da feature e use para navegar até o código relevante.

#### 2. Análise de domínio

Documente:
- **Conceitos existentes**: entidades e regras que já estão no código
- **Conceitos novos**: o que a feature introduz que ainda não existe
- **Regras de negócio**: lógica que governa a feature (explícita ou implícita no código)

#### 3. Direção estratégica

Proponha:
- **Abordagem**: como resolver (novo módulo? Extensão de existente? Refactor primeiro?)
- **Padrão de design**: qual pattern se encaixa (Strategy? Repository? Facade?)
- **Fronteiras**: o que está dentro do escopo e o que está fora

#### 4. Riscos e edge cases

Identifique:
- **Riscos técnicos**: performance, concorrência, breaking changes
- **Edge cases**: cenários de borda que a descrição não menciona mas o código revela
- **Ambiguidades**: pontos onde a feature não é clara o suficiente

### Output

Salve como `specs/{story-id}/analysis.md` com as quatro seções acima.

**PARE e apresente:**
- Resumo da análise
- Riscos encontrados
- Direção proposta
- Pergunte: "Análise OK? Posso avançar para spec/implementação?"

### Quando usar

- Feature toca 3+ módulos
- Área do código que você não escreveu
- Feature envolve integração com sistema externo
- Mudança pode ter efeitos colaterais
- Você quer entender antes de planejar

### Quando NÃO usar

- Feature é simples e isolada (1 módulo, sem dependências)
- Você já domina a área — vá direto para `/feature` ou `/spec`
