# Problema — DISC-006: A prescrição de corrida não é mensurável

> Criado em: 2026-08-28
> Facilitado por: Claude
> Recorte de: `.discovery/DISC-005-revisao-de-aderencia-pos-treino/`

---

## Persona

Corredor com vínculo ativo a um personal, que recebe a ficha e corre nos dias
prescritos. Secundariamente o próprio personal, que escreve a prescrição.

---

## Situação atual

O personal publica a ficha com uma descrição livre de corrida para terça,
quinta e sábado (ADR-010). O corredor lê essa frase no detalhamento do dia,
corre, e registra distância, duração, ritmo e esforço percebido.

O que ele registra é numérico. O que lhe foi prescrito é prosa.

---

## Problema

A prescrição e a execução não vivem na mesma escala. O corredor lê "fartlek
leve" e registra 8,4 km em 47 minutos com esforço 7 — e nada no sistema, nem no
corredor, consegue dizer se um corresponde ao outro.

Para o corredor isso é ambiguidade no momento de treinar: "leve" e "moderada"
significam coisas diferentes para pessoas diferentes, e ele descobre a
interpretação certa perguntando ao personal ou errando.

Para o produto é ausência de dado: nenhuma comparação entre prescrito e
executado é possível para corrida, hoje ou depois.

---

## Impacto

| Dimensão | Impacto |
|----------|---------|
| Frequência | Três dias por semana, em toda ficha publicada |
| Afetados | Todo corredor com personal vinculado |
| Custo | Corredor calibra por conta própria e pode correr sistematicamente acima ou abaixo do pretendido, sem que ninguém perceba; o personal só descobre pelo relato |

---

## Alternativas atuais

| Alternativa | Limitação |
|-------------|-----------|
| Personal escrever os números dentro da frase | O dado existe para o olho humano, não para o sistema; formato varia a cada personal e a cada dia |
| Corredor perguntar ao personal | Depende de disponibilidade; não fica registrado |
| Corredor decidir sozinho pela sensação | É exatamente o que a ficha existe para evitar |

---

## Evidências

- `src/Steady.Domain/Coaching/TrainingSheet.cs`: `RunningWorkout` tem apenas
  três strings de descrição.
- `RunningSession` registra distância, duração, ritmo e esforço — a assimetria
  entre prescrição e execução está no próprio código.
- DISC-005, suposição crítica #2: a comparabilidade dos campos foi levantada
  como incerteza de certeza média, com "descrições livres de corrida"
  nomeadas explicitamente como o ponto de falha esperado.

---

## Perguntas em aberto

- [x] Os números devem substituir a descrição ou conviver com ela? → Conviver;
  a descrição carrega intenção que número nenhum expressa.
- [x] Devem ser obrigatórios? → Não; prescrição qualitativa é legítima.
- [ ] Quantos personais de fato preencherão campos opcionais? Só o piloto diz.
