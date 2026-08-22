using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPlanRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "plan_requests",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    idempotency_key = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    race_distance = table.Column<string>(type: "text", nullable: false),
                    race_date = table.Column<string>(type: "text", nullable: false),
                    race_is_first_time = table.Column<bool>(type: "boolean", nullable: false),
                    longest_recent_run_km = table.Column<double>(type: "double precision", nullable: false),
                    training_days_per_week = table.Column<int>(type: "integer", nullable: false),
                    current_weekly_running_days = table.Column<int>(type: "integer", nullable: true),
                    reference_distance_km = table.Column<double>(type: "double precision", nullable: true),
                    reference_duration = table.Column<string>(type: "text", nullable: true),
                    strength_session_minutes = table.Column<int>(type: "integer", nullable: true),
                    equipment_access = table.Column<string>(type: "text", nullable: true),
                    recurring_pain_areas = table.Column<string[]>(type: "text[]", nullable: false),
                    prior_injuries = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_plan_requests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_plan_requests_corredores_corredor_id",
                        column: x => x.corredor_id,
                        principalTable: "corredores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_plan_requests_corredor_id",
                table: "plan_requests",
                column: "corredor_id");

            migrationBuilder.CreateIndex(
                name: "IX_plan_requests_corredor_id_idempotency_key",
                table: "plan_requests",
                columns: new[] { "corredor_id", "idempotency_key" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_pain_logs_corredores_corredor_id",
                table: "pain_logs",
                column: "corredor_id",
                principalTable: "corredores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_running_sessions_corredores_corredor_id",
                table: "running_sessions",
                column: "corredor_id",
                principalTable: "corredores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_strength_sessions_corredores_corredor_id",
                table: "strength_sessions",
                column: "corredor_id",
                principalTable: "corredores",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_pain_logs_corredores_corredor_id",
                table: "pain_logs");

            migrationBuilder.DropForeignKey(
                name: "FK_running_sessions_corredores_corredor_id",
                table: "running_sessions");

            migrationBuilder.DropForeignKey(
                name: "FK_strength_sessions_corredores_corredor_id",
                table: "strength_sessions");

            migrationBuilder.DropTable(
                name: "plan_requests");
        }
    }
}
