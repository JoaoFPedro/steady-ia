# Constituição: Steady

> Gerada em: 2026-08-09 | Versão: 1.0
> Gerada por: `/init` — SDD Kit

---

## 1. Identidade

| Campo | Valor |
|-------|-------|
| **Projeto** | Steady |
| **Problema** | Corredores amadores que já correm 21km (meia maratona) querem treinar com segurança e consistência para sua primeira maratona (ou distâncias inferiores), sem depender de conhecimento técnico de fisiologia esportiva |
| **Usuário principal** | Corredor amador experiente (já correu meia maratona), buscando plano estruturado até a maratona completa. Validação inicial com dezenas a poucas centenas de usuários; visão de crescer para centenas |
| **Tipo** | MVP para validar hipótese |
| **Horizonte** | 2-3 meses até ter algo testável com os primeiros corredores (meta interna, sem prazo contratual) |

---

## 2. Lei do Domínio

1. **Nenhum Plano de Treino aumenta o volume semanal em mais de 10% em relação à semana anterior** — regra dos 10% (progressão segura de carga). Uma progressão que viole isso é um bug de domínio, não um detalhe de implementação.
2. **Toda Sessão de Treino registrada é imutável após conclusão** — correções geram um novo Registro de Desempenho; o original nunca é sobrescrito. Preserva histórico de performance para análise de progressão.
3. **Um Objetivo de Corrida sempre define data-alvo e distância antes de qualquer Plano de Treino existir** — o plano é derivado desses dois parâmetros, nunca criado livremente sem meta associada.
4. **Toda regra de progressão ou prevenção de lesão implementada é rastreável a uma fonte reconhecida de treino** (ex: regra dos 10%, periodização clássica, semanas de recuperação a cada 3-4 semanas) — nunca uma decisão arbitrária do código. O desenvolvedor não tem formação em fisiologia esportiva; a fonte da regra vira ADR.

---

## 3. Mandatos de Qualidade

### Invioláveis (bloqueiam entrega)
- Nenhuma regra de progressão de treino ou prevenção de lesão entra em produção sem ADR referenciando a fonte (ver Lei do Domínio #4)
- Dados de localização (GPS) e desempenho físico nunca são expostos a outro usuário — são dados sensíveis de saúde (LGPD)
- Autenticação é feita exclusivamente via Google Sign-In no MVP — nunca armazenar senha própria (reduz superfície de ataque com 1 desenvolvedor)

### Críticos (revisados em todo PR)
- Toda mutação em Plano de Treino ou Sessão de Treino preserva histórico (nunca deleta — apenas versiona ou cancela)
- Dados de GPS são validados antes de persistir (coordenadas fora de range, timestamps inconsistentes, sessões corrompidas)

### Desejáveis (metas, não bloqueadores)
- Cobertura de testes ≥ 70% (calibrado para MVP solo — não 80%)
- Geração de Plano de Treino responde em < 500ms

---

## 4. Técnicas Prioritárias

### Patterns a priorizar neste projeto
| Pattern | Razão |
|---------|-------|
| Guard Clause | Validação de inputs de domínio (distância, ritmo, datas) antes de qualquer regra de progressão |
| DTO / Value Object | Pace, Distância, Volume Semanal como tipos de domínio — não floats soltos trafegando entre RN e .NET |
| Repository Pattern | Backend .NET com EF Core — isola regras de progressão do acesso a dados, facilita teste |
| Early Return | KISS é prioridade em MVP solo — sem aninhamento desnecessário |

### Anti-patterns críticos neste contexto
| Anti-pattern | Risco específico |
|-------------|-----------------|
| Abstração Prematura | Dev solo em MVP de 2-3 meses — camadas para "futuro hipotético" custam tempo que não sobra |
| Primitive Obsession | Domínio de treino tem muitas grandezas (pace, distância, elevação, volume) — representá-las como float solto gera bugs sutis de unidade/conversão |

---

## 5. Fronteiras e Integrações

| Sistema | Tipo | Responsabilidade | Risco |
|---------|------|-----------------|-------|
| Google Sign-In | Identity Provider (OAuth) | Autenticação de usuário | Token expirado/inválido, falha de rede |
| API de GPS (Expo Location) | API nativa do device | Rastreamento de rota/corrida em Sessão de Treino | Precisão de GPS, permissão negada pelo usuário, consumo de bateria |
| PostgreSQL | Banco de dados | Persistência do domínio (Corredor, Plano, Sessão, Objetivo, Desempenho) | Dados sensíveis de saúde/localização exigem cuidado de acesso |

---

## 6. Acordos do Time

- **Nível de abstração**: mínimo necessário — dev solo, MVP, clareza antes de elegância
- **Revisão de código**: sem par disponível — `/review` (sensor inferencial automático) substitui revisão humana em todo PR
- **Decisões arquiteturais**: qualquer regra de treino/fisiologia ou mudança que afete 2+ módulos → ADR obrigatório (rastreabilidade é ainda mais importante sem par para validar de memória)
- **Frequência de /sync**: após cada refactor significativo ou mudança em regra de progressão

---

## 7. Emendas

| # | Data | Mudança | Razão |
|---|------|---------|-------|
| — | — | — | — |

---

## 8. Fitness Functions

| # | Função | Limiar | Sensor | Frequência |
|---|--------|--------|--------|------------|
| FF-001 | Cobertura de testes | ≥ 70% | coverage tool (Jest/xUnit) | pre-commit |
| FF-002 | Complexidade ciclomática | ≤ 10 por função | linter | pre-commit |
| FF-003 | Tamanho de módulo | ≤ 300 linhas | linter | pre-commit |
| FF-004 | RN não acessa banco diretamente — sempre via API .NET | 0 violações | constraint test | CI |
| FF-005 | Drift spec ↔ código | 0 cenários desincronizados | /sync | pós-merge |
| FF-006 | Nenhum Plano de Treino gera aumento de volume semanal > 10% sem sinalização explícita | 0 violações | teste de domínio | pre-commit |
| FF-007 | Dados de localização/GPS armazenados sem consentimento registrado | 0 ocorrências | teste de domínio + review | CI |
