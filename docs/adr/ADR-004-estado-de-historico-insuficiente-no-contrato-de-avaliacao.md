# ADR-004: Estado de histórico insuficiente exposto no contrato da avaliação de sobrecarga

> **Data**: 2026-08-16
> **Status**: Accepted
> **Story**: STORY-003
> **Decisores**: Jefferson

## Contexto

O ADR-001 define que a regra de sobrecarga **não é avaliada** enquanto o corredor tiver menos de 14 dias de histórico (§5 da regra: sem uma janela anterior completa de 7 dias, nenhum alerta é gerado). Hoje esse caso é representado por `OverloadAssessment.NoRisk()` — indistinguível, do lado de fora, de "avaliei e não há risco".

Para a API isso nunca fez diferença. Para o app da STORY-003 faz: a regra de negócio #9 da spec exige que o corredor com menos de 14 dias veja *"ainda estou reunindo dados"* em vez de *"está tudo bem"*. Um corredor que lê "sem risco" na primeira semana e se machuca na terceira recebeu do app uma garantia que o domínio nunca deu — é o pior falso negativo possível num produto cujo propósito é prevenir lesão.

O app não pode derivar esse estado sozinho. Descobrir "meu histórico tem menos de 14 dias" é aplicar o §5 do ADR-001, ou seja, criar uma segunda fonte de verdade da regra no cliente — vedado por FF-004 (`.sdd/PROJECT-CONSTITUTION.md`) e pela regra de negócio #6 da spec da STORY-003. Se o limiar de 14 dias mudar num ADR futuro, o app ficaria em silêncio divergente do servidor.

## Opções Consideradas

### Opção A: App deriva o estado a partir do histórico (`GET /api/training-sessions`)

- **Prós**: Nenhuma mudança no backend; o app já vai buscar o histórico para a tela de Histórico.
- **Contras**: Replica o §5 do ADR-001 no cliente — segunda fonte de verdade, exatamente o que FF-004 proíbe. A divergência apareceria em produção como um app que afirma "reunindo dados" enquanto a API já avalia (ou o contrário), e nenhum teste do domínio pegaria isso.

### Opção B: Estado explícito no domínio, propagado até o contrato da API

- **Prós**: A regra continua com dono único (`OverloadDetectionService`). O app só exibe o que recebe, cumprindo FF-004 e a regra #6 da spec. Mudança aditiva no contrato — nenhum consumidor existente quebra. Fica coberta por teste de domínio, que é onde a rastreabilidade ao ADR-001 é verificada.
- **Contras**: Toca 3 módulos (Domain, Api, app) e amplia o contrato público da avaliação com um terceiro campo.

### Opção C: API devolve 204/404 quando não há histórico suficiente

- **Prós**: Não amplia o corpo da resposta.
- **Contras**: Usa código de status para comunicar estado de domínio — "não há avaliação disponível" não é ausência de recurso. Obriga todo cliente a tratar o caminho feliz em dois lugares, e o cliente ainda precisaria de texto próprio para explicar o motivo.

## Decisão

Escolhemos **Opção B**.

`OverloadAssessment` passa a carregar `HasSufficientHistory`, com uma fábrica dedicada `InsufficientHistory()` usada por `OverloadDetectionService` quando o histórico não cobre os 14 dias exigidos pelo ADR-001. `OverloadAssessmentResponse` ganha o campo correspondente e o app passa a ter três estados de exibição — *reunindo dados*, *sem risco*, *risco com sugestão* — todos determinados pelo servidor.

O limiar de 14 dias e o critério de "histórico suficiente" continuam definidos exclusivamente no ADR-001. Este ADR decide apenas **onde o estado é calculado e como ele atravessa a fronteira**, não a regra em si.

## Consequências

### Positivas

- O app deixa de ter qualquer caminho em que precisaria conhecer o limiar de 14 dias — FF-004 preservado
- "Reunindo dados" vira um estado de primeira classe do domínio, testável em `Steady.Domain.Tests` junto do resto da regra
- Mudança aditiva: `HasRisk` e `Suggestion` seguem com o mesmo significado, e os testes existentes de API e domínio continuam válidos

### Negativas

- Terceiro campo no contrato da avaliação — um cliente que ignorar `hasSufficientHistory` volta a exibir "sem risco" indevidamente (mitigado por ser o app o único consumidor no MVP)
- `OverloadAssessment` passa a ter três estados representados por dois booleanos; a combinação `HasRisk = true` com `HasSufficientHistory = false` é inválida por construção e só não existe porque as fábricas privadas impedem

### Riscos

- Um ADR futuro que mude o limiar de 14 dias precisa lembrar de revisar o texto que o app exibe ("a avaliação começa depois de 14 dias") → mitigação: o texto do app não repete o número como regra, e o ADR-001 permanece a referência única citada neste ADR

## Referências

- `docs/adr/ADR-001-regra-sobrecarga-combinada.md` — §5 da regra (mínimo de 14 dias de histórico)
- `.sdd/PROJECT-CONSTITUTION.md` — FF-004 (regra de domínio nunca vive no cliente), §6 (mudança em 2+ módulos exige ADR)
- `specs/STORY-003/spec.bdd.md` — regras de negócio #6 e #9; cenário "Corredor com menos de 14 dias de histórico"
