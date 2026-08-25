# Spec BDD: STORY-013 — Histórico de carga compartilhado com o personal

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-004-historico-de-carga-para-o-personal/](../../.discovery/DISC-004-historico-de-carga-para-o-personal/)
> **Status**: Implementada e revisada em 2026-08-24
> **Autor**: Jefferson com Codex

---

## Feature: Prescrição do personal e execução real do corredor

O personal publica uma ficha completa para um corredor que confirmou o vínculo.
O corredor executa qualquer um dos quatro treinos, registra as cargas reais em
quilogramas e pode deixar uma nota breve. O personal consulta o histórico
detalhado enquanto o vínculo estiver ativo.

### Decisões de produto

1. Uma conta recebe acesso por roles. O modelo suporta as roles `Corredor` e
   `Personal`; se ambas existirem, as duas áreas aparecem na mesma navegação.
2. Um personal pode ter vários corredores. Um corredor pode ter várias
   solicitações pendentes, mas apenas um vínculo ativo.
3. Buscar por e-mail encontra o corredor, mas não concede acesso. O corredor
   precisa aceitar a solicitação.
4. Toda ficha publicada contém exatamente quatro treinos: `Empurrada`,
   `Puxada`, `Inferiores` e `Corrida`.
5. Empurrada, Puxada e Inferiores contêm exercícios. Corrida contém uma única
   descrição livre e usa o formulário de corrida existente na execução.
6. O plano semanal apenas sugere uma ficha. O corredor pode executar qualquer
   uma em qualquer dia.
7. A execução de musculação é salva de uma vez como um único conjunto. Carga
   vazia ou zero significa exercício pulado somente depois de confirmação.
8. O personal vê o histórico detalhado; o corredor vê a ficha ativa e a carga
   sugerida, mas não uma tela de histórico detalhado.
9. Uma ficha nova substitui imediatamente a ativa e começa sem cargas
   sugeridas. Execuções antigas permanecem imutáveis.
10. O registro do corredor funciona offline. Prescrição, busca e vínculo exigem
    comunicação com a API.

---

## Regras de validação

| Campo | Regra |
|-------|-------|
| Nome do exercício | Texto livre entre 2 e 100 caracteres |
| Séries | Inteiro entre 1 e 20 |
| Repetições | Inteiro entre 1 e 100 |
| Carga executada | Quilogramas, até duas casas decimais, entre `0,01` e `999,99` |
| Carga vazia ou `0` | Não é carga; registra `Pulado` após confirmação |
| Nota | Texto livre opcional, no máximo 200 caracteres; começa vazia em cada execução |
| Corrida | Uma descrição livre obrigatória na prescrição; execução usa os campos reais já existentes |

---

## Cenários — Happy Path

```gherkin
Scenario: Personal encontra um corredor e solicita vínculo
  Given que estou autenticado com a role Personal
  And existe um corredor cadastrado com o e-mail "corredor@example.com"
  When busco por "corredor@example.com"
  And envio a solicitação de vínculo
  Then o corredor recebe uma solicitação pendente desse personal
  And eu ainda não vejo fichas, cargas ou notas dele
```

```gherkin
Scenario: Corredor aceita o vínculo
  Given que tenho uma solicitação pendente de um personal
  And não tenho outro vínculo ativo
  When aceito a solicitação
  Then o vínculo fica ativo
  And o personal passa a poder publicar minha ficha e consultar meu histórico
```

```gherkin
Scenario: Personal publica a ficha completa
  Given que tenho vínculo ativo com um corredor
  And preenchi um treino Empurrada com exercícios válidos
  And preenchi um treino Puxada com exercícios válidos
  And preenchi um treino Inferiores com exercícios válidos
  And preenchi um treino Corrida com uma descrição
  When publico a ficha
  Then ela se torna a ficha ativa do corredor imediatamente
  And as cargas dos exercícios começam vazias
```

```gherkin
Scenario: Corredor registra cargas e nota de uma ficha de musculação
  Given que minha ficha ativa contém "Agachamento livre" com 4 séries de 6 repetições
  And a carga de "Agachamento livre" começa vazia
  When informo 60,50 kg
  And adiciono a nota "Ajustar posição dos pés"
  And finalizo o treino
  Then a execução inteira é salva
  And o personal vê 60,50 kg e a nota no histórico de "Agachamento livre"
```

```gherkin
Scenario: Última carga positiva é sugerida no próximo treino da mesma ficha
  Given que executei "Agachamento livre" com 60,50 kg na ficha ativa
  When abro novamente o mesmo treino da mesma ficha
  Then a carga de "Agachamento livre" vem sugerida como 60,50 kg
  And a nota começa vazia
```

```gherkin
Scenario: Personal consulta a evolução de um exercício
  Given que tenho vínculo ativo com o corredor
  And ele registrou várias execuções de "Agachamento livre" na ficha ativa
  When abro o histórico detalhado desse corredor
  Then vejo as execuções em ordem cronológica
  And cada item mostra data, carga, nota quando existir e estado executado ou pulado
```

```gherkin
Scenario: Corredor escolhe uma ficha diferente da sugestão do dia
  Given que o plano semanal sugere Empurrada para hoje
  And minha ficha ativa contém os quatro tipos obrigatórios
  When escolho executar Inferiores
  Then o Steady permite abrir e registrar Inferiores
  And não altera a prescrição ativa
```

```gherkin
Scenario: Execução de corrida reutiliza o registro existente
  Given que a ficha Corrida diz "Moderada com fartlek leve, pace X, tempo estimado Y"
  When escolho executar Corrida
  Then vejo essa descrição como prescrição
  And registro distância, duração, ritmo e esforço reais no formulário existente
  And o personal vê a corrida realizada no histórico do vínculo
```

```gherkin
Scenario: Personal publica um novo conjunto de treinos
  Given que o corredor possui uma ficha ativa com execuções registradas
  When publico outra ficha completa
  Then a nova ficha substitui imediatamente a anterior como ativa
  And todas as cargas da nova ficha começam vazias
  And as execuções da ficha anterior permanecem inalteradas no meu histórico
```

```gherkin
Scenario: Registro de musculação funciona offline
  Given que a ficha ativa já foi carregada no aparelho
  And estou sem conexão
  When preencho as cargas e notas
  And finalizo o treino
  Then a execução inteira entra na fila local como uma unidade
  And recebo confirmação de que o treino foi registrado
  When a conexão retorna e a fila sincroniza
  Then o personal passa a ver a execução uma única vez
```

---

## Cenários — Edge Cases

```gherkin
Scenario: Exercícios sem carga exigem uma única confirmação
  Given que preenchi parte dos exercícios do treino
  And deixei "Supino reto" vazio
  And informei 0 kg em "Desenvolvimento"
  When tento finalizar o treino
  Then vejo uma única confirmação listando "Supino reto" e "Desenvolvimento" como pulados
  And nada é salvo antes da minha decisão
```

```gherkin
Scenario: Corredor confirma exercícios pulados
  Given que a confirmação lista exercícios vazios ou com 0 kg
  When confirmo a finalização
  Then o treino é salvo
  And esses exercícios aparecem como pulados para o personal
  And os exercícios com carga positiva aparecem como executados
```

```gherkin
Scenario: Corredor cancela a confirmação de exercícios pulados
  Given que a confirmação lista exercícios vazios ou com 0 kg
  When cancelo a confirmação
  Then o treino não é salvo
  And continuo no formulário com os valores já digitados
```

```gherkin
Scenario: Exercício pulado volta sem sugestão de carga
  Given que pulei "Supino reto" na última execução da ficha ativa
  When abro novamente o treino Empurrada
  Then a carga de "Supino reto" começa vazia
  And o estado pulado anterior fica visível somente no histórico do personal
```

```gherkin
Scenario: Carga com duas casas decimais é aceita
  Given que estou registrando um exercício
  When informo 17,25 kg
  Then posso finalizar o treino
  And a carga é preservada como 17,25 kg
```

```gherkin
Scenario: Várias solicitações pendentes para o mesmo corredor
  Given que não possuo vínculo ativo
  And recebi solicitações de personals diferentes
  When aceito uma delas
  Then esse vínculo se torna o único ativo
  And as demais solicitações deixam de poder ser aceitas
```

```gherkin
Scenario: Personal acompanha vários corredores
  Given que estou autenticado como Personal
  And vários corredores aceitaram individualmente minhas solicitações
  When abro minha lista de corredores
  Then vejo cada corredor vinculado
  And o histórico de um corredor nunca mistura dados de outro
```

```gherkin
Scenario: Conta com as duas roles recebe as duas áreas
  Given que minha conta possui as roles Corredor e Personal
  When entro no Steady
  Then vejo as funções das duas roles na mesma navegação
  And não preciso trocar manualmente de modo
```

```gherkin
Scenario: Ficha publicada offline ainda não substitui o cache do corredor
  Given que o corredor está offline com a ficha anterior carregada
  And o personal publica uma nova ficha
  When o corredor abre o treino sem sincronizar
  Then continua vendo e executando a ficha anterior
  And a execução fica associada à ficha anterior
  When o aparelho sincroniza
  Then a nova ficha passa a ser a ativa para as próximas execuções
```

```gherkin
Scenario: Treino escolhido livremente mantém a regra de progresso por modalidade
  Given que o plano previa somente musculação hoje
  When executo a ficha Corrida
  Then a corrida é registrada normalmente
  And o dia ainda não fica cumprido como musculação
```

---

## Cenários — Error Cases

```gherkin
Scenario: Personal não vinculado não acessa dados pelo identificador do corredor
  Given que conheço o e-mail e o identificador de um corredor
  And não possuo vínculo ativo com ele
  When tento consultar suas fichas ou execuções diretamente
  Then recebo acesso negado
  And nenhum dado de desempenho é retornado
```

```gherkin
Scenario: Corredor já vinculado fica indisponível para outro personal
  Given que o corredor já possui um vínculo ativo
  When outro personal busca seu e-mail
  Then vê que o corredor está indisponível para novo vínculo
  And não descobre quem é o personal atual
```

```gherkin
Scenario: Busca por e-mail sem cadastro informa que o corredor não existe
  Given que estou autenticado como Personal
  When busco um e-mail que não está cadastrado
  Then vejo "Corredor não encontrado"
  And nenhuma solicitação é criada
```

```gherkin
Scenario: Ficha incompleta não pode ser publicada
  Given que falta um dos tipos Empurrada, Puxada, Inferiores ou Corrida
  When tento publicar a ficha
  Then a publicação é recusada
  And vejo qual tipo obrigatório está faltando
```

```gherkin
Scenario Outline: Prescrição de exercício inválida é recusada
  Given que estou editando um exercício da ficha
  When informo <campo> como <valor>
  Then não posso publicar a ficha
  And vejo uma mensagem de validação no campo

  Examples:
    | campo       | valor                  |
    | nome        | "A"                    |
    | nome        | texto com 101 caracteres |
    | séries      | 0                      |
    | séries      | 21                     |
    | repetições  | 0                      |
    | repetições  | 101                    |
```

```gherkin
Scenario Outline: Carga inválida é recusada
  Given que estou registrando um exercício
  When informo a carga <carga>
  Then não posso finalizar o treino como executado
  And vejo uma mensagem de carga inválida

  Examples:
    | carga       |
    | -1 kg       |
    | 1000 kg     |
    | 10,123 kg   |
    | texto       |
```

```gherkin
Scenario: Nota acima do limite é recusada
  Given que estou registrando um exercício
  When informo uma nota com 201 caracteres
  Then não posso finalizar o treino
  And vejo que a nota aceita no máximo 200 caracteres
```

```gherkin
Scenario: Revogar vínculo remove acesso imediatamente
  Given que existe um vínculo ativo entre corredor e personal
  When qualquer uma das partes encerra o vínculo
  Then o personal perde imediatamente o acesso às fichas, cargas, notas e corridas do corredor
  And o corredor mantém seus dados
```

```gherkin
Scenario: Falha ao publicar não substitui a ficha ativa
  Given que o corredor possui uma ficha ativa
  And a API falha ao receber uma ficha nova
  When o personal tenta publicá-la
  Then vê que a publicação falhou
  And a ficha anterior continua ativa sem alterações
```

```gherkin
Scenario: Falha de sincronização preserva a execução completa na fila
  Given que finalizei um treino offline
  When a sincronização falha temporariamente
  Then todos os exercícios, cargas, notas e estados pulados continuam juntos na fila
  And uma nova tentativa usa a mesma chave de idempotência
```

```gherkin
Scenario: Sessão perdida durante acesso protegido leva ao login
  Given que meu token não pôde ser renovado
  When tento abrir a ficha ou o histórico protegido
  Then sou levado à tela de login
  And execuções pendentes do corredor permanecem preservadas no aparelho
```

---

## Mapping esperado: Cenário → Teste

| Área | Cobertura automatizada esperada |
|------|---------------------------------|
| Vínculo e autorização | Domínio, repository e endpoints: transições, cardinalidade e isolamento por corredor |
| Publicação da ficha | Domínio e API: quatro tipos obrigatórios, validações e substituição atômica |
| Execução de musculação | Domínio, API e app: validação, pulados, sugestão e JSON atômico |
| Corrida prescrita | API e app: descrição da ficha ligada ao registro real existente |
| Offline e idempotência | App e API: fila mantém a execução inteira e servidor deduplica reenvios |
| Histórico do personal | Repository e endpoints: ordem cronológica e vínculo ativo obrigatório |
| UI e navegação | Teste de funções de apresentação; validação manual de telas enquanto a limitação do SDK permanecer |

Todo cenário automatizável deve receber pelo menos um teste no `/implement`. O
mapping final deve listar arquivos e status RED/GREEN reais.

---

## Fora de escopo

- Catálogo ou normalização global de nomes de exercício.
- Carga diferente por série.
- Falha de repetição estruturada.
- Progressão automática ou recomendação fisiológica de carga.
- Prescrição gerada pelo Steady.
- Subscription, cobrança e limites por plano comercial.
- Histórico detalhado na interface do corredor.
- Semântica especial para encerrar e depois recriar o mesmo vínculo.

---

## Decisões técnicas obrigatórias antes do `/implement`

- Criar ADR para roles, vínculo autorizado e isolamento das consultas do
  personal, ampliando a fronteira definida pela ADR-002.
- Criar ADR para ficha ativa substituível versus execuções imutáveis.
- O blueprint deste fluxo está em `blueprint.mermaid` e deve orientar o
  fatiamento da implementação.
