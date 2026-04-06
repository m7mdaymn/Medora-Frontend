using EliteClinic.Domain.Enums;

namespace EliteClinic.Application.Features.Clinic.DTOs;

// ─── Visit DTOs ────────────────────────────────────────────────────

public class VisitDto
{
    public Guid Id { get; set; }
    public Guid? BranchId { get; set; }
    public VisitType VisitType { get; set; }
    public VisitSource Source { get; set; }
    public bool IsBookingSource { get; set; }
    public Guid? QueueTicketId { get; set; }
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public string PatientPhone { get; set; } = string.Empty;
    public DateTime? PatientDateOfBirth { get; set; }
    public string PatientGender { get; set; } = string.Empty;
    public string? ServiceName { get; set; }
    public decimal? ServicePrice { get; set; }
    public DoctorCompensationMode? DoctorCompensationMode { get; set; }
    public decimal? DoctorCompensationValue { get; set; }
    public decimal? EstimatedDoctorCompensationAmount { get; set; }
    public TicketStatus? TicketStatus { get; set; }
    public DateTime? TicketCancelledAt { get; set; }
    public bool IsCancelled { get; set; }
    public string EffectiveStatus { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public VisitStatus Status { get; set; }
    public EncounterLifecycleState LifecycleState { get; set; }
    public EncounterFinancialState FinancialState { get; set; }
    public string? Complaint { get; set; }
    public string? Diagnosis { get; set; }
    public string? Notes { get; set; }

    // Vitals
    public int? BloodPressureSystolic { get; set; }
    public int? BloodPressureDiastolic { get; set; }
    public int? HeartRate { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    public decimal? BMI { get; set; }
    public decimal? BloodSugar { get; set; }
    public decimal? OxygenSaturation { get; set; }
    public int? RespiratoryRate { get; set; }

    public DateTime? FollowUpDate { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? MedicallyCompletedAt { get; set; }
    public DateTime? FinanciallySettledAt { get; set; }
    public DateTime? FullyClosedAt { get; set; }

    public List<PrescriptionDto> Prescriptions { get; set; } = new();
    public List<LabRequestDto> LabRequests { get; set; } = new();
    public InvoiceDto? Invoice { get; set; }
    public PatientChronicProfileDto? ChronicProfile { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateVisitRequest
{
    public VisitType VisitType { get; set; } = VisitType.Exam;
    public VisitSource Source { get; set; } = VisitSource.WalkInTicket;
    public Guid? BranchId { get; set; }
    public Guid? QueueTicketId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public string? Complaint { get; set; }
    public string? Notes { get; set; }
}

public class UpdateVisitRequest
{
    public string? Complaint { get; set; }
    public string? Diagnosis { get; set; }
    public string? Notes { get; set; }

    // Vitals
    public int? BloodPressureSystolic { get; set; }
    public int? BloodPressureDiastolic { get; set; }
    public int? HeartRate { get; set; }
    public decimal? Temperature { get; set; }
    public decimal? Weight { get; set; }
    public decimal? Height { get; set; }
    public decimal? BMI { get; set; }
    public decimal? BloodSugar { get; set; }
    public decimal? OxygenSaturation { get; set; }
    public int? RespiratoryRate { get; set; }

    public DateTime? FollowUpDate { get; set; }
}

public class CompleteVisitRequest
{
    public string? Diagnosis { get; set; }
    public string? Notes { get; set; }
}

// ─── Patient Summary DTO ───────────────────────────────────────────

public class PatientSummaryDto
{
    public Guid PatientId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string Gender { get; set; } = string.Empty;
    public int TotalVisits { get; set; }
    public List<VisitSummaryDto> RecentVisits { get; set; } = new();
}

public class VisitSummaryDto
{
    public Guid Id { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public string? Complaint { get; set; }
    public string? Diagnosis { get; set; }
    public DateTime StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

public class ProfileVisitQueryRequest
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class StaleOpenVisitDto
{
    public Guid VisitId { get; set; }
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public Guid? QueueTicketId { get; set; }
    public string? Complaint { get; set; }
    public DateTime StartedAt { get; set; }
    public double AgeHours { get; set; }
    public bool HasActiveQueueTicket { get; set; }
}

public class CloseStaleVisitRequest
{
    public string? ResolutionNote { get; set; }
    public bool MarkQueueTicketNoShow { get; set; } = true;
}

public class MyVisitsFilterRequest
{
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public VisitSource? Source { get; set; }
    public VisitType? VisitType { get; set; }
    public VisitStatus? Status { get; set; }
    public bool? IsBooking { get; set; }
    public bool? IsSelfService { get; set; }
    public bool? IsExam { get; set; }
    public bool? IsConsultation { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
