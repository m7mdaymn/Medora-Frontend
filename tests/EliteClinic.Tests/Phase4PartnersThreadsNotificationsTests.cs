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

public class Phase4PartnersThreadsNotificationsTests
{
    [Fact]
    public async Task CreateLabPartnerOrder_ThenUpdateStatus_ShouldPersistHistoryAndNotifications()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);

        var partnerService = BuildPartnerService(ctx);

        var partner = await partnerService.CreatePartnerAsync(tenantId, new CreatePartnerRequest
        {
            Name = "Central Lab",
            Type = PartnerType.Laboratory,
            ContactPhone = "0105550001"
        });

        Assert.True(partner.Success);

        var created = await partnerService.CreateLabOrderAsync(
            tenantId,
            seed.VisitId,
            seed.LabRequestId,
            seed.DoctorUserId,
            new CreateLabPartnerOrderRequest
            {
                PartnerId = partner.Data!.Id,
                EstimatedCost = 350m,
                ExternalReference = "LAB-001",
                Notes = "Urgent lab processing"
            });

        Assert.True(created.Success);
        Assert.Equal(PartnerOrderStatus.Sent, created.Data!.Status);
        Assert.NotNull(created.Data.SentAt);

        var linkedLab = await ctx.LabRequests.FirstAsync(l => l.Id == seed.LabRequestId);
        Assert.Equal(created.Data.Id, linkedLab.PartnerOrderId);

        var updated = await partnerService.UpdateOrderStatusAsync(
            tenantId,
            seed.DoctorUserId,
            created.Data.Id,
            new UpdatePartnerOrderStatusRequest
            {
                Status = PartnerOrderStatus.Accepted,
                FinalCost = 420m,
                Notes = "Accepted by external lab"
            });

        Assert.True(updated.Success);
        Assert.Equal(PartnerOrderStatus.Accepted, updated.Data!.Status);
        Assert.NotNull(updated.Data.AcceptedAt);
        Assert.Equal(420m, updated.Data.FinalCost);
        Assert.Equal(2, updated.Data.StatusHistory.Count);

        var histories = await ctx.PartnerOrderStatusHistories
            .Where(h => h.PartnerOrderId == created.Data.Id)
            .ToListAsync();

        Assert.Equal(2, histories.Count);
        Assert.Contains(histories, h => h.OldStatus == null && h.NewStatus == PartnerOrderStatus.Sent);
        Assert.Contains(histories, h => h.OldStatus == PartnerOrderStatus.Sent && h.NewStatus == PartnerOrderStatus.Accepted);

        var notifications = await ctx.InAppNotifications
            .Where(n => n.EntityId == created.Data.Id && n.Type == InAppNotificationType.PartnerOrderStatusChanged)
            .ToListAsync();

        Assert.Equal(2, notifications.Count);
        Assert.All(notifications, n => Assert.Equal(seed.PatientUserId, n.UserId));

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task PrescriptionRevisions_ShouldTrackCreateAndUpdate_AndNotifyOtherParty()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);

        var prescriptionService = BuildPrescriptionService(ctx);

        var created = await prescriptionService.CreateAsync(
            tenantId,
            seed.VisitId,
            new CreatePrescriptionRequest
            {
                MedicationName = "Amoxicillin",
                Dosage = "500mg",
                Frequency = "twice daily",
                Duration = "5 days",
                Instructions = "After meals",
                RevisionReason = "Initial diagnosis"
            },
            seed.DoctorUserId);

        Assert.True(created.Success);

        var updated = await prescriptionService.UpdateAsync(
            tenantId,
            seed.VisitId,
            created.Data!.Id,
            new UpdatePrescriptionRequest
            {
                MedicationName = "Amoxicillin",
                Dosage = "875mg",
                Frequency = "twice daily",
                Duration = "7 days",
                Instructions = "After meals",
                RevisionReason = "Dose adjusted"
            },
            seed.DoctorUserId);

        Assert.True(updated.Success);

        var revisions = await prescriptionService.GetRevisionsAsync(tenantId, seed.VisitId, created.Data.Id, seed.DoctorUserId);
        Assert.True(revisions.Success);
        Assert.Equal(2, revisions.Data!.Count);
        Assert.Equal("Updated", revisions.Data[0].Action);
        Assert.Equal("Dose adjusted", revisions.Data[0].Reason);
        Assert.Equal("Created", revisions.Data[1].Action);

        var revisionNotifications = await ctx.InAppNotifications
            .Where(n => n.EntityType == nameof(Prescription)
                        && n.EntityId == created.Data.Id
                        && n.Type == InAppNotificationType.PrescriptionRevised)
            .ToListAsync();

        Assert.Equal(2, revisionNotifications.Count);
        Assert.All(revisionNotifications, n => Assert.Equal(seed.PatientUserId, n.UserId));

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task DocumentThreadFlow_ShouldCreateReplyClose_AndHideInternalReplyFromPatientView()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);

        var patientMedicalService = BuildPatientMedicalService(ctx);

        var thread = await patientMedicalService.CreateDocumentThreadAsync(
            tenantId,
            seed.PatientId,
            seed.DocumentId,
            new CreatePatientMedicalDocumentThreadRequest
            {
                Subject = "Clarify result",
                Notes = "Discuss elevated count",
                InitialMessage = "Please explain this report"
            },
            seed.DoctorUserId,
            isPatientActor: false,
            CancellationToken.None);

        Assert.True(thread.Success);
        Assert.Equal(MedicalDocumentThreadStatus.Open, thread.Data!.Status);
        Assert.Single(thread.Data.Replies);

        var patientReply = await patientMedicalService.AddThreadReplyAsync(
            tenantId,
            seed.PatientId,
            seed.DocumentId,
            thread.Data.Id,
            new AddPatientMedicalDocumentThreadReplyRequest
            {
                Message = "Thanks, that helps",
                IsInternalNote = false
            },
            seed.PatientUserId,
            isPatientActor: true,
            CancellationToken.None);

        Assert.True(patientReply.Success);

        var internalReply = await patientMedicalService.AddThreadReplyAsync(
            tenantId,
            seed.PatientId,
            seed.DocumentId,
            thread.Data.Id,
            new AddPatientMedicalDocumentThreadReplyRequest
            {
                Message = "Internal follow-up for next visit",
                IsInternalNote = true
            },
            seed.DoctorUserId,
            isPatientActor: false,
            CancellationToken.None);

        Assert.True(internalReply.Success);

        var closed = await patientMedicalService.CloseThreadAsync(
            tenantId,
            seed.PatientId,
            seed.DocumentId,
            thread.Data.Id,
            new ClosePatientMedicalDocumentThreadRequest
            {
                Notes = "Resolved and closed"
            },
            seed.DoctorUserId,
            isPatientActor: false,
            CancellationToken.None);

        Assert.True(closed.Success);
        Assert.Equal(MedicalDocumentThreadStatus.Closed, closed.Data!.Status);
        Assert.NotNull(closed.Data.ClosedAt);

        var patientView = await patientMedicalService.ListDocumentThreadsAsync(
            tenantId,
            seed.PatientId,
            seed.DocumentId,
            seed.PatientUserId,
            isPatientActor: true,
            CancellationToken.None);

        Assert.True(patientView.Success);
        var patientThread = Assert.Single(patientView.Data!);
        Assert.Equal(2, patientThread.Replies.Count);
        Assert.DoesNotContain(patientThread.Replies, r => r.IsInternalNote);

        var staffView = await patientMedicalService.ListDocumentThreadsAsync(
            tenantId,
            seed.PatientId,
            seed.DocumentId,
            seed.DoctorUserId,
            isPatientActor: false,
            CancellationToken.None);

        Assert.True(staffView.Success);
        var staffThread = Assert.Single(staffView.Data!);
        Assert.Equal(3, staffThread.Replies.Count);

        var threadNotifications = await ctx.InAppNotifications
            .Where(n => n.EntityId == thread.Data.Id && n.Type == InAppNotificationType.MedicalDocumentThreadUpdated)
            .ToListAsync();

        Assert.Equal(4, threadNotifications.Count);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task NotificationService_InAppReadFlow_ShouldMarkSingleAndAllAsRead()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);

        var firstId = Guid.NewGuid();
        var secondId = Guid.NewGuid();
        var thirdId = Guid.NewGuid();

        ctx.InAppNotifications.AddRange(
            new InAppNotification
            {
                Id = firstId,
                TenantId = tenantId,
                UserId = seed.PatientUserId,
                Type = InAppNotificationType.System,
                Title = "A",
                Body = "A"
            },
            new InAppNotification
            {
                Id = secondId,
                TenantId = tenantId,
                UserId = seed.PatientUserId,
                Type = InAppNotificationType.System,
                Title = "B",
                Body = "B"
            },
            new InAppNotification
            {
                Id = thirdId,
                TenantId = tenantId,
                UserId = seed.PatientUserId,
                Type = InAppNotificationType.System,
                Title = "C",
                Body = "C"
            });

        await ctx.SaveChangesAsync();

        var notificationService = BuildNotificationService(ctx);

        var unreadBefore = await notificationService.GetInAppNotificationsAsync(
            tenantId,
            seed.PatientUserId,
            new InAppNotificationsQuery { UnreadOnly = true, PageSize = 50 });

        Assert.True(unreadBefore.Success);
        Assert.Equal(3, unreadBefore.Data!.Items.Count);

        var markSingle = await notificationService.MarkInAppReadAsync(tenantId, seed.PatientUserId, firstId);
        Assert.True(markSingle.Success);
        Assert.True(markSingle.Data!.IsRead);
        Assert.NotNull(markSingle.Data.ReadAt);

        var markAll = await notificationService.MarkAllInAppReadAsync(tenantId, seed.PatientUserId);
        Assert.True(markAll.Success);
        Assert.Equal(2, markAll.Data);

        var unreadAfter = await notificationService.GetInAppNotificationsAsync(
            tenantId,
            seed.PatientUserId,
            new InAppNotificationsQuery { UnreadOnly = true, PageSize = 50 });

        Assert.True(unreadAfter.Success);
        Assert.Empty(unreadAfter.Data!.Items);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public void Phase4EndpointRoles_ShouldMatchPolicyMatrix()
    {
        AssertMethodRoles(typeof(PartnersController), nameof(PartnersController.List), "ClinicOwner", "ClinicManager", "Receptionist", "Doctor", "SuperAdmin");
        AssertMethodRoles(typeof(PartnersController), nameof(PartnersController.Create), "ClinicOwner", "ClinicManager", "SuperAdmin");
        AssertMethodRoles(typeof(PartnersController), nameof(PartnersController.ListContracts), "ClinicOwner", "ClinicManager", "Receptionist", "Doctor", "SuperAdmin");

        AssertMethodRoles(typeof(PartnerOrdersController), nameof(PartnerOrdersController.List), "ClinicOwner", "ClinicManager", "Receptionist", "Doctor", "Nurse", "SuperAdmin");
        AssertMethodRoles(typeof(PartnerOrdersController), nameof(PartnerOrdersController.UpdateStatus), "ClinicOwner", "ClinicManager", "Receptionist", "Doctor", "Nurse", "SuperAdmin");

        AssertMethodRoles(typeof(LabRequestsController), nameof(LabRequestsController.CreatePartnerOrder), "ClinicOwner", "ClinicManager", "Doctor", "SuperAdmin");
        AssertMethodRoles(typeof(PrescriptionsController), nameof(PrescriptionsController.CreatePartnerOrder), "ClinicOwner", "ClinicManager", "Doctor", "SuperAdmin");
        AssertMethodRoles(typeof(PrescriptionsController), nameof(PrescriptionsController.GetRevisions), "ClinicOwner", "ClinicManager", "Receptionist", "Doctor", "Nurse", "SuperAdmin");

        AssertMethodRoles(typeof(PatientMedicalController), nameof(PatientMedicalController.ListDocumentThreads), "ClinicOwner", "ClinicManager", "Receptionist", "Nurse", "Doctor", "Patient", "SuperAdmin");
        AssertMethodRoles(typeof(PatientMedicalController), nameof(PatientMedicalController.CreateDocumentThread), "ClinicOwner", "ClinicManager", "Receptionist", "Nurse", "Doctor", "Patient", "SuperAdmin");
        AssertMethodRoles(typeof(PatientMedicalController), nameof(PatientMedicalController.AddThreadReply), "ClinicOwner", "ClinicManager", "Receptionist", "Nurse", "Doctor", "Patient", "SuperAdmin");
        AssertMethodRoles(typeof(PatientMedicalController), nameof(PatientMedicalController.CloseThread), "ClinicOwner", "ClinicManager", "Receptionist", "Nurse", "Doctor", "Patient", "SuperAdmin");

        AssertMethodRoles(typeof(NotificationsController), nameof(NotificationsController.GetInApp), "Patient", "Doctor", "ClinicOwner", "ClinicManager", "Receptionist", "Nurse", "SuperAdmin");
        AssertMethodRoles(typeof(NotificationsController), nameof(NotificationsController.MarkInAppRead), "Patient", "Doctor", "ClinicOwner", "ClinicManager", "Receptionist", "Nurse", "SuperAdmin");
        AssertMethodRoles(typeof(NotificationsController), nameof(NotificationsController.MarkAllInAppRead), "Patient", "Doctor", "ClinicOwner", "ClinicManager", "Receptionist", "Nurse", "SuperAdmin");
    }

    private static void AssertMethodRoles(Type controllerType, string methodName, params string[] requiredRoles)
    {
        var method = controllerType.GetMethod(methodName);
        Assert.NotNull(method);

        var authorize = method!.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorize);
        Assert.False(string.IsNullOrWhiteSpace(authorize!.Roles));

        var roles = authorize.Roles!
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        foreach (var role in requiredRoles)
            Assert.Contains(role, roles, StringComparer.OrdinalIgnoreCase);
    }

    private static PartnerService BuildPartnerService(EliteClinicDbContext ctx)
    {
        return new PartnerService(ctx, new BranchAccessService(ctx));
    }

    private static PrescriptionService BuildPrescriptionService(EliteClinicDbContext ctx)
    {
        return new PrescriptionService(ctx, new FakeMessageService());
    }

    private static PatientMedicalService BuildPatientMedicalService(EliteClinicDbContext ctx)
    {
        return new PatientMedicalService(ctx, new NoOpFileStorageService());
    }

    private static NotificationService BuildNotificationService(EliteClinicDbContext ctx)
    {
        return new NotificationService(ctx);
    }

    private static async Task<SeedData> SeedAsync(EliteClinicDbContext ctx, Guid tenantId)
    {
        var patientUser = new ApplicationUser("phase4-patient", "Phase4 Patient") { TenantId = tenantId };
        var doctorUser = new ApplicationUser("phase4-doctor", "Phase4 Doctor") { TenantId = tenantId };

        var patient = new Patient
        {
            TenantId = tenantId,
            UserId = patientUser.Id,
            Name = "Phase4 Patient",
            Phone = "0100004000",
            IsDefault = true
        };

        var doctor = new Doctor
        {
            TenantId = tenantId,
            UserId = doctorUser.Id,
            Name = "Phase4 Doctor",
            IsEnabled = true
        };

        var branch = new Branch
        {
            TenantId = tenantId,
            Name = "Phase4 Main Branch",
            IsActive = true
        };

        ctx.Users.AddRange(patientUser, doctorUser);
        ctx.Patients.Add(patient);
        ctx.Doctors.Add(doctor);
        ctx.Branches.Add(branch);
        await ctx.SaveChangesAsync();

        var visit = new Visit
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            PatientId = patient.Id,
            BranchId = branch.Id,
            Status = VisitStatus.Open,
            Source = VisitSource.WalkInTicket,
            VisitType = VisitType.Exam,
            StartedAt = DateTime.UtcNow
        };

        var labRequest = new LabRequest
        {
            TenantId = tenantId,
            VisitId = visit.Id,
            TestName = "CBC",
            Type = LabRequestType.Lab,
            Notes = "Baseline test"
        };

        var document = new PatientMedicalDocument
        {
            TenantId = tenantId,
            PatientId = patient.Id,
            UploadedByUserId = doctorUser.Id,
            Category = DocumentCategory.Lab,
            OriginalFileName = "cbc-report.pdf",
            StoredFileName = "cbc-report.pdf",
            RelativePath = $"{tenantId}/patient-medical-documents/cbc-report.pdf",
            PublicUrl = "/media/test/cbc-report.pdf",
            ContentType = "application/pdf",
            FileSizeBytes = 1024,
            Notes = "Initial upload"
        };

        ctx.Visits.Add(visit);
        ctx.LabRequests.Add(labRequest);
        ctx.PatientMedicalDocuments.Add(document);
        await ctx.SaveChangesAsync();

        return new SeedData(
            PatientUserId: patientUser.Id,
            DoctorUserId: doctorUser.Id,
            PatientId: patient.Id,
            DoctorId: doctor.Id,
            BranchId: branch.Id,
            VisitId: visit.Id,
            LabRequestId: labRequest.Id,
            DocumentId: document.Id);
    }

    private readonly record struct SeedData(
        Guid PatientUserId,
        Guid DoctorUserId,
        Guid PatientId,
        Guid DoctorId,
        Guid BranchId,
        Guid VisitId,
        Guid LabRequestId,
        Guid DocumentId);

    private sealed class NoOpFileStorageService : IFileStorageService
    {
        public Task<(string RelativePath, string PublicUrl, string StoredFileName)> SaveImageAsync(
            Guid tenantId,
            string category,
            IFormFile file,
            CancellationToken cancellationToken = default)
        {
            _ = cancellationToken;
            var stored = Path.GetFileName(file.FileName);
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
            _ = relativePath;
            _ = cancellationToken;
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