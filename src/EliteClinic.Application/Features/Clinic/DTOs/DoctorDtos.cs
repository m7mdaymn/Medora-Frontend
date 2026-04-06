using EliteClinic.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

// ───── Doctor DTOs ─────

public class DoctorDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsEnabled { get; set; }
    public string Username { get; set; } = string.Empty;
    public UrgentCaseMode UrgentCaseMode { get; set; }
    public bool UrgentEnabled { get; set; }
    public int? UrgentInsertAfterCount { get; set; }
    public bool SupportsUrgent { get; set; }
    public int AvgVisitDurationMinutes { get; set; }
    public DoctorCompensationMode CompensationMode { get; set; }
    public decimal CompensationValue { get; set; }
    public DateTime CompensationEffectiveFrom { get; set; }
    public List<DoctorServiceDto> Services { get; set; } = new();
    public List<DoctorCompensationHistoryItemDto> CompensationHistory { get; set; } = new();
    public DoctorVisitFieldConfigDto? VisitFieldConfig { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDoctorRequest
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Username is required")]
    [StringLength(50, ErrorMessage = "Username cannot exceed 50 characters")]
    public string Username { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "Password must be 6-100 characters")]
    public string Password { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Specialty { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }

    public UrgentCaseMode UrgentCaseMode { get; set; } = UrgentCaseMode.UrgentNext;
    public bool? UrgentEnabled { get; set; }
    [Range(0, 3, ErrorMessage = "UrgentInsertAfterCount must be between 0 and 3")]
    public int? UrgentInsertAfterCount { get; set; }

    [Range(1, 120, ErrorMessage = "AvgVisitDurationMinutes must be between 1 and 120")]
    public int AvgVisitDurationMinutes { get; set; } = 15;

    [Required]
    public DoctorCompensationMode CompensationMode { get; set; } = DoctorCompensationMode.Percentage;

    [Range(0.01, 1000000000)]
    public decimal CompensationValue { get; set; }

    public DateTime? CompensationEffectiveFrom { get; set; }
}

public class UpdateDoctorRequest
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(100)]
    public string? Specialty { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }

    public UrgentCaseMode UrgentCaseMode { get; set; } = UrgentCaseMode.UrgentNext;
    public bool? UrgentEnabled { get; set; }
    [Range(0, 3, ErrorMessage = "UrgentInsertAfterCount must be between 0 and 3")]
    public int? UrgentInsertAfterCount { get; set; }

    [Range(1, 120)]
    public int AvgVisitDurationMinutes { get; set; } = 15;

    [Required]
    public DoctorCompensationMode CompensationMode { get; set; } = DoctorCompensationMode.Percentage;

    [Range(0.01, 1000000000)]
    public decimal CompensationValue { get; set; }

    public DateTime? CompensationEffectiveFrom { get; set; }
}

public class PatchDoctorRequest
{
    [StringLength(200)] public string? Name { get; set; }
    [StringLength(100)] public string? Specialty { get; set; }
    [StringLength(20)] public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }
    public UrgentCaseMode? UrgentCaseMode { get; set; }
    public bool? UrgentEnabled { get; set; }
    [Range(0, 3)] public int? UrgentInsertAfterCount { get; set; }
    [Range(1, 120)] public int? AvgVisitDurationMinutes { get; set; }
    public DoctorCompensationMode? CompensationMode { get; set; }
    [Range(0.01, 1000000000)] public decimal? CompensationValue { get; set; }
    public DateTime? CompensationEffectiveFrom { get; set; }
}

public class DoctorCompensationHistoryItemDto
{
    public Guid Id { get; set; }
    public DoctorCompensationMode Mode { get; set; }
    public decimal Value { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public Guid ChangedByUserId { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DoctorServiceDto
{
    public Guid Id { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int? DurationMinutes { get; set; }
    public bool IsActive { get; set; }
}

public class DoctorServiceRequest
{
    [Required(ErrorMessage = "ServiceName is required")]
    [StringLength(200, ErrorMessage = "ServiceName cannot exceed 200 characters")]
    public string ServiceName { get; set; } = string.Empty;

    [Range(0, double.MaxValue, ErrorMessage = "Price must be non-negative")]
    public decimal Price { get; set; }

    [Range(1, 480)]
    public int? DurationMinutes { get; set; }

    public bool IsActive { get; set; } = true;
}

public class UpdateDoctorServicesRequest
{
    [Required(ErrorMessage = "Services list is required")]
    public List<DoctorServiceRequest> Services { get; set; } = new();
}

public class DoctorVisitFieldConfigDto
{
    public bool BloodPressure { get; set; }
    public bool HeartRate { get; set; }
    public bool Temperature { get; set; }
    public bool Weight { get; set; }
    public bool Height { get; set; }
    public bool BMI { get; set; }
    public bool BloodSugar { get; set; }
    public bool OxygenSaturation { get; set; }
    public bool RespiratoryRate { get; set; }
}

public class UpdateVisitFieldsRequest
{
    public bool BloodPressure { get; set; }
    public bool HeartRate { get; set; }
    public bool Temperature { get; set; } = true;
    public bool Weight { get; set; } = true;
    public bool Height { get; set; }
    public bool BMI { get; set; }
    public bool BloodSugar { get; set; }
    public bool OxygenSaturation { get; set; }
    public bool RespiratoryRate { get; set; }
}
