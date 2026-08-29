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

A ficha ativa é o planejamento do corredor e sempre contém quatro cards de
treino: **Empurrada**, **Puxada**, **Inferiores** e **Corrida**. Os três
primeiros contêm exercícios em texto livre, séries e repetições. O mesmo card
Corrida contém três prescrições livres, uma para terça, outra para quinta e
outra para sábado, como "Moderada/fartlek leve, pace X, tempo estimado Y".

Para o corredor, esses treinos não formam uma aba principal separada. Eles
substituem o conteúdo estático de **Planejamento → Semana → Detalhamento de
cada dia**. O dia sugere a ficha correspondente sem bloquear a escolha livre
de outro treino.

Esta story introduz dados de desempenho físico compartilhados entre contas. O
isolamento por corredor, a autorização pelo vínculo e a preservação do
histórico são requisitos de domínio e segurança, não detalhes de interface.

## Critérios de Aceite

- [x] O personal encontra um corredor por e-mail e envia uma solicitação de vínculo.
- [x] O personal não acessa ficha, cargas ou notas antes da confirmação do corredor.
- [x] O corredor pode aceitar o vínculo e o personal passa a acessar somente os dados desse corredor vinculado.
- [x] A ficha publicada contém exatamente um treino de cada tipo: Empurrada, Puxada, Inferiores e Corrida.
- [x] Nos treinos de musculação, o personal informa exercícios em texto livre, séries e repetições, sem prescrever a carga real.
- [x] No único card Corrida, o personal informa três descrições livres e obrigatórias: terça, quinta e sábado.
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
- [x] A barra principal não exibe uma aba Treinos separada.
- [x] Em Planejamento → Semana → Detalhamento de cada dia, os exercícios estáticos são substituídos pelos treinos da ficha ativa.
- [x] Segunda e sexta exibem Inferiores; terça exibe Empurrada e a corrida de terça; quarta exibe Empurrada; quinta exibe Puxada e a corrida de quinta; sábado exibe a corrida de sábado; domingo permanece descanso.
- [x] O registro iniciado pelo detalhamento diário usa a execução da ficha com carga e nota, sem voltar ao registro genérico de musculação.
- [x] Sem ficha ativa, o detalhamento informa que o personal ainda não publicou o treino e não apresenta exercícios estáticos como prescrição.
- [x] Com a API indisponível e uma ficha em cache, o detalhamento usa a última ficha salva e identifica que o conteúdo pode estar desatualizado.
- [x] Ao voltar de uma execução, o planejamento reabre na seção Semana e no dia de origem.
- [x] Fichas já persistidas com uma única descrição de corrida continuam legíveis durante a transição de formato.
- [x] O detalhamento diário exibe somente um botão `Registrar Treino`; não exibe botões diretos de Puxada, Inferiores ou `Registrar corrida`.
- [x] Ao tocar em `Registrar Treino`, o corredor escolhe qual treino da ficha realmente realizou antes de informar a execução.
- [x] Em um dia sem corrida prescrita, concluir o registro envia somente o treino escolhido.
- [x] Em terça, quinta ou sábado, ao concluir um treino que não seja Corrida, o Steady pergunta se o corredor também registrará a corrida prescrita daquele dia.
- [x] Se o corredor responder não, somente o primeiro treino é registrado e o fluxo termina.
- [x] Se responder sim, o primeiro treino permanece preparado sem ser enviado e o corredor segue para o formulário de corrida com a prescrição daquele dia.
- [x] Ao concluir a corrida complementar, as duas execuções entram juntas na fila offline como uma única unidade idempotente e são persistidas juntas no servidor.
- [x] Se a corrida complementar não for registrada — por recusa, volta ou cancelamento — o treino de musculação é enviado sozinho e seus dados são preservados.
- [x] Se o treino inicialmente escolhido já for Corrida, o formulário de corrida abre diretamente e não pergunta se haverá uma segunda corrida.
- [x] Uma falha ao validar ou persistir qualquer parte do registro combinado não deixa somente uma das duas execuções gravada.

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
- Prescrição gerada pela aplicação; a fonte dos exercícios continua sendo o personal.
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
