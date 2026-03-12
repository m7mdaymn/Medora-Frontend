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
