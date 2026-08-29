using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Steady.Infrastructure.Repositories;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSteadyTrainingPlan : Migration
    {
        /// <summary>
        /// Identidade fixa da versão 1 (ADR-013) — conhecida para que corredores já
        /// existentes sejam associados a ela no mesmo passo que a cria, sem uma
        /// segunda migration de backfill.
        /// </summary>
        private static readonly Guid SeedVersionId = new("2cca3fc1-0794-4ffb-8e29-52658e8a647f");

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "training_plan_versions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    definition = table.Column<string>(type: "jsonb", nullable: false),
                    is_current = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_training_plan_versions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_training_plan_versions_is_current",
                table: "training_plan_versions",
                column: "is_current",
                unique: true,
                filter: "is_current = TRUE");

            migrationBuilder.CreateIndex(
                name: "IX_training_plan_versions_version",
                table: "training_plan_versions",
                column: "version",
                unique: true);

            // Seed da versão 1 — transcrição literal de trainingPlanDocument.ts
            // (SteadyTrainingPlanSeed, ADR-013). Serializado aqui, na migration, para
            // que o JSON persistido seja sempre o que o serializador de produção
            // produz — nunca um literal copiado à mão que possa divergir dele.
            migrationBuilder.InsertData(
                table: "training_plan_versions",
                columns: ["Id", "version", "definition", "is_current", "created_at"],
                values:
                [
                    SeedVersionId,
                    1,
                    SteadyTrainingPlanDocuments.Serialize(SteadyTrainingPlanSeed.Version1()),
                    true,
                    new DateTime(2026, 8, 29, 0, 0, 0, DateTimeKind.Utc)
                ]);

            // defaultValue backfila corredores já existentes com a versão 1 no mesmo
            // passo que cria a coluna — nenhuma UPDATE separada é necessária.
            migrationBuilder.AddColumn<Guid>(
                name: "training_plan_version_id",
                table: "corredores",
                type: "uuid",
                nullable: false,
                defaultValue: SeedVersionId);

            migrationBuilder.CreateIndex(
                name: "IX_corredores_training_plan_version_id",
                table: "corredores",
                column: "training_plan_version_id");

            migrationBuilder.AddForeignKey(
                name: "FK_corredores_training_plan_versions_training_plan_version_id",
                table: "corredores",
                column: "training_plan_version_id",
                principalTable: "training_plan_versions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_corredores_training_plan_versions_training_plan_version_id",
                table: "corredores");

            migrationBuilder.DropTable(
                name: "training_plan_versions");

            migrationBuilder.DropIndex(
                name: "IX_corredores_training_plan_version_id",
                table: "corredores");

            migrationBuilder.DropColumn(
                name: "training_plan_version_id",
                table: "corredores");
        }
    }
}
