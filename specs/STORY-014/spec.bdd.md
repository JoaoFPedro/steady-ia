# Spec BDD: STORY-014 — Revisão de aderência após o treino com IA

> **Story**: [story.md](./story.md)
> **Discovery**: [../../.discovery/DISC-005-revisao-de-aderencia-pos-treino/](../../.discovery/DISC-005-revisao-de-aderencia-pos-treino/)
> **Status**: In Review
> **Autor**: Jefferson com Codex
> **Data**: 2026-08-28

---

## Feature: Revisão da execução em relação ao treino prescrito

Depois que um treino é sincronizado, o Steady compara de forma determinística
o que estava prescrito com o que foi executado. Somente uma divergência acima
das tolerâncias vigentes gera revisão. A IA explica os fatos calculados e os
possíveis impactos, enquanto a ação final permanece limitada pela política de
segurança a `Manter`, `ReduzirCarga` ou `PriorizarRecuperacao`.

### Decisões de produto

1. A revisão não simplifica nem substitui o registro atual; ela acontece depois
   da persistência e da sincronização.
2. Somente divergências materiais geram revisão. Aderência integral e variações
   dentro da tolerância não geram alerta, card ou chamada à IA.
3. Tolerâncias são configuráveis por campo, versionadas e rastreáveis. Cada
   comparação preserva a versão aplicada para continuar reproduzível.
4. A comparação usa a prescrição aplicável ao treino executado, preservando a
   versão da ficha e o contexto do plano; uma publicação posterior não reescreve
   a revisão.
5. Corrida compara conclusão, distância, duração e esforço percebido.
   Musculação compara conclusão, exercícios, séries, repetições e cargas.
6. Em dia combinado, corrida e musculação são avaliadas separadamente e
   consolidadas em uma única revisão do dia.
7. Plano do Steady e ficha do personal têm a mesma autoridade. Se prescreverem
   corridas incompatíveis para o mesmo dia, o sistema mostra conflito e não
   escolhe uma fonte nem recomenda uma ação.
8. Qualquer `PainLog` do corredor na mesma data da execução tem precedência e
   força `PriorizarRecuperacao`, pois o domínio ainda não possui intensidade da
   dor.
9. Diferenças, classificação, política de segurança e ação permitida são
   determinísticas. A IA redige uma explicação a partir desses fatos e nunca
   pode elevar ou substituir a ação autorizada.
10. A revisão não diagnostica lesão, não atribui causalidade e não altera plano,
    ficha ou próximo treino.
11. A Dashboard mostra somente a revisão mais recente. Cada revisão permanece
    vinculada ao treino em seu histórico.
12. O corredor confirma leitura com `Entendi`; não escolhe uma decisão no MVP.
    A coerência compara o próximo treino elegível com a recomendação mostrada.
13. Ausência de próximo registro produz estado `Desconhecida`, nunca recuperação.
14. O personal com vínculo ativo vê revisão completa, recomendação, confirmação
    `Entendi` e coerência. Sem vínculo ativo, não vê nenhum desses dados.
15. Registro offline continua imediato. A revisão nasce pendente e só é
    processada depois que a execução sincroniza.
16. Falha da IA não afeta o treino. A nova tentativa só ocorre quando o corredor
    toca em `Tentar novamente` e reutiliza os mesmos fatos determinísticos.

### Vocabulário observável

| Termo | Significado |
|-------|-------------|
| `Aderente` | Todas as diferenças estão dentro das tolerâncias da versão aplicada |
| `Divergente` | Pelo menos uma diferença excede a tolerância aplicável |
| `ConflitoDePrescricao` | Plano do Steady e ficha do personal prescrevem corridas incompatíveis no mesmo dia |
| `PendenteDeSincronizacao` | Execução existe apenas na fila local; ainda não pode ser revisada no servidor |
| `PendenteDeIA` | Comparação divergente foi calculada, mas a explicação ainda não foi concluída |
| `Entendida` | Corredor tocou em `Entendi` na revisão |
| `Coerente` | Próximo treino observável corresponde à recomendação segundo a política versionada |
| `NaoCoerente` | Próximo treino observável não corresponde à recomendação segundo a política versionada |
| `Desconhecida` | Ainda não existe próximo treino observável suficiente para medir coerência |

---

## Cenários — Happy Path

```gherkin
Scenario: Corrida divergente gera revisão na Dashboard e no histórico
  Given que a prescrição aplicável pede uma corrida de 10 km em 60 minutos com esforço 6
  And a versão de tolerâncias vigente considera material a execução informada
  When registro 8 km em 55 minutos com esforço 8
  And o treino sincroniza com sucesso
  Then o Steady classifica a execução como Divergente
  And a revisão lista as diferenças de distância, duração e esforço
  And apresenta uma recomendação autorizada pela política de segurança
  And a revisão aparece como o card mais recente da Dashboard
  And a mesma revisão aparece no detalhe desse treino no histórico
```

```gherkin
Scenario: Musculação divergente compara prescrição e execução detalhadas
  Given que a ficha aplicável prescreve "Agachamento" com 4 séries de 6 repetições
  And a execução registra 3 séries de 5 repetições com carga diferente da referência comparável
  And essas diferenças excedem as tolerâncias vigentes
  When a execução sincroniza
  Then a revisão identifica as divergências de séries, repetições e carga
  And preserva separadamente os valores prescritos e executados
  And apresenta apenas fatos calculados pelo Steady na explicação
```

```gherkin
Scenario: Dia combinado produz uma única revisão com duas modalidades
  Given que o dia prescreve musculação e corrida
  And a musculação executada está dentro das tolerâncias
  And a corrida executada possui uma divergência material
  When o registro combinado sincroniza atomicamente
  Then existe uma única revisão para o dia
  And a revisão identifica musculação como aderente
  And identifica a divergência da corrida
  And nenhuma modalidade é omitida do contexto apresentado
```

```gherkin
Scenario: Dor no mesmo dia força priorizar recuperação
  Given que existe uma execução divergente em uma data
  And o corredor possui um PainLog em qualquer região nessa mesma data
  When a revisão é produzida
  Then a recomendação é PriorizarRecuperacao
  And a revisão informa que houve registro de dor sem diagnosticar causa ou lesão
  And nenhuma saída da IA pode substituir essa recomendação por Manter ou ReduzirCarga
```

```gherkin
Scenario: Corredor confirma que leu a revisão
  Given que uma revisão ainda não foi confirmada
  When o corredor toca em "Entendi"
  Then a revisão recebe o estado Entendida com data e hora
  And o treino, a ficha e o plano permanecem inalterados
  And a confirmação fica visível no histórico do treino
```

```gherkin
Scenario: Próximo treino coerente com a recomendação é medido
  Given que uma revisão recomendou ReduzirCarga
  And sua coerência está Desconhecida
  When o próximo treino elegível é sincronizado
  And sua execução satisfaz a política versionada de redução de carga
  Then a coerência da revisão passa a Coerente
  And a avaliação registra a versão da política usada
```

```gherkin
Scenario: Personal vinculado consulta a revisão completa
  Given que o personal possui vínculo ativo com o corredor
  And o corredor possui uma revisão processada
  When o personal abre o histórico desse corredor
  Then vê a comparação completa e a explicação
  And vê a recomendação apresentada ao corredor
  And vê se o corredor tocou em "Entendi"
  And vê a coerência ou o estado Desconhecida do próximo treino
```

---

## Cenários — Edge Cases

```gherkin
Scenario: Treino aderente não gera revisão
  Given que existe uma prescrição aplicável
  And todos os valores executados estão dentro das tolerâncias vigentes
  When o treino sincroniza
  Then a execução é classificada como Aderente
  And nenhuma chamada à IA é solicitada
  And nenhum card de revisão é criado para esse treino
  And o histórico preserva o treino sem uma revisão de divergência
```

```gherkin
Scenario: Pequena variação fica dentro da tolerância configurada
  Given que a versão vigente define tolerâncias para distância, duração, esforço, séries, repetições e carga
  And a execução varia somente dentro desses limites
  When a aderência é calculada
  Then o resultado é Aderente
  And a versão das tolerâncias usada fica auditável
```

```gherkin
Scenario: Alterar tolerâncias não reclassifica revisão existente
  Given que uma revisão foi calculada com a versão 1 das tolerâncias
  When a configuração ativa muda para a versão 2
  Then a revisão existente preserva sua classificação original
  And continua informando que usou a versão 1
  And somente comparações futuras usam a versão 2
```

```gherkin
Scenario: Nova ficha não muda a prescrição de uma execução anterior
  Given que um treino foi executado sob uma versão da ficha
  And o personal publicou outra ficha antes do processamento da revisão
  When a revisão da execução anterior é processada
  Then ela usa a versão da ficha aplicável à execução
  And não compara o treino antigo com a ficha nova
```

```gherkin
Scenario: Plano e ficha possuem corridas conflitantes
  Given que o plano do Steady prescreve uma corrida para o dia
  And a ficha do personal prescreve uma corrida incompatível para o mesmo dia
  When o Steady prepara a comparação
  Then o resultado é ConflitoDePrescricao
  And nenhuma das prescrições prevalece
  And nenhuma recomendação é gerada
  And o corredor vê um pop-up de conflito ao abrir a Dashboard
  And o conflito permanece acessível no card mais recente e no histórico
```

```gherkin
Scenario: Fechar o pop-up não resolve o conflito
  Given que o corredor está vendo o pop-up de ConflitoDePrescricao
  When fecha o pop-up
  Then pode continuar usando o aplicativo
  And nenhum plano ou ficha é alterado
  And o conflito continua registrado no histórico
  And o mesmo conflito já reconhecido não abre outro pop-up automaticamente
```

```gherkin
Scenario: Dashboard mostra somente a revisão mais recente
  Given que o corredor possui várias revisões processadas
  When abre a Dashboard
  Then vê somente a revisão de data de execução mais recente no card
  And encontra todas as revisões anteriores nos respectivos treinos do histórico
```

```gherkin
Scenario: Exercício pulado é uma divergência observável
  Given que a ficha prescreve um exercício
  And o corredor o confirmou como pulado na execução
  When a aderência é calculada
  Then o exercício é classificado como não executado
  And a revisão mostra o exercício prescrito e o estado pulado
```

```gherkin
Scenario: Campo não comparável não é inventado
  Given que uma prescrição livre não contém um valor estruturado de distância ou duração
  When a comparação é calculada
  Then o campo ausente fica marcado como NãoComparável
  And a IA não infere um valor que não foi prescrito
  And os demais campos comparáveis continuam sendo avaliados
```

```gherkin
Scenario: Ausência de próximo treino mantém coerência desconhecida
  Given que uma revisão possui recomendação
  And ainda não existe outro treino elegível sincronizado
  When o corredor ou o personal consulta a revisão
  Then a coerência aparece como Desconhecida
  And o Steady não interpreta ausência de registro como recuperação
```

```gherkin
Scenario: Próximo treino não coerente atualiza a métrica sem punir o corredor
  Given que uma revisão possui recomendação
  When o próximo treino elegível sincronizado não satisfaz a política correspondente
  Then a coerência passa a NaoCoerente
  And o registro seguinte permanece válido e imutável
  And o sistema não altera automaticamente treinos futuros
```

```gherkin
Scenario: Registro offline aguarda sincronização antes da revisão
  Given que o corredor está sem conexão
  When finaliza um treino divergente
  Then o treino entra na fila local com estado PendenteDeSincronizacao
  And recebe a confirmação imediata já existente
  And nenhuma revisão é fabricada apenas no aparelho
  When a conexão retorna e a execução sincroniza uma única vez
  Then a comparação é iniciada no servidor
  And a revisão processada passa a aparecer na Dashboard e no histórico
```

---

## Cenários — Segurança, autorização e erros

```gherkin
Scenario: Saída da IA em desacordo com a política é rejeitada
  Given que a política determinística autorizou PriorizarRecuperacao
  When o provedor devolve uma explicação que recomenda manter o treino
  Then essa saída não é exibida ao corredor nem ao personal
  And a revisão fica indisponível com opção de Tentar novamente
  And o incidente fica auditável sem expor dados de outro corredor
```

```gherkin
Scenario: IA tenta diagnosticar ou atribuir causa à dor
  Given que existe um PainLog na data da execução
  When a saída da IA afirma uma lesão ou uma causa para a dor
  Then a saída é rejeitada
  And nenhuma afirmação diagnóstica é persistida ou exibida
  And a recomendação determinística PriorizarRecuperacao permanece preservada
```

```gherkin
Scenario: Provedor de IA falha sem afetar o treino
  Given que uma divergência determinística foi calculada
  When o provedor de IA falha ou excede o tempo limite
  Then o treino continua sincronizado uma única vez
  And a revisão mostra que a explicação está indisponível
  And exibe a ação "Tentar novamente"
  And nenhuma nova tentativa automática é iniciada
```

```gherkin
Scenario: Corredor solicita nova tentativa da explicação
  Given que a explicação da revisão está indisponível
  When o corredor toca em "Tentar novamente"
  Then uma única nova solicitação é iniciada
  And reutiliza a comparação e as versões de regras originais
  And não duplica o treino nem cria outra revisão para a mesma execução
```

```gherkin
Scenario: Reenvio idempotente não duplica a revisão
  Given que a execução e sua revisão já foram persistidas
  When a mesma chave de idempotência é reenviada
  Then existe somente uma execução
  And existe somente uma revisão vinculada a ela
```

```gherkin
Scenario: Personal sem vínculo ativo não acessa revisão
  Given que um personal não possui vínculo ativo com o corredor
  When tenta consultar a revisão por qualquer identificador conhecido
  Then o acesso é negado
  And nenhum fato, texto, recomendação, confirmação ou métrica é retornado
```

```gherkin
Scenario: Encerrar vínculo remove acesso às revisões
  Given que um personal vê revisões por possuir vínculo ativo
  When o vínculo é encerrado
  Then o acesso do personal às revisões e métricas é removido imediatamente
  And o corredor continua vendo suas próprias revisões no histórico
```

```gherkin
Scenario: Contexto enviado à IA contém somente dados autorizados
  Given que vários corredores possuem treinos e revisões
  When uma revisão é solicitada para um corredor
  Then o contexto contém somente sua prescrição, execução, regras aplicáveis e PainLog da mesma data
  And não contém e-mail, Google sub, dados de outro corredor ou histórico não necessário
```

```gherkin
Scenario: Dados insuficientes impedem recomendação inventada
  Given que os campos disponíveis não permitem classificar com segurança a divergência
  And não existe uma regra determinística que autorize uma ação
  When a revisão é preparada
  Then o Steady informa que os dados são insuficientes
  And não solicita à IA que escolha entre Manter, ReduzirCarga ou PriorizarRecuperacao
  And nenhuma recomendação é exibida
```

---

## Mapping esperado: Cenário → Teste

| Área | Cobertura automatizada esperada |
|------|---------------------------------|
| Comparação de corrida | Domínio: distância, duração, esforço, tolerâncias e campos não comparáveis |
| Comparação de musculação | Domínio: exercício, séries, repetições, carga e pulados |
| Dia combinado | Domínio e API: consolidação sem ocultar modalidade parcial |
| Regras versionadas | Domínio e persistência: reprodução da classificação original |
| Dor e segurança | Domínio/API: precedência de recuperação e bloqueio de saída incompatível |
| Conflito de prescrição | Domínio, API e app: sem precedência, sem recomendação, pop-up e histórico |
| Orquestração de IA | API: saída estruturada, validação, timeout e retry manual |
| Offline e idempotência | App/API: pendência, sincronização eventual e revisão única |
| Dashboard e histórico | App: revisão mais recente versus coleção completa por treino |
| Compreensão e coerência | API/app: `Entendi`, próximo treino e estado desconhecido |
| Visibilidade do personal | Repository/endpoints: vínculo ativo, isolamento e revogação imediata |
| Privacidade do provedor | API: minimização e isolamento do contexto enviado |

Todo cenário automatizável deve receber pelo menos um teste no `/implement`.
O mapping final deve listar os arquivos reais e seus estados RED/GREEN.

---

## Decisões técnicas obrigatórias antes do `/implement`

- Criar ADR para a fronteira entre comparação determinística, política de
  segurança e explicação por IA.
- Definir fontes reconhecidas para as regras que autorizam `Manter`,
  `ReduzirCarga` e `PriorizarRecuperacao`.
- Definir o contrato versionado das tolerâncias e da política de coerência.
- Definir provedor, retenção, redaction, timeout e formato de saída estruturada.
- Preservar snapshot ou referência imutável da prescrição aplicável à execução.
- Modelar revisão e confirmação como fatos próprios; nunca alterar a execução
  imutável já existente.

## Fora de escopo

- Alteração automática de plano, ficha ou treino futuro.
- Diagnóstico, tratamento ou atribuição causal de dor.
- Chat aberto e perguntas livres ao modelo.
- Plano ou ficha gerados por IA.
- Wearables, sono, HRV e frequência cardíaca.
- Reprocessamento histórico em massa.
- Personal sem vínculo ativo ou compartilhamento público de revisões.
