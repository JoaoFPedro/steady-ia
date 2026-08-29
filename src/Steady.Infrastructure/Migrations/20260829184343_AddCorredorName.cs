using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Steady.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCorredorName : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "name",
                table: "corredores",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "name",
                table: "corredores");
        }
    }
}
