# Análise — STORY-021: Menu da conta também na aba Planejamento

> `/analyze` em 2026-08-29. Pedido: o ícone do usuário, com acesso à opção de
> sair da conta, deve estar também na aba **Planejamento**.

## 1. Scan de código relevante

### Estrutura atual — `src/steady-app`

| Arquivo | Papel hoje | Impacto esperado |
|---------|------------|------------------|
| `app/(tabs)/index.tsx` | Dashboard. Instancia `useAccountMenu`, envolve a tela em `Drawer` e renderiza o avatar como único gatilho | A composição exclusiva da Home precisa virar uma casca compartilhável, sem duplicar as ~30 linhas do drawer |
| `app/(tabs)/planning.tsx` | Aba Planejamento: lista planos e vínculos, sem identidade nem menu | Ganha o avatar no cabeçalho e passa a usar a mesma casca de menu da Dashboard |
| `app/(tabs)/_layout.tsx` | Declara Dashboard, Planejamento e Personal com `headerShown: false` | Pode permanecer intacto se a casca for reutilizada somente nas telas requeridas |
| `src/account/useAccountMenu.ts` | Estado e efeitos de UI: carrega identidade, fecha com BackHandler e conduz saída/confirmacão | Já é reutilizável; não deve ter regra copiada para Planejamento |
| `src/account/AccountMenu.tsx` | Conteúdo visual do drawer: avatar, nome/e-mail, falha e botão “Sair da conta” | Reutilizado sem alteração de comportamento |
| `src/account/signOutAccount.ts` | Regra do ADR-005: sincronizar, confirmar descarte de pendências e sair | Intacto |
| `src/account/accountPresentation.ts` | Normaliza nome, e-mail, foto e fallback do avatar | Intacto |
| `src/ui/Avatar.tsx` | Foto Google com inicial offline/erro | Reutilizado no cabeçalho de Planejamento |
| `app/_layout.tsx` | Stack raiz; login e rotas de planejamento vivem fora/dentro do grupo de abas | Confirma que o pedido pode ficar limitado à tab, sem expor menu no login |

### Dependências envolvidas

- `react-native-drawer-layout` já está instalado e funcionando na Dashboard.
- `expo-router` fornece navegação e mantém o grupo `(tabs)` dentro do Stack que
  já oferece a raiz necessária para gestos.
- Google Sign-In fornece a identidade volátil. Foto continua opcional e com
  fallback local.
- Fila offline, rascunho combinado e cache da ficha participam da saída pelo
  fluxo existente do ADR-005.
- Nenhuma dependência, API ou mudança nativa é necessária.

### Padrões em uso

- **Regra pura separada da UI**: `signOutAccount` decide o resultado;
  `useAccountMenu` traduz o resultado para drawer, diálogo e navegação.
- **Presentational component**: `AccountMenu` recebe dados e callbacks prontos.
- **Adapter de identidade**: `accountPresentation` impede que nome/foto ausentes
  vazem como estados inválidos para a tela.
- **Composição sobre herança** e tokens Nocturne para toda apresentação.

### Achado que define a mudança

O comentário em `app/(tabs)/index.tsx` registra que o drawer foi colocado na
Home porque Planejamento “não tem menu de conta nesta versão”. Portanto, não é
uma limitação técnica: é um recorte de escopo anterior que este pedido revoga.
A regra de saída já está pronta para ser apresentada em outra tela.

## 2. Análise de domínio

### Conceitos existentes

- **Conta apresentada** (`AccountView`): nome, e-mail, inicial e foto opcionais,
  usados somente para exibição.
- **Menu da conta**: superfície local de identidade e ações da sessão.
- **Encerramento de sessão**: tenta sincronizar; se ainda houver registros
  pendentes, exige confirmação antes de descartá-los; falha mantém o corredor
  autenticado e mostra feedback (ADR-005).
- **Aba Planejamento**: lista persistida de pedidos de plano e gestão do vínculo
  com o personal.

### Conceitos novos

Nenhum conceito de domínio. Surge apenas uma segunda **superfície de acesso** ao
menu já existente.

### Regras de negócio

1. O avatar de Planejamento representa a mesma conta autenticada mostrada na
   Dashboard, com o mesmo fallback quando nome/foto estiverem ausentes.
2. Tocar no avatar abre o mesmo menu lateral, incluindo “Sair da conta”.
3. Sair pela aba Planejamento segue integralmente o ADR-005: mesma tentativa de
   sincronização, mesma confirmação de descarte, mesmo tratamento de falha e
   mesmo destino de login.
4. O botão voltar do Android fecha primeiro o menu aberto, sem sair da tab.
5. O menu não aparece no login.
6. A listagem de planos, vínculos e estados de carregamento não muda.

## 3. Direção estratégica

### Abordagem recomendada

Extrair a composição repetível hoje embutida na Home para um componente de
conta, por exemplo `src/account/AccountMenuDrawer.tsx`:

1. O componente instancia `useAccountMenu` uma vez para a tela ativa.
2. Ele configura `Drawer` e renderiza o `AccountMenu` existente.
3. Expõe aos filhos, por render prop ou props pequenas, o `AccountView` e a ação
   `openMenu`, necessários para desenhar o avatar no cabeçalho.
4. Dashboard troca sua composição inline pela casca sem mudança visual.
5. Planejamento usa a mesma casca e adiciona um `Pressable` + `Avatar` no topo.

Essa extração evita duplicar configuração, feedback e ligação de callbacks,
mas não sobe o menu ao layout global. Assim, o escopo permanece explícito:
Dashboard e a tab Planejamento têm menu; login e rotas empilhadas não ganham
drawer acidentalmente.

### Padrão de design

**Componente container + render prop (composição).** O container possui o estado
do drawer e entrega somente `account`/`openMenu` para o cabeçalho específico de
cada tela. `AccountMenu` continua puramente apresentacional e
`signOutAccount` continua sendo a regra única.

Um Context no `(tabs)/_layout.tsx` também funcionaria, mas adicionaria provider,
hook de contexto e estado compartilhado para apenas duas telas. Para o escopo
atual, o container reutilizável é mais simples e mantém cada tab independente.

### Fronteiras

**Dentro do escopo:** avatar na tela-lista da aba Planejamento; abrir/fechar o
mesmo drawer; saída completa conforme ADR-005; refactor da Dashboard para usar a
casca compartilhada; acessibilidade do gatilho; testes das fronteiras puras já
existentes e smoke test das duas tabs.

**Fora do escopo:** exibir avatar nas rotas `/planning/new` e
`/planning/plan`; colocar menu na área Personal ou nas telas de registro;
alterar opções do menu; editar perfil; mudar autenticação; redesenhar o
cabeçalho do documento do plano.

> Interpretação adotada: “na aba de planejamento” é a tela-lista acessada pela
> barra inferior. As rotas empilhadas de criar/visualizar plano não são a aba e
> mantêm seus cabeçalhos próprios.

## 4. Riscos e edge cases

| # | Risco / edge case | Impacto | Mitigação |
|---|-------------------|---------|-----------|
| R1 | Copiar o drawer inteiro para Planejamento cria duas implementações que divergem | Médio | Extrair `AccountMenuDrawer` e reutilizar nas duas telas |
| R2 | Subir o drawer ao Stack raiz expõe menu no login | Alto | Manter a casca somente nas telas autorizadas; não envolver `app/_layout.tsx` |
| R3 | Estado global no layout das tabs pode deixar o drawer aberto ao trocar de aba | Médio | Container local por tela; cada tab controla sua própria abertura |
| R4 | Sair com registros offline pendentes pela nova entrada poderia ignorar a confirmação | Alto | Reusar `useAccountMenu`/`signOutAccount`, sem novo handler de logout |
| R5 | Duplo toque em “Sair” dispara operações concorrentes | Já mitigado | `useAccountMenu` bloqueia enquanto `saindo` é verdadeiro |
| R6 | Foto sem rede ou URL inválida deixa o gatilho invisível | Já mitigado | `Avatar` renderiza inicial antes da foto e mantém a mesma área tocável |
| R7 | Botão voltar fecha a tab em vez do drawer | Já mitigado | Reusar o `BackHandler` de `useAccountMenu` |
| R8 | A Home sofre regressão visual durante o refactor | Médio | Manter tamanho, posição, label acessível e gesto; smoke test Dashboard + Planejamento |
| R9 | Duas tabs montadas podem ler a identidade duas vezes | Baixo | Leitura é local, pequena e sem persistência; aceitar no MVP evita Context prematuro |
| R10 | Harness atual não renderiza telas React Native | Médio para regressão visual | Cobrir lógica pura existente e fazer validação manual no aparelho; não instalar versão incompatível |

### Ambiguidades para a spec

1. **Posição do avatar em Planejamento:** recomenda-se topo direito na mesma
   linha do identificador/título, preservando a hierarquia atual da tela.
2. **Rotas internas de planejamento:** esta análise limita o ícone à tab-lista.
   Se “também” inclui o documento e o formulário, o escopo muda porque essas
   rotas possuem cabeçalhos diferentes no Stack.
3. **Área Personal:** fica fora por não ter sido solicitada; pode virar uma
   decisão futura de navegação global da conta.
