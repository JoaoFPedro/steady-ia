using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCorredorEmail : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "email",
                table: "corredores",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "email",
                table: "corredores");
        }
    }
}
