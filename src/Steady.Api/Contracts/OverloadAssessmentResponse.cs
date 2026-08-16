namespace Steady.Api.Contracts;

/// <param name="HasSufficientHistory">
/// <c>false</c> enquanto o histórico não cobre a janela que o ADR-001 exige. O cliente
/// exibe "reunindo dados" em vez de "sem risco", sem conhecer o limiar (ADR-004).
/// </param>
public sealed record OverloadAssessmentResponse(bool HasRisk, string? Suggestion, bool HasSufficientHistory);
