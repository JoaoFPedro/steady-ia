# Tasks — STORY-014

> Spec: [spec.bdd.md](./spec.bdd.md) · Blueprint: [blueprint.mermaid](./blueprint.mermaid)
> Ordem obrigatória: cada frente depende da anterior. Dentro de cada frente,
> TDD cenário a cenário — não avance sem o anterior verde.

## 0. Pré-requisitos (stories separadas, nesta ordem)

- [ ] STORY-015 — prescrição de corrida estruturada na ficha (ADR-012).
- [ ] STORY-016 — plano do Steady como prescrição no servidor (ADR-013).

> Sequencial, não paralelo: a STORY-016 usa o `RunPrescription` que a STORY-015
> cria. Ambas bloqueiam a frente 3 desta story — sem elas não existe prescrição
> comparável de corrida nem segunda fonte para detectar `ConflitoDePrescricao`.

## 1. Decisões

- [x] ADR-012 — prescrição de corrida estruturada na ficha do personal.
- [x] ADR-013 — plano do Steady persistido como fonte de prescrição.
- [x] ADR-014 — fronteira determinística entre comparação, política e IA.
- [x] ADR-015 — tolerâncias e políticas de aderência versionadas.
- [x] ADR-016 — Claude API como provedor da explicação.
- [x] Atualizar `.sdd/memory/DECISIONS.md` e as dependências de `story.md`.

## 2. Tolerâncias e políticas versionadas (ADR-015)

- [ ] Modelar `AdherencePolicyVersion` imutável com unicidade da versão vigente.
- [ ] Criar migration com o seed da versão 1 e o teste de arranque que falha sem
      versão vigente.
- [ ] Cobrir por TDD tolerância por campo, incluindo prescrição em faixa.
- [ ] Provar que publicar a versão 2 não reclassifica revisão da versão 1.

## 3. Comparação determinística (ADR-014, passos 1 a 3)

- [ ] Resolver a prescrição aplicável à data preservando referência imutável às
      versões de plano e de ficha usadas.
- [ ] Provar que ficha publicada depois da execução não é usada na comparação.
- [ ] Comparar corrida: conclusão, distância, duração e esforço percebido.
- [ ] Comparar musculação: conclusão, exercícios, séries, repetições e carga
      contra a referência mediana do histórico do exercício.
- [ ] Marcar campo sem prescrição numérica como `NãoComparável` sem inferência.
- [ ] Classificar exercício pulado como não executado.
- [ ] Consolidar dia combinado em uma revisão sem ocultar modalidade parcial.
- [ ] Detectar `ConflitoDePrescricao` só com faixas comparáveis disjuntas;
      divergência apenas textual não é conflito.
- [ ] Classificar `Aderente` sem produzir revisão, card ou chamada ao provedor.

## 4. Política de segurança e ação autorizada (ADR-014, passo 4)

- [ ] Implementar a ordem de avaliação da tabela do ADR-014 por TDD.
- [ ] `PainLog` na data força `PriorizarRecuperacao` acima de qualquer regra.
- [ ] `ConflitoDePrescricao` e `DadosInsuficientes` não produzem ação.
- [ ] Calcular carga prescrita e executada na escala session-RPE da ADR-001.
- [ ] Cobrir os casos perigosos do discovery antes de qualquer integração.

## 5. Revisão como fato próprio (ADR-014)

- [ ] Modelar `WorkoutReview` com snapshot, versões aplicadas, ação, estado da
      explicação, confirmação e coerência.
- [ ] Criar entidade, repositório e migration sem tocar na execução imutável.
- [ ] Garantir no máximo uma revisão por execução sob reenvio da mesma chave.
- [ ] Criar a revisão após a persistência da execução, fora da transação.

## 6. Provedor da explicação (ADR-016)

- [ ] Definir a porta `IExplanationProvider` e o duplo em memória.
- [ ] Montar o contexto por lista permitida positiva; teste falha em campo novo.
- [ ] Provar que e-mail, `sub`, região da dor e dados de outro corredor nunca
      entram no payload.
- [ ] Implementar `ClaudeExplanationProvider` com saída estruturada e 15s.
- [ ] Validar a saída: ação divergente, diagnóstico, causalidade ou número novo
      são rejeitados sem persistir nem exibir.
- [ ] Auditar o incidente sem conteúdo rejeitado nem dado do corredor.
- [ ] Falha e timeout deixam a revisão `Indisponivel` sem afetar o treino.
- [ ] Ausência de credencial mantém comparação e ação funcionando.

## 7. API da revisão

- [ ] Endpoint da revisão mais recente do corredor.
- [ ] Endpoint da revisão por execução, para o histórico.
- [ ] Endpoint `Entendi` registrando data e hora sem alterar plano ou ficha.
- [ ] Endpoint `Tentar novamente`: uma requisição por toque, mesmos fatos e
      versões, sem criar segunda revisão.
- [ ] Incluir revisão, ação, `Entendi` e coerência no histórico do personal.
- [ ] Negar acesso sem vínculo ativo e provar revogação imediata ao encerrar.

## 8. Coerência com o próximo treino (ADR-015)

- [ ] Avaliar coerência na sincronização do próximo treino elegível.
- [ ] Registrar a versão da política usada na avaliação.
- [ ] Manter `Desconhecida` enquanto não houver próximo treino sincronizado.
- [ ] Provar que `NaoCoerente` não invalida o registro nem altera treino futuro.

## 9. Aplicativo

- [ ] Criar tipos e leitura da revisão com cache offline.
- [ ] Exibir somente a revisão mais recente no card da Dashboard.
- [ ] Exibir a revisão do treino no detalhe do histórico.
- [ ] Implementar `Entendi` e `Tentar novamente` na revisão.
- [ ] Exibir explicação `Indisponivel` sem esconder comparação e ação.
- [ ] Abrir pop-up de `ConflitoDePrescricao` na Dashboard; fechar não resolve e
      o mesmo conflito reconhecido não reabre.
- [ ] Registrar contestação do corredor quando a revisão não fizer sentido.
- [ ] Exibir revisão, ação, `Entendi` e coerência na área do personal.
- [ ] Manter o registro offline inalterado, com a revisão aparecendo só depois
      da sincronização.

## 10. Fechamento

- [ ] Executar testes .NET e Jest, typecheck e cobertura.
- [ ] Rodar a bateria de casos comuns, incompletos, contraditórios e perigosos.
- [ ] Preencher `mapping.md` com cenário → arquivo real e estado RED/GREEN.
- [ ] Marcar os critérios de aceite de `story.md`.
- [ ] Executar `/review` com OWASP Top 10 e `/sync` do domínio.
