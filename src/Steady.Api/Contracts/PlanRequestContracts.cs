using Steady.Domain.Planning;

namespace Steady.Api.Contracts;

/// <summary>Pedido de plano como o app envia (STORY-010).</summary>
public sealed record PlanRequestBody(
    string RaceDistance,
    /// <summary>Data da prova em <c>AAAA-MM-DD</c>. O app valida dd/mm/aaaa e normaliza antes de enviar.</summary>
    string RaceDate,
    bool RaceIsFirstTime,
    double LongestRecentRunKm,
    int TrainingDaysPerWeek,
    int? CurrentWeeklyRunningDays,
    double? ReferenceDistanceKm,
    string? ReferenceDuration,
    int? StrengthSessionMinutes,
    string? EquipmentAccess,
    IReadOnlyList<string>? RecurringPainAreas,
    string? PriorInjuries);

public sealed record PlanRequestResponse(
    Guid Id,
    Guid IdempotencyKey,
    string RaceDistance,
    string RaceDate,
    bool RaceIsFirstTime,
    double LongestRecentRunKm,
    int TrainingDaysPerWeek,
    int? CurrentWeeklyRunningDays,
    double? ReferenceDistanceKm,
    string? ReferenceDuration,
    int? StrengthSessionMinutes,
    string? EquipmentAccess,
    IReadOnlyList<string> RecurringPainAreas,
    string? PriorInjuries,
    DateTime CreatedAt);

/// <summary>
/// Tradução entre os valores que o app usa na tela ("21.1", "academia_completa") e os
/// nomes semânticos do domínio (<c>HalfMarathon</c>, <c>AcademiaCompleta</c>).
///
/// Fica na borda de propósito: o domínio e o banco se leem sozinhos, e o app não
/// precisa mudar o vocabulário que já tem em <c>trainingPlanRequest.ts</c>.
/// </summary>
internal static class PlanRequestWire
{
    private static readonly Dictionary<string, RaceDistance> Distancias = new()
    {
        ["5"] = RaceDistance.FiveK,
        ["10"] = RaceDistance.TenK,
        ["21.1"] = RaceDistance.HalfMarathon,
        ["42.2"] = RaceDistance.Marathon,
        ["ultra"] = RaceDistance.Ultra,
    };

    private static readonly Dictionary<string, EquipmentAccess> Equipamentos = new()
    {
        ["academia_completa"] = EquipmentAccess.AcademiaCompleta,
        ["halteres_casa"] = EquipmentAccess.HalteresCasa,
        ["peso_corporal"] = EquipmentAccess.PesoCorporal,
    };

    private static readonly Dictionary<string, PainArea> Dores = new()
    {
        ["canela"] = PainArea.Canela,
        ["joelho"] = PainArea.Joelho,
        ["it_band"] = PainArea.ItBand,
        ["lombar"] = PainArea.Lombar,
        ["tornozelo"] = PainArea.Tornozelo,
        ["panturrilha"] = PainArea.Panturrilha,
        ["nenhuma"] = PainArea.Nenhuma,
    };

    private static readonly Dictionary<RaceDistance, string> DistanciasInverso =
        Distancias.ToDictionary(par => par.Value, par => par.Key);

    private static readonly Dictionary<EquipmentAccess, string> EquipamentosInverso =
        Equipamentos.ToDictionary(par => par.Value, par => par.Key);

    private static readonly Dictionary<PainArea, string> DoresInverso =
        Dores.ToDictionary(par => par.Value, par => par.Key);

    public static bool TryDistancia(string? valor, out RaceDistance distancia) =>
        Distancias.TryGetValue(valor ?? string.Empty, out distancia);

    public static bool TryEquipamento(string? valor, out EquipmentAccess? equipamento)
    {
        equipamento = null;

        if (string.IsNullOrWhiteSpace(valor))
            return true;

        if (!Equipamentos.TryGetValue(valor, out var achado))
            return false;

        equipamento = achado;
        return true;
    }

    public static bool TryDores(IReadOnlyList<string>? valores, out IReadOnlyList<PainArea> dores)
    {
        dores = [];

        if (valores is null || valores.Count == 0)
            return true;

        var traduzidas = new List<PainArea>(valores.Count);

        foreach (var valor in valores)
        {
            if (!Dores.TryGetValue(valor, out var dor))
                return false;

            traduzidas.Add(dor);
        }

        dores = traduzidas;
        return true;
    }

    public static string Escrever(RaceDistance distancia) => DistanciasInverso[distancia];

    public static string? Escrever(EquipmentAccess? equipamento) =>
        equipamento is null ? null : EquipamentosInverso[equipamento.Value];

    public static IReadOnlyList<string> Escrever(IReadOnlyList<PainArea> dores) =>
        dores.Select(dor => DoresInverso[dor]).ToArray();
}
