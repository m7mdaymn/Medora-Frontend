using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
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
        var queueService = new QueueService(ctx, fakeMessageService, new InvoiceNumberService(ctx));
        var result = await queueService.SkipTicketAsync(tenantId, t1.Id, Guid.NewGuid());

        Assert.True(result.Success);
        var refreshed = await ctx.QueueTickets.FirstAsync(t => t.Id == t1.Id);
        Assert.Equal(TicketStatus.Waiting, refreshed.Status);
        Assert.Equal(3, refreshed.TicketNumber);

        await conn.DisposeAsync();
        await ctx.DisposeAsync();
    }

    // Additional cross-aggregate tests are intentionally deferred to a dedicated API-hosted integration harness.
}
