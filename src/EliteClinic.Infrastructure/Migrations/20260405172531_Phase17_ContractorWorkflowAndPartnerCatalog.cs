using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EliteClinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase17_ContractorWorkflowAndPartnerCatalog : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ClinicDoctorSharePercentage",
                table: "PartnerOrders",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ClinicRevenueAmount",
                table: "PartnerOrders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "CompletedByUserId",
                table: "PartnerOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DoctorPayoutAmount",
                table: "PartnerOrders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PartnerServiceCatalogItemId",
                table: "PartnerOrders",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "PatientArrivedAt",
                table: "PartnerOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ResultSummary",
                table: "PartnerOrders",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResultUploadedAt",
                table: "PartnerOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledAt",
                table: "PartnerOrders",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ServiceNameSnapshot",
                table: "PartnerOrders",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ServicePrice",
                table: "PartnerOrders",
                type: "decimal(18,2)",
                precision: 18,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "SettlementPercentage",
                table: "PartnerOrders",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SettlementTarget",
                table: "PartnerOrders",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ClinicDoctorSharePercentage",
                table: "PartnerContracts",
                type: "decimal(18,4)",
                precision: 18,
                scale: 4,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SettlementTarget",
                table: "PartnerContracts",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "PartnerServiceCatalogItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BranchId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ServiceName = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Price = table.Column<decimal>(type: "decimal(18,2)", precision: 18, scale: 2, nullable: false),
                    SettlementTarget = table.Column<int>(type: "int", nullable: false),
                    SettlementPercentage = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: false),
                    ClinicDoctorSharePercentage = table.Column<decimal>(type: "decimal(18,4)", precision: 18, scale: 4, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerServiceCatalogItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PartnerServiceCatalogItems_Branches_BranchId",
                        column: x => x.BranchId,
                        principalTable: "Branches",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_PartnerServiceCatalogItems_Partners_PartnerId",
                        column: x => x.PartnerId,
                        principalTable: "Partners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PartnerUsers",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PartnerId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    IsPrimary = table.Column<bool>(type: "bit", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsDeleted = table.Column<bool>(type: "bit", nullable: false),
                    DeletedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TenantId = table.Column<Guid>(type: "uniqueidentifier", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartnerUsers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PartnerUsers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PartnerUsers_Partners_PartnerId",
                        column: x => x.PartnerId,
                        principalTable: "Partners",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PartnerOrders_PartnerServiceCatalogItemId",
                table: "PartnerOrders",
                column: "PartnerServiceCatalogItemId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerServiceCatalogItems_BranchId",
                table: "PartnerServiceCatalogItems",
                column: "BranchId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerServiceCatalogItems_PartnerId",
                table: "PartnerServiceCatalogItems",
                column: "PartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerServiceCatalogItems_TenantId_PartnerId_BranchId_ServiceName",
                table: "PartnerServiceCatalogItems",
                columns: new[] { "TenantId", "PartnerId", "BranchId", "ServiceName" },
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerUsers_PartnerId",
                table: "PartnerUsers",
                column: "PartnerId");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerUsers_TenantId_PartnerId_UserId",
                table: "PartnerUsers",
                columns: new[] { "TenantId", "PartnerId", "UserId" },
                unique: true,
                filter: "[IsDeleted] = 0");

            migrationBuilder.CreateIndex(
                name: "IX_PartnerUsers_TenantId_UserId_IsActive",
                table: "PartnerUsers",
                columns: new[] { "TenantId", "UserId", "IsActive" });

            migrationBuilder.CreateIndex(
                name: "IX_PartnerUsers_UserId",
                table: "PartnerUsers",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PartnerOrders_PartnerServiceCatalogItems_PartnerServiceCatalogItemId",
                table: "PartnerOrders",
                column: "PartnerServiceCatalogItemId",
                principalTable: "PartnerServiceCatalogItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.NoAction);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PartnerOrders_PartnerServiceCatalogItems_PartnerServiceCatalogItemId",
                table: "PartnerOrders");

            migrationBuilder.DropTable(
                name: "PartnerServiceCatalogItems");

            migrationBuilder.DropTable(
                name: "PartnerUsers");

            migrationBuilder.DropIndex(
                name: "IX_PartnerOrders_PartnerServiceCatalogItemId",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "ClinicDoctorSharePercentage",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "ClinicRevenueAmount",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "CompletedByUserId",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "DoctorPayoutAmount",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "PartnerServiceCatalogItemId",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "PatientArrivedAt",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "ResultSummary",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "ResultUploadedAt",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "ScheduledAt",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "ServiceNameSnapshot",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "ServicePrice",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "SettlementPercentage",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "SettlementTarget",
                table: "PartnerOrders");

            migrationBuilder.DropColumn(
                name: "ClinicDoctorSharePercentage",
                table: "PartnerContracts");

            migrationBuilder.DropColumn(
                name: "SettlementTarget",
                table: "PartnerContracts");
        }
    }
}
