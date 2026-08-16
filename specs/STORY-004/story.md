# Story: STORY-004 — Tela Conta com saída da sessão

Discovery: — (sem discovery associado, ver *Contexto*)
Análise prévia: [analysis.md](./analysis.md)

## Descrição

Como **corredor que usa o Steady no meu celular**,
Quero **ver em qual conta estou e poder sair dela**,
Para que **eu consiga trocar de conta, emprestar o aparelho ou simplesmente encerrar a sessão sem
desinstalar o app**.

## Contexto

A STORY-003 entregou o app inteiro assumindo **uma conta por aparelho, para sempre**: o
`_layout.tsx` reaproveita silenciosamente a credencial do Google a cada abertura e não existe
nenhum caminho de volta ao login. Quem entrou uma vez está preso àquela conta.

Isso não veio de uma hipótese de produto — apareceu no dogfooding, quando o desenvolvedor precisou
validar o isolamento de dados entre corredores (ADR-002) e não teve como trocar de conta no
aparelho. É uma lacuna operacional de uma story já entregue, por isso não passa por `/discover`.

O `/analyze` mostrou que a parte difícil não é sair do Google — `GoogleSignInSession.signOut()` já
existe e já está correto. A parte difícil é a **fila offline**: ela é global, não guarda dono, e o
token só é anexado no momento do envio. Abrir o caminho de saída sem tratar isso faria os treinos de
um corredor caírem na conta do próximo a entrar no mesmo aparelho — violação direta do mandato
inviolável da Constituição (dados de saúde nunca expostos entre usuários) e corrupção da avaliação
de sobrecarga dos dois (ADR-001).

## Critérios de Aceite

- [ ] Corredor abre uma tela **Conta** a partir da home e vê qual conta Google está autenticada
- [ ] Corredor sai da conta pela tela Conta e é levado à tela de login
- [ ] Antes de encerrar a sessão, o app tenta sincronizar os registros pendentes
- [ ] Se sobrar registro pendente, o corredor é avisado de **quantos** serão perdidos e só sai
      mediante confirmação explícita
- [ ] Cancelar a confirmação preserva a sessão e a fila, sem efeito nenhum
- [ ] **Nenhum registro pendente sobrevive à saída** — nunca é enviado com o token de outro corredor
      (ADR-005)
- [ ] Depois de sair, o histórico de navegação não permite voltar a nenhuma tela autenticada
- [ ] Depois de sair, a próxima abertura do app mostra o login — o app não reautentica sozinho
- [ ] Sair encerra a sessão apenas no aparelho; o consentimento concedido ao Steady no Google é
      preservado

## Fora de Escopo

| Item | Razão |
|------|-------|
| Barra de abas (`Tabs`) | Conta é a segunda tela de navegação do app; uma barra para duas entradas é Abstração Prematura (anti-pattern da Constituição). Reavaliar quando houver uma terceira |
| `revokeAccess()` — revogar o consentimento no Google | Sair deve ser barato de desfazer; revogar faria o Google pedir consentimento de novo a cada retorno |
| Exclusão de conta / direito ao apagamento (LGPD) | Escopo próprio, envolve backend e retenção de dados. Story futura |
| Logout automático por inatividade | Sem requisito; o token do Google já expira e é renovado (ADR-002) |
| Troca rápida entre contas (multi-conta) | Sair + entrar resolve no MVP |
| Preservar a fila por dono (`sub` no item) | Saída **C** da análise. Só se justifica quando um aparelho tiver mais de um corredor real — registrada no ADR-005 como evolução |

## Estimativa

- **Tamanho**: P
- **Complexidade**: Baixa na tela, **Média na fila** — toda a complexidade está na regra de descarte

## Dependências

| Tipo | Descrição | Status |
|------|-----------|--------|
| Story | STORY-003 (app mobile, fila offline, sessão do Google) | Concluída |
| ADR | ADR-002 — autenticação e isolamento por corredor | Accepted |
| ADR | ADR-003 — chave de idempotência | Accepted |
| ADR | **ADR-005 — destino da fila pendente ao encerrar a sessão** | **Pendente — pré-requisito do `/implement`** |
