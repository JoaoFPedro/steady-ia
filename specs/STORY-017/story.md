# Story: STORY-017 — Ficha do personal: validação em tela, observação, tempo e remoção de exercício

Discovery: nenhum. Ajuste de usabilidade sobre a ficha já entregue pelas
STORY-013 e STORY-015, pedido direto pelo usuário em 2026-08-29.
Análise: [analysis.md](./analysis.md)
ADR: ADR-012 (campo opcional = ausente) · ADR-017 (cor de erro no Nocturne, proposto)

## Descrição

Como **personal com vínculo ativo**,
Quero **ser avisado no próprio campo quando a ficha estiver incompleta, poder
remover exercícios que sobraram, anotar uma observação em cada exercício e
prescrever tempo além de séries e repetições**,
Para que **eu publique a ficha certa na primeira tentativa e o corredor receba a
instrução completa de cada exercício**.

## Contexto

`app/personal/runner.tsx` hoje monta a ficha inteira e só descobre que ela está
incompleta **depois** do round-trip HTTP: a rejeição do domínio volta como uma
frase única no `NoticeStrip` do topo da tela, que não diz qual dos ~15 campos
por exercício está errado. Pior, `Number('')` é `0`: o campo em branco chega ao
backend como "série 0" e volta a mensagem "As séries devem estar entre 1 e 20",
que descreve um valor que o personal nunca digitou.

A tela também começa com um exercício em branco por treino e o
`+ Adicionar exercício` nunca remove nenhum. Com a validação passando a
bloquear a publicação, um card vazio sobrando travaria o personal
permanentemente — por isso a remoção entra nesta story, não na seguinte.

Nos campos do exercício faltam duas coisas que o personal precisa dizer:
o **tempo** (prancha, isometria, trabalho por tempo) e uma **observação**
livre ("não travar o cotovelo", "cadência 3-1-3"). Ambos opcionais, ambos
seguindo o padrão da ADR-012: em branco é ausência, nunca zero, nunca inferido.

O Nocturne não tem vermelho — a rampa `danger` entra como token novo do design
system (ADR-017), não como hex solto na tela.

## Critérios de Aceite

- [ ] Tentar publicar ficha incompleta não envia nada à API: a tela realça em vermelho cada campo inválido, com a mensagem sob o campo.
- [ ] O aviso no topo deixa de ser usado para erro de preenchimento; segue reservado para falha de rede e rejeição da API.
- [ ] O erro de um campo desaparece assim que aquele campo é corrigido.
- [ ] O personal pode remover qualquer exercício, exceto quando é o último do treino.
- [ ] Remover um exercício não afeta os erros nem os valores dos demais.
- [ ] Cada exercício aceita uma observação livre e opcional, de até 200 caracteres.
- [ ] Cada exercício aceita um tempo opcional em segundos, sem substituir séries nem repetições, que continuam obrigatórias.
- [ ] Campo opcional em branco fica ausente no dado — nunca zero, nunca string vazia.
- [ ] O corredor vê tempo e observação junto da prescrição do exercício.
- [ ] Ficha publicada antes desta story continua legível, sem tempo e sem observação.
- [ ] A ficha permanece imutável e substituível; publicar não altera fichas anteriores.

## Estimativa

- **Tamanho**: M
- **Complexidade**: Média

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-013 — ficha e execução detalhada | Concluída |
| Story | STORY-015 — prescrição de corrida estruturada | Concluída |
| Decisão | ADR-012 — campo opcional é ausência, nunca zero | Accepted |
| Decisão | ADR-017 — cor de erro no Nocturne | Proposto nesta story |
| Técnica | `zod` como dependência de `src/steady-app` | A adicionar |

## Fora de Escopo

- Migrar os outros formulários do app (registro de corrida, pedido de plano) para o `Field` com erro — o componente fica pronto, a migração é outra story.
- Comparar tempo prescrito × executado — é a STORY-014.
- Tornar tempo ou observação obrigatórios.
- Prescrever carga de musculação.
- Reordenar exercícios.
- Duplicar no app os limites numéricos do domínio (1–20 séries, 1–100 repetições): continuam validados só no backend.
