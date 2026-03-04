using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class AddCompanyDetailsAndContactLogs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CompanyDetails",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EntityType = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    EntityId = table.Column<int>(type: "int", nullable: false),
                    EmpresaIndex = table.Column<int>(type: "int", nullable: false),
                    CNPJ = table.Column<string>(type: "nvarchar(18)", maxLength: 18, nullable: true),
                    Telefone = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    DataCotacao = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PessoaContatada = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Endereco = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyDetails", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "CompanyContactLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CompanyDetailId = table.Column<int>(type: "int", nullable: false),
                    Data = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Assunto = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Resposta = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    ProximosPassos = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ResponsavelId = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CompanyContactLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CompanyContactLogs_CompanyDetails_CompanyDetailId",
                        column: x => x.CompanyDetailId,
                        principalTable: "CompanyDetails",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CompanyContactLogs_Users_ResponsavelId",
                        column: x => x.ResponsavelId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyContactLogs_CompanyDetailId",
                table: "CompanyContactLogs",
                column: "CompanyDetailId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyContactLogs_ResponsavelId",
                table: "CompanyContactLogs",
                column: "ResponsavelId");

            migrationBuilder.CreateIndex(
                name: "IX_CompanyDetails_EntityType_EntityId_EmpresaIndex",
                table: "CompanyDetails",
                columns: new[] { "EntityType", "EntityId", "EmpresaIndex" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CompanyContactLogs");

            migrationBuilder.DropTable(
                name: "CompanyDetails");
        }
    }
}
