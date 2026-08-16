using Microsoft.EntityFrameworkCore;

namespace Steady.Infrastructure.Persistence;

public sealed class SteadyDbContext(DbContextOptions<SteadyDbContext> options) : DbContext(options)
{
    public DbSet<CorredorEntity> Corredores => Set<CorredorEntity>();
    public DbSet<RunningSessionEntity> RunningSessions => Set<RunningSessionEntity>();
    public DbSet<StrengthSessionEntity> StrengthSessions => Set<StrengthSessionEntity>();
    public DbSet<PainLogEntity> PainLogs => Set<PainLogEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CorredorEntity>(entity =>
        {
            entity.ToTable("corredores");
            entity.HasKey(c => c.Id);
            entity.Property(c => c.GoogleSub).HasColumnName("google_sub").IsRequired();
            entity.HasIndex(c => c.GoogleSub).IsUnique();
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
            entity.HasIndex(s => s.CorredorId);
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
            entity.HasIndex(s => s.CorredorId);
        });

        modelBuilder.Entity<PainLogEntity>(entity =>
        {
            entity.ToTable("pain_logs");
            entity.HasKey(p => p.Id);
            entity.Property(p => p.CorredorId).HasColumnName("corredor_id");
            entity.Property(p => p.Date).HasColumnName("date");
            entity.Property(p => p.Region).HasColumnName("region").IsRequired();
            entity.HasIndex(p => p.CorredorId);
        });
    }
}
