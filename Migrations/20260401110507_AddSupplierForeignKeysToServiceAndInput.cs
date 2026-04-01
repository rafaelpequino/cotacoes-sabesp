using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierForeignKeysToServiceAndInput : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Supplier1Id",
                table: "Services",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier2Id",
                table: "Services",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier3Id",
                table: "Services",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier4Id",
                table: "Services",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier5Id",
                table: "Services",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier6Id",
                table: "Services",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier1Id",
                table: "Inputs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier2Id",
                table: "Inputs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier3Id",
                table: "Inputs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier4Id",
                table: "Inputs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier5Id",
                table: "Inputs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Supplier6Id",
                table: "Inputs",
                type: "int",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Supplier1Id",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Supplier2Id",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Supplier3Id",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Supplier4Id",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Supplier5Id",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Supplier6Id",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "Supplier1Id",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "Supplier2Id",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "Supplier3Id",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "Supplier4Id",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "Supplier5Id",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "Supplier6Id",
                table: "Inputs");
        }
    }
}
