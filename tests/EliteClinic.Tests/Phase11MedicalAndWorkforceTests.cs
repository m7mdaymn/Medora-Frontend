using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using Microsoft.AspNetCore.Http;
using Xunit;

namespace EliteClinic.Tests;

public class Phase11MedicalAndWorkforceTests
{
    [Fact]
    public async Task ChronicProfile_ShouldBeCreated_AndVisibleInVisitContext()
    {
        var tenantId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var doctorUserId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var ownerUser = new ApplicationUser("owner", "Owner") { Id = ownerUserId, TenantId = tenantId };
        var doctorUser = new ApplicationUser("doctor", "Doctor") { Id = doctorUserId, TenantId = tenantId };
        var patientUser = new ApplicationUser("patient", "Patient") { Id = Guid.NewGuid(), TenantId = tenantId };
        ctx.Users.AddRange(ownerUser, doctorUser, patientUser);

        var doctor = new Doctor { TenantId = tenantId, UserId = doctorUserId, Name = "Dr. Test" };
        var patient = new Patient { TenantId = tenantId, UserId = patientUser.Id, Name = "P1", Phone = "111" };
        var visit = new Visit
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            PatientId = patient.Id,
            Status = VisitStatus.Open,
            LifecycleState = EncounterLifecycleState.InProgress,
            FinancialState = EncounterFinancialState.NotStarted,
            StartedAt = DateTime.UtcNow
        };

        ctx.Doctors.Add(doctor);
        ctx.Patients.Add(patient);
        ctx.Visits.Add(visit);
        await ctx.SaveChangesAsync();

        var patientMedicalService = new PatientMedicalService(ctx, new TestFileStorageService());
        var upsert = await patientMedicalService.UpsertChronicProfileAsync(
            tenantId,
            patient.Id,
            new UpsertPatientChronicProfileRequest
            {
                Diabetes = true,
                Hypertension = true,
                CardiacDisease = false,
                Asthma = true,
                Other = true,
                OtherNotes = "Seasonal triggers"
            },
            ownerUserId,
            isPatientActor: false);

        Assert.True(upsert.Success);
        Assert.True(upsert.Data!.Diabetes);

        var visitService = new VisitService(ctx);
        var visitResult = await visitService.GetVisitByIdAsync(tenantId, visit.Id, doctorUserId);

        Assert.True(visitResult.Success);
        Assert.NotNull(visitResult.Data);
        Assert.NotNull(visitResult.Data!.ChronicProfile);
        Assert.True(visitResult.Data.ChronicProfile!.Diabetes);
        Assert.True(visitResult.Data.ChronicProfile.Hypertension);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task PatientDocument_ShouldAcceptPdf_AndRejectOversized()
    {
        var tenantId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var ownerUser = new ApplicationUser("owner", "Owner") { Id = ownerUserId, TenantId = tenantId };
        var patientUser = new ApplicationUser("patient", "Patient") { Id = Guid.NewGuid(), TenantId = tenantId };
        ctx.Users.AddRange(ownerUser, patientUser);

        var patient = new Patient { TenantId = tenantId, UserId = patientUser.Id, Name = "P1", Phone = "111" };
        ctx.Patients.Add(patient);
        await ctx.SaveChangesAsync();

        var storage = new TestFileStorageService();
        var service = new PatientMedicalService(ctx, storage);

        var bytes = System.Text.Encoding.UTF8.GetBytes("pdf content");
        IFormFile okFile = new FormFile(new MemoryStream(bytes), 0, bytes.Length, "file", "test.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/pdf"
        };

        var uploadOk = await service.UploadDocumentAsync(
            tenantId,
            patient.Id,
            okFile,
            new UploadPatientMedicalDocumentRequest { Category = DocumentCategory.Lab, Notes = "ok" },
            ownerUserId,
            isPatientActor: false);

        Assert.True(uploadOk.Success);

        var bigBytes = new byte[(10 * 1024 * 1024) + 1];
        IFormFile oversized = new FormFile(new MemoryStream(bigBytes), 0, bigBytes.Length, "file", "large.pdf")
        {
            Headers = new HeaderDictionary(),
            ContentType = "application/pdf"
        };

        var uploadTooBig = await service.UploadDocumentAsync(
            tenantId,
            patient.Id,
            oversized,
            new UploadPatientMedicalDocumentRequest { Category = DocumentCategory.Radiology },
            ownerUserId,
            isPatientActor: false);

        Assert.False(uploadTooBig.Success);
        Assert.Contains("10 MB", uploadTooBig.Message);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task Workforce_ShouldCreateCompensation_Attendance_Payout_AndClosingSnapshot()
    {
        var tenantId = Guid.NewGuid();
        var ownerUserId = Guid.NewGuid();
        var doctorUserId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var ownerUser = new ApplicationUser("owner", "Owner") { Id = ownerUserId, TenantId = tenantId };
        var doctorUser = new ApplicationUser("doctor", "Doctor") { Id = doctorUserId, TenantId = tenantId };
        ctx.Users.AddRange(ownerUser, doctorUser);

        var doctor = new Doctor { TenantId = tenantId, UserId = doctorUserId, Name = "Dr. Workforce" };
        var employee = new Employee { TenantId = tenantId, UserId = null, Name = "Staff Nullable User", Role = "Receptionist" };
        var patient = new Patient { TenantId = tenantId, UserId = ownerUserId, Name = "P1", Phone = "111" };
        var visit = new Visit
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            PatientId = patient.Id,
            Status = VisitStatus.Completed,
            LifecycleState = EncounterLifecycleState.FullyClosed,
            FinancialState = EncounterFinancialState.FinanciallySettled,
            StartedAt = DateTime.UtcNow.AddHours(-1),
            CompletedAt = DateTime.UtcNow
        };

        ctx.Doctors.Add(doctor);
        ctx.Employees.Add(employee);
        ctx.Patients.Add(patient);
        ctx.Visits.Add(visit);

        var invoice = new Invoice
        {
            TenantId = tenantId,
            VisitId = visit.Id,
            PatientId = patient.Id,
            DoctorId = doctor.Id,
            InvoiceNumber = "INV-TST-1",
            PatientNameSnapshot = patient.Name,
            PatientPhoneSnapshot = patient.Phone,
            Amount = 200,
            PaidAmount = 100,
            RemainingAmount = 100,
            IsServiceRendered = true,
            Status = InvoiceStatus.PartiallyPaid
        };

        var payment = new Payment
        {
            TenantId = tenantId,
            InvoiceId = invoice.Id,
            Amount = 100,
            PaidAt = DateTime.UtcNow,
            PaymentMethod = "Cash"
        };

        ctx.Invoices.Add(invoice);
        ctx.Payments.Add(payment);
        await ctx.SaveChangesAsync();

        var workforce = new WorkforceService(ctx);

        var comp = await workforce.CreateDoctorCompensationRuleAsync(
            tenantId,
            doctor.Id,
            ownerUserId,
            new CreateDoctorCompensationRuleRequest
            {
                Mode = DoctorCompensationMode.Percentage,
                Value = 30,
                EffectiveFrom = DateTime.UtcNow.Date
            });

        Assert.True(comp.Success);

        var attendance = await workforce.CreateAttendanceRecordAsync(
            tenantId,
            ownerUserId,
            new CreateAttendanceRecordRequest
            {
                EmployeeId = employee.Id,
                CheckInAt = DateTime.UtcNow,
                LateMinutes = 3
            });

        Assert.True(attendance.Success);

        var checkout = await workforce.CheckOutAttendanceAsync(
            tenantId,
            attendance.Data!.Id,
            new CheckOutAttendanceRequest
            {
                CheckOutAt = DateTime.UtcNow.AddHours(8),
                OvertimeMinutes = 15
            });

        Assert.True(checkout.Success);

        var payout = await workforce.CreateSalaryPayoutAsync(
            tenantId,
            ownerUserId,
            new CreateSalaryPayoutRequest
            {
                EmployeeId = employee.Id,
                Amount = 1500,
                Notes = "Monthly payout"
            });

        Assert.True(payout.Success);
        Assert.Equal("SalaryPayout", payout.Data!.Category);

        var closing = await workforce.GenerateDailyClosingSnapshotAsync(
            tenantId,
            ownerUserId,
            DateTime.UtcNow.Date);

        Assert.True(closing.Success);
        Assert.True(closing.Data!.PaymentsCount >= 1);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }

    private sealed class TestFileStorageService : IFileStorageService
    {
        public Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default) => Task.CompletedTask;

        public bool IsAllowedSize(long size) => size > 0 && size <= 5 * 1024 * 1024;

        public bool IsAllowedSize(long size, long maxSizeBytes) => size > 0 && size <= maxSizeBytes;

        public bool IsSupportedImage(IFormFile file) => true;

        public Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveImageAsync(Guid tenantId, string category, IFormFile file, CancellationToken cancellationToken = default)
            => Task.FromResult(($"tenants/{tenantId}/{category}/image.png", "/media/image.png", "image.png"));

        public Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveFileAsync(Guid tenantId, string category, IFormFile file, CancellationToken cancellationToken = default)
            => Task.FromResult(($"tenants/{tenantId}/{category}/{file.FileName}", $"/media/{file.FileName}", file.FileName));
    }
}
