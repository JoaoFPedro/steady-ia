using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddWorkoutReviews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "adherence_policy_versions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    running_distance_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    running_duration_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    perceived_effort_points = table.Column<int>(type: "integer", nullable: false),
                    sets_absolute = table.Column<int>(type: "integer", nullable: false),
                    repetitions_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    load_percent = table.Column<decimal>(type: "numeric", nullable: false),
                    is_current = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_adherence_policy_versions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "review_outbox",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    execution_id = table.Column<Guid>(type: "uuid", nullable: false),
                    training_sheet_id = table.Column<Guid>(type: "uuid", nullable: true),
                    execution_kind = table.Column<string>(type: "text", nullable: false),
                    idempotency_key = table.Column<Guid>(type: "uuid", nullable: false),
                    execution_date = table.Column<DateOnly>(type: "date", nullable: false),
                    pain_reported_at_completion = table.Column<bool>(type: "boolean", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    attempts = table.Column<int>(type: "integer", nullable: false),
                    lease_until = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_attempt_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_review_outbox", x => x.Id);
                    table.ForeignKey(
                        name: "FK_review_outbox_corredores_corredor_id",
                        column: x => x.corredor_id,
                        principalTable: "corredores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "workout_reviews",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    execution_id = table.Column<Guid>(type: "uuid", nullable: false),
                    execution_kind = table.Column<string>(type: "text", nullable: false),
                    execution_date = table.Column<DateOnly>(type: "date", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    action = table.Column<string>(type: "text", nullable: true),
                    policy_version = table.Column<int>(type: "integer", nullable: false),
                    plan_version = table.Column<int>(type: "integer", nullable: true),
                    training_sheet_id = table.Column<Guid>(type: "uuid", nullable: true),
                    comparison = table.Column<string>(type: "jsonb", nullable: false),
                    explanation_status = table.Column<string>(type: "text", nullable: false),
                    explanation = table.Column<string>(type: "jsonb", nullable: true),
                    understood_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    contested = table.Column<bool>(type: "boolean", nullable: false),
                    coherence_status = table.Column<string>(type: "text", nullable: false),
                    next_execution_id = table.Column<Guid>(type: "uuid", nullable: true),
                    coherence_policy_version = table.Column<int>(type: "integer", nullable: true),
                    coherence_evaluated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_workout_reviews", x => x.Id);
                    table.ForeignKey(
                        name: "FK_workout_reviews_corredores_corredor_id",
                        column: x => x.corredor_id,
                        principalTable: "corredores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "adherence_policy_versions",
                columns: new[] { "Id", "created_at", "is_current", "load_percent", "perceived_effort_points", "repetitions_percent", "running_distance_percent", "running_duration_percent", "sets_absolute", "version" },
                values: new object[] { new Guid("14000000-0000-0000-0000-000000000001"), new DateTime(2026, 8, 30, 0, 0, 0, 0, DateTimeKind.Utc), true, 0.10m, 2, 0.20m, 0.10m, 0.10m, 1, 1 });

            migrationBuilder.CreateIndex(
                name: "IX_adherence_policy_versions_is_current",
                table: "adherence_policy_versions",
                column: "is_current",
                unique: true,
                filter: "is_current = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_adherence_policy_versions_version",
                table: "adherence_policy_versions",
                column: "version",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_review_outbox_corredor_id_idempotency_key",
                table: "review_outbox",
                columns: new[] { "corredor_id", "idempotency_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_review_outbox_execution_kind_execution_id",
                table: "review_outbox",
                columns: new[] { "execution_kind", "execution_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_review_outbox_status_next_attempt_at",
                table: "review_outbox",
                columns: new[] { "status", "next_attempt_at" });

            migrationBuilder.CreateIndex(
                name: "IX_workout_reviews_corredor_id_execution_date",
                table: "workout_reviews",
                columns: new[] { "corredor_id", "execution_date" });

            migrationBuilder.CreateIndex(
                name: "IX_workout_reviews_execution_kind_execution_id",
                table: "workout_reviews",
                columns: new[] { "execution_kind", "execution_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "adherence_policy_versions");

            migrationBuilder.DropTable(
                name: "review_outbox");

            migrationBuilder.DropTable(
                name: "workout_reviews");
        }
    }
}
