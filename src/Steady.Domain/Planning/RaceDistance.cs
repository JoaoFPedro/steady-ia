namespace Steady.Domain.Planning;

/// <summary>
/// Distância da prova-alvo. Nomes semânticos em vez dos números do formulário
/// ("21.1") para que a linha no banco se leia sozinha — mesma escolha de
/// <c>MuscleGroup</c>. A tradução do valor que o app envia fica na borda da API.
/// </summary>
public enum RaceDistance
{
    FiveK,
    TenK,
    HalfMarathon,
    Marathon,
    Ultra
}
