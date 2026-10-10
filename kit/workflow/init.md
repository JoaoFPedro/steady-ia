---
name: init
title: Fundação do projeto
role: Produto & Design
description: Construa a fundação do projeto via entrevista estruturada — gera Constituição, memórias e ADR-000.
model: strategy
agent: agent
argument-hint: nenhum
instructions: [init]
---

Construa a fundação do projeto através de uma entrevista estruturada. Gera a Constituição do projeto e inicializa as memórias antes do primeiro código.

> Use este comando **antes de qualquer feature**, no início absoluto do projeto.
> Pré-requisito: pasta do `isabel` (`.sdd/`, `.claude/`, `CLAUDE.md`) já copiada para a raiz do projeto.
> Para projetos com código existente, use `/onboard` em vez de `/init`.

O `/init` prepara o contexto do produto. Quando a primeira funcionalidade for implementada, `/build` cria sua documentação em `docs/documenta-ai/`; as entregas seguintes a atualizam.

## Pré-condições

Antes de qualquer ação, leia (silenciosamente, só comente se ausente):

- `.sdd/CONSTITUTION.md` — leis universais do framework
- `.sdd/PLAYBOOK.md` — patterns e técnicas disponíveis
- `.sdd/STACK.md` — stack detectada (se existir)

---

## O que é a Constituição do Projeto

A CONSTITUTION.md do framework define as leis universais do isabel — essas não mudam.

A **Constituição do projeto** (`.sdd/PROJECT-CONSTITUTION.md`) é diferente: é o contrato específico *deste* software. Ela responde:
- Qual problema resolve e para quem
- Quais princípios guiam decisões de domínio *neste contexto*
- Quais mandatos de qualidade se aplicam dado os riscos reais
- Quais técnicas do PLAYBOOK têm prioridade para este tipo de produto

---

## Fase 1 — Entrevista de Descoberta

Conduza a entrevista de forma conversacional. **Uma pergunta por vez.** Aguarde a resposta antes de avançar.

### Pergunta 1 — Identidade
> "Vamos construir a fundação do projeto. Comece pelo essencial: **qual é o nome do projeto e qual problema ele resolve?** Em uma ou duas frases, na voz de quem vai usá-lo — não o que o sistema faz, mas o que o usuário consegue fazer."

*Aguarde resposta.*

### Pergunta 2 — Usuários e Escala
> "**Quem são os usuários principais?** Descreva a persona e, se possível, a escala esperada: usuários simultâneos, transações por dia, volume de dados — qualquer número que ajude a entender o que 'funcionar bem' significa aqui."

*Aguarde resposta.*

### Pergunta 3 — Domínio
> "Quais são as **3 a 5 entidades centrais** do domínio? Pense nas coisas que o sistema guarda, manipula e sobre as quais raciocina — não nas telas ou endpoints, mas nos conceitos do negócio."

*Aguarde resposta.*

### Pergunta 4 — Tipo e Horizonte
> "Que tipo de produto é este? **MVP para validar hipótese, produto em crescimento, ferramenta interna, API pública, migração de sistema legado, plataforma B2B?** E qual o horizonte de entrega — 3 meses? 1 ano? Entrega contínua?"

*Aguarde resposta.*

### Pergunta 5 — Riscos e Restrições
> "Quais são os **maiores riscos ou restrições** que este projeto carrega? Pense em: segurança e privacidade de dados, compliance/regulação (LGPD, PCI, SOC 2), performance crítica, time-to-market apertado, integração com sistema legado, equipe pequena, domínio complexo."

*Aguarde resposta.*

### Pergunta 6 — Integrações
> "Existem **integrações externas** previstas ou já mapeadas? Por exemplo: gateway de pagamento, identity provider (Auth0, Cognito), ERP/CRM, filas de mensagem (Kafka, SQS), storage (S3), APIs de terceiros."

*Aguarde resposta.*

### Pergunta 7 — Time
> "Última questão: **qual é o tamanho e perfil da equipe?** Por exemplo: 3 devs backend plenos + 1 tech lead, experiência com o domínio? time distribuído? Essa informação calibra o nível de abstração e a frequência de revisões."

---

## Fase 2 — Confirmação de Stack

Leia `.sdd/STACK.md`. Se não existir (projeto novo, sem código ainda), pergunte ao usuário a stack pretendida:

> "Antes de gerar a Constituição: **qual stack você pretende usar?** Linguagem, framework, banco, test runner. Se ainda não decidiu, posso sugerir com base no perfil do projeto."

Escreva o resultado em `.sdd/STACK.md` no formato:

```markdown
# Stack

- **Linguagem**: …
- **Framework**: …
- **Test runner**: …
- **Banco / ORM**: …
- **Package manager**: …
```

Se o projeto **já tem código** (situação rara em `/init`, mas possível em scaffold pré-existente), detecte a stack lendo `package.json`/lock files/`pyproject.toml`/`go.mod`/etc — mesmo procedimento da Fase 0.7 do `/onboard`.

Apresente a stack e pergunte:
> "Stack confirmada: [lista]. Está correto?"

---

## Fase 3 — Geração da Constituição

Com base em todas as respostas e na stack confirmada, gere `.sdd/PROJECT-CONSTITUTION.md`.

**Regras de derivação:**

- **Princípios de domínio**: derive das entidades e do tipo de produto — não use frases genéricas. Um princípio deve ser específico o suficiente para orientar uma decisão de implementação concreta.
  - Ruim: "Dados devem ser consistentes"
  - Bom: "Um pedido nunca é deletado — apenas cancelado com razão registrada (auditoria fiscal)"

- **Mandatos de qualidade**: derive dos riscos informados. Se mencionou LGPD, o mandato é sobre dados pessoais. Se mencionou performance crítica, o mandato é sobre latência. Priorize — nem tudo pode ser Prioridade 1.

- **Técnicas prioritárias**: selecione do PLAYBOOK com base no tipo de produto e stack. MVP → prefira KISS e Early Return. Produto maduro → SOLID e Repository. API pública → DTO e Contract Testing. Fintech → Guard Clause e Error tipado.

- **Acordos do time**: calibre pelo perfil informado. Time pequeno → menos abstrações, mais pair review. Time experiente no domínio → pode usar DDD. Time distribuído → mais documentação de decisões (ADRs frequentes).

Use o template em `.sdd/templates/project-constitution.md` como base.

---

## Fase 4 — Inicialização da Memória

Preencha com as informações coletadas:

### `.sdd/memory/PROJECT.md`
- Identificação: nome e cliente (se aplicável)
- Contexto: o que faz, para quem, por quê — em 3-5 frases
- Convenções: branches, commits, testes (padrão isabel, ajuste se o time informou diferente)
- Glossário: termos de domínio mencionados na entrevista (entidades, jargões do negócio)
- Links: deixe em branco se não informado

### `.sdd/memory/DOMAIN.md`
- Liste as entidades mencionadas com campos principais (se informados)
- Para cada entidade, note os relacionamentos óbvios derivados do contexto
- Deixe fluxos como `[a definir em /feature]` — não invente

### `docs/adr/ADR-000-foundation.md`
Crie um ADR de fundação com:
- Stack escolhida e motivação (derivada da entrevista)
- Principais padrões adotados (derivados da Constituição)
- Decisões arquiteturais iniciais (se mencionadas)
- Status: **Accepted**

---

## Fase 5 — Calibração do Playbook

Com base no tipo de projeto e nos riscos declarados, atualize `.sdd/config.json`:

| Condição identificada | Ação em config.json |
|----------------------|---------------------|
| Dados sensíveis / privacidade | `"security_priority": "high"` |
| Compliance (LGPD, PCI, SOC 2) | `"extensions.compliance": true` |
| Performance como restrição crítica | `"extensions.performance_patterns": true` |
| Domínio complexo com muitas regras | `"extensions.ddd": true` |
| API pública ou integrações B2B | `"extensions.contract_testing": true` |
| Integrações externas mapeadas | Ativar MCPs relevantes (`playwright`, `dbhub`, etc.) |

---

## Fase 6 — Handshake Final

Apresente o resumo do que foi gerado:

```
Fundação criada.

✅ .sdd/PROJECT-CONSTITUTION.md  — lei do projeto
✅ .sdd/memory/PROJECT.md        — contexto e glossário
✅ .sdd/memory/DOMAIN.md         — entidades e fronteiras
✅ docs/adr/ADR-000-foundation.md — snapshot das decisões iniciais
✅ .sdd/config.json              — stack e extensões calibrados

Revise a Constituição — ela guiará todas as decisões de arquitetura e domínio.
Se algo estiver errado, corrija agora: é mais barato do que corrigir depois de 10 stories.

Próximos passos:
  1. /triage    → explore o primeiro problema antes de virar story
  2. /feature   → pipeline completo: story → spec → blueprint → TDD
```

---

## Regras

- Faça **uma pergunta por vez**. Não dispare todas de uma vez.
- Se o usuário for vago, reformule com um exemplo concreto antes de insistir.
- Princípios de domínio devem ser **falsificáveis**: um dev deve conseguir decidir se violou ou não o princípio.
- Não invente entidades, integrações ou restrições que não foram mencionadas.
- A Constituição deve caber em **uma tela** — princípios, não manual.
- Se conflito com a CONSTITUTION.md do framework: a lei universal prevalece.
- Registre na Constituição apenas o que **diferencia este projeto** do genérico.
