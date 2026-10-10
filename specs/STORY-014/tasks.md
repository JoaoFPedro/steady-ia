# Tasks — STORY-014

> Spec: [spec.bdd.md](./spec.bdd.md) · Blueprint: [blueprint.mermaid](./blueprint.mermaid)
> Ordem obrigatória: cada frente depende da anterior. Dentro de cada frente,
> TDD cenário a cenário — não avance sem o anterior verde.

## 0. Pré-requisitos (stories separadas, nesta ordem)

- [x] STORY-015 — prescrição de corrida estruturada na ficha (ADR-012).
- [x] STORY-016 — plano do Steady como prescrição no servidor (ADR-013).

> Sequencial, não paralelo: a STORY-016 usa o `RunPrescription` que a STORY-015
> cria. Ambas bloqueiam a frente 3 desta story — sem elas não existe prescrição
> comparável de corrida nem segunda fonte para detectar `ConflitoDePrescricao`.

## 1. Decisões

- [x] ADR-012 — prescrição de corrida estruturada na ficha do personal.
- [x] ADR-013 — plano do Steady persistido como fonte de prescrição.
- [x] ADR-014 — fronteira determinística entre comparação, política e IA.
- [x] ADR-015 — tolerâncias e políticas de aderência versionadas.
- [x] ADR-016 — Claude API como provedor da explicação.
- [x] ADR-018 — outbox transacional para criação durável da revisão.
- [x] ADR-019 — identidade histórica estável do exercício.
- [x] Atualizar `.sdd/memory/DECISIONS.md` e as dependências de `story.md`.

## 2. Tolerâncias e políticas versionadas (ADR-015)

- [x] Modelar `AdherencePolicyVersion` imutável com unicidade da versão vigente.
- [x] Criar migration com o seed da versão 1 e o teste de arranque que falha sem
      versão vigente.
- [x] Cobrir por TDD tolerância por campo, incluindo prescrição em faixa.
- [x] Provar que publicar a versão 2 não reclassifica revisão da versão 1.

## 3. Comparação determinística (ADR-014, passos 1 a 3)

- [x] Resolver a prescrição aplicável à data preservando referência imutável às
      versões de plano e de ficha usadas.
- [x] Provar que ficha publicada depois da execução não é usada na comparação.
- [x] Comparar corrida: conclusão, distância, duração e esforço percebido.
- [x] Comparar musculação: conclusão, exercícios, séries, repetições e carga
      contra a referência mediana do histórico do exercício.
- [x] Marcar campo sem prescrição numérica como `NãoComparável` sem inferência.
- [x] Classificar exercício pulado como não executado.
- [x] Consolidar dia combinado em uma revisão sem ocultar modalidade parcial.
- [x] Detectar `ConflitoDePrescricao` só com faixas comparáveis disjuntas;
      divergência apenas textual não é conflito.
- [x] Classificar `Aderente` sem produzir revisão, card ou chamada ao provedor.

## 4. Política de segurança e ação autorizada (ADR-014, passo 4)

- [x] Implementar a ordem de avaliação da tabela do ADR-014 por TDD.
- [x] `PainLog` na data força `PriorizarRecuperacao` acima de qualquer regra.
- [x] Perguntar dor no encerramento e sincronizar a resposta na mesma unidade
      lógica; dor avulsa posterior não reabre revisão publicada.
- [x] `ConflitoDePrescricao` e `DadosInsuficientes` não produzem ação.
- [ ] Calcular carga prescrita e executada na escala session-RPE da ADR-001.
- [x] Cobrir os casos perigosos do discovery antes de qualquer integração.

## 5. Revisão como fato próprio (ADR-014)

- [x] Modelar `WorkoutReview` com snapshot, versões aplicadas, ação, estado da
      explicação, confirmação e coerência.
- [x] Criar entidade, repositório e migration sem tocar na execução imutável.
- [x] Garantir no máximo uma revisão por execução sob reenvio da mesma chave.
- [x] Gravar execução e evento de outbox na mesma transação; criar a revisão
      fora dela por processamento retomável e idempotente.

## 6. Provedor da explicação (ADR-016)

- [x] Definir a porta `IExplanationProvider` e o duplo em memória.
- [x] Montar o contexto por lista permitida positiva; teste falha em campo novo.
- [x] Provar que e-mail, `sub`, região da dor e dados de outro corredor nunca
      entram no payload.
- [x] Implementar `ClaudeExplanationProvider` com saída estruturada e 15s.
- [x] Validar a saída: ação divergente, diagnóstico, causalidade ou número novo
      são rejeitados sem persistir nem exibir.
- [x] Auditar o incidente sem conteúdo rejeitado nem dado do corredor.
- [x] Falha e timeout deixam a revisão `Indisponivel` sem afetar o treino.
- [x] Ausência de credencial mantém comparação e ação funcionando.

## 7. API da revisão

- [x] Endpoint da revisão mais recente do corredor.
- [x] Endpoint da revisão por execução, para o histórico.
- [x] Endpoint `Entendi` registrando data e hora sem alterar plano ou ficha.
- [x] Endpoint `Tentar novamente`: uma requisição por toque, mesmos fatos e
      versões, sem criar segunda revisão.
- [x] Incluir revisão, ação, `Entendi` e coerência no histórico do personal.
- [x] Negar acesso sem vínculo ativo e provar revogação imediata ao encerrar.

## 8. Coerência com o próximo treino (ADR-015)

- [x] Avaliar coerência na sincronização do próximo treino elegível.
- [x] Registrar a versão da política usada na avaliação.
- [x] Manter `Desconhecida` enquanto não houver próximo treino sincronizado.
- [x] Provar que `NaoCoerente` não invalida o registro nem altera treino futuro.
- [x] Recalcular coerência quando execução offline anterior sincronizar depois,
      ordenando pela data real e preservando o snapshot da revisão.

## 8.1 Identidade histórica do exercício

- [x] Separar `ExerciseKey` estável do id da prescrição.
- [x] Preservar a chave ao editar ou renomear uma linha da ficha.
- [x] Gerar chave nova ao remover e recriar exercício, mesmo com nome igual.
- [x] Em ficha legada, iniciar a chave pelo `ExerciseId` existente e nunca unir
      históricos apenas pelo nome.
- [x] Copiar `DurationSeconds` e `ExerciseKey` para o snapshot da execução.

## 9. Aplicativo

- [x] Criar tipos e leitura da revisão com cache offline.
- [x] Exibir somente a revisão mais recente no card da Dashboard.
- [x] Exibir a revisão do treino no detalhe do histórico.
- [x] Implementar `Entendi` e `Tentar novamente` na revisão.
- [x] Exibir explicação `Indisponivel` sem esconder comparação e ação.
- [x] Abrir pop-up de `ConflitoDePrescricao` na Dashboard; fechar não resolve e
      o mesmo conflito reconhecido não reabre.
- [x] Registrar contestação do corredor quando a revisão não fizer sentido.
- [x] Exibir revisão, ação, `Entendi` e coerência na área do personal.
- [x] Manter o registro offline inalterado, com a revisão aparecendo só depois
      da sincronização.
- [x] Exigir resposta sim/não sobre dor antes de colocar o treino na fila.

## 10. Fechamento

- [ ] Executar cobertura (testes .NET/Jest e typecheck estão verdes).
- [x] Rodar a bateria de casos comuns, incompletos, contraditórios e perigosos.
- [x] Preencher `mapping.md` com cenário → arquivo real e estado RED/GREEN.
- [x] Marcar os critérios de aceite de `story.md`.
- [ ] Executar `/sync` do domínio (`/review` concluído nesta implementação).
