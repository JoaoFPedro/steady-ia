using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddRunningSessionRegisteredAt : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "registered_at",
                table: "running_sessions",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "registered_at",
                table: "running_sessions");
        }
    }
}
