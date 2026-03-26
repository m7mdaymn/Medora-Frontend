using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EliteClinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase10_EncounterSettlementUrgentAndLineItems : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Employees_UserId",
                table: "Employees");

            migrationBuilder.AddColumn<int>(
                name: "FinancialState",
                table: "Visits",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "FinanciallySettledAt",
                table: "Visits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FullyClosedAt",
                table: "Visits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LifecycleState",
                table: "Visits",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "MedicallyCompletedAt",
                table: "Visits",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "VisitType",
                table: "Visits",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "CompensationRulesEnabled",
                table: "TenantFeatureFlags",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ConsultationVisitTypeEnabled",
                table: "TenantFeatureFlags",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "DailyClosingSnapshotEnabled",
                table: "TenantFeatureFlags",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "EncounterPendingSettlementEnabled",
                table: "TenantFeatureFlags",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "PatientDocumentsEnabled",
                table: "TenantFeatureFlags",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "UrgentInsertPolicyEnabled",
                table: "TenantFeatureFlags",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "HasPendingSettlement",
                table: "Invoices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "PendingSettlementAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier");

            migrationBuilder.AddColumn<bool>(
                name: "UrgentEnabled",
                table: "Doctors",
                type: "bit",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "UrgentInsertAfterCount",
                table: "Doctors",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "Latitude",
                table: "ClinicSettings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "Longitude",
                table: "ClinicSettings",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MapUrl",
                table: "ClinicSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "InvoiceLineItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    InvoiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ClinicServiceId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    AddedByUserId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ItemName = table.Column<string>(type: "nvarchar(250)", maxLength: 250, nullable: false),
                    UnitPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    TotalPrice = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_InvoiceLineItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_InvoiceLineItems_Invoices_InvoiceId",
                        column: x => x.InvoiceId,
                        principalTable: "Invoices",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_UserId",
                table: "Employees",
                column: "UserId",
                unique: true,
                filter: "[UserId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLineItems_InvoiceId",
                table: "InvoiceLineItems",
                column: "InvoiceId");

            migrationBuilder.CreateIndex(
                name: "IX_InvoiceLineItems_TenantId_InvoiceId_CreatedAt",
                table: "InvoiceLineItems",
                columns: new[] { "TenantId", "InvoiceId", "CreatedAt" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "InvoiceLineItems");

            migrationBuilder.DropIndex(
                name: "IX_Employees_UserId",
                table: "Employees");

            migrationBuilder.DropColumn(
                name: "FinancialState",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "FinanciallySettledAt",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "FullyClosedAt",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "LifecycleState",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "MedicallyCompletedAt",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "VisitType",
                table: "Visits");

            migrationBuilder.DropColumn(
                name: "CompensationRulesEnabled",
                table: "TenantFeatureFlags");

            migrationBuilder.DropColumn(
                name: "ConsultationVisitTypeEnabled",
                table: "TenantFeatureFlags");

            migrationBuilder.DropColumn(
                name: "DailyClosingSnapshotEnabled",
                table: "TenantFeatureFlags");

            migrationBuilder.DropColumn(
                name: "EncounterPendingSettlementEnabled",
                table: "TenantFeatureFlags");

            migrationBuilder.DropColumn(
                name: "PatientDocumentsEnabled",
                table: "TenantFeatureFlags");

            migrationBuilder.DropColumn(
                name: "UrgentInsertPolicyEnabled",
                table: "TenantFeatureFlags");

            migrationBuilder.DropColumn(
                name: "HasPendingSettlement",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PendingSettlementAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "UrgentEnabled",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "UrgentInsertAfterCount",
                table: "Doctors");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "ClinicSettings");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "ClinicSettings");

            migrationBuilder.DropColumn(
                name: "MapUrl",
                table: "ClinicSettings");

            migrationBuilder.AlterColumn<Guid>(
                name: "UserId",
                table: "Employees",
                type: "uniqueidentifier",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uniqueidentifier",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Employees_UserId",
                table: "Employees",
                column: "UserId",
                unique: true);
        }
    }
}
