# Decisão — DISC-001: Combinar musculação e corrida sem prejudicar performance

> Data: 2026-08-09
> Decidido por: Jefferson
> Referências: `.discovery/DISC-001-musculacao-e-corrida/problem.md` · `.discovery/DISC-001-musculacao-e-corrida/hypothesis.md`

---

## Decisão

- [x] **Construir** → Story criada em `specs/STORY-001/`
- [ ] **Validar primeiro** → Experimento / pesquisa necessária antes de construir
- [ ] **Diferir** → Válido, mas não agora
- [ ] **Descartar** → Fora do escopo, problema não confirmado ou hipótese refutada

---

## Rationale

**Por que esta decisão?**

O problema é real e vivido diretamente pelo próprio desenvolvedor (dogfooding), o que reduz o risco de construir algo sem validação de mercado — o primeiro usuário real é o próprio criador. A hipótese está clara e o escopo mínimo é pequeno o suficiente para caber no horizonte de MVP (2-3 meses). A suposição crítica de maior risco (critério de sobrecarga combinada sem sensores biométricos) será validada na prática, usando o próprio uso do produto como experimento — não é necessário um ciclo de pesquisa separado antes de construir.

---

## Se Construir

**Story criada:** `specs/STORY-001/`

**Escopo acordado:**
- Registro de Sessão de Treino de corrida e de musculação (tipo, volume/intensidade, grupo muscular/região)
- Regra de alerta/recomendação quando o padrão combinado indica risco de sobrecarga
- Registro de dor/desconforto pós-treino pelo usuário

**O que fica fora desta versão:**
- Recomendações personalizadas via IA/ML
- Integração com wearables biométricos (HRV, sono, etc.)
- Prescrição detalhada de exercícios de musculação (séries/cargas específicas)

---

## Aprendizados

- A dor recorrente não é localizada (canela foi só o episódio mais recente) — reforça que o problema é sistêmico (falta de critério de balanceamento), não uma lesão pontual isolada.
- Sem formação em fisiologia esportiva, a regra de sobrecarga combinada precisa se apoiar em fontes reconhecidas — mesma exigência já registrada na Lei do Domínio do Steady (`.sdd/PROJECT-CONSTITUTION.md`), e vale igualmente para regras que envolvem musculação.
