# Tasks — STORY-017

> Spec: [spec.bdd.md](./spec.bdd.md) · ADR-012 · ADR-017 (proposto)

## 0. Decisão

- [ ] Escrever `docs/adr/ADR-017-cor-de-erro-no-nocturne.md`: por que o vermelho
      entra num DS que só tinha a rampa accent, e onde ele pode ser usado.

## 1. Domínio

- [ ] Cobrir por TDD `ExercisePrescription` com `DurationSeconds` opcional
      (> 0, ausente ≠ zero) e `Observation` opcional (≤ 200 caracteres,
      normalizada como `NormalizeNote` já faz na execução).
- [ ] Manter séries e repetições obrigatórias e nos limites atuais.
- [ ] Provar que os campos novos não alteram a imutabilidade da ficha.

## 2. Persistência

- [ ] Serializar os dois campos no `ExerciseDocument`.
- [ ] Ler ficha legada sem os campos como prescrição sem tempo e sem observação.
- [ ] Provar que branco nunca vira `0` nem `""` no JSON.
- [ ] Levar `DurationSeconds` para o snapshot `ExerciseExecution` (é alvo
      comparável pela STORY-014); **não** levar a observação.

## 3. API

- [ ] Estender `ExercisePrescriptionBody` e `ExercisePrescriptionResponse`.
- [ ] Manter role de personal e vínculo ativo como gate da publicação.
- [ ] Devolver mensagem clara ao rejeitar tempo zero, negativo ou observação
      longa demais.

## 4. Design System

- [ ] Adicionar a rampa `danger` a `src/theme/nocturne.ts`.
- [ ] Dar a `src/ui/Field.tsx` a prop `error?: string`: borda, rótulo e
      mensagem em `danger`, sem hex solto.

## 5. Aplicativo — validação

- [ ] Adicionar `zod` a `src/steady-app` e confirmar que a suíte Jest passa.
- [ ] Criar `src/coaching/trainingSheetSchema.ts`: schema do formulário inteiro
      produzindo `TrainingSheetDraft`, com erro endereçado por campo.
- [ ] Absorver `runPrescriptionForm.ts` no schema — não deixar duas validações
      da mesma corrida coexistindo.
- [ ] Não replicar no schema os limites numéricos do domínio.
- [ ] Ligar o schema a `app/personal/runner.tsx`: erro só após tentativa de
      publicar, some ao corrigir o campo, nada é enviado enquanto houver erro.
- [ ] Manter o `NoticeStrip` para rejeição da API e falha de rede.

## 6. Aplicativo — campos e remoção

- [ ] Adicionar tempo e observação ao card de exercício em `runner.tsx`.
- [ ] Adicionar remoção de exercício, indisponível no último do treino.
- [ ] Estender `ExerciseDraft` e `ExercisePrescription` nos tipos do app.
- [ ] Exibir tempo e observação ao corredor em `app/coaching/strength.tsx` e no
      detalhamento do dia; exercício sem eles não ganha linha vazia.
- [ ] Distinguir visualmente a observação do personal do campo de observação
      que o corredor preenche.

## 7. Fechamento

- [ ] `/review` — spec + OWASP.
- [ ] Atualizar `.sdd/memory/DOMAIN.md` (`ExercisePrescription` com os dois
      campos novos).
- [ ] Atualizar `.sdd/STACK.md` com a rampa `danger` e com `zod`.
