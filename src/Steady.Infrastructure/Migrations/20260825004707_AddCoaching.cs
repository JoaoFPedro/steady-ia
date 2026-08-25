using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCoaching : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string[]>(
                name: "roles",
                table: "corredores",
                type: "text[]",
                nullable: false,
                defaultValue: new[] { "Corredor" });

            migrationBuilder.CreateTable(
                name: "coaching_links",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    personal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    requested_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    accepted_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ended_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_coaching_links", x => x.Id);
                    table.ForeignKey(
                        name: "FK_coaching_links_corredores_corredor_id",
                        column: x => x.corredor_id,
                        principalTable: "corredores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_coaching_links_corredores_personal_id",
                        column: x => x.personal_id,
                        principalTable: "corredores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "training_sheets",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    personal_id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    definition = table.Column<string>(type: "jsonb", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_training_sheets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_training_sheets_corredores_corredor_id",
                        column: x => x.corredor_id,
                        principalTable: "corredores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_training_sheets_corredores_personal_id",
                        column: x => x.personal_id,
                        principalTable: "corredores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "strength_workout_executions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    corredor_id = table.Column<Guid>(type: "uuid", nullable: false),
                    training_sheet_id = table.Column<Guid>(type: "uuid", nullable: false),
                    workout_type = table.Column<string>(type: "text", nullable: false),
                    date = table.Column<string>(type: "text", nullable: false),
                    details = table.Column<string>(type: "jsonb", nullable: false),
                    idempotency_key = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_strength_workout_executions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_strength_workout_executions_corredores_corredor_id",
                        column: x => x.corredor_id,
                        principalTable: "corredores",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_strength_workout_executions_training_sheets_training_sheet_~",
                        column: x => x.training_sheet_id,
                        principalTable: "training_sheets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_coaching_links_corredor_id",
                table: "coaching_links",
                column: "corredor_id",
                unique: true,
                filter: "status = 'Active'");

            migrationBuilder.CreateIndex(
                name: "IX_coaching_links_personal_id",
                table: "coaching_links",
                column: "personal_id");

            migrationBuilder.CreateIndex(
                name: "IX_coaching_links_personal_id_corredor_id",
                table: "coaching_links",
                columns: new[] { "personal_id", "corredor_id" },
                unique: true,
                filter: "status = 'Pending'");

            migrationBuilder.CreateIndex(
                name: "IX_strength_workout_executions_corredor_id_idempotency_key",
                table: "strength_workout_executions",
                columns: new[] { "corredor_id", "idempotency_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_strength_workout_executions_corredor_id_training_sheet_id",
                table: "strength_workout_executions",
                columns: new[] { "corredor_id", "training_sheet_id" });

            migrationBuilder.CreateIndex(
                name: "IX_strength_workout_executions_training_sheet_id",
                table: "strength_workout_executions",
                column: "training_sheet_id");

            migrationBuilder.CreateIndex(
                name: "IX_training_sheets_corredor_id",
                table: "training_sheets",
                column: "corredor_id",
                unique: true,
                filter: "is_active = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_training_sheets_personal_id",
                table: "training_sheets",
                column: "personal_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "coaching_links");

            migrationBuilder.DropTable(
                name: "strength_workout_executions");

            migrationBuilder.DropTable(
                name: "training_sheets");

            migrationBuilder.DropColumn(
                name: "roles",
                table: "corredores");
        }
    }
}
