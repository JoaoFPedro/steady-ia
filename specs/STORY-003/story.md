# Story: STORY-003 — App mobile: registrar treino offline-first e ver risco de sobrecarga

Discovery: .discovery/DISC-001-musculacao-e-corrida/ (fecha o ciclo iniciado na STORY-001)

## Descrição

Como **corredor amador treinando para minha primeira maratona e que também faz musculação**,
Quero **registrar meus treinos e minhas dores pelo celular, mesmo sem conexão, e ver na hora se a combinação da semana indica risco de sobrecarga**,
Para que **eu consiga manter o registro consistente no dia a dia e ajustar o próximo treino antes da dor aparecer**.

## Contexto

A STORY-001 entregou as regras de domínio (`Steady.Domain`, ADR-001) e a STORY-002 as expôs via API autenticada com persistência em PostgreSQL (ADR-002). Nada disso é alcançável pelo corredor ainda — não existe cliente. Esta story entrega o app mobile (Expo/React Native) que consome a API existente, fechando o loop da DISC-001 e permitindo iniciar o dogfooding.

A hipótese da DISC-001 só se valida com registro real e contínuo por 4-6 semanas. A suposição crítica #2 — "o usuário vai registrar consistentemente os treinos de musculação, não só corrida" — é o maior risco de execução desta story: o corredor registra o treino logo após terminar, frequentemente na rua e sem sinal. Por isso o registro é **offline-first**, não online-com-erro.

## Critérios de Aceite

- [x] Corredor autentica exclusivamente via Google Sign-In (mandato inviolável da Constituição — nunca senha própria)
- [x] Corredor registra Sessão de Treino de Corrida, de Musculação e Registro de Dor pelo app
- [x] Todo registro é aceito mesmo sem conexão, enfileirado localmente e sincronizado automaticamente quando a conexão volta
- [x] Nenhum registro reenviado pela fila gera duplicata no servidor (chave de idempotência — ADR-003)
- [x] Após registrar uma sessão sincronizada, o app exibe imediatamente a avaliação de sobrecarga atualizada
- [x] Home exibe a avaliação de sobrecarga e indica quantos registros ainda estão pendentes de sincronização
- [x] Corredor consulta seu histórico de treinos no app
- [x] Token do Google expirado é renovado silenciosamente; o corredor só é levado ao login se a renovação falhar, e a fila é preservada
- [x] O app nunca calcula risco de sobrecarga localmente — a regra vive em `Steady.Domain` (ADR-001) e é apenas exibida (FF-004) — inclusive o estado "reunindo dados", que vem do servidor (ADR-004)

## Estimativa

- **Tamanho**: G
- **Complexidade**: Média-Alta (a fila offline concentra a maior parte da complexidade)

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-001 (`Steady.Domain`) | Concluída |
| Story | STORY-002 (API + persistência) | Concluída |
| ADR | ADR-003 — chave de idempotência para sincronização offline | Accepted |
| ADR | ADR-004 — estado de histórico insuficiente no contrato da avaliação | Accepted |
| Serviço | Google Sign-In no Expo (`@react-native-google-signin/google-signin`) | Integrado |
| Backend | Aceitar chave de idempotência nos endpoints de registro (coluna + migration) | Implementado |

## Notas

**Escopo desta story** — espelho da API existente. Explicitamente **fora**:

- Geração de Plano de Treino / onboarding de "race day" e plano de 20 semanas, presentes em `Marathon training app design/`. É regra de progressão de treino: exige discovery próprio e ADR com fonte reconhecida (Lei do Domínio #4).
- Rastreamento de rota por GPS ao vivo. Nova fronteira (Expo Location) com dados sensíveis de localização sob LGPD — FF-007 exige consentimento registrado. Independente da hipótese da DISC-001.

**Divergência herdada:** o critério de aceite da STORY-001 previa dor "associada à Sessão de Treino", mas `PainLog` foi implementado como `(Data, Região)` independente. Decisão do `/spec`: manter independente nesta story — dor costuma surgir horas ou dias após o treino, e forçar o vínculo seria modelagem incorreta. Cabe ao `/sync` alinhar o AC da STORY-001 ao modelo real.
