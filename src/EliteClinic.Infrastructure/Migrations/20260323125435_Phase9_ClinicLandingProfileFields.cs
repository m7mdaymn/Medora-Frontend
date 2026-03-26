using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EliteClinic.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class Phase9_ClinicLandingProfileFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ClinicSettings",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ImgUrl",
                table: "ClinicSettings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SocialLinksJson",
                table: "ClinicSettings",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "ClinicSettings");

            migrationBuilder.DropColumn(
                name: "ImgUrl",
                table: "ClinicSettings");

            migrationBuilder.DropColumn(
                name: "SocialLinksJson",
                table: "ClinicSettings");
        }
    }
}
