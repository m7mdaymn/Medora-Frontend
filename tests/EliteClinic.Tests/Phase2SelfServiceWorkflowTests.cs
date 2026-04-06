using EliteClinic.Api.Controllers;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using Xunit;

namespace EliteClinic.Tests;

public class Phase2SelfServiceWorkflowTests
{
    [Fact]
    public async Task CreateRequest_ShouldCreatePendingRequest_AndNoQueueArtifactsBeforeApproval()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seed = await SeedCoreAsync(ctx, tenantId);
        var service = BuildService(ctx, new FakeFileStorageService());

        var create = await service.CreateAsync(
            tenantId,
            seed.PatientUserId,
            BuildSameDayRequest(seed),
            CreateImageFile("proof-a.png"),
            supportingDocuments: null,
            CancellationToken.None);

        Assert.True(create.Success);
        Assert.Equal(PatientSelfServiceRequestStatus.PendingPaymentReview, create.Data!.Status);
        Assert.Equal(PatientSelfServiceRequestType.SameDayTicket, create.Data.RequestType);
        Assert.Equal(VisitSource.PatientSelfServiceTicket, create.Data.Source);

        Assert.Equal(0, await ctx.QueueTickets.CountAsync());
        Assert.Equal(0, await ctx.Bookings.CountAsync());

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task RequestReupload_ThenReuploadPaymentProof_ShouldReturnToPendingReview_AndIncrementCount()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seed = await SeedCoreAsync(ctx, tenantId);
        var storage = new FakeFileStorageService();
        var service = BuildService(ctx, storage);

        var created = await service.CreateAsync(
            tenantId,
            seed.PatientUserId,
            BuildSameDayRequest(seed),
            CreateImageFile("proof-before.png"),
            supportingDocuments: null,
            CancellationToken.None);

        Assert.True(created.Success);

        var requested = await service.RequestReuploadAsync(
            tenantId,
            created.Data!.Id,
            seed.ReviewerUserId,
            new RequestSelfServicePaymentReupload { Reason = "Please upload clearer screenshot" },
            CancellationToken.None);

        Assert.True(requested.Success);
        Assert.Equal(PatientSelfServiceRequestStatus.ReuploadRequested, requested.Data!.Status);

        var reuploaded = await service.ReuploadPaymentProofAsync(
            tenantId,
            seed.PatientUserId,
            created.Data.Id,
            CreateImageFile("proof-after.png"),
            CancellationToken.None);

        Assert.True(reuploaded.Success);
        Assert.Equal(PatientSelfServiceRequestStatus.PendingPaymentReview, reuploaded.Data!.Status);
        Assert.Equal(1, reuploaded.Data.ReuploadCount);
        Assert.Equal("proof-after.png", reuploaded.Data.PaymentProof.OriginalFileName);
        Assert.Contains(storage.DeletedPaths, p => p.Contains("patient-self-service-payment-proofs", StringComparison.OrdinalIgnoreCase));

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task AdjustPaidAmount_ShouldPersistAdjustedAmount_AndNotes()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seed = await SeedCoreAsync(ctx, tenantId);
        var service = BuildService(ctx, new FakeFileStorageService());

        var created = await service.CreateAsync(
            tenantId,
            seed.PatientUserId,
            BuildSameDayRequest(seed),
            CreateImageFile("proof-adjust.png"),
            supportingDocuments: null,
            CancellationToken.None);

        Assert.True(created.Success);

        var adjusted = await service.AdjustPaidAmountAsync(
            tenantId,
            created.Data!.Id,
            seed.ReviewerUserId,
            new AdjustSelfServicePaidAmountRequest
            {
                AdjustedPaidAmount = 510m,
                Notes = "Bank confirmation amount"
            },
            CancellationToken.None);

        Assert.True(adjusted.Success);
        Assert.Equal(510m, adjusted.Data!.AdjustedPaidAmount);
        Assert.Contains("Bank confirmation amount", adjusted.Data.ApprovalNotes);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task RejectRequest_ShouldSetRejectedStatus_AndReason()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seed = await SeedCoreAsync(ctx, tenantId);
        var service = BuildService(ctx, new FakeFileStorageService());

        var created = await service.CreateAsync(
            tenantId,
            seed.PatientUserId,
            BuildSameDayRequest(seed),
            CreateImageFile("proof-reject.png"),
            supportingDocuments: null,
            CancellationToken.None);

        Assert.True(created.Success);

        var rejected = await service.RejectAsync(
            tenantId,
            created.Data!.Id,
            seed.ReviewerUserId,
            new RejectPatientSelfServiceRequest { Reason = "Transfer reference mismatch" },
            CancellationToken.None);

        Assert.True(rejected.Success);
        Assert.Equal(PatientSelfServiceRequestStatus.Rejected, rejected.Data!.Status);
        Assert.Equal("Transfer reference mismatch", rejected.Data.RejectionReason);
        Assert.Equal(seed.ReviewerUserId, rejected.Data.RejectedByUserId);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task ApproveSameDayTicket_ShouldConvertToQueueTicket()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seed = await SeedCoreAsync(ctx, tenantId);
        var service = BuildService(ctx, new FakeFileStorageService());

        var created = await service.CreateAsync(
            tenantId,
            seed.PatientUserId,
            BuildSameDayRequest(seed),
            CreateImageFile("proof-ticket.png"),
            supportingDocuments: null,
            CancellationToken.None);

        Assert.True(created.Success);

        var approved = await service.ApproveAsync(
            tenantId,
            created.Data!.Id,
            seed.ReviewerUserId,
            new ApprovePatientSelfServiceRequest(),
            CancellationToken.None);

        Assert.True(approved.Success);
        Assert.Equal(PatientSelfServiceRequestStatus.ConvertedToQueueTicket, approved.Data!.Status);
        Assert.NotNull(approved.Data.ConvertedQueueTicketId);
        Assert.Null(approved.Data.ConvertedBookingId);

        var ticket = await ctx.QueueTickets.FirstAsync(t => t.Id == approved.Data.ConvertedQueueTicketId!.Value);
        Assert.Equal(seed.PatientId, ticket.PatientId);
        Assert.Equal(seed.DoctorId, ticket.DoctorId);
        Assert.Equal(VisitSource.PatientSelfServiceTicket, ticket.Source);
        Assert.True(ticket.TicketNumber > 0);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task ApproveFutureBooking_ShouldConvertToBooking()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seed = await SeedCoreAsync(ctx, tenantId);
        var service = BuildService(ctx, new FakeFileStorageService());

        var created = await service.CreateAsync(
            tenantId,
            seed.PatientUserId,
            BuildFutureBookingRequest(seed),
            CreateImageFile("proof-booking.png"),
            supportingDocuments: null,
            CancellationToken.None);

        Assert.True(created.Success);

        var approved = await service.ApproveAsync(
            tenantId,
            created.Data!.Id,
            seed.ReviewerUserId,
            new ApprovePatientSelfServiceRequest(),
            CancellationToken.None);

        Assert.True(approved.Success);
        Assert.Equal(PatientSelfServiceRequestStatus.ConvertedToBooking, approved.Data!.Status);
        Assert.NotNull(approved.Data.ConvertedBookingId);
        Assert.Null(approved.Data.ConvertedQueueTicketId);

        var booking = await ctx.Bookings.FirstAsync(b => b.Id == approved.Data.ConvertedBookingId!.Value);
        Assert.Equal(seed.PatientId, booking.PatientId);
        Assert.Equal(seed.DoctorId, booking.DoctorId);
        Assert.Equal(VisitSource.PatientSelfServiceBooking, booking.Source);
        Assert.Equal(0, await ctx.QueueTickets.CountAsync(t => !t.IsDeleted));

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task NoTicketNumber_ShouldExistBeforeApproval()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seed = await SeedCoreAsync(ctx, tenantId);
        var service = BuildService(ctx, new FakeFileStorageService());

        var created = await service.CreateAsync(
            tenantId,
            seed.PatientUserId,
            BuildSameDayRequest(seed),
            CreateImageFile("proof-preapprove.png"),
            supportingDocuments: null,
            CancellationToken.None);

        Assert.True(created.Success);

        var pendingTicket = await ctx.QueueTickets
            .FirstOrDefaultAsync(t => t.PatientId == seed.PatientId && !t.IsDeleted);

        Assert.Null(pendingTicket);
        Assert.Equal(PatientSelfServiceRequestStatus.PendingPaymentReview, created.Data!.Status);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public void SelfServiceReviewEndpoints_ShouldAllowReceptionistManagerOwnerRoles()
    {
        AssertMethodRoles(nameof(SelfServiceRequestsController.GetAll), "ClinicOwner", "ClinicManager", "Receptionist");
        AssertMethodRoles(nameof(SelfServiceRequestsController.GetById), "ClinicOwner", "ClinicManager", "Receptionist");
        AssertMethodRoles(nameof(SelfServiceRequestsController.Approve), "ClinicOwner", "ClinicManager", "Receptionist");
        AssertMethodRoles(nameof(SelfServiceRequestsController.Reject), "ClinicOwner", "ClinicManager", "Receptionist");
        AssertMethodRoles(nameof(SelfServiceRequestsController.RequestReupload), "ClinicOwner", "ClinicManager", "Receptionist");
        AssertMethodRoles(nameof(SelfServiceRequestsController.AdjustPaidAmount), "ClinicOwner", "ClinicManager", "Receptionist");
    }

    private static void AssertMethodRoles(string methodName, params string[] requiredRoles)
    {
        var method = typeof(SelfServiceRequestsController).GetMethod(methodName);
        Assert.NotNull(method);

        var authorize = method!.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorize);
        Assert.False(string.IsNullOrWhiteSpace(authorize!.Roles));

        var methodRoles = authorize.Roles!
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        foreach (var role in requiredRoles)
            Assert.Contains(role, methodRoles, StringComparer.OrdinalIgnoreCase);
    }

    private static PatientSelfServiceRequestService BuildService(EliteClinicDbContext ctx, IFileStorageService fileStorage)
    {
        var messageService = new FakeMessageService();
        var queueService = new QueueService(
            ctx,
            messageService,
            new FakeInvoiceNumberService(),
            new AllowAllBranchAccessService());
        var tenantId = ctx.Tenants.IgnoreQueryFilters().Select(t => t.Id).First();
        var bookingService = new BookingService(ctx, messageService, DbContextFactory.CreateTenantContext(tenantId));
        return new PatientSelfServiceRequestService(ctx, fileStorage, queueService, bookingService);
    }

    private static async Task<SeedData> SeedCoreAsync(EliteClinicDbContext ctx, Guid tenantId)
    {
        var patientUser = new ApplicationUser("patient-self", "Patient Self") { TenantId = tenantId };
        var doctorUser = new ApplicationUser("doctor-self", "Doctor Self") { TenantId = tenantId };
        var reviewerUser = new ApplicationUser("reviewer-self", "Reviewer Self") { TenantId = tenantId };

        var patient = new Patient
        {
            TenantId = tenantId,
            UserId = patientUser.Id,
            Name = "Patient One",
            Phone = "0100000001",
            IsDefault = true
        };

        var doctor = new Doctor
        {
            TenantId = tenantId,
            UserId = doctorUser.Id,
            Name = "Dr One",
            IsEnabled = true,
            UrgentEnabled = true,
            UrgentCaseMode = UrgentCaseMode.UrgentNext
        };

        var branch = new Branch
        {
            TenantId = tenantId,
            Name = "Main Branch",
            IsActive = true
        };

        var doctorService = new DoctorService
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            ServiceName = "Self Service Consultation",
            Price = 500m,
            DurationMinutes = 30,
            IsActive = true
        };

        var queueSession = new QueueSession
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            BranchId = branch.Id,
            IsActive = true,
            StartedAt = DateTime.UtcNow
        };

        var settings = new ClinicSettings
        {
            TenantId = tenantId,
            ClinicName = "Test Clinic",
            BookingEnabled = true,
            SelfServicePaymentPolicy = PatientSelfServicePaymentPolicy.FullOnly,
            SelfServiceRequestExpiryHours = 24
        };

        var flags = new TenantFeatureFlag
        {
            TenantId = tenantId,
            OnlineBooking = true
        };

        ctx.Users.AddRange(patientUser, doctorUser, reviewerUser);
        ctx.Patients.Add(patient);
        ctx.Doctors.Add(doctor);
        ctx.Branches.Add(branch);
        ctx.DoctorServices.Add(doctorService);
        ctx.QueueSessions.Add(queueSession);
        ctx.ClinicSettings.Add(settings);
        ctx.TenantFeatureFlags.Add(flags);
        await ctx.SaveChangesAsync();

        return new SeedData(
            PatientUserId: patientUser.Id,
            ReviewerUserId: reviewerUser.Id,
            PatientId: patient.Id,
            DoctorId: doctor.Id,
            BranchId: branch.Id,
            DoctorServiceId: doctorService.Id);
    }

    private static CreatePatientSelfServiceRequest BuildSameDayRequest(SeedData seed)
    {
        return new CreatePatientSelfServiceRequest
        {
            PatientId = seed.PatientId,
            DoctorId = seed.DoctorId,
            BranchId = seed.BranchId,
            DoctorServiceId = seed.DoctorServiceId,
            RequestType = PatientSelfServiceRequestType.SameDayTicket,
            VisitType = VisitType.Exam,
            RequestedDate = DateTime.UtcNow.Date,
            PaidAmount = 500m,
            PaymentMethod = "BankTransfer",
            TransferReference = "REF-100",
            Complaint = "Headache"
        };
    }

    private static CreatePatientSelfServiceRequest BuildFutureBookingRequest(SeedData seed)
    {
        return new CreatePatientSelfServiceRequest
        {
            PatientId = seed.PatientId,
            DoctorId = seed.DoctorId,
            BranchId = seed.BranchId,
            DoctorServiceId = seed.DoctorServiceId,
            RequestType = PatientSelfServiceRequestType.FutureBooking,
            VisitType = VisitType.Consultation,
            RequestedDate = DateTime.UtcNow.Date.AddDays(1),
            RequestedTime = "10:30",
            PaidAmount = 500m,
            PaymentMethod = "BankTransfer",
            TransferReference = "REF-200",
            Complaint = "Follow up"
        };
    }

    private static IFormFile CreateImageFile(string fileName)
    {
        var bytes = new byte[] { 1, 2, 3, 4, 5, 6 };
        var stream = new MemoryStream(bytes);
        return new FormFile(stream, 0, bytes.Length, "file", fileName)
        {
            Headers = new HeaderDictionary(),
            ContentType = "image/png"
        };
    }

    private readonly record struct SeedData(
        Guid PatientUserId,
        Guid ReviewerUserId,
        Guid PatientId,
        Guid DoctorId,
        Guid BranchId,
        Guid DoctorServiceId);

    private sealed class FakeInvoiceNumberService : IInvoiceNumberService
    {
        public Task<string> GenerateNextAsync(Guid tenantId, DateTime? issuedAtUtc = null, CancellationToken cancellationToken = default)
        {
            _ = tenantId;
            _ = issuedAtUtc;
            _ = cancellationToken;
            return Task.FromResult($"INV-{DateTime.UtcNow:yyyy}-TEST");
        }
    }

    private sealed class FakeFileStorageService : IFileStorageService
    {
        private int _counter;
        public List<string> DeletedPaths { get; } = new();

        public Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveImageAsync(
            Guid tenantId,
            string category,
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            _ = cancellationToken;
            _counter++;
            var stored = $"{_counter}-{Path.GetFileName(file.FileName)}";
            var relative = $"{tenantId}/{category}/{stored}";
            var url = $"/media/{relative}";
            return Task.FromResult((relative, url, stored));
        }

        public Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveFileAsync(
            Guid tenantId,
            string category,
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            return SaveImageAsync(tenantId, category, file, cancellationToken);
        }

        public Task DeleteAsync(string relativePath, CancellationToken cancellationToken = default)
        {
            _ = cancellationToken;
            DeletedPaths.Add(relativePath);
            return Task.CompletedTask;
        }

        public bool IsSupportedImage(IFormFile file)
        {
            return file.ContentType is "image/png" or "image/jpeg" or "image/jpg" or "image/webp";
        }

        public bool IsAllowedSize(long size)
        {
            return IsAllowedSize(size, 10 * 1024 * 1024);
        }

        public bool IsAllowedSize(long size, long maxSizeBytes)
        {
            return size > 0 && size <= maxSizeBytes;
        }
    }
}