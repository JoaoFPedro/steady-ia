using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Steady.Domain.Coaching;
using Steady.Domain.Planning;

namespace Steady.Infrastructure.Persistence;

public sealed class SteadyDbContext(DbContextOptions<SteadyDbContext> options) : DbContext(options)
{
    public DbSet<CorredorEntity> Corredores => Set<CorredorEntity>();
    public DbSet<RunningSessionEntity> RunningSessions => Set<RunningSessionEntity>();
    public DbSet<StrengthSessionEntity> StrengthSessions => Set<StrengthSessionEntity>();
    public DbSet<PainLogEntity> PainLogs => Set<PainLogEntity>();
    public DbSet<PlanRequestEntity> PlanRequests => Set<PlanRequestEntity>();
    public DbSet<CoachingLinkEntity> CoachingLinks => Set<CoachingLinkEntity>();
    public DbSet<TrainingSheetEntity> TrainingSheets => Set<TrainingSheetEntity>();
    public DbSet<StrengthWorkoutExecutionEntity> StrengthWorkoutExecutions => Set<StrengthWorkoutExecutionEntity>();
    public DbSet<TrainingPlanVersionEntity> TrainingPlanVersions => Set<TrainingPlanVersionEntity>();
    public DbSet<AdherencePolicyVersionEntity> AdherencePolicyVersions => Set<AdherencePolicyVersionEntity>();
    public DbSet<ReviewOutboxEntity> ReviewOutbox => Set<ReviewOutboxEntity>();
    public DbSet<WorkoutReviewEntity> WorkoutReviews => Set<WorkoutReviewEntity>();

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
            entity.Property(c => c.Name).HasColumnName("name");
            entity.Property(c => c.Roles)
                .HasColumnName("roles")
                .HasColumnType("text[]")
                .HasDefaultValue(new[] { "Corredor" })
                .HasConversion(
                    roles => roles.ToArray(),
                    roles => roles.ToList())
                .Metadata.SetValueComparer(new ValueComparer<IReadOnlyList<string>>(
                    (a, b) => a != null && b != null && a.SequenceEqual(b),
                    roles => roles.Aggregate(0, (hash, role) => HashCode.Combine(hash, role.GetHashCode())),
                    roles => roles.ToList()));
            entity.Property(c => c.TrainingPlanVersionId).HasColumnName("training_plan_version_id");
            entity.Property(c => c.CreatedAt).HasColumnName("created_at");
            entity.HasOne<TrainingPlanVersionEntity>()
                .WithMany()
                .HasForeignKey(c => c.TrainingPlanVersionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TrainingPlanVersionEntity>(entity =>
        {
            entity.ToTable("training_plan_versions");
            entity.HasKey(v => v.Id);
            entity.Property(v => v.Version).HasColumnName("version");
            entity.HasIndex(v => v.Version).IsUnique();
            entity.Property(v => v.DefinitionJson).HasColumnName("definition").HasColumnType("jsonb");
            entity.Property(v => v.IsCurrent).HasColumnName("is_current");
            // Só uma versão vigente por vez — mesmo padrão da ficha ativa (is_active em training_sheets).
            entity.HasIndex(v => v.IsCurrent).IsUnique().HasFilter("is_current = TRUE");
            entity.Property(v => v.CreatedAt).HasColumnName("created_at");
        });

        modelBuilder.Entity<AdherencePolicyVersionEntity>(entity =>
        {
            entity.ToTable("adherence_policy_versions");
            entity.HasKey(policy => policy.Id);
            entity.Property(policy => policy.Version).HasColumnName("version");
            entity.HasIndex(policy => policy.Version).IsUnique();
            entity.Property(policy => policy.RunningDistancePercent).HasColumnName("running_distance_percent");
            entity.Property(policy => policy.RunningDurationPercent).HasColumnName("running_duration_percent");
            entity.Property(policy => policy.PerceivedEffortPoints).HasColumnName("perceived_effort_points");
            entity.Property(policy => policy.SetsAbsolute).HasColumnName("sets_absolute");
            entity.Property(policy => policy.RepetitionsPercent).HasColumnName("repetitions_percent");
            entity.Property(policy => policy.LoadPercent).HasColumnName("load_percent");
            entity.Property(policy => policy.IsCurrent).HasColumnName("is_current");
            entity.HasIndex(policy => policy.IsCurrent).IsUnique().HasFilter("is_current = TRUE");
            entity.Property(policy => policy.CreatedAt).HasColumnName("created_at");
            entity.HasData(new AdherencePolicyVersionEntity
            {
                Id = Guid.Parse("14000000-0000-0000-0000-000000000001"),
                Version = 1,
                RunningDistancePercent = 0.10m,
                RunningDurationPercent = 0.10m,
                PerceivedEffortPoints = 2,
                SetsAbsolute = 1,
                RepetitionsPercent = 0.20m,
                LoadPercent = 0.10m,
                IsCurrent = true,
                CreatedAt = new DateTime(2026, 8, 30, 0, 0, 0, DateTimeKind.Utc)
            });
        });

        modelBuilder.Entity<ReviewOutboxEntity>(entity =>
        {
            entity.ToTable("review_outbox");
            entity.HasKey(item => item.Id);
            entity.Property(item => item.CorredorId).HasColumnName("corredor_id");
            entity.Property(item => item.ExecutionId).HasColumnName("execution_id");
            entity.Property(item => item.TrainingSheetId).HasColumnName("training_sheet_id");
            entity.Property(item => item.ExecutionKind).HasColumnName("execution_kind").HasConversion<string>();
            entity.Property(item => item.IdempotencyKey).HasColumnName("idempotency_key");
            entity.Property(item => item.ExecutionDate).HasColumnName("execution_date");
            entity.Property(item => item.PainReportedAtCompletion).HasColumnName("pain_reported_at_completion");
            entity.Property(item => item.Status).HasColumnName("status").HasConversion<string>();
            entity.Property(item => item.Attempts).HasColumnName("attempts");
            entity.Property(item => item.LeaseUntil).HasColumnName("lease_until");
            entity.Property(item => item.NextAttemptAt).HasColumnName("next_attempt_at");
            entity.Property(item => item.CreatedAt).HasColumnName("created_at");
            entity.Property(item => item.CompletedAt).HasColumnName("completed_at");
            entity.HasIndex(item => new { item.ExecutionKind, item.ExecutionId }).IsUnique();
            entity.HasIndex(item => new { item.CorredorId, item.IdempotencyKey }).IsUnique();
            entity.HasIndex(item => new { item.Status, item.NextAttemptAt });
            entity.HasOne<CorredorEntity>().WithMany().HasForeignKey(item => item.CorredorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<WorkoutReviewEntity>(entity =>
        {
            entity.ToTable("workout_reviews");
            entity.HasKey(review => review.Id);
            entity.Property(review => review.CorredorId).HasColumnName("corredor_id");
            entity.Property(review => review.ExecutionId).HasColumnName("execution_id");
            entity.Property(review => review.ExecutionKind).HasColumnName("execution_kind").HasConversion<string>();
            entity.Property(review => review.ExecutionDate).HasColumnName("execution_date");
            entity.Property(review => review.Status).HasColumnName("status").HasConversion<string>();
            entity.Property(review => review.Action).HasColumnName("action").HasConversion<string>();
            entity.Property(review => review.PolicyVersion).HasColumnName("policy_version");
            entity.Property(review => review.PlanVersion).HasColumnName("plan_version");
            entity.Property(review => review.TrainingSheetId).HasColumnName("training_sheet_id");
            entity.Property(review => review.ComparisonJson).HasColumnName("comparison").HasColumnType("jsonb");
            entity.Property(review => review.ExplanationStatus).HasColumnName("explanation_status").HasConversion<string>();
            entity.Property(review => review.ExplanationJson).HasColumnName("explanation").HasColumnType("jsonb");
            entity.Property(review => review.UnderstoodAt).HasColumnName("understood_at");
            entity.Property(review => review.Contested).HasColumnName("contested");
            entity.Property(review => review.CoherenceStatus).HasColumnName("coherence_status").HasConversion<string>();
            entity.Property(review => review.NextExecutionId).HasColumnName("next_execution_id");
            entity.Property(review => review.CoherencePolicyVersion).HasColumnName("coherence_policy_version");
            entity.Property(review => review.CoherenceEvaluatedAt).HasColumnName("coherence_evaluated_at");
            entity.Property(review => review.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(review => new { review.ExecutionKind, review.ExecutionId }).IsUnique();
            entity.HasIndex(review => new { review.CorredorId, review.ExecutionDate });
            entity.HasOne<CorredorEntity>().WithMany().HasForeignKey(review => review.CorredorId)
                .OnDelete(DeleteBehavior.Cascade);
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

        modelBuilder.Entity<CoachingLinkEntity>(entity =>
        {
            entity.ToTable("coaching_links");
            entity.HasKey(link => link.Id);
            entity.Property(link => link.PersonalId).HasColumnName("personal_id");
            entity.Property(link => link.CorredorId).HasColumnName("corredor_id");
            entity.Property(link => link.Status).HasColumnName("status").HasConversion<string>();
            entity.Property(link => link.RequestedAt).HasColumnName("requested_at");
            entity.Property(link => link.AcceptedAt).HasColumnName("accepted_at");
            entity.Property(link => link.EndedAt).HasColumnName("ended_at");
            entity.HasIndex(link => link.PersonalId);
            entity.HasIndex(link => link.CorredorId);
            entity.HasIndex(link => link.CorredorId)
                .IsUnique()
                .HasFilter("status = 'Active'");
            entity.HasIndex(link => new { link.PersonalId, link.CorredorId })
                .IsUnique()
                .HasFilter("status = 'Pending'");
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(link => link.PersonalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(link => link.CorredorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<TrainingSheetEntity>(entity =>
        {
            entity.ToTable("training_sheets");
            entity.HasKey(sheet => sheet.Id);
            entity.Property(sheet => sheet.PersonalId).HasColumnName("personal_id");
            entity.Property(sheet => sheet.CorredorId).HasColumnName("corredor_id");
            entity.Property(sheet => sheet.DefinitionJson).HasColumnName("definition").HasColumnType("jsonb");
            entity.Property(sheet => sheet.IsActive).HasColumnName("is_active");
            entity.Property(sheet => sheet.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(sheet => sheet.CorredorId)
                .IsUnique()
                .HasFilter("is_active = TRUE");
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(sheet => sheet.PersonalId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(sheet => sheet.CorredorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<StrengthWorkoutExecutionEntity>(entity =>
        {
            entity.ToTable("strength_workout_executions");
            entity.HasKey(execution => execution.Id);
            entity.Property(execution => execution.CorredorId).HasColumnName("corredor_id");
            entity.Property(execution => execution.TrainingSheetId).HasColumnName("training_sheet_id");
            entity.Property(execution => execution.WorkoutType).HasColumnName("workout_type").HasConversion<string>();
            entity.Property(execution => execution.Date).HasColumnName("date");
            entity.Property(execution => execution.DetailsJson).HasColumnName("details").HasColumnType("jsonb");
            entity.Property(execution => execution.IdempotencyKey).HasColumnName("idempotency_key");
            entity.Property(execution => execution.CreatedAt).HasColumnName("created_at");
            entity.HasIndex(execution => new { execution.CorredorId, execution.IdempotencyKey }).IsUnique();
            entity.HasIndex(execution => new { execution.CorredorId, execution.TrainingSheetId });
            entity.HasOne<CorredorEntity>()
                .WithMany()
                .HasForeignKey(execution => execution.CorredorId)
                .OnDelete(DeleteBehavior.Restrict);
            entity.HasOne<TrainingSheetEntity>()
                .WithMany()
                .HasForeignKey(execution => execution.TrainingSheetId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
