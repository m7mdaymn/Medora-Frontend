namespace EliteClinic.Application.Features.Clinic.DTOs;

// ─── Prescription DTOs ─────────────────────────────────────────────

public class PrescriptionDto
{
    public Guid Id { get; set; }
    public Guid VisitId { get; set; }
    public string MedicationName { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePrescriptionRequest
{
    public string MedicationName { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
    public string? RevisionReason { get; set; }
}

public class UpdatePrescriptionRequest
{
    public string MedicationName { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
    public string? RevisionReason { get; set; }
}

public class PrescriptionRevisionDto
{
    public Guid Id { get; set; }
    public Guid PrescriptionId { get; set; }
    public Guid VisitId { get; set; }
    public int RevisionNumber { get; set; }
    public string Action { get; set; } = string.Empty;
    public string MedicationName { get; set; } = string.Empty;
    public string? Dosage { get; set; }
    public string? Frequency { get; set; }
    public string? Duration { get; set; }
    public string? Instructions { get; set; }
    public string? Reason { get; set; }
    public Guid ChangedByUserId { get; set; }
    public DateTime ChangedAt { get; set; }
}
