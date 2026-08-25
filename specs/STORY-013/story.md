# Story: STORY-013 — Histórico de carga compartilhado com o personal

Discovery: `.discovery/DISC-004-historico-de-carga-para-o-personal/`

## Descrição

Como **corredor que segue uma ficha de musculação prescrita por um personal**,
Quero **registrar a carga realmente utilizada e uma nota opcional em cada
exercício**,
Para que **eu acompanhe minha evolução e meu personal ajuste a ficha com base
no histórico real, sem depender da minha memória**.

## Contexto

Hoje a `StrengthSession` registra apenas data, grupo muscular, intensidade e
duração. O personal prescreve exercícios, séries e repetições, mas a carga que
o corredor efetivamente usa se perde depois do treino e não chega ao
profissional.

No MVP, o personal possui perfil próprio por role, encontra o corredor pelo
e-mail e solicita vínculo. Nenhum dado é liberado antes da confirmação do
corredor. Um personal pode acompanhar vários corredores, mas cada corredor tem
apenas um vínculo ativo. Depois de vinculado, o personal publica uma ficha
completa e consulta o histórico detalhado das execuções.

A ficha ativa sempre contém quatro treinos: **Empurrada**, **Puxada**,
**Inferiores** e **Corrida**. Os três primeiros contêm exercícios em texto
livre, séries e repetições. Corrida contém uma descrição livre, como
"Moderada/fartlek leve, pace X, tempo estimado Y". O planejamento sugere qual
ficha combina com o dia, mas o corredor pode executar qualquer uma delas.

Esta story introduz dados de desempenho físico compartilhados entre contas. O
isolamento por corredor, a autorização pelo vínculo e a preservação do
histórico são requisitos de domínio e segurança, não detalhes de interface.

## Critérios de Aceite

- [x] O personal encontra um corredor por e-mail e envia uma solicitação de vínculo.
- [x] O personal não acessa ficha, cargas ou notas antes da confirmação do corredor.
- [x] O corredor pode aceitar o vínculo e o personal passa a acessar somente os dados desse corredor vinculado.
- [x] A ficha publicada contém exatamente um treino de cada tipo: Empurrada, Puxada, Inferiores e Corrida.
- [x] Nos treinos de musculação, o personal informa exercícios em texto livre, séries e repetições, sem prescrever a carga real.
- [x] No treino de corrida, o personal informa uma única descrição livre da prescrição.
- [x] No primeiro treino, a carga de cada exercício pode começar vazia e ser preenchida pelo corredor.
- [x] Cada execução registra uma única carga em quilogramas por exercício e uma nota curta opcional.
- [x] Em um novo treino, o Steady sugere a última carga registrada para aquele exercício, permitindo confirmar ou alterar.
- [x] Carga vazia ou zero exige confirmação e registra o exercício como pulado; no treino seguinte a carga volta vazia.
- [x] A nota começa vazia em cada execução e permanece vinculada ao histórico daquele treino.
- [x] O personal vinculado consulta a evolução cronológica de cargas, notas e exercícios pulados; o corredor não recebe histórico detalhado.
- [x] O treino sugerido pelo plano não bloqueia a escolha livre de outra ficha.
- [x] Publicar uma ficha nova a torna ativa imediatamente, substitui a anterior e inicia suas cargas vazias.
- [x] Registros feitos offline entram juntos na fila local e aparecem para o personal depois da sincronização.
- [x] Um personal não vinculado nunca acessa dados de desempenho do corredor, mesmo conhecendo seu e-mail.
- [x] Alterações futuras na ficha não reescrevem execuções históricas.

## Estimativa

- **Tamanho**: G
- **Complexidade**: Alta

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-009 — identidade persistida do corredor por Google `sub` | Concluída |
| Story | STORY-003 — registro offline-first e sessões imutáveis | Concluída |
| Domínio | Novo papel de personal, vínculo autorizado, ficha e execução por exercício | Concluída |
| Segurança | Autorização por vínculo confirmado em toda query de dados do corredor | Concluída |

## Fora de Escopo

- Catálogo padronizado de exercícios.
- Carga diferente por série.
- Registro estruturado de falhas ou repetições incompletas.
- Progressão automática de carga.
- Prescrição gerada pela aplicação.
- Subscription e cobrança.
- Histórico detalhado para o corredor.
- Comportamento especial ao refazer um vínculo encerrado.

## Notas

- A carga sugerida é apenas auxílio de preenchimento; uma nova execução só
  existe depois da confirmação do corredor.
- A ficha não expõe versões ao corredor. O personal publica um novo conjunto,
  que substitui o conjunto ativo sem alterar as execuções já registradas.
- Carga aceita: quilogramas entre `0,01` e `999,99`, com até duas casas
  decimais. Vazio e zero representam exercício pulado após confirmação.
