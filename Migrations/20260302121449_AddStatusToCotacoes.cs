using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class AddStatusToCotacoes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Services",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Concluída");

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "Inputs",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Concluída");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Status",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Inputs");
        }
    }
}
