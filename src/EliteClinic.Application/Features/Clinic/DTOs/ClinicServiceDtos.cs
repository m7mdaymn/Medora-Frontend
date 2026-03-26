namespace EliteClinic.Application.Features.Clinic.DTOs;

// ─── Clinic Service DTOs ───────────────────────────────────────────

public class ClinicServiceDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DefaultPrice { get; set; }
    public int? DefaultDurationMinutes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateClinicServiceRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal DefaultPrice { get; set; }
    public int? DefaultDurationMinutes { get; set; }
}

public class UpdateClinicServiceRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public decimal? DefaultPrice { get; set; }
    public int? DefaultDurationMinutes { get; set; }
    public bool? IsActive { get; set; }
}

public class DoctorClinicServiceLinkDto
{
    public Guid LinkId { get; set; }
    public Guid DoctorId { get; set; }
    public Guid ClinicServiceId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal EffectivePrice { get; set; }
    public int? EffectiveDurationMinutes { get; set; }
    public decimal? OverridePrice { get; set; }
    public int? OverrideDurationMinutes { get; set; }
    public bool IsActive { get; set; }
}

public class UpsertDoctorClinicServiceLinkRequest
{
    public decimal? OverridePrice { get; set; }
    public int? OverrideDurationMinutes { get; set; }
    public bool IsActive { get; set; } = true;
}
