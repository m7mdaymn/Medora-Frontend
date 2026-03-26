using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EliteClinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase6_OperationalSafetyAndInvoiceNumbering : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "CreditAmount",
                table: "Invoices",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreditIssuedAt",
                table: "Invoices",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvoiceNumber",
                table: "Invoices",
                type: "nvarchar(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsServiceRendered",
                table: "Invoices",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PatientNameSnapshot",
                table: "Invoices",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PatientPhoneSnapshot",
                table: "Invoices",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Invoices_TenantId_InvoiceNumber",
                table: "Invoices",
                columns: new[] { "TenantId", "InvoiceNumber" },
                unique: true,
                filter: "[IsDeleted] = 0 AND [InvoiceNumber] <> ''");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Invoices_TenantId_InvoiceNumber",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreditAmount",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "CreditIssuedAt",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "InvoiceNumber",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "IsServiceRendered",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PatientNameSnapshot",
                table: "Invoices");

            migrationBuilder.DropColumn(
                name: "PatientPhoneSnapshot",
                table: "Invoices");
        }
    }
}
