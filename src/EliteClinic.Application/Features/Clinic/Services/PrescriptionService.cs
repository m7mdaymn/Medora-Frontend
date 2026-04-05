using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class PrescriptionService : IPrescriptionService
{
    private readonly EliteClinicDbContext _context;
    private readonly IMessageService _messageService;

    public PrescriptionService(EliteClinicDbContext context, IMessageService messageService)
    {
        _context = context;
        _messageService = messageService;
    }

    public async Task<ApiResponse<PrescriptionDto>> CreateAsync(Guid tenantId, Guid visitId, CreatePrescriptionRequest request, Guid callerUserId)
    {
        var visit = await _context.Visits.FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit == null)
            return ApiResponse<PrescriptionDto>.Error("Visit not found");

        var doctorActor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.UserId == callerUserId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctorActor != null && visit.DoctorId != doctorActor.Id)
            return ApiResponse<PrescriptionDto>.Error("Doctors can only manage prescriptions for their own visits");

        if (visit.Status != VisitStatus.Open)
            return ApiResponse<PrescriptionDto>.Error("Cannot add prescriptions to a completed visit");

        var prescription = new Prescription
        {
            TenantId = tenantId,
            VisitId = visitId,
            MedicationName = request.MedicationName,
            Dosage = request.Dosage,
            Frequency = request.Frequency,
            Duration = request.Duration,
            Instructions = request.Instructions
        };

        _context.Prescriptions.Add(prescription);
        await AddRevisionAsync(tenantId, prescription, "Created", callerUserId, request.RevisionReason);
        await AddRevisionNotificationAsync(tenantId, visit.PatientId, visit.DoctorId, callerUserId, prescription.Id, "Prescription created");
        await _context.SaveChangesAsync();

        var patient = await _context.Patients
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == visit.PatientId);

        await _messageService.LogWorkflowEventAsync(
            tenantId,
            nameof(MessageScenario.MedicationReminder),
            recipientUserId: patient?.UserId,
            recipientPhone: patient?.Phone,
            variables: new Dictionary<string, string>
            {
                ["medicationName"] = prescription.MedicationName,
                ["dosage"] = prescription.Dosage ?? string.Empty,
                ["frequency"] = prescription.Frequency ?? string.Empty,
                ["notes"] = prescription.Instructions ?? string.Empty
            });

        return ApiResponse<PrescriptionDto>.Created(MapToDto(prescription), "Prescription added successfully");
    }

    public async Task<ApiResponse<PrescriptionDto>> UpdateAsync(Guid tenantId, Guid visitId, Guid prescriptionId,
        UpdatePrescriptionRequest request, Guid callerUserId)
    {
        var visit = await _context.Visits.FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit == null)
            return ApiResponse<PrescriptionDto>.Error("Visit not found");

        // Same-day check for doctor
        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == callerUserId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor != null && visit.DoctorId != doctor.Id)
            return ApiResponse<PrescriptionDto>.Error("Doctors can only manage prescriptions for their own visits");
        if (doctor != null && visit.StartedAt.Date != DateTime.UtcNow.Date)
            return ApiResponse<PrescriptionDto>.Error("Can only edit prescriptions from today's visits");

        var prescription = await _context.Prescriptions
            .FirstOrDefaultAsync(p => p.Id == prescriptionId && p.VisitId == visitId && p.TenantId == tenantId && !p.IsDeleted);
        if (prescription == null)
            return ApiResponse<PrescriptionDto>.Error("Prescription not found");

        prescription.MedicationName = request.MedicationName;
        prescription.Dosage = request.Dosage;
        prescription.Frequency = request.Frequency;
        prescription.Duration = request.Duration;
        prescription.Instructions = request.Instructions;

        await AddRevisionAsync(tenantId, prescription, "Updated", callerUserId, request.RevisionReason);
        await AddRevisionNotificationAsync(tenantId, visit.PatientId, visit.DoctorId, callerUserId, prescription.Id, "Prescription updated");
        await _context.SaveChangesAsync();

        return ApiResponse<PrescriptionDto>.Ok(MapToDto(prescription), "Prescription updated successfully");
    }

    public async Task<ApiResponse> DeleteAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId)
    {
        var visit = await _context.Visits.FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit == null)
            return ApiResponse.Error("Visit not found");

        var doctor = await _context.Doctors.FirstOrDefaultAsync(d => d.UserId == callerUserId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor != null && visit.DoctorId != doctor.Id)
            return ApiResponse.Error("Doctors can only manage prescriptions for their own visits");
        if (doctor != null && visit.StartedAt.Date != DateTime.UtcNow.Date)
            return ApiResponse.Error("Can only delete prescriptions from today's visits");

        var prescription = await _context.Prescriptions
            .FirstOrDefaultAsync(p => p.Id == prescriptionId && p.VisitId == visitId && p.TenantId == tenantId && !p.IsDeleted);
        if (prescription == null)
            return ApiResponse.Error("Prescription not found");

        await AddRevisionAsync(tenantId, prescription, "Deleted", callerUserId, "Prescription deleted");
        await AddRevisionNotificationAsync(tenantId, visit.PatientId, visit.DoctorId, callerUserId, prescription.Id, "Prescription deleted");
        _context.Prescriptions.Remove(prescription); // soft-delete via SaveChangesAsync override
        await _context.SaveChangesAsync();

        return ApiResponse.Ok("Prescription deleted successfully");
    }

    public async Task<ApiResponse<List<PrescriptionDto>>> GetByVisitAsync(Guid tenantId, Guid visitId)
    {
        var visit = await _context.Visits.FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit == null)
            return ApiResponse<List<PrescriptionDto>>.Error("Visit not found");

        var prescriptions = await _context.Prescriptions
            .Where(p => p.VisitId == visitId && p.TenantId == tenantId && !p.IsDeleted)
            .OrderBy(p => p.CreatedAt)
            .ToListAsync();

        return ApiResponse<List<PrescriptionDto>>.Ok(
            prescriptions.Select(MapToDto).ToList(),
            $"Retrieved {prescriptions.Count} prescription(s)");
    }

    public async Task<ApiResponse<List<PrescriptionRevisionDto>>> GetRevisionsAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId)
    {
        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.Id == visitId && v.TenantId == tenantId && !v.IsDeleted);
        if (visit == null)
            return ApiResponse<List<PrescriptionRevisionDto>>.Error("Visit not found");

        var doctor = await _context.Doctors
            .FirstOrDefaultAsync(d => d.UserId == callerUserId && d.TenantId == tenantId && !d.IsDeleted);
        if (doctor != null && visit.DoctorId != doctor.Id)
            return ApiResponse<List<PrescriptionRevisionDto>>.Error("Doctors can only access revisions for their own visits");

        var revisions = await _context.PrescriptionRevisions
            .Where(r => r.TenantId == tenantId && !r.IsDeleted && r.VisitId == visitId && r.PrescriptionId == prescriptionId)
            .OrderByDescending(r => r.RevisionNumber)
            .ThenByDescending(r => r.ChangedAt)
            .ToListAsync();

        return ApiResponse<List<PrescriptionRevisionDto>>.Ok(
            revisions.Select(MapRevisionToDto).ToList(),
            $"Retrieved {revisions.Count} revision(s)");
    }

    private async Task AddRevisionAsync(Guid tenantId, Prescription prescription, string action, Guid callerUserId, string? reason)
    {
        var currentRevision = await _context.PrescriptionRevisions
            .Where(r => r.TenantId == tenantId && !r.IsDeleted && r.PrescriptionId == prescription.Id)
            .MaxAsync(r => (int?)r.RevisionNumber) ?? 0;

        _context.PrescriptionRevisions.Add(new PrescriptionRevision
        {
            TenantId = tenantId,
            PrescriptionId = prescription.Id,
            VisitId = prescription.VisitId,
            RevisionNumber = currentRevision + 1,
            Action = action,
            MedicationName = prescription.MedicationName,
            Dosage = prescription.Dosage,
            Frequency = prescription.Frequency,
            Duration = prescription.Duration,
            Instructions = prescription.Instructions,
            Reason = string.IsNullOrWhiteSpace(reason) ? null : reason.Trim(),
            ChangedByUserId = callerUserId,
            ChangedAt = DateTime.UtcNow
        });
    }

    private async Task AddRevisionNotificationAsync(
        Guid tenantId,
        Guid patientId,
        Guid doctorId,
        Guid actorUserId,
        Guid prescriptionId,
        string actionText)
    {
        var patientUserId = await _context.Patients
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == patientId)
            .Select(p => (Guid?)p.UserId)
            .FirstOrDefaultAsync();

        var doctorUserId = await _context.Doctors
            .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.Id == doctorId)
            .Select(d => (Guid?)d.UserId)
            .FirstOrDefaultAsync();

        var recipients = new HashSet<Guid>();
        if (patientUserId.HasValue)
            recipients.Add(patientUserId.Value);
        if (doctorUserId.HasValue)
            recipients.Add(doctorUserId.Value);
        recipients.Remove(actorUserId);

        foreach (var userId in recipients)
        {
            _context.InAppNotifications.Add(new InAppNotification
            {
                TenantId = tenantId,
                UserId = userId,
                Type = InAppNotificationType.PrescriptionRevised,
                Title = "Prescription revised",
                Body = actionText,
                EntityType = nameof(Prescription),
                EntityId = prescriptionId
            });
        }
    }

    private static PrescriptionDto MapToDto(Prescription p)
    {
        return new PrescriptionDto
        {
            Id = p.Id,
            VisitId = p.VisitId,
            MedicationName = p.MedicationName,
            Dosage = p.Dosage,
            Frequency = p.Frequency,
            Duration = p.Duration,
            Instructions = p.Instructions,
            CreatedAt = p.CreatedAt
        };
    }

    private static PrescriptionRevisionDto MapRevisionToDto(PrescriptionRevision revision)
    {
        return new PrescriptionRevisionDto
        {
            Id = revision.Id,
            PrescriptionId = revision.PrescriptionId,
            VisitId = revision.VisitId,
            RevisionNumber = revision.RevisionNumber,
            Action = revision.Action,
            MedicationName = revision.MedicationName,
            Dosage = revision.Dosage,
            Frequency = revision.Frequency,
            Duration = revision.Duration,
            Instructions = revision.Instructions,
            Reason = revision.Reason,
            ChangedByUserId = revision.ChangedByUserId,
            ChangedAt = revision.ChangedAt
        };
    }
}
