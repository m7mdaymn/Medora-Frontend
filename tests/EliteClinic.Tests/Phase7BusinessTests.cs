using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using EliteClinic.Infrastructure.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace EliteClinic.Tests;

public class Phase7BusinessTests
{
    [Fact]
    public async Task SkipTicket_ShouldMoveTicketToQueueTail()
    {
        var tenantId = Guid.NewGuid();
        var doctorUserId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var doctorUser = new ApplicationUser("doc", "Doctor") { Id = doctorUserId, TenantId = tenantId };
        var patientUser = new ApplicationUser("pat", "Patient") { Id = Guid.NewGuid(), TenantId = tenantId };
        ctx.Users.AddRange(doctorUser, patientUser);

        var doctor = new Doctor { TenantId = tenantId, UserId = doctorUserId, Name = "Dr" };
        var patient = new Patient { TenantId = tenantId, UserId = patientUser.Id, Name = "P1", Phone = "111" };
        var session = new QueueSession { TenantId = tenantId, DoctorId = doctor.Id, IsActive = true, StartedAt = DateTime.UtcNow };
        ctx.Doctors.Add(doctor);
        ctx.Patients.Add(patient);
        ctx.QueueSessions.Add(session);
        await ctx.SaveChangesAsync();

        var t1 = new QueueTicket { TenantId = tenantId, SessionId = session.Id, PatientId = patient.Id, DoctorId = doctor.Id, TicketNumber = 1, Status = TicketStatus.Waiting, IssuedAt = DateTime.UtcNow };
        var t2 = new QueueTicket { TenantId = tenantId, SessionId = session.Id, PatientId = patient.Id, DoctorId = doctor.Id, TicketNumber = 2, Status = TicketStatus.Waiting, IssuedAt = DateTime.UtcNow };
        ctx.QueueTickets.AddRange(t1, t2);
        await ctx.SaveChangesAsync();

        var fakeMessageService = new FakeMessageService();
        var queueService = new QueueService(
            ctx,
            fakeMessageService,
            new InvoiceNumberService(ctx),
            new AllowAllBranchAccessService());
        var result = await queueService.SkipTicketAsync(tenantId, t1.Id, Guid.NewGuid());

        Assert.True(result.Success);
        var refreshed = await ctx.QueueTickets.FirstAsync(t => t.Id == t1.Id);
        Assert.Equal(TicketStatus.Waiting, refreshed.Status);
        Assert.Equal(3, refreshed.TicketNumber);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task RefundPayment_ShouldUpdateInvoiceBalances_OnPartialRefund()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var doctorUser = new ApplicationUser("doc-refund", "Doctor Refund") { TenantId = tenantId };
        var patientUser = new ApplicationUser("pat-refund", "Patient Refund") { TenantId = tenantId };
        ctx.Users.AddRange(doctorUser, patientUser);

        var doctor = new Doctor { TenantId = tenantId, UserId = doctorUser.Id, Name = "Dr Refund" };
        var patient = new Patient { TenantId = tenantId, UserId = patientUser.Id, Name = "Patient Refund", Phone = "222" };
        ctx.Doctors.Add(doctor);
        ctx.Patients.Add(patient);
        await ctx.SaveChangesAsync();

        var visit = new Visit
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            PatientId = patient.Id,
            VisitType = VisitType.Exam,
            Source = VisitSource.WalkInTicket,
            Status = VisitStatus.Completed,
            LifecycleState = EncounterLifecycleState.FullyClosed,
            FinancialState = EncounterFinancialState.FinanciallySettled,
            StartedAt = DateTime.UtcNow.AddHours(-2),
            CompletedAt = DateTime.UtcNow.AddHours(-1),
            FinanciallySettledAt = DateTime.UtcNow.AddHours(-1),
            FullyClosedAt = DateTime.UtcNow.AddHours(-1)
        };
        ctx.Visits.Add(visit);
        await ctx.SaveChangesAsync();

        var invoice = new Invoice
        {
            TenantId = tenantId,
            VisitId = visit.Id,
            PatientId = patient.Id,
            DoctorId = doctor.Id,
            InvoiceNumber = "INV-REFUND-001",
            Amount = 1000m,
            PaidAmount = 1000m,
            RemainingAmount = 0m,
            Status = InvoiceStatus.Paid,
            IsServiceRendered = true
        };

        ctx.Invoices.Add(invoice);
        ctx.Payments.Add(new Payment
        {
            TenantId = tenantId,
            InvoiceId = invoice.Id,
            Amount = 1000m,
            PaymentMethod = "Cash",
            PaidAt = DateTime.UtcNow.AddHours(-1)
        });
        await ctx.SaveChangesAsync();

        var invoiceService = new InvoiceService(ctx, new InvoiceNumberService(ctx), DbContextFactory.CreateTenantContext(tenantId));
        var refund = await invoiceService.RefundPaymentAsync(
            tenantId,
            invoice.Id,
            new RefundInvoiceRequest
            {
                Amount = 200m,
                Reason = "Partial correction"
            },
            Guid.NewGuid());

        Assert.True(refund.Success);

        var reloadedInvoice = await ctx.Invoices.FirstAsync(i => i.Id == invoice.Id);
        Assert.Equal(800m, reloadedInvoice.PaidAmount);
        Assert.Equal(200m, reloadedInvoice.RemainingAmount);
        Assert.Equal(InvoiceStatus.PartiallyPaid, reloadedInvoice.Status);

        var refundRows = await ctx.Payments
            .Where(p => p.InvoiceId == invoice.Id && p.Amount < 0)
            .ToListAsync();

        Assert.Single(refundRows);
        Assert.Equal(-200m, refundRows[0].Amount);
        Assert.Equal("Refund", refundRows[0].PaymentMethod);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }

    [Fact]
    public async Task SessionClosure_ShouldCreateAutoRefund_NotCreditIssue()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);

        var doctorUser = new ApplicationUser("doc-closure", "Doctor Closure") { TenantId = tenantId };
        var patientUser = new ApplicationUser("pat-closure", "Patient Closure") { TenantId = tenantId };
        ctx.Users.AddRange(doctorUser, patientUser);

        var doctor = new Doctor { TenantId = tenantId, UserId = doctorUser.Id, Name = "Dr Closure" };
        var patient = new Patient { TenantId = tenantId, UserId = patientUser.Id, Name = "Patient Closure", Phone = "333" };
        ctx.Doctors.Add(doctor);
        ctx.Patients.Add(patient);
        await ctx.SaveChangesAsync();

        var expiredSession = new QueueSession
        {
            TenantId = tenantId,
            DoctorId = doctor.Id,
            IsActive = true,
            StartedAt = DateTime.UtcNow.Date.AddDays(-1).AddHours(9)
        };
        ctx.QueueSessions.Add(expiredSession);
        await ctx.SaveChangesAsync();

        var waitingTicket = new QueueTicket
        {
            TenantId = tenantId,
            SessionId = expiredSession.Id,
            PatientId = patient.Id,
            DoctorId = doctor.Id,
            TicketNumber = 1,
            Status = TicketStatus.Waiting,
            Source = VisitSource.WalkInTicket,
            IssuedAt = DateTime.UtcNow.Date.AddDays(-1).AddHours(9).AddMinutes(5)
        };
        ctx.QueueTickets.Add(waitingTicket);
        await ctx.SaveChangesAsync();

        var visit = new Visit
        {
            TenantId = tenantId,
            QueueTicketId = waitingTicket.Id,
            DoctorId = doctor.Id,
            PatientId = patient.Id,
            VisitType = VisitType.Exam,
            Source = VisitSource.WalkInTicket,
            Status = VisitStatus.Open,
            StartedAt = DateTime.UtcNow.Date.AddDays(-1).AddHours(9).AddMinutes(10)
        };
        ctx.Visits.Add(visit);
        await ctx.SaveChangesAsync();

        var invoice = new Invoice
        {
            TenantId = tenantId,
            VisitId = visit.Id,
            PatientId = patient.Id,
            DoctorId = doctor.Id,
            InvoiceNumber = "INV-CLOSE-001",
            Amount = 400m,
            PaidAmount = 400m,
            RemainingAmount = 0m,
            Status = InvoiceStatus.Paid,
            IsServiceRendered = false
        };
        ctx.Invoices.Add(invoice);
        ctx.Payments.Add(new Payment
        {
            TenantId = tenantId,
            InvoiceId = invoice.Id,
            Amount = 400m,
            PaymentMethod = "Cash",
            PaidAt = DateTime.UtcNow.Date.AddDays(-1).AddHours(9).AddMinutes(15)
        });
        await ctx.SaveChangesAsync();

        var serviceCollection = new ServiceCollection();
        serviceCollection.AddDbContext<EliteClinicDbContext>(options =>
        {
            options.UseSqlite(conn);
            options.EnableSensitiveDataLogging();
        });
        using var serviceProvider = serviceCollection.BuildServiceProvider();

        var backgroundService = new SessionClosureBackgroundService(
            serviceProvider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger<SessionClosureBackgroundService>.Instance);

        await backgroundService.CloseExpiredSessionsAsync();

        var reloadedSession = await ctx.QueueSessions
            .AsNoTracking()
            .FirstAsync(s => s.Id == expiredSession.Id);
        var reloadedTicket = await ctx.QueueTickets
            .AsNoTracking()
            .FirstAsync(t => t.Id == waitingTicket.Id);
        var reloadedInvoice = await ctx.Invoices
            .AsNoTracking()
            .FirstAsync(i => i.Id == invoice.Id);

        Assert.False(reloadedSession.IsActive);
        Assert.NotNull(reloadedSession.ClosedAt);
        Assert.Equal(TicketStatus.NoShow, reloadedTicket.Status);
        Assert.Equal(InvoiceStatus.Refunded, reloadedInvoice.Status);
        Assert.Equal(0m, reloadedInvoice.Amount);
        Assert.Equal(0m, reloadedInvoice.PaidAmount);
        Assert.Equal(0m, reloadedInvoice.RemainingAmount);

        var autoRefunds = await ctx.Payments
            .Where(p => p.InvoiceId == invoice.Id && p.Amount < 0 && p.PaymentMethod == "AutoRefundSessionClosure")
            .ToListAsync();

        Assert.Single(autoRefunds);
        Assert.Equal(-400m, autoRefunds[0].Amount);

        await backgroundService.CloseExpiredSessionsAsync();
        var autoRefundCountAfterSecondRun = await ctx.Payments
            .CountAsync(p => p.InvoiceId == invoice.Id && p.Amount < 0 && p.PaymentMethod == "AutoRefundSessionClosure");

        Assert.Equal(1, autoRefundCountAfterSecondRun);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }

}

internal sealed class AllowAllBranchAccessService : IBranchAccessService
{
    public Task<HashSet<Guid>?> GetScopedBranchIdsAsync(Guid tenantId, Guid callerUserId, CancellationToken cancellationToken = default)
        => Task.FromResult<HashSet<Guid>?>(null);

    public Task<ApiResponse> EnsureCanAccessBranchAsync(Guid tenantId, Guid callerUserId, Guid branchId, CancellationToken cancellationToken = default)
        => Task.FromResult(ApiResponse.Ok());
}
