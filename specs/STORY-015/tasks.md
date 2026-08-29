# Tasks — STORY-015

> Spec: [spec.bdd.md](./spec.bdd.md) · ADR-012

## 1. Domínio

- [x] Cobrir por TDD `RunPrescription` com descrição obrigatória e faixas
      opcionais de distância, duração e esforço.
- [x] Aceitar alvo exato (mínimo sem máximo) e faixa (mínimo e máximo).
- [x] Rejeitar faixa invertida, zero, negativo e valor fora dos limites já
      usados em `RunningSession.Create`.
- [x] Distinguir campo ausente de campo inválido nas mensagens.
- [x] Evoluir `RunningWorkout` para três `RunPrescription` preservando
      `WorkoutType.Run` e a assinatura de criação da ficha.

## 2. Persistência

- [x] Serializar e desserializar os campos novos no documento da ficha.
- [x] Ler ficha legada sem campos numéricos como prescrição só com descrição.
- [x] Provar que campo em branco nunca é persistido como zero.
- [x] Provar que publicar não altera os números da ficha anterior.

## 3. API

- [x] Estender `PublishTrainingSheetBody` com os campos opcionais por dia.
- [x] Validar e devolver mensagem por campo na rejeição.
- [x] Incluir os campos na resposta da ficha ativa e do histórico.
- [x] Manter role de personal e vínculo ativo como gate da publicação.

## 4. Aplicativo

- [x] Estender os tipos de ficha do app com os campos opcionais.
- [x] Adicionar os campos ao card Corrida em `app/personal/runner.tsx`.
- [x] Validar faixa no formulário antes do envio, sem duplicar a regra de
      domínio como fonte de verdade.
- [x] Exibir os números junto da descrição no detalhamento do dia.
- [x] Manter o dia sem números exibindo somente a descrição.

## 5. Fechamento

- [x] Executar testes .NET e Jest, typecheck e cobertura.
- [x] Preencher `mapping.md` com cenário → arquivo real e estado RED/GREEN.
- [x] Marcar os critérios de aceite de `story.md`.
- [x] Executar `/review` e `/sync`.
