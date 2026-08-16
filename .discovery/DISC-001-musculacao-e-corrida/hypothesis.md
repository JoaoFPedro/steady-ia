# Hipótese — DISC-001: Combinar musculação e corrida sem prejudicar performance

> Referência ao problema: `.discovery/DISC-001-musculacao-e-corrida/problem.md`

---

## Hipótese

> Acreditamos que **um sistema de recomendação de treino que combina volume de corrida e musculação, evitando sobrecarga do mesmo grupo/estrutura sem recuperação adequada**
> vai resolver **a falta de critério para balancear os dois tipos de treino**
> para **o corredor amador que treina para sua primeira maratona e também faz musculação**,
> e saberemos que funcionou quando **os episódios de dor pós-treino recorrente diminuírem em frequência/intensidade ao longo de algumas semanas de uso**.

---

## Suposições críticas

| # | Suposição | Certeza (Alta/Média/Baixa) | Como validar |
|---|-----------|---------------------------|--------------|
| 1 | É possível estabelecer um critério (baseado em regras conhecidas, sem sensores biométricos) para detectar quando corrida + musculação combinadas geram sobrecarga | Média | Confrontar com literatura de treino + registrar dor real do usuário ao aplicar a regra |
| 2 | O usuário vai registrar consistentemente os treinos de musculação (não só corrida) para o sistema ter dados suficientes | Média | Observar se o registro é mantido nas primeiras semanas de uso |
| 3 | Regras genéricas de balanceamento (sem dados biométricos individualizados) já são suficientes para reduzir a dor recorrente | Baixa/Média | Medir se a frequência de dor cai após algumas semanas usando as recomendações |

---

## Maior risco

**Suposição #1** — se não for possível estabelecer um critério confiável de sobrecarga combinada sem sensores biométricos, a hipótese inteira não tem base para gerar recomendações úteis.

---

## Escopo mínimo

**Dentro do escopo:**
- Registro de Sessão de Treino tanto de corrida quanto de musculação (tipo, volume/intensidade, grupo muscular/região trabalhada)
- Regra simples de alerta/recomendação quando o padrão combinado indica risco (ex: musculação pesada de perna + aumento de volume de corrida na mesma semana)
- Registro de dor/desconforto pelo usuário pós-treino, para calibrar e observar se a frequência cai

**Fora do escopo (explicitamente):**
- Recomendações personalizadas via IA/ML
- Integração com wearables biométricos (HRV, sono, etc.)
- Prescrição detalhada de exercícios de musculação (séries/cargas específicas)

---

## Métricas de validação

| Métrica | Baseline atual | Meta para considerar válido |
|---------|---------------|----------------------------|
| Frequência de episódios de dor pós-treino recorrente | Recorrente, sem critério (situação atual) | Redução perceptível de frequência/intensidade após 4-6 semanas usando as recomendações |

---

## Impacto mapeado (opcional)

```
Meta: Corredor amador completa sua primeira maratona sem interrupção por lesão
├── Corredor que também treina musculação
│   ├── Impacto: Reduz episódios de dor recorrente por sobrecarga combinada
│   │   └── Entregável: Registro de treino (corrida + musculação) + regra de alerta de sobrecarga combinada
│   └── Impacto: Ganha confiança de que a combinação de treinos está balanceada
│       └── Entregável: Registro de dor pós-treino + feedback visível de tendência
```
