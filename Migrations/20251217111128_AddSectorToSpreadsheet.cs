using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class AddSectorToSpreadsheet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Sector",
                table: "Spreadsheets",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Sector",
                table: "Spreadsheets");
        }
    }
}
