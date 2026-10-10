using System.Net.Http.Json;
using System.Text.Json;
using Steady.Domain.Adherence;

namespace Steady.Api.Services;

public sealed class ClaudeExplanationProvider(HttpClient httpClient, IConfiguration configuration)
    : IExplanationProvider
{
    public async Task<StructuredExplanation?> ExplainAsync(
        ExplanationContext context, CancellationToken cancellationToken)
    {
        var apiKey = configuration["Anthropic:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey)) return null;

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        request.Headers.Add("x-api-key", apiKey);
        request.Headers.Add("anthropic-version", "2023-06-01");
        request.Content = JsonContent.Create(new
        {
            model = configuration["Anthropic:Model"] ?? "claude-sonnet-4-5-20250929",
            max_tokens = 600,
            system = "Explique somente os fatos recebidos em português. Não diagnostique, não atribua causa e não introduza números.",
            messages = new[] { new { role = "user", content = JsonSerializer.Serialize(context) } },
            tools = new[]
            {
                new
                {
                    name = "submit_review",
                    description = "Entrega a explicação estruturada da revisão.",
                    input_schema = new
                    {
                        type = "object",
                        additionalProperties = false,
                        properties = new
                        {
                            divergences = new { type = "array", items = new { type = "string" } },
                            possibleImpacts = new { type = "array", items = new { type = "string" } },
                            action = new { type = "string", @enum = Enum.GetNames<AuthorizedAction>() },
                            painObservation = new { type = new[] { "string", "null" } }
                        },
                        required = new[] { "divergences", "possibleImpacts", "action", "painObservation" }
                    }
                }
            },
            tool_choice = new { type = "tool", name = "submit_review" }
        });

        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode) return null;
        using var document = await JsonDocument.ParseAsync(
            await response.Content.ReadAsStreamAsync(cancellationToken), cancellationToken: cancellationToken);
        var toolUse = document.RootElement.GetProperty("content").EnumerateArray()
            .FirstOrDefault(block => block.GetProperty("type").GetString() == "tool_use");
        if (toolUse.ValueKind == JsonValueKind.Undefined) return null;
        var input = toolUse.GetProperty("input");
        if (!Enum.TryParse<AuthorizedAction>(input.GetProperty("action").GetString(), out var action)) return null;

        return new StructuredExplanation(
            input.GetProperty("divergences").EnumerateArray().Select(item => item.GetString() ?? "").ToArray(),
            input.GetProperty("possibleImpacts").EnumerateArray().Select(item => item.GetString() ?? "").ToArray(),
            action,
            input.GetProperty("painObservation").ValueKind == JsonValueKind.Null
                ? null
                : input.GetProperty("painObservation").GetString());
    }
}
