# ADR-001: Regra de detecção de sobrecarga combinada (corrida + musculação)

> **Data**: 2026-08-09
> **Status**: Accepted
> **Story**: STORY-001
> **Decisores**: Jefferson

## Contexto

STORY-001 exige que o Steady alerte o corredor quando a combinação de musculação e corrida indicar risco de sobrecarga (regra de negócio #4 de `specs/STORY-001/spec.bdd.md`). O desenvolvedor não tem formação em fisiologia esportiva — a Lei do Domínio do Steady (`.sdd/PROJECT-CONSTITUTION.md`, princípio #4) exige que toda regra de progressão ou prevenção de lesão seja rastreável a uma fonte reconhecida, via ADR, antes de entrar em produção. Este ADR define e fundamenta essa regra.

## Opções Consideradas

### Opção A: Regra baseada em distância pura (aumento de volume de corrida + musculação de perna pesada)

- **Prós**: Simples de calcular e explicar; dados já capturados (distância de corrida, intensidade de musculação).
- **Contras**: Ignora duração e esforço da corrida — duas corridas de mesma distância podem ter cargas de esforço muito diferentes (ex: ritmo forte vs trote leve). Menos alinhado a frameworks de ciência do treino.

### Opção B: Carga de treino combinada via session-RPE + Acute:Chronic Workload Ratio (ACWR)

- **Prós**: Fundamentado em literatura revisada por pares (Gabbett 2016; Foster 2001), usado em esportes profissionais para exatamente este problema — quantificar risco de lesão combinando modalidades diferentes de treino numa mesma escala. Reaproveita a "regra dos 10%" já adotada na Constituição do projeto, aplicada à carga combinada em vez de só à distância.
- **Contras**: Exige computar uma "carga de treino" (duração × intensidade) por sessão, um passo a mais de modelagem do que distância pura.

## Decisão

Escolhemos **Opção B** porque é a mais rastreável a fontes reconhecidas — exigência inviolável da Lei do Domínio — e representa com mais fidelidade o problema real relatado (dor por acúmulo de estresse entre corrida e musculação, não apenas por volume de corrida isolado).

### Regra definida

**Fontes**:
- Gabbett, T.J. (2016). *"The training-injury prevention paradox: should athletes be training smarter and harder?"* British Journal of Sports Medicine. — modelo Acute:Chronic Workload Ratio (ACWR)
- Foster, C. et al. (2001). *"A new approach to monitoring exercise training."* Journal of Strength and Conditioning Research. — método session-RPE para quantificar carga de treino de forma comparável entre modalidades
- Daniels, J. — *Daniels' Running Formula* — princípio hard/easy (não empilhar dois estímulos de alta carga sem recuperação)
- Regra dos 10% — já adotada na Lei do Domínio do Steady (princípio #1)

**Cálculo**:
1. Cada Sessão de Treino (corrida ou musculação) gera uma **carga de treino** = duração (minutos) × intensidade, numa escala comum de esforço (RPE 1-10 para corrida; leve=3 / moderado=6 / pesado=9 para musculação — mapeamento do método session-RPE de Foster).
2. **Carga de corrida dos últimos 7 dias** = soma da carga de todas as Sessões de Corrida na janela móvel de 7 dias corridos.
3. **Carga de corrida dos 7 dias anteriores** = mesma soma, na janela imediatamente anterior.
4. **Sobrecarga é sinalizada quando**: existe ao menos uma Sessão de Musculação de Perna (Frontal ou Posterior) com intensidade **pesada** nos últimos 7 dias **E** a carga de corrida dos últimos 7 dias é **≥ 110%** da carga de corrida dos 7 dias anteriores.
5. Sem uma janela anterior completa de 7 dias (menos de 14 dias de histórico total), a regra não é avaliada — nenhum alerta é gerado (conforme cenário de edge case já validado na spec).

## Consequências

### Positivas

- Regra rastreável a fontes reconhecidas de ciência do treino, cumprindo o mandato inviolável da Constituição
- Mesma unidade de carga (session-RPE) permite comparar/combinar corrida e musculação sem inventar heurística ad-hoc
- Reaproveita o limiar de 10% já validado no domínio (consistência entre regras)

### Negativas

- Modelagem exige capturar/derivar intensidade em escala numérica (RPE ou mapeamento leve/moderado/pesado → 3/6/9) — um passo a mais de transformação de dados antes de calcular a carga
- O threshold de 110% e o mapeamento leve/moderado/pesado → 3/6/9 são aproximações razoáveis, não validados especificamente para este usuário — sujeitos a calibração conforme uso real (ver seção de aprendizados do discovery)

### Riscos

- Falso negativo (sobrecarga real não detectada porque o padrão não bate exatamente com a regra) → mitigação: o registro de dor (STORY-001) serve como sinal de calibração; se dor continuar ocorrendo sem alerta, a regra deve ser revisada em novo ADR
- Falso positivo (alerta sem sobrecarga real) → mitigação: a sugestão nunca bloqueia o registro (regra de negócio #5), o custo de um falso positivo é baixo

## Referências

- Gabbett, T.J. (2016). *British Journal of Sports Medicine*, 50(5), 273-280.
- Foster, C. et al. (2001). *Journal of Strength and Conditioning Research*, 15(1), 109-115.
- Daniels, J. — *Daniels' Running Formula*
- `.sdd/PROJECT-CONSTITUTION.md` — Lei do Domínio, princípios #1 e #4
- `specs/STORY-001/spec.bdd.md` — regra de negócio #4
