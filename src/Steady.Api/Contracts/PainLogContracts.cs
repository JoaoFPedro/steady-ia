namespace Steady.Api.Contracts;

public sealed record PainLogRequest(DateOnly Date, string Region);

public sealed record PainLogResponse(Guid Id, DateOnly Date, string Region);
