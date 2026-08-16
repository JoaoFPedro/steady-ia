---
applyTo: ".sdd/PROJECT-CONSTITUTION.md,.sdd/memory/PROJECT.md,.sdd/memory/DOMAIN.md"
---

# Init — Constituição do Projeto (Copilot)

Você está editando arquivos de fundação de um projeto novo. Conduza a entrevista estruturada para gerar a Constituição antes de qualquer código.

> Para projetos com código existente: use o processo de onboarding (`docs/ONBOARDING-PROMPT.md`).
> Para Claude Code: use o slash command `/init`.

---

## Contexto necessário

Antes de iniciar:
1. `.sdd/CONSTITUTION.md` — lei universal do SDD Kit (não modifique)
2. `.sdd/PLAYBOOK.md` — patterns disponíveis
3. `.sdd/STACK.md` — se não existir, oriente: `./sdd scan`

---

## Processo de Init

### Etapa 1 — Entrevista (uma pergunta por vez)

Cole no Copilot Chat e faça cada pergunta separadamente. Aguarde a resposta antes de avançar.

**Pergunta 1 — Identidade**
> "Qual o nome do projeto e qual problema ele resolve? Em uma ou duas frases, na voz de quem vai usá-lo — não o que o sistema faz, mas o que o usuário consegue fazer."

**Pergunta 2 — Usuários e escala**
> "Quem são os usuários principais? Persona e escala esperada (usuários simultâneos, transações/dia)."

**Pergunta 3 — Domínio**
> "Quais são as 3 a 5 entidades centrais do domínio? Os conceitos de negócio, não as telas ou endpoints."

**Pergunta 4 — Tipo e horizonte**
> "MVP, produto em crescimento, ferramenta interna, API pública ou migração? E qual o horizonte de entrega?"

**Pergunta 5 — Riscos e restrições**
> "Maiores riscos: segurança de dados, compliance (LGPD, PCI), performance crítica, time-to-market, sistema legado?"

**Pergunta 6 — Integrações**
> "Integrações externas previstas: pagamento, auth, ERP, filas, storage, APIs de terceiros?"

**Pergunta 7 — Time**
> "Tamanho e perfil da equipe? Experiência no domínio?"

---

### Etapa 2 — Geração dos artefatos

Com base nas respostas, gere:

#### `.sdd/PROJECT-CONSTITUTION.md` (use o template em `.sdd/templates/project-constitution.md`)

Regras de derivação:
- **Lei do Domínio**: princípios específicos e falsificáveis — um dev deve conseguir decidir se violou o princípio
  - Bom: "Saldo nunca pode ser negativo sem autorização explícita de crédito"
  - Ruim: "Dados financeiros são importantes" (não orienta nenhuma decisão)
- **Mandatos de qualidade**: derivados dos riscos. Categorize: Inviolável / Crítico / Desejável
- **Técnicas prioritárias**: selecione do PLAYBOOK pelo tipo de produto:
  - MVP → KISS, Early Return, Guard Clause
  - Produto maduro → SOLID, Repository
  - API pública → DTO, Contract Testing
  - Domínio complexo → DDD (se `extensions.ddd: true` no config)

#### `.sdd/memory/PROJECT.md`
Contexto (3-5 frases), glossário de termos do domínio, convenções.

#### `.sdd/memory/DOMAIN.md`
Entidades mencionadas com campos principais e relacionamentos óbvios.

#### `docs/adr/ADR-000-foundation.md`
Stack, padrões adotados, decisões iniciais. Status: Accepted.

---

### Etapa 3 — Calibração do config.json

Atualize `.sdd/config.json`:

| Condição | Ação |
|----------|------|
| Dados sensíveis / LGPD | `"security_priority": "high"` |
| Compliance | `"extensions.compliance": true` |
| Performance crítica | `"extensions.performance_patterns": true` |
| Domínio complexo | `"extensions.ddd": true` |
| API pública / B2B | `"extensions.contract_testing": true` |

---

## Regras

- Uma pergunta por vez — não dispare a lista completa
- Princípios de domínio devem ser falsificáveis e específicos deste projeto
- Não invente entidades ou restrições não mencionadas
- A Constituição deve caber em uma tela
- Lei universal (`.sdd/CONSTITUTION.md`) prevalece sobre qualquer conflito
