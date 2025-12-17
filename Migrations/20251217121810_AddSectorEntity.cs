using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class AddSectorEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Sector",
                table: "Spreadsheets");

            migrationBuilder.AddColumn<int>(
                name: "SectorId",
                table: "Spreadsheets",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Sectors",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Sectors", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Spreadsheets_SectorId",
                table: "Spreadsheets",
                column: "SectorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Spreadsheets_Sectors_SectorId",
                table: "Spreadsheets",
                column: "SectorId",
                principalTable: "Sectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Spreadsheets_Sectors_SectorId",
                table: "Spreadsheets");

            migrationBuilder.DropTable(
                name: "Sectors");

            migrationBuilder.DropIndex(
                name: "IX_Spreadsheets_SectorId",
                table: "Spreadsheets");

            migrationBuilder.DropColumn(
                name: "SectorId",
                table: "Spreadsheets");

            migrationBuilder.AddColumn<string>(
                name: "Sector",
                table: "Spreadsheets",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);
        }
    }
}
