using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIdempotencyKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // gen_random_uuid() dá um valor distinto a cada linha já existente. Um defaultValue fixo
            // faria todas compartilharem a mesma chave e a criação do índice único abaixo falharia.
            migrationBuilder.AddColumn<Guid>(
                name: "idempotency_key",
                table: "strength_sessions",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "idempotency_key",
                table: "running_sessions",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<Guid>(
                name: "idempotency_key",
                table: "pain_logs",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            // O default serviu apenas ao backfill. A chave é responsabilidade do cliente (ADR-003):
            // mantê-lo permitiria um INSERT sem chave receber uma aleatória em silêncio.
            migrationBuilder.Sql("ALTER TABLE strength_sessions ALTER COLUMN idempotency_key DROP DEFAULT;");
            migrationBuilder.Sql("ALTER TABLE running_sessions ALTER COLUMN idempotency_key DROP DEFAULT;");
            migrationBuilder.Sql("ALTER TABLE pain_logs ALTER COLUMN idempotency_key DROP DEFAULT;");

            migrationBuilder.CreateIndex(
                name: "IX_strength_sessions_corredor_id_idempotency_key",
                table: "strength_sessions",
                columns: new[] { "corredor_id", "idempotency_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_running_sessions_corredor_id_idempotency_key",
                table: "running_sessions",
                columns: new[] { "corredor_id", "idempotency_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_pain_logs_corredor_id_idempotency_key",
                table: "pain_logs",
                columns: new[] { "corredor_id", "idempotency_key" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_strength_sessions_corredor_id_idempotency_key",
                table: "strength_sessions");

            migrationBuilder.DropIndex(
                name: "IX_running_sessions_corredor_id_idempotency_key",
                table: "running_sessions");

            migrationBuilder.DropIndex(
                name: "IX_pain_logs_corredor_id_idempotency_key",
                table: "pain_logs");

            migrationBuilder.DropColumn(
                name: "idempotency_key",
                table: "strength_sessions");

            migrationBuilder.DropColumn(
                name: "idempotency_key",
                table: "running_sessions");

            migrationBuilder.DropColumn(
                name: "idempotency_key",
                table: "pain_logs");
        }
    }
}
