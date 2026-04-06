using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using Xunit;

namespace EliteClinic.Tests;

public class QueueWithPaymentCompatibilityTests
{
    [Fact]
    public async Task WithPayment_ShouldSupportLegacyDoctorServiceId_AndPartialPayment()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var legacyService = new DoctorService
        {
            TenantId = tenantId,
            DoctorId = seeded.Doctor.Id,
            ServiceName = "Legacy Service",
            Price = 500,
            IsActive = true
        };
        ctx.DoctorServices.Add(legacyService);
        await ctx.SaveChangesAsync();

        var service = BuildQueueService(ctx);
        var result = await service.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            DoctorServiceId = legacyService.Id,
            VisitType = VisitType.Consultation,
            PaidAmount = 200,
            PaymentMethod = "Cash"
        }, Guid.NewGuid());

        Assert.True(result.Success);
        Assert.Equal("Legacy Service", result.Data!.ServiceName);
        Assert.Equal(500m, result.Data.InvoiceAmount);
        Assert.Equal(200m, result.Data.PaidAmount);
        Assert.Equal(300m, result.Data.RemainingAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, result.Data.InvoiceStatus);
        Assert.Contains("Remaining amount: 300", result.Message, StringComparison.OrdinalIgnoreCase);

        var savedTicket = await ctx.QueueTickets
            .FirstAsync(t => t.Id == result.Data!.Id);
        Assert.Equal(legacyService.Id, savedTicket.DoctorServiceId);

        var savedVisit = await ctx.Visits.FirstAsync(v => v.QueueTicketId == savedTicket.Id);
        Assert.Equal(VisitType.Consultation, savedVisit.VisitType);

        var savedInvoice = await ctx.Invoices.FirstAsync(i => i.VisitId == savedVisit.Id);
        Assert.Equal(500m, savedInvoice.Amount);
        Assert.Equal(200m, savedInvoice.PaidAmount);
        Assert.Equal(300m, savedInvoice.RemainingAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, savedInvoice.Status);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task WithPayment_ShouldSupportLinkedClinicServiceId_WithoutFkCrash()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var clinicService = new ClinicService
        {
            TenantId = tenantId,
            Name = "Clinic Linked Service",
            DefaultPrice = 450,
            IsActive = true
        };
        ctx.ClinicServicesCatalog.Add(clinicService);
        await ctx.SaveChangesAsync();

        ctx.DoctorServiceLinks.Add(new DoctorServiceLink
        {
            TenantId = tenantId,
            DoctorId = seeded.Doctor.Id,
            ClinicServiceId = clinicService.Id,
            OverridePrice = 420,
            IsActive = true
        });
        await ctx.SaveChangesAsync();

        var service = BuildQueueService(ctx);
        var result = await service.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            DoctorServiceId = clinicService.Id,
            PaidAmount = 100,
            PaymentMethod = "Cash"
        }, Guid.NewGuid());

        Assert.True(result.Success);
        Assert.Equal(clinicService.Id, result.Data!.DoctorServiceId);
        Assert.Equal("Clinic Linked Service", result.Data!.ServiceName);
        Assert.Equal(420m, result.Data.InvoiceAmount);
        Assert.Equal(100m, result.Data.PaidAmount);
        Assert.Equal(320m, result.Data.RemainingAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, result.Data.InvoiceStatus);

        var savedTicket = await ctx.QueueTickets.FirstAsync(t => t.Id == result.Data!.Id);
        Assert.Null(savedTicket.DoctorServiceId);

        var savedVisit = await ctx.Visits.FirstAsync(v => v.QueueTicketId == savedTicket.Id);
        var savedInvoice = await ctx.Invoices.FirstAsync(i => i.VisitId == savedVisit.Id);
        Assert.Equal(420m, savedInvoice.Amount);
        Assert.Equal(100m, savedInvoice.PaidAmount);
        Assert.Equal(320m, savedInvoice.RemainingAmount);

        var invoiceService = new InvoiceService(ctx, new FakeInvoiceNumberService(), DbContextFactory.CreateTenantContext(tenantId));
        var invoiceDto = await invoiceService.GetInvoiceByIdAsync(tenantId, savedInvoice.Id);
        Assert.True(invoiceDto.Success);
        Assert.Equal(100m, invoiceDto.Data!.PaidAmount);
        Assert.Equal(320m, invoiceDto.Data.RemainingAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, invoiceDto.Data.Status);

        var board = await service.GetBoardAsync(tenantId, Guid.NewGuid());
        Assert.True(board.Success);
        var boardTicket = board.Data!.Sessions
            .SelectMany(s => s.WaitingTickets)
            .First(t => t.Id == savedTicket.Id);
        Assert.Equal(clinicService.Id, boardTicket.DoctorServiceId);
        Assert.Equal("Clinic Linked Service", boardTicket.ServiceName);
        Assert.Equal(420m, boardTicket.InvoiceAmount);
        Assert.Equal(100m, boardTicket.PaidAmount);
        Assert.Equal(320m, boardTicket.RemainingAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, boardTicket.InvoiceStatus);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task WithPayment_ShouldSupportDoctorServiceLinkId_WhenProvidedByDoctorServicesPayload()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var clinicService = new ClinicService
        {
            TenantId = tenantId,
            Name = "Clinic Linked Service",
            DefaultPrice = 600,
            IsActive = true
        };
        ctx.ClinicServicesCatalog.Add(clinicService);
        await ctx.SaveChangesAsync();

        var link = new DoctorServiceLink
        {
            TenantId = tenantId,
            DoctorId = seeded.Doctor.Id,
            ClinicServiceId = clinicService.Id,
            OverridePrice = 550,
            IsActive = true
        };
        ctx.DoctorServiceLinks.Add(link);
        await ctx.SaveChangesAsync();

        var service = BuildQueueService(ctx);
        var result = await service.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            DoctorServiceId = link.Id,
            PaidAmount = 150,
            PaymentMethod = "Cash"
        }, Guid.NewGuid());

        Assert.True(result.Success);
        Assert.Equal(link.Id, result.Data!.DoctorServiceId);
        Assert.Equal("Clinic Linked Service", result.Data!.ServiceName);

        var savedTicket = await ctx.QueueTickets.FirstAsync(t => t.Id == result.Data!.Id);
        Assert.Null(savedTicket.DoctorServiceId);

        var savedVisit = await ctx.Visits.FirstAsync(v => v.QueueTicketId == savedTicket.Id);
        var savedInvoice = await ctx.Invoices.FirstAsync(i => i.VisitId == savedVisit.Id);
        Assert.Equal(550m, savedInvoice.Amount);
        Assert.Equal(150m, savedInvoice.PaidAmount);
        Assert.Equal(400m, savedInvoice.RemainingAmount);

        var invoiceService = new InvoiceService(ctx, new FakeInvoiceNumberService(), DbContextFactory.CreateTenantContext(tenantId));
        var invoiceDto = await invoiceService.GetInvoiceByIdAsync(tenantId, savedInvoice.Id);
        Assert.True(invoiceDto.Success);
        Assert.Equal(150m, invoiceDto.Data!.PaidAmount);
        Assert.Equal(400m, invoiceDto.Data.RemainingAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, invoiceDto.Data.Status);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task WithPayment_InvalidDoctorServiceId_ShouldReturnApiError()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);

        var service = BuildQueueService(ctx);
        var result = await service.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            DoctorServiceId = Guid.NewGuid(),
            PaidAmount = 100
        }, Guid.NewGuid());

        Assert.False(result.Success);
        Assert.Contains("doctorServiceId", result.Message, StringComparison.OrdinalIgnoreCase);
        Assert.Equal(0, await ctx.QueueTickets.CountAsync());

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task CancelTicket_ShouldPersistAndReturnCancelledStatus()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var queueService = BuildQueueService(ctx);

        var issued = await queueService.IssueTicketAsync(tenantId, new CreateQueueTicketRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            IsUrgent = false
        }, Guid.NewGuid());

        Assert.True(issued.Success);

        var cancelled = await queueService.CancelTicketAsync(tenantId, issued.Data!.Id, Guid.NewGuid());
        Assert.True(cancelled.Success);
        Assert.Equal(TicketStatus.Cancelled, cancelled.Data!.Status);

        var savedTicket = await ctx.QueueTickets.FirstAsync(t => t.Id == issued.Data!.Id);
        Assert.Equal(TicketStatus.Cancelled, savedTicket.Status);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task CancelWithPaymentTicket_ShouldPersistAndReturnCancelledStatus()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var legacyService = new DoctorService
        {
            TenantId = tenantId,
            DoctorId = seeded.Doctor.Id,
            ServiceName = "Cancelable Paid Service",
            Price = 500,
            IsActive = true
        };
        ctx.DoctorServices.Add(legacyService);
        await ctx.SaveChangesAsync();

        var queueService = BuildQueueService(ctx);
        var issued = await queueService.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            DoctorServiceId = legacyService.Id,
            PaidAmount = 300,
            PaymentMethod = "Cash"
        }, Guid.NewGuid());

        Assert.True(issued.Success);

        var cancelled = await queueService.CancelTicketAsync(tenantId, issued.Data!.Id, Guid.NewGuid());
        Assert.True(cancelled.Success);
        Assert.Equal(TicketStatus.Cancelled, cancelled.Data!.Status);

        var savedTicket = await ctx.QueueTickets.FirstAsync(t => t.Id == issued.Data!.Id);
        Assert.Equal(TicketStatus.Cancelled, savedTicket.Status);

        var visit = await ctx.Visits.FirstAsync(v => v.QueueTicketId == issued.Data!.Id);
        var invoice = await ctx.Invoices.FirstAsync(i => i.VisitId == visit.Id);
        Assert.Equal(0m, invoice.Amount);
        Assert.Equal(0m, invoice.PaidAmount);
        Assert.Equal(0m, invoice.RemainingAmount);
        Assert.Equal(InvoiceStatus.Refunded, invoice.Status);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task WithPayment_Consultation_ShouldPersist_AndVisitDetailsShouldReturnPatientFields()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        seeded.Patient.Phone = "0101001001";
        seeded.Patient.DateOfBirth = new DateTime(1991, 7, 15);
        seeded.Patient.Gender = Gender.Female;

        var legacyService = new DoctorService
        {
            TenantId = tenantId,
            DoctorId = seeded.Doctor.Id,
            ServiceName = "Consult Service",
            Price = 1000,
            IsActive = true
        };
        ctx.DoctorServices.Add(legacyService);
        await ctx.SaveChangesAsync();

        var queueService = BuildQueueService(ctx);
        var withPayment = await queueService.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            DoctorServiceId = legacyService.Id,
            VisitType = VisitType.Consultation,
            PaidAmount = 800,
            PaymentMethod = "Cash"
        }, Guid.NewGuid());

        Assert.True(withPayment.Success);

        var createdVisit = await ctx.Visits.FirstAsync(v => v.QueueTicketId == withPayment.Data!.Id);
        Assert.Equal(VisitType.Consultation, createdVisit.VisitType);

        var visitService = new VisitService(ctx);
        var visitResponse = await visitService.GetVisitByIdAsync(tenantId, createdVisit.Id, Guid.NewGuid());

        Assert.True(visitResponse.Success);
        Assert.Equal(VisitType.Consultation, visitResponse.Data!.VisitType);
        Assert.Equal("0101001001", visitResponse.Data.PatientPhone);
        Assert.Equal(new DateTime(1991, 7, 15), visitResponse.Data.PatientDateOfBirth);
        Assert.Equal("Female", visitResponse.Data.PatientGender);
        Assert.Equal("0101001001", visitResponse.Data.Phone);
        Assert.Equal(new DateTime(1991, 7, 15), visitResponse.Data.DateOfBirth);
        Assert.Equal("Female", visitResponse.Data.Gender);

        var savedInvoice = await ctx.Invoices.FirstAsync(i => i.VisitId == createdVisit.Id);
        Assert.Equal(1000m, savedInvoice.Amount);
        Assert.Equal(800m, savedInvoice.PaidAmount);
        Assert.Equal(200m, savedInvoice.RemainingAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, savedInvoice.Status);

        var financeService = new FinanceService(ctx, DbContextFactory.CreateTenantContext(tenantId));
        var daily = await financeService.GetDailyRevenueAsync(tenantId, DateTime.UtcNow.Date);
        Assert.True(daily.Success);
        Assert.Equal(800m, daily.Data!.TotalPaid);
        Assert.Equal(200m, daily.Data!.TotalUnpaid);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task FullRefund_ShouldSetInvoiceStatusToRefunded_AndZeroRemaining()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var legacyService = new DoctorService
        {
            TenantId = tenantId,
            DoctorId = seeded.Doctor.Id,
            ServiceName = "Refundable Service",
            Price = 900,
            IsActive = true
        };
        ctx.DoctorServices.Add(legacyService);
        await ctx.SaveChangesAsync();

        var queueService = BuildQueueService(ctx);
        var withPayment = await queueService.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            DoctorServiceId = legacyService.Id,
            PaidAmount = 900,
            PaymentMethod = "Cash"
        }, Guid.NewGuid());

        Assert.True(withPayment.Success);

        var createdVisit = await ctx.Visits.FirstAsync(v => v.QueueTicketId == withPayment.Data!.Id);
        var savedInvoice = await ctx.Invoices.FirstAsync(i => i.VisitId == createdVisit.Id);
        Assert.Equal(InvoiceStatus.Paid, savedInvoice.Status);

        var invoiceService = new InvoiceService(ctx, new FakeInvoiceNumberService(), DbContextFactory.CreateTenantContext(tenantId));
        var refund = await invoiceService.RefundPaymentAsync(tenantId, savedInvoice.Id, new RefundInvoiceRequest
        {
            Amount = 900,
            Reason = "Full refund requested"
        }, Guid.NewGuid());

        Assert.True(refund.Success);

        var reloaded = await ctx.Invoices.FirstAsync(i => i.Id == savedInvoice.Id);
        Assert.Equal(0m, reloaded.Amount);
        Assert.Equal(0m, reloaded.PaidAmount);
        Assert.Equal(0m, reloaded.RemainingAmount);
        Assert.Equal(InvoiceStatus.Refunded, reloaded.Status);

        var invoiceDto = await invoiceService.GetInvoiceByIdAsync(tenantId, savedInvoice.Id);
        Assert.True(invoiceDto.Success);
        Assert.Equal(0m, invoiceDto.Data!.PaidAmount);
        Assert.Equal(0m, invoiceDto.Data.RemainingAmount);
        Assert.Equal(InvoiceStatus.Refunded, invoiceDto.Data.Status);
        Assert.Equal(900m, invoiceDto.Data.TotalRefunded);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task QueueOrdering_ShouldPreferNormalizedUrgentInsertAfterCount()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        seeded.Doctor.UrgentEnabled = true;
        seeded.Doctor.UrgentCaseMode = UrgentCaseMode.UrgentFront;
        seeded.Doctor.UrgentInsertAfterCount = 1;

        var patient2User = new ApplicationUser("p2", "P2") { TenantId = tenantId };
        var patient3User = new ApplicationUser("p3", "P3") { TenantId = tenantId };
        var patient2 = new Patient { TenantId = tenantId, UserId = patient2User.Id, Name = "Patient2", Phone = "222" };
        var patient3 = new Patient { TenantId = tenantId, UserId = patient3User.Id, Name = "Patient3", Phone = "333" };
        ctx.Users.AddRange(patient2User, patient3User);
        ctx.Patients.AddRange(patient2, patient3);

        var t1 = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            TicketNumber = 1,
            Status = TicketStatus.Waiting,
            IsUrgent = false,
            IssuedAt = DateTime.UtcNow.AddMinutes(-3)
        };
        var t2 = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = seeded.Session.Id,
            PatientId = patient2.Id,
            DoctorId = seeded.Doctor.Id,
            TicketNumber = 2,
            Status = TicketStatus.Waiting,
            IsUrgent = true,
            IssuedAt = DateTime.UtcNow.AddMinutes(-2)
        };
        var t3 = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = seeded.Session.Id,
            PatientId = patient3.Id,
            DoctorId = seeded.Doctor.Id,
            TicketNumber = 3,
            Status = TicketStatus.Waiting,
            IsUrgent = false,
            IssuedAt = DateTime.UtcNow.AddMinutes(-1)
        };

        ctx.QueueTickets.AddRange(t1, t2, t3);
        await ctx.SaveChangesAsync();

        var service = BuildQueueService(ctx);
        var result = await service.GetTicketsBySessionAsync(tenantId, seeded.Session.Id, Guid.NewGuid());

        Assert.True(result.Success);
        Assert.Equal(t1.Id, result.Data![0].Id);
        Assert.Equal(t2.Id, result.Data![1].Id);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public void DoctorDtoMapping_ShouldKeepUrgentFieldsConsistent()
    {
        var doctor = new Doctor
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Name = "Dr Urgent",
            UrgentCaseMode = UrgentCaseMode.UrgentBucket,
            UrgentEnabled = true,
            UrgentInsertAfterCount = 2,
            AvgVisitDurationMinutes = 15,
            IsEnabled = true
        };

        var user = new ApplicationUser("urgent-user", "Dr Urgent")
        {
            Id = doctor.UserId
        };

        var mapMethod = typeof(DoctorServiceImpl).GetMethod("MapToDto", BindingFlags.NonPublic | BindingFlags.Static);
        Assert.NotNull(mapMethod);

        var dto = (DoctorDto)mapMethod!.Invoke(null, new object?[] { doctor, user, null })!;

        Assert.Equal(doctor.UrgentCaseMode, dto.UrgentCaseMode);
        Assert.Equal(doctor.UrgentEnabled, dto.UrgentEnabled);
        Assert.Equal(doctor.UrgentInsertAfterCount, dto.UrgentInsertAfterCount);
        Assert.Equal(dto.UrgentEnabled, dto.SupportsUrgent);
    }

    [Fact]
    public async Task IssueTicket_ShouldFail_WhenDoctorShiftIsNotOpen()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var otherDoctorUser = new ApplicationUser("doc2", "Doctor 2") { TenantId = tenantId };
        var otherDoctor = new Doctor
        {
            TenantId = tenantId,
            UserId = otherDoctorUser.Id,
            Name = "Dr Closed Shift",
            IsEnabled = true,
            UrgentEnabled = true,
            UrgentCaseMode = UrgentCaseMode.UrgentNext
        };

        ctx.Users.Add(otherDoctorUser);
        ctx.Doctors.Add(otherDoctor);
        var sharedSession = new QueueSession
        {
            TenantId = tenantId,
            DoctorId = null,
            IsActive = true,
            StartedAt = DateTime.UtcNow
        };
        ctx.QueueSessions.Add(sharedSession);
        await ctx.SaveChangesAsync();

        var queueService = BuildQueueService(ctx);
        var issued = await queueService.IssueTicketAsync(tenantId, new CreateQueueTicketRequest
        {
            SessionId = sharedSession.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = otherDoctor.Id,
            IsUrgent = false
        }, Guid.NewGuid());

        Assert.False(issued.Success);
        Assert.Contains("shift is not open", issued.Message, StringComparison.OrdinalIgnoreCase);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task TicketBoard_ShouldExposeVisitAndInvoiceIds()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var legacyService = new DoctorService
        {
            TenantId = tenantId,
            DoctorId = seeded.Doctor.Id,
            ServiceName = "Linked Metadata Service",
            Price = 300,
            IsActive = true
        };
        ctx.DoctorServices.Add(legacyService);
        await ctx.SaveChangesAsync();

        var queueService = BuildQueueService(ctx);
        var issued = await queueService.IssueTicketWithPaymentAsync(tenantId, new CreateQueueTicketWithPaymentRequest
        {
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            DoctorServiceId = legacyService.Id,
            PaidAmount = 300,
            PaymentMethod = "Cash"
        }, Guid.NewGuid());

        Assert.True(issued.Success);

        var visit = await ctx.Visits.FirstAsync(v => v.QueueTicketId == issued.Data!.Id);
        var invoice = await ctx.Invoices.FirstAsync(i => i.VisitId == visit.Id);

        var board = await queueService.GetBoardAsync(tenantId, Guid.NewGuid());
        Assert.True(board.Success);

        var boardTicket = board.Data!.Sessions
            .SelectMany(s => s.WaitingTickets)
            .First(t => t.Id == issued.Data!.Id);

        Assert.Equal(visit.Id, boardTicket.VisitId);
        Assert.Equal(invoice.Id, boardTicket.InvoiceId);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task QueueTicket_IsFromBooking_ShouldBeTrue_ForAllBookingSources()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var seeded = await SeedCoreAsync(ctx, tenantId);
        var patient2User = new ApplicationUser("pat-booking-2", "Patient B2") { TenantId = tenantId };
        var patient3User = new ApplicationUser("pat-booking-3", "Patient B3") { TenantId = tenantId };
        var patient2 = new Patient { TenantId = tenantId, UserId = patient2User.Id, Name = "Patient B2", Phone = "222" };
        var patient3 = new Patient { TenantId = tenantId, UserId = patient3User.Id, Name = "Patient B3", Phone = "333" };

        ctx.Users.AddRange(patient2User, patient3User);
        ctx.Patients.AddRange(patient2, patient3);
        await ctx.SaveChangesAsync();

        var bookingTicket = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = seeded.Session.Id,
            PatientId = seeded.Patient.Id,
            DoctorId = seeded.Doctor.Id,
            Source = VisitSource.Booking,
            TicketNumber = 1,
            Status = TicketStatus.Waiting,
            IssuedAt = DateTime.UtcNow.AddMinutes(-3)
        };
        var consultationBookingTicket = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = seeded.Session.Id,
            PatientId = patient2.Id,
            DoctorId = seeded.Doctor.Id,
            Source = VisitSource.ConsultationBooking,
            TicketNumber = 2,
            Status = TicketStatus.Waiting,
            IssuedAt = DateTime.UtcNow.AddMinutes(-2)
        };
        var selfServiceBookingTicket = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = seeded.Session.Id,
            PatientId = patient3.Id,
            DoctorId = seeded.Doctor.Id,
            Source = VisitSource.PatientSelfServiceBooking,
            TicketNumber = 3,
            Status = TicketStatus.Waiting,
            IssuedAt = DateTime.UtcNow.AddMinutes(-1)
        };

        ctx.QueueTickets.AddRange(bookingTicket, consultationBookingTicket, selfServiceBookingTicket);
        ctx.Visits.AddRange(
            new Visit
            {
                TenantId = tenantId,
                QueueTicketId = bookingTicket.Id,
                DoctorId = seeded.Doctor.Id,
                PatientId = seeded.Patient.Id,
                VisitType = VisitType.Exam,
                Source = VisitSource.Booking,
                Status = VisitStatus.Open,
                StartedAt = DateTime.UtcNow.AddMinutes(-3)
            },
            new Visit
            {
                TenantId = tenantId,
                QueueTicketId = consultationBookingTicket.Id,
                DoctorId = seeded.Doctor.Id,
                PatientId = patient2.Id,
                VisitType = VisitType.Consultation,
                Source = VisitSource.ConsultationBooking,
                Status = VisitStatus.Open,
                StartedAt = DateTime.UtcNow.AddMinutes(-2)
            },
            new Visit
            {
                TenantId = tenantId,
                QueueTicketId = selfServiceBookingTicket.Id,
                DoctorId = seeded.Doctor.Id,
                PatientId = patient3.Id,
                VisitType = VisitType.Consultation,
                Source = VisitSource.PatientSelfServiceBooking,
                Status = VisitStatus.Open,
                StartedAt = DateTime.UtcNow.AddMinutes(-1)
            });
        await ctx.SaveChangesAsync();

        var queueService = BuildQueueService(ctx);
        var board = await queueService.GetBoardAsync(tenantId, Guid.NewGuid());

        Assert.True(board.Success);
        var waitingTickets = board.Data!.Sessions
            .SelectMany(s => s.WaitingTickets)
            .ToDictionary(t => t.Id);

        Assert.True(waitingTickets[bookingTicket.Id].IsFromBooking);
        Assert.True(waitingTickets[consultationBookingTicket.Id].IsFromBooking);
        Assert.True(waitingTickets[selfServiceBookingTicket.Id].IsFromBooking);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    private static QueueService BuildQueueService(EliteClinic.Infrastructure.Data.EliteClinicDbContext ctx)
    {
        return new QueueService(
            ctx,
            new FakeMessageService(),
            new FakeInvoiceNumberService(),
            new AllowAllBranchAccessService());
    }

    private static async Task<(Doctor Doctor, Patient Patient, QueueSession Session)> SeedCoreAsync(EliteClinic.Infrastructure.Data.EliteClinicDbContext ctx, Guid tenantId)
    {
        var doctorUser = new ApplicationUser("doc", "Doctor") { TenantId = tenantId };
        var patientUser = new ApplicationUser("pat", "Patient") { TenantId = tenantId };
        ctx.Users.AddRange(doctorUser, patientUser);

        var doctor = new Doctor
        {
            TenantId = tenantId,
            UserId = doctorUser.Id,
            Name = "Dr Test",
            UrgentEnabled = true,
            UrgentCaseMode = UrgentCaseMode.UrgentNext,
            UrgentInsertAfterCount = 0
        };

        var patient = new Patient
        {
            TenantId = tenantId,
            UserId = patientUser.Id,
            Name = "Patient1",
            Phone = "111"
        };

        var session = new QueueSession
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            IsActive = true,
            StartedAt = DateTime.UtcNow
        };

        ctx.Doctors.Add(doctor);
        ctx.Patients.Add(patient);
        ctx.QueueSessions.Add(session);
        await ctx.SaveChangesAsync();

        return (doctor, patient, session);
    }

    private sealed class FakeInvoiceNumberService : IInvoiceNumberService
    {
        public Task<string> GenerateNextAsync(Guid tenantId, DateTime? issuedAtUtc = null, CancellationToken cancellationToken = default)
            => Task.FromResult($"INV-{DateTime.UtcNow.Year}-000001");
    }
}
