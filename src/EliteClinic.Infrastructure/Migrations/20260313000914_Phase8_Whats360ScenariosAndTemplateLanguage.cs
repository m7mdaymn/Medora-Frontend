using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EliteClinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase8_Whats360ScenariosAndTemplateLanguage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MessageTemplates_TenantId_TemplateKey_Channel",
                table: "MessageTemplates");

            migrationBuilder.AddColumn<string>(
                name: "Language",
                table: "MessageTemplates",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ProviderRawResponse",
                table: "MessageLogs",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MessageTemplates_TenantId_TemplateKey_Channel_Language",
                table: "MessageTemplates",
                columns: new[] { "TenantId", "TemplateKey", "Channel", "Language" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MessageTemplates_TenantId_TemplateKey_Channel_Language",
                table: "MessageTemplates");

            migrationBuilder.DropColumn(
                name: "Language",
                table: "MessageTemplates");

            migrationBuilder.DropColumn(
                name: "ProviderRawResponse",
                table: "MessageLogs");

            migrationBuilder.CreateIndex(
                name: "IX_MessageTemplates_TenantId_TemplateKey_Channel",
                table: "MessageTemplates",
                columns: new[] { "TenantId", "TemplateKey", "Channel" },
                unique: true,
                filter: "[IsDeleted] = 0");
        }
    }
}
