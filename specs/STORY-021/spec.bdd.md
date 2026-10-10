# Spec BDD: STORY-021 — Menu da conta também na aba Planejamento

> **Story**: [story.md](./story.md)
> **Status**: Implemented · 2026-08-29
> **Autor**: Codex (Produto & Design)
> **Revisor**: Jefferson (aprovada em conversa)

---

## Feature: Acesso à conta pela aba Planejamento

A tela principal de Planejamento passa a oferecer o mesmo avatar e menu lateral
da Dashboard, permitindo encerrar a sessão sem abandonar o contexto da tab.

### Regras de Negócio

1. O avatar aparece no topo direito da tela-lista da tab **Planejamento**, na
   mesma linha visual do cabeçalho da tela.
2. O avatar apresenta a mesma conta autenticada da Dashboard: foto do Google
   quando disponível e inicial determinística como base/fallback.
3. O avatar é o único gatilho visível do menu e possui nome acessível “Abrir
   menu da conta”; o gesto da borda continua permitido pelo drawer.
4. O drawer de Planejamento possui o mesmo conteúdo e comportamento do drawer
   da Dashboard: avatar, nome quando disponível, e-mail quando disponível,
   explicação local e botão “Sair da conta”.
5. Não existe uma segunda implementação da regra de saída. Planejamento reutiliza
   `useAccountMenu` e `signOutAccount`, preservando o ADR-005.
6. Sem pendências, uma saída bem-sucedida fecha o menu, limpa o cache privado da
   ficha e leva ao login.
7. Com registros offline pendentes, o corredor decide entre cancelar e sair
   descartando. Cancelar mantém menu, sessão e registros; confirmar limpa os
   registros antes de sair.
8. Se a saída nativa falhar, o corredor continua autenticado, o menu permanece
   utilizável e exibe “Não foi possível sair”.
9. Enquanto a saída está em andamento, novos toques não iniciam outra operação.
10. No Android, voltar com o drawer aberto fecha somente o drawer.
11. A presença do menu não altera carregamento, lista de planos, criação de
    plano, aceite ou encerramento de vínculo com personal.
12. O avatar não é adicionado ao login, à área Personal nem às rotas empilhadas
    `/planning/new` e `/planning/plan`.
13. A Dashboard continua com o mesmo avatar, posição e comportamento após a
    extração da casca compartilhada.

---

### Cenários — Happy Path

```gherkin
Scenario: Corredor encontra sua conta na aba Planejamento
  Given que o corredor está autenticado
  When abre a aba "Planejamento"
  Then vê o avatar da sua conta no topo direito
  And o avatar pode ser acionado com o nome acessível "Abrir menu da conta"
```

```gherkin
Scenario: Corredor abre o menu da conta em Planejamento
  Given que o corredor está na aba "Planejamento"
  When toca no avatar
  Then o menu lateral abre pela esquerda
  And mostra a mesma identidade exibida na Dashboard
  And oferece a ação "Sair da conta"
```

```gherkin
Scenario: Corredor sai sem registros pendentes pela aba Planejamento
  Given que o menu da conta está aberto em Planejamento
  And não há registros offline pendentes
  When toca em "Sair da conta"
  Then o aplicativo tenta sincronizar antes de sair
  And encerra a sessão neste aparelho
  And fecha o menu
  And navega para o login
```

```gherkin
Scenario: Dashboard preserva o menu existente
  Given que a casca do menu passou a ser compartilhada
  When o corredor abre a Dashboard e toca no avatar
  Then o menu da conta abre como antes
  And oferece a mesma ação de saída
```

---

### Cenários — Edge Cases

```gherkin
Scenario: Conta sem foto mantém um gatilho visível
  Given que a conta Google não possui foto ou a imagem não carrega
  When o corredor abre a aba "Planejamento"
  Then vê a inicial de fallback no avatar
  And consegue abrir o menu pelo mesmo local
```

```gherkin
Scenario: Voltar no Android fecha o menu de Planejamento
  Given que o drawer da conta está aberto na aba "Planejamento"
  When o corredor pressiona o botão voltar do Android
  Then o drawer fecha
  And a aba "Planejamento" continua aberta
```

```gherkin
Scenario: Corredor cancela saída com registros pendentes
  Given que há registros offline pendentes
  And o menu da conta está aberto em Planejamento
  When toca em "Sair da conta"
  And escolhe "Cancelar" no diálogo
  Then permanece autenticado
  And os registros pendentes são preservados
  And o botão de saída volta a ficar disponível
```

```gherkin
Scenario: Corredor confirma descarte dos registros pendentes
  Given que há registros offline pendentes
  And o menu da conta está aberto em Planejamento
  When toca em "Sair da conta"
  And escolhe "Sair mesmo assim"
  Then os registros pendentes e o rascunho combinado são apagados
  And somente depois a sessão é encerrada
  And o aplicativo navega para o login
```

```gherkin
Scenario: Rotas internas de planejamento mantêm seus cabeçalhos
  Given que o avatar existe na tela principal da tab Planejamento
  When o corredor abre a criação ou o documento de um plano
  Then essas rotas mantêm seus cabeçalhos atuais
  And não exibem um novo avatar da conta
```

---

### Cenários — Error Cases

```gherkin
Scenario: Saída nativa falha a partir de Planejamento
  Given que o menu da conta está aberto na aba "Planejamento"
  And o provedor nativo não consegue encerrar a sessão
  When o corredor toca em "Sair da conta"
  Then permanece autenticado
  And o menu informa "Não foi possível sair"
  And permite tentar novamente
```

---

## Mapping: Cenário → Teste

| Cenário | Arquivo de Teste | Status |
|---------|------------------|--------|
| Sair sem pendências | `src/steady-app/src/account/__tests__/signOutAccount.test.ts` | 🟢 Green (regressão) |
| Cancelar saída com pendências | `src/steady-app/src/account/__tests__/signOutFeedback.test.ts` + validação manual do diálogo | 🟢 Green / 🟢 inspeção · smoke recomendado |
| Confirmar descarte antes de sair | `src/steady-app/src/account/__tests__/discardOnSignOut.test.ts` | 🟢 Green (regressão) |
| Falha nativa mantém sessão e permite nova tentativa | `src/steady-app/src/account/__tests__/signOutAccount.test.ts` e `signOutFeedback.test.ts` | 🟢 Green (regressão) |
| Identidade e fallback do avatar | `src/steady-app/src/account/__tests__/accountPresentation.test.ts` + inspeção do componente compartilhado | 🟢 Green · smoke recomendado |
| Avatar abre o menu em Planejamento | Inspeção de `PlanningScreen` + `AccountMenuButton` | 🟢 Conforme · smoke recomendado |
| Voltar fecha o drawer | Reuso de `useAccountMenu` em Planejamento | 🟢 Conforme · smoke Android recomendado |
| Dashboard não regride | Dashboard usa a mesma casca e o mesmo botão extraídos | 🟢 Conforme · smoke recomendado |
| Rotas internas permanecem sem avatar | Inspeção de imports em `app/planning/*` | 🟢 Conforme |

> O projeto não possui harness compatível para renderização React Native nesta
> versão do Expo. A lógica crítica de saída e identidade continua coberta por
> Jest; posicionamento, gesto e navegação do drawer exigem smoke test.

---

## Notas de Especificação

- “Aba Planejamento” significa somente a tela-lista acessada pela barra
  inferior. `/planning/new` e `/planning/plan` não recebem o avatar.
- O avatar fica no topo direito. A Dashboard preserva sua posição atual.
- A implementação deve extrair a composição do drawer para evitar cópia entre
  as tabs, mas não deve criar estado global de conta no Stack raiz.
- Fora do escopo: menu na área Personal, novas opções de perfil, edição de
  conta, mudança na autenticação ou no ADR-005.
