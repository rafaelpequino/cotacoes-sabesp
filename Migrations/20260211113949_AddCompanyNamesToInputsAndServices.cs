using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyNamesToInputsAndServices : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa1",
                table: "Services",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa2",
                table: "Services",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa3",
                table: "Services",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa4",
                table: "Services",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa5",
                table: "Services",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa6",
                table: "Services",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa1",
                table: "Inputs",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa2",
                table: "Inputs",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa3",
                table: "Inputs",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa4",
                table: "Inputs",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa5",
                table: "Inputs",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "NomeEmpresa6",
                table: "Inputs",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Attachments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    OriginalFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    StoredFileName = table.Column<string>(type: "nvarchar(255)", maxLength: 255, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FilePath = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    FileExtension = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    EntityType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    UploadedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Attachments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Attachments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_UserId",
                table: "Attachments",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Attachments");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa1",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa2",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa3",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa4",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa5",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa6",
                table: "Services");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa1",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa2",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa3",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa4",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa5",
                table: "Inputs");

            migrationBuilder.DropColumn(
                name: "NomeEmpresa6",
                table: "Inputs");
        }
    }
}
