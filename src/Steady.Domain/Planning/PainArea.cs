namespace Steady.Domain.Planning;

/// <summary>
/// Região de dor recorrente. <see cref="Nenhuma"/> existe porque o formulário a
/// oferece como opção explícita, mas não sobrevive à criação do pedido: um
/// <see cref="PlanRequest"/> representa "nenhuma dor" como lista vazia.
/// </summary>
public enum PainArea
{
    Canela,
    Joelho,
    ItBand,
    Lombar,
    Tornozelo,
    Panturrilha,
    Nenhuma
}
