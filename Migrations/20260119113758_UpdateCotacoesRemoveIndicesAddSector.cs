using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCotacoesRemoveIndicesAddSector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IndiceAnterior",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "IndiceAtual",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "MesAnterior",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "TempoPassado",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Sectors");

            migrationBuilder.DropColumn(
                name: "IndiceAnterior",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "IndiceAtual",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "MesAnterior",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "TempoPassado",
                table: "Inputs");

            // Garantir que existe pelo menos um setor padrão
            migrationBuilder.Sql(@"
                IF NOT EXISTS (SELECT 1 FROM Sectors WHERE Id = 1)
                BEGIN
                    SET IDENTITY_INSERT Sectors ON;
                    INSERT INTO Sectors (Id, Name, IsActive) VALUES (1, 'Não Especificado', 1);
                    SET IDENTITY_INSERT Sectors OFF;
                END
            ");

            migrationBuilder.AddColumn<int>(
                name: "SectorId",
                table: "Services",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.AddColumn<int>(
                name: "SectorId",
                table: "Inputs",
                type: "int",
                nullable: false,
                defaultValue: 1);

            migrationBuilder.CreateIndex(
                name: "IX_Services_SectorId",
                table: "Services",
                column: "SectorId");

            migrationBuilder.CreateIndex(
                name: "IX_Inputs_SectorId",
                table: "Inputs",
                column: "SectorId");

            migrationBuilder.AddForeignKey(
                name: "FK_Inputs_Sectors_SectorId",
                table: "Inputs",
                column: "SectorId",
                principalTable: "Sectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Services_Sectors_SectorId",
                table: "Services",
                column: "SectorId",
                principalTable: "Sectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Inputs_Sectors_SectorId",
                table: "Inputs");

            migrationBuilder.DropForeignKey(
                name: "FK_Services_Sectors_SectorId",
                table: "Services");

            migrationBuilder.DropIndex(
                name: "IX_Services_SectorId",
                table: "Services");

            migrationBuilder.DropIndex(
                name: "IX_Inputs_SectorId",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "SectorId",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "SectorId",
                table: "Inputs");

            migrationBuilder.AddColumn<decimal>(
                name: "IndiceAnterior",
                table: "Services",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "IndiceAtual",
                table: "Services",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MesAnterior",
                table: "Services",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TempoPassado",
                table: "Services",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "Sectors",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Sectors",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "IndiceAnterior",
                table: "Inputs",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "IndiceAtual",
                table: "Inputs",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MesAnterior",
                table: "Inputs",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "TempoPassado",
                table: "Inputs",
                type: "int",
                nullable: true);
        }
    }
}
