# Decisão — DISC-005: Revisão de aderência após o treino

> Data: 2026-08-28
> Decidido por: Jefferson
> Referências: `.discovery/DISC-005-revisao-de-aderencia-pos-treino/problem.md` · `.discovery/DISC-005-revisao-de-aderencia-pos-treino/hypothesis.md`

---

## Decisão

- [x] **Construir** → Story criada em `specs/STORY-014/`
- [ ] **Validar primeiro** → Experimento / pesquisa necessária antes de construir
- [ ] **Diferir** → Válido, mas não agora
- [ ] **Descartar** → Fora do escopo, problema não confirmado ou hipótese refutada

---

## Rationale

O Steady já possui os dois lados necessários para a comparação: prescrições do
plano e da ficha do personal, além das execuções imutáveis de corrida e
musculação. O problema aparece depois do registro, portanto não exige substituir
o fluxo atual nem pedir texto livre ao corredor.

O produto decidiu construir agora, sem um experimento separado anterior. O
risco de orientação esportiva insegura será tratado dentro da story como
condição de aceite: fatos e limites são determinísticos e rastreáveis; a IA não
diagnostica, não inventa causalidade e não altera o planejamento. Casos de
avaliação e bloqueios de segurança fazem parte da entrega, não de uma fase
opcional posterior.

---

## Se Construir

**Story criada:** `specs/STORY-014/`

**Escopo acordado:**

- Comparar o executado com plano do Steady e ficha ativa do personal.
- Revisar corrida, musculação e dias combinados, incluindo todos os campos
  definidos na hipótese.
- Explicar divergências e possíveis impactos com limites verificáveis.
- Recomendar de forma informativa manter, reduzir carga ou priorizar
  recuperação.
- Manter plano e ficha inalterados.
- Criar a revisão depois da sincronização quando o registro nascer offline.
- Medir compreensão e coerência da decisão com o próximo treino observável.
- Incluir avaliação de segurança e feedback de revisão sem sentido.

**O que fica fora desta versão:**

- Alteração automática de treino, ficha ou plano.
- Diagnóstico e atribuição de causa a dor.
- Chat aberto, wearables e geração de prescrição.
- Considerar ausência de registro como prova de recuperação.

---

## Aprendizados

- O atrito não está em registrar dados; está em interpretar a diferença entre
  prescrição e execução antes do treino seguinte.
- Plano do Steady e ficha do personal precisam participar da mesma revisão,
  especialmente em dias combinados.
- A entrega precisa medir entendimento e comportamento, não apenas geração de
  texto.
- Processamento online não deve quebrar o contrato offline-first existente: a
  revisão pode ser eventual, mas o registro continua imediato.
- Adaptação automática foi reconhecida como evolução futura e exige discovery
  próprio antes de entrar no produto.
