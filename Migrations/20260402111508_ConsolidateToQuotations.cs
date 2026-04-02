using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class ConsolidateToQuotations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Inputs_Sectors_SectorId",
                table: "Inputs");

            migrationBuilder.DropForeignKey(
                name: "FK_Inputs_Suppliers_SupplierId",
                table: "Inputs");

            migrationBuilder.DropForeignKey(
                name: "FK_Inputs_Users_UserId",
                table: "Inputs");

            migrationBuilder.DropForeignKey(
                name: "FK_Services_Sectors_SectorId",
                table: "Services");

            migrationBuilder.DropForeignKey(
                name: "FK_Services_Suppliers_SupplierId",
                table: "Services");

            migrationBuilder.DropForeignKey(
                name: "FK_Services_Users_UserId",
                table: "Services");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Services",
                table: "Services");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Inputs",
                table: "Inputs");

            migrationBuilder.RenameTable(
                name: "Services",
                newName: "Service");

            migrationBuilder.RenameTable(
                name: "Inputs",
                newName: "Input");

            migrationBuilder.RenameIndex(
                name: "IX_Services_UserId",
                table: "Service",
                newName: "IX_Service_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Services_SupplierId",
                table: "Service",
                newName: "IX_Service_SupplierId");

            migrationBuilder.RenameIndex(
                name: "IX_Services_SectorId",
                table: "Service",
                newName: "IX_Service_SectorId");

            migrationBuilder.RenameIndex(
                name: "IX_Inputs_UserId",
                table: "Input",
                newName: "IX_Input_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Inputs_SupplierId",
                table: "Input",
                newName: "IX_Input_SupplierId");

            migrationBuilder.RenameIndex(
                name: "IX_Inputs_SectorId",
                table: "Input",
                newName: "IX_Input_SectorId");

            migrationBuilder.AddColumn<int>(
                name: "QuotationId",
                table: "CompanyContactLogs",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "QuotationId",
                table: "Attachments",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Service",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Concluída");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Service",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETUTCDATE()");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Input",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldDefaultValue: "Concluída");

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Input",
                type: "datetime2",
                nullable: false,
                oldClrType: typeof(DateTime),
                oldType: "datetime2",
                oldDefaultValueSql: "GETUTCDATE()");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Service",
                table: "Service",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Input",
                table: "Input",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "Quotations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SectorId = table.Column<int>(type: "int", nullable: false),
                    OriginalId = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    Item = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: false),
                    Unit = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PriceFornecedor = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PrecoMontagem = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    PrecoAdotado = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    MediaAdotada = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    MediaSaneada = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    MenorValor = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    MediaAritmetica = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Mediana = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    NomeEmpresa1 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Empresa1 = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    NomeEmpresa2 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Empresa2 = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    NomeEmpresa3 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Empresa3 = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    NomeEmpresa4 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Empresa4 = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    NomeEmpresa5 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Empresa5 = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    NomeEmpresa6 = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    Empresa6 = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: true),
                    Supplier1Id = table.Column<int>(type: "int", nullable: true),
                    Supplier2Id = table.Column<int>(type: "int", nullable: true),
                    Supplier3Id = table.Column<int>(type: "int", nullable: true),
                    Supplier4Id = table.Column<int>(type: "int", nullable: true),
                    Supplier5Id = table.Column<int>(type: "int", nullable: true),
                    Supplier6Id = table.Column<int>(type: "int", nullable: true),
                    Justificativa = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Concluída"),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "GETUTCDATE()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Quotations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Quotations_Sectors_SectorId",
                        column: x => x.SectorId,
                        principalTable: "Sectors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Quotations_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CompanyContactLogs_QuotationId",
                table: "CompanyContactLogs",
                column: "QuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_Attachments_QuotationId",
                table: "Attachments",
                column: "QuotationId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_SectorId",
                table: "Quotations",
                column: "SectorId");

            migrationBuilder.CreateIndex(
                name: "IX_Quotations_UserId",
                table: "Quotations",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Attachments_Quotations_QuotationId",
                table: "Attachments",
                column: "QuotationId",
                principalTable: "Quotations",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_CompanyContactLogs_Quotations_QuotationId",
                table: "CompanyContactLogs",
                column: "QuotationId",
                principalTable: "Quotations",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Input_Sectors_SectorId",
                table: "Input",
                column: "SectorId",
                principalTable: "Sectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Input_Suppliers_SupplierId",
                table: "Input",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Input_Users_UserId",
                table: "Input",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Service_Sectors_SectorId",
                table: "Service",
                column: "SectorId",
                principalTable: "Sectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Service_Suppliers_SupplierId",
                table: "Service",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Service_Users_UserId",
                table: "Service",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Attachments_Quotations_QuotationId",
                table: "Attachments");

            migrationBuilder.DropForeignKey(
                name: "FK_CompanyContactLogs_Quotations_QuotationId",
                table: "CompanyContactLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_Input_Sectors_SectorId",
                table: "Input");

            migrationBuilder.DropForeignKey(
                name: "FK_Input_Suppliers_SupplierId",
                table: "Input");

            migrationBuilder.DropForeignKey(
                name: "FK_Input_Users_UserId",
                table: "Input");

            migrationBuilder.DropForeignKey(
                name: "FK_Service_Sectors_SectorId",
                table: "Service");

            migrationBuilder.DropForeignKey(
                name: "FK_Service_Suppliers_SupplierId",
                table: "Service");

            migrationBuilder.DropForeignKey(
                name: "FK_Service_Users_UserId",
                table: "Service");

            migrationBuilder.DropTable(
                name: "Quotations");

            migrationBuilder.DropIndex(
                name: "IX_CompanyContactLogs_QuotationId",
                table: "CompanyContactLogs");

            migrationBuilder.DropIndex(
                name: "IX_Attachments_QuotationId",
                table: "Attachments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Service",
                table: "Service");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Input",
                table: "Input");

            migrationBuilder.DropColumn(
                name: "QuotationId",
                table: "CompanyContactLogs");

            migrationBuilder.DropColumn(
                name: "QuotationId",
                table: "Attachments");

            migrationBuilder.RenameTable(
                name: "Service",
                newName: "Services");

            migrationBuilder.RenameTable(
                name: "Input",
                newName: "Inputs");

            migrationBuilder.RenameIndex(
                name: "IX_Service_UserId",
                table: "Services",
                newName: "IX_Services_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Service_SupplierId",
                table: "Services",
                newName: "IX_Services_SupplierId");

            migrationBuilder.RenameIndex(
                name: "IX_Service_SectorId",
                table: "Services",
                newName: "IX_Services_SectorId");

            migrationBuilder.RenameIndex(
                name: "IX_Input_UserId",
                table: "Inputs",
                newName: "IX_Inputs_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_Input_SupplierId",
                table: "Inputs",
                newName: "IX_Inputs_SupplierId");

            migrationBuilder.RenameIndex(
                name: "IX_Input_SectorId",
                table: "Inputs",
                newName: "IX_Inputs_SectorId");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Services",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Concluída",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Services",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Inputs",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Concluída",
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AlterColumn<DateTime>(
                name: "CreatedAt",
                table: "Inputs",
                type: "datetime2",
                nullable: false,
                defaultValueSql: "GETUTCDATE()",
                oldClrType: typeof(DateTime),
                oldType: "datetime2");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Services",
                table: "Services",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Inputs",
                table: "Inputs",
                column: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Inputs_Sectors_SectorId",
                table: "Inputs",
                column: "SectorId",
                principalTable: "Sectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Inputs_Suppliers_SupplierId",
                table: "Inputs",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Inputs_Users_UserId",
                table: "Inputs",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Services_Sectors_SectorId",
                table: "Services",
                column: "SectorId",
                principalTable: "Sectors",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_Services_Suppliers_SupplierId",
                table: "Services",
                column: "SupplierId",
                principalTable: "Suppliers",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Services_Users_UserId",
                table: "Services",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
