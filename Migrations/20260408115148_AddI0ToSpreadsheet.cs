using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CotacoesEPC.Migrations
{
    /// <inheritdoc />
    public partial class AddI0ToSpreadsheet : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.DropPrimaryKey(
                name: "PK_Service",
                table: "Service");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Input",
                table: "Input");

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

            migrationBuilder.AddColumn<int>(
                name: "I0Month",
                table: "Spreadsheets",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "I0Year",
                table: "Spreadsheets",
                type: "int",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DropColumn(
                name: "I0Month",
                table: "Spreadsheets");

            migrationBuilder.DropColumn(
                name: "I0Year",
                table: "Spreadsheets");

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

            migrationBuilder.AddPrimaryKey(
                name: "PK_Service",
                table: "Service",
                column: "Id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Input",
                table: "Input",
                column: "Id");

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
    }
}
