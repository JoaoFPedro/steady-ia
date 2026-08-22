using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Steady.Domain.Planning;

namespace Steady.Infrastructure.Persistence;

public sealed class SteadyDbContext(DbContextOptions<SteadyDbContext> options) : DbContext(options)
{
    public DbSet<CorredorEntity> Corredores => Set<CorredorEntity>();
    public DbSet<RunningSessionEntity> RunningSessions => Set<RunningSessionEntity>();
    public DbSet<StrengthSessionEntity> StrengthSessions => Set<StrengthSessionEntity>();
    public DbSet<PainLogEntity> PainLogs => Set<PainLogEntity>();
    public DbSet<PlanRequestEntity> PlanRequests => Set<PlanRequestEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CorredorEntity>(entity =>
        {
            entity.ToTable("corredores");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.GoogleSub).HasColumnName("google_sub").IsRequired();
            entity.HasIndex(c => c.GoogleSub).IsUnique();
            // Sem índice único e sem IsRequired: e-mail repetido entre corredores é
            // estado válido, e ausência também (STORY-009, regras 1 e 2).
            entity.Property(c => c.Email).HasColumnName("email");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<RunningSessionEntity>(entity =>
        {
            entity.ToTable("running_sessions");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.CorredorId).HasColumnName("corredor_id");
            entity.Property(s => s.Date).HasColumnName("date");
            entity.Property(s => s.DistanceKm).HasColumnName("distance_km");
            entity.Property(s => s.DurationMinutes).HasColumnName("duration_minutes");
            entity.Property(s => s.AveragePaceMinPerKm).HasColumnName("average_pace_min_per_km");
            entity.Property(s => s.PerceivedEffort).HasColumnName("perceived_effort");
            entity.Property(s => s.IdempotencyKey).HasColumnName("idempotency_key");
            entity.HasIndex(s => s.CorredorId);
            entity.HasIndex(s => new { s.CorredorId, s.IdempotencyKey }).IsUnique();

            // Sem esta constraint, corredor_id era um uuid solto: nada impedia registro
            // órfão (ADR-007). Adicionada junto com plan_requests, na STORY-010.
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(s => s.CorredorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<StrengthSessionEntity>(entity =>
        {
            entity.ToTable("strength_sessions");
            entity.HasKey(s => s.Id);
            entity.Property(s => s.CorredorId).HasColumnName("corredor_id");
            entity.Property(s => s.Date).HasColumnName("date");
            entity.Property(s => s.MuscleGroup).HasColumnName("muscle_group").HasConversion<string>();
            entity.Property(s => s.Intensity).HasColumnName("intensity").HasConversion<string>();
            entity.Property(s => s.DurationMinutes).HasColumnName("duration_minutes");
            entity.Property(s => s.IdempotencyKey).HasColumnName("idempotency_key");
            entity.HasIndex(s => s.CorredorId);
            entity.HasIndex(s => new { s.CorredorId, s.IdempotencyKey }).IsUnique();

            // Sem esta constraint, corredor_id era um uuid solto: nada impedia registro
            // órfão (ADR-007). Adicionada junto com plan_requests, na STORY-010.
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(s => s.CorredorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PainLogEntity>(entity =>
        {
            entity.ToTable("pain_logs");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.CorredorId).HasColumnName("corredor_id");
            entity.Property(p => p.Date).HasColumnName("date");
            entity.Property(p => p.Region).HasColumnName("region").IsRequired();
            entity.Property(p => p.IdempotencyKey).HasColumnName("idempotency_key");
            entity.HasIndex(p => p.CorredorId);
            entity.HasIndex(p => new { p.CorredorId, p.IdempotencyKey }).IsUnique();

            // Sem esta constraint, corredor_id era um uuid solto: nada impedia registro
            // órfão (ADR-007). Adicionada junto com plan_requests, na STORY-010.
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(p => p.CorredorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<PlanRequestEntity>(entity =>
        {
            entity.ToTable("plan_requests");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.CorredorId).HasColumnName("corredor_id");
            entity.Property(p => p.IdempotencyKey).HasColumnName("idempotency_key");
            entity.Property(p => p.CreatedAt).HasColumnName("created_at");

            // Objetivo de Corrida (Lei do Domínio #3): sem estes não existe pedido.
            entity.Property(p => p.RaceDistance).HasColumnName("race_distance").HasConversion<string>().IsRequired();
            // Texto ISO, não `date` — ADR-007, "Datas como texto ISO".
            entity.Property(p => p.RaceDate).HasColumnName("race_date").IsRequired();
            entity.Property(p => p.RaceIsFirstTime).HasColumnName("race_is_first_time");

            entity.Property(p => p.LongestRecentRunKm).HasColumnName("longest_recent_run_km");
            entity.Property(p => p.TrainingDaysPerWeek).HasColumnName("training_days_per_week");

            entity.Property(p => p.CurrentWeeklyRunningDays).HasColumnName("current_weekly_running_days");
            entity.Property(p => p.ReferenceDistanceKm).HasColumnName("reference_distance_km");
            entity.Property(p => p.ReferenceDuration).HasColumnName("reference_duration");
            entity.Property(p => p.StrengthSessionMinutes).HasColumnName("strength_session_minutes");
            entity.Property(p => p.EquipmentAccess).HasColumnName("equipment_access").HasConversion<string>();

            // text[] nativo: conjunto pequeno de enum, tabela filha não pagaria seu custo (ADR-007).
            entity.Property(p => p.RecurringPainAreas)
                .HasColumnName("recurring_pain_areas")
                .HasConversion(
                    areas => areas.Select(a => a.ToString()).ToArray(),
                    valores => valores.Select(Enum.Parse<PainArea>).ToList())
                .HasColumnType("text[]")
                // Sem comparador, o EF não detecta mudança dentro da lista. O pedido é
                // imutável (Lei do Domínio #2), mas deixar o aviso de pé esconderia o
                // dia em que alguém tornar a coleção mutável.
                .Metadata.SetValueComparer(new ValueComparer<IReadOnlyList<PainArea>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    areas => areas.Aggregate(0, (hash, area) => HashCode.Combine(hash, area.GetHashCode())),
                    areas => areas.ToList()));

            entity.Property(p => p.PriorInjuries).HasColumnName("prior_injuries");

            entity.HasIndex(p => p.CorredorId);
            entity.HasIndex(p => new { p.CorredorId, p.IdempotencyKey }).IsUnique();

            // Primeira FK do projeto. As três tabelas anteriores ganham a sua na mesma
            // migration — item explícito da STORY-010, não efeito colateral (ADR-007).
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(p => p.CorredorId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
