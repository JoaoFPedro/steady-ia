using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "corredores",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    google_sub = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_corredores", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "pain_logs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    region = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pain_logs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "running_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    distance_km = table.Column<double>(type: "double precision", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false),
                    average_pace_min_per_km = table.Column<double>(type: "double precision", nullable: false),
                    perceived_effort = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_running_sessions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "strength_sessions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    date = table.Column<DateOnly>(type: "date", nullable: false),
                    muscle_group = table.Column<string>(type: "text", nullable: false),
                    intensity = table.Column<string>(type: "text", nullable: false),
                    duration_minutes = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_strength_sessions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_corredores_google_sub",
                table: "corredores",
                column: "google_sub",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pain_logs_corredor_id",
                table: "pain_logs",
                column: "corredor_id");

            migrationBuilder.CreateIndex(
                name: "IX_running_sessions_corredor_id",
                table: "running_sessions",
                column: "corredor_id");

            migrationBuilder.CreateIndex(
                name: "IX_strength_sessions_corredor_id",
                table: "strength_sessions",
                column: "corredor_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "corredores");

            migrationBuilder.DropTable(
                name: "pain_logs");

            migrationBuilder.DropTable(
                name: "running_sessions");

            migrationBuilder.DropTable(
                name: "strength_sessions");
        }
    }
}
