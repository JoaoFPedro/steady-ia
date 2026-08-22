namespace Steady.Domain.Planning;

/// <summary>
/// A que o corredor tem acesso para o dia de força — define quais exercícios do
/// plano são viáveis (RDL e hip thrust exigem carga externa).
/// </summary>
public enum EquipmentAccess
{
    AcademiaCompleta,
    HalteresCasa,
    PesoCorporal
}
