# Story: STORY-018 — Dia registrado fecha o botão de registro

Discovery: nenhum. Pedido direto do usuário em 2026-08-29, durante a validação
da STORY-017.

## Descrição

Como **corredor**,
Quero **que o botão de registro do dia desabilite depois que eu registro o
treino daquele dia**,
Para que **eu não registre o mesmo treino duas vezes nem fique em dúvida se o
registro entrou**.

## Contexto

O botão "Registrar Treino" aparece no detalhamento do dia de hoje e continuava
habilitado depois do registro. Como sessão registrada é imutável (Lei do
Domínio #2 — não há update nem delete), um segundo toque criava sessão
duplicada sem caminho de volta.

O estado já existia: `dayCompletion` deriva `cumprido` quando todas as
modalidades previstas do dia têm registro. Ele **não estava sendo usado** para
o botão.

Ao ligar os dois, veio à tona que o sinal estava quebrado para o caminho
principal do app. A musculação registrada **pela ficha do personal** escapava
da conta nas duas pontas:

- na fila offline, `loadLoggedSessions` filtrava só `running` e `strength`,
  descartando `strengthWorkout` e `combinedWorkout` — que é o que o fluxo da
  ficha enfileira;
- no servidor, `/training-sessions` lia apenas `RunningSessionRepository` e
  `StrengthSessionRepository`, e a execução da ficha é um
  `StrengthWorkoutExecution`, tabela separada (ADR-009).

Consequência antes desta story: numa segunda-feira o corredor registrava o
treino e o dia continuava sem marca — e a musculação feita pela ficha **nunca
aparecia no histórico dele**. Sábado funcionava por acidente, porque corrida
vira `RunningSession`.

## Critérios de Aceite

- [x] Registrado tudo que o dia previa, o botão daquele dia fica desabilitado e passa a dizer "Treino registrado".
- [x] O botão desabilita apenas no dia registrado; os outros dias não são afetados.
- [x] O botão fecha mesmo com a prova distante, fora da janela de 168 dias do plano.
- [x] Dia parcial (musculação feita, corrida pendente) mantém o botão habilitado.
- [x] Registro ainda na fila offline já fecha o dia, sem esperar o sync.
- [x] O dia não reabre quando o registro sai da fila e chega ao servidor.
- [x] A musculação registrada pela ficha aparece no histórico do corredor.
- [x] A execução da ficha não exibe duração inventada — ela não registra duração.
- [x] O histórico continua isolado por corredor.

## Fora de Escopo

- Contar a execução da ficha na avaliação de sobrecarga: `OverloadDetectionService` precisa de duração e intensidade, que a execução não tem.
- Permitir corrigir ou apagar um registro.
- Mudar o cálculo de `DayStatus`.
