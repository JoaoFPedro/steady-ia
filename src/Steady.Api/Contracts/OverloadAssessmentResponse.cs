namespace Steady.Api.Contracts;

public sealed record OverloadAssessmentResponse(bool HasRisk, string? Suggestion);
