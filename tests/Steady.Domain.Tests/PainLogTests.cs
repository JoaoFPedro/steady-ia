using System;
using Steady.Domain.Training;
using Xunit;

namespace Steady.Domain.Tests;

public class PainLogTests
{
    [Fact]
    public void Corredor_registra_dor_pos_treino_dias_depois()
    {
        var trainedOn = new DateOnly(2026, 8, 3);
        var reportedOn = trainedOn.AddDays(3);

        var painLog = PainLog.Create(date: reportedOn, region: "Canela");

        Assert.Equal(reportedOn, painLog.Date);
        Assert.Equal("Canela", painLog.Region);
    }
}
