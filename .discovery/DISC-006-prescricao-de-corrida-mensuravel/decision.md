# Decisão — DISC-006: A prescrição de corrida não é mensurável

> Data: 2026-08-28
> Decidido por: Jefferson
> Referências: `.discovery/DISC-006-prescricao-de-corrida-mensuravel/problem.md` · `.discovery/DISC-006-prescricao-de-corrida-mensuravel/hypothesis.md`

---

## Decisão

- [x] **Construir** → Story criada em `specs/STORY-015/`
- [ ] **Validar primeiro**
- [ ] **Diferir**
- [ ] **Descartar**

---

## Rationale

Este discovery é um recorte do DISC-005, aberto quando o planejamento da
STORY-014 mostrou que a comparação de corrida não tinha dado de entrada. Ele
existe separado porque o problema se sustenta sozinho: mesmo sem revisão
nenhuma, "fartlek leve" é uma instrução ambígua para quem vai correr.

Construir agora, e não depois da STORY-014, porque a ordem inversa é impossível:
sem prescrição mensurável a revisão de corrida nasceria vazia.

Os campos são opcionais por decisão de produto, aceitando o risco da suposição
#1. Torná-los obrigatórios resolveria a adoção e destruiria a prescrição
qualitativa, que é legítima e é o que o personal escreve hoje. A adoção será
medida antes de qualquer discussão sobre obrigatoriedade.

---

## Se Construir

**Story criada:** `specs/STORY-015/`

**Escopo acordado:**

- Três campos opcionais e independentes por dia de corrida da ficha.
- Faixa com mínimo obrigatório e máximo opcional.
- Descrição livre permanece obrigatória e principal.
- Ficha legada continua legível.
- Corredor vê os números junto da descrição.

**O que fica fora desta versão:**

- Comparação com a execução.
- Obrigatoriedade dos campos.
- Extração de número a partir de texto.
- Carga prescrita de musculação.

---

## Aprendizados

- A assimetria estava no código desde a STORY-013: execução numérica,
  prescrição textual. Ninguém notou porque nada as confrontava.
- Recortar a habilitadora do DISC-005 revelou que ela tem valor próprio para o
  corredor, independente da revisão que a motivou.
- Opcional é uma aposta explícita na adoção, não uma omissão de decisão.
