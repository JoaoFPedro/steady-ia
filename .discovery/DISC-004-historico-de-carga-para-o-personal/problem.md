# Problema — DISC-004: O personal não recebe a carga realmente executada

> Criado em: 2026-08-24
> Facilitado por: Codex com Jefferson

---

## Persona

**Quem tem o problema?**

No MVP, o corredor que faz musculação a partir de uma ficha prescrita por um
personal e o próprio personal que precisa ajustar essa ficha. A prescrição vem
do profissional; uma prescrição gerada pelo Steady fica para uma evolução
futura.

---

## Situação atual

**Como as coisas funcionam hoje?**

O personal informa os exercícios, séries e repetições. Durante o treino, o
corredor escolhe a carga real que consegue executar, partindo da orientação do
personal, e tenta lembrar esse valor. Não existe um registro por exercício nem
um canal que devolva a execução ao profissional.

Exemplo do que hoje fica apenas na memória:

```text
Agachamento livre
4 x 6 — 60 kg
```

O Steady registra uma `StrengthSession` agregada por grupo muscular,
intensidade e duração. Esse registro é suficiente para carga combinada e
sobrecarga, mas não responde qual exercício foi feito nem qual peso foi usado.

---

## Problema

**O que está errado, faltando ou frustrante nesse fluxo?**

A carga realmente executada se perde após o treino. O corredor não consegue
medir sua evolução por exercício e o personal não recebe histórico objetivo
para decidir se mantém ou altera a ficha. A próxima prescrição depende de
lembrança e relato informal, não do que foi registrado.

---

## Impacto

| Dimensão | Impacto |
|----------|---------|
| Frequência | Muito frequente: aparece sempre que uma carga é escolhida ou ajustada durante o treino |
| Afetados | Corredor e personal responsável por sua ficha |
| Custo para o corredor | Não sabe com segurança qual carga utilizou anteriormente nem enxerga evolução por exercício |
| Custo para o personal | Fica sem histórico real para manter, aumentar ou reduzir o estímulo prescrito |
| Risco | Ajustes de treino baseados em memória incompleta; acesso indevido se o vínculo personal-corredor não exigir consentimento |

---

## Alternativas atuais

| Alternativa | Limitação |
|-------------|-----------|
| Depender da memória do corredor | A informação se perde com frequência e não chega ao personal |
| Perguntar no atendimento seguinte | Resposta retrospectiva e imprecisa; não produz histórico consultável |
| Prescrever conservadoramente | Reduz o risco imediato, mas não resolve a ausência de evidência para acompanhar progressão |

---

## Evidências

- O uso atual depende exclusivamente da memória do corredor.
- Segundo o usuário, a perda da informação acontece com muita frequência.
- A carga real não chega ao personal.
- `StrengthSession` não possui exercício, séries, repetições, carga externa ou
  observação por execução.
- O DISC-003 e a STORY-012 já identificavam carga e séries por exercício como
  um problema separado, candidato explícito a `DISC-004`.

---

## Perguntas em aberto

- [ ] Como uma ficha muda ao longo do tempo sem reescrever o histórico das
      execuções anteriores?
- [ ] O personal poderá editar uma prescrição em vigor ou sempre publicará uma
      nova versão?
- [ ] Quais unidades de carga serão aceitas no MVP: apenas quilogramas ou
      também peso corporal, placas e aparelhos sem unidade comparável?
- [ ] Como recuperar ou revogar um vínculo personal-corredor?

