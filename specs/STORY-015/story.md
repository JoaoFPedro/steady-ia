# Story: STORY-015 — Prescrição de corrida estruturada na ficha

Discovery: `.discovery/DISC-006-prescricao-de-corrida-mensuravel/` (recorte do DISC-005)
Habilitadora de: `specs/STORY-014/`
ADR: ADR-012

## Descrição

Como **personal com vínculo ativo**,
Quero **prescrever distância, duração e esforço da corrida ao lado da descrição
que já escrevo**,
Para que **o corredor veja exatamente o alvo do dia e o Steady possa comparar o
que foi executado com o que foi prescrito**.

## Contexto

Hoje `RunningWorkout` (`src/Steady.Domain/Coaching/TrainingSheet.cs`) guarda só
`TuesdayDescription`, `ThursdayDescription` e `SaturdayDescription` — texto
livre. O corredor lê a instrução, mas nada no dado diz quanto correr.

Sem número, nenhuma comparação de corrida é possível: a STORY-014 classificaria
distância, duração e esforço como `NãoComparável` em toda ficha, e a revisão de
corrida entregaria apenas "correu / não correu".

A descrição livre permanece obrigatória e continua sendo a instrução principal.
Os números são opcionais porque prescrição de corrida é legitimamente
qualitativa em muitos dias ("fartlek leve", "longão confortável"), e forçar o
personal a numerar tudo empobreceria a ficha.

Os números são **faixas**, não pontos. "8 a 10 km" é como se prescreve; obrigar
um valor único produziria divergência artificial na comparação futura.

## Critérios de Aceite

- [x] O personal pode informar distância, duração e esforço percebido para cada dia de corrida da ficha.
- [x] Os três campos são opcionais e independentes entre si; a descrição continua obrigatória.
- [x] Cada campo numérico aceita um alvo exato ou uma faixa com mínimo e máximo.
- [x] Faixa invertida, valor zero, negativo ou fora dos limites do domínio é rejeitada com mensagem clara.
- [x] Esforço percebido respeita a escala 1–10 já usada em `RunningSession`.
- [x] Uma ficha publicada antes desta story continua legível, com os campos numéricos ausentes.
- [x] Campo deixado em branco fica ausente no dado — nunca zero, nunca valor inferido.
- [x] O corredor vê os números prescritos junto da descrição no detalhamento do dia.
- [x] A ficha permanece imutável e substituível: publicar não altera fichas anteriores.
- [x] Publicar continua exigindo vínculo ativo e role de personal.

## Estimativa

- **Tamanho**: M
- **Complexidade**: Média

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-013 — ficha e execução detalhada do personal | Concluída |
| Decisão | ADR-012 — prescrição de corrida estruturada | Accepted |

## Habilita

| Story | O que fica bloqueado sem esta |
|-------|------------------------------|
| STORY-016 | O `RunPrescription` que o plano do Steady também usa |
| STORY-014 | Comparação de distância, duração e esforço da corrida |

> Primeira da sequência **STORY-015 → STORY-016 → STORY-014**.

## Fora de Escopo

- Comparar execução com prescrição — é a STORY-014.
- Tornar os campos obrigatórios.
- Extrair números da descrição livre por qualquer meio, incluindo IA.
- Prescrever carga de musculação.
- Sugerir ao personal um valor a partir do histórico do corredor.
