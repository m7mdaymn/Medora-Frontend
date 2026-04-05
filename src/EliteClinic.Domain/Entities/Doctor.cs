using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class Doctor : TenantBaseEntity
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Specialty { get; set; }
    public string? Phone { get; set; }
    public string? Bio { get; set; }
    public string? PhotoUrl { get; set; }
    public bool IsEnabled { get; set; }
    public UrgentCaseMode UrgentCaseMode { get; set; }
    public bool UrgentEnabled { get; set; }
    public int UrgentInsertAfterCount { get; set; }
    public int AvgVisitDurationMinutes { get; set; }
    public DoctorCompensationMode CompensationMode { get; set; }
    public decimal CompensationValue { get; set; }
    public DateTime CompensationEffectiveFrom { get; set; }

    // Navigation
    public ApplicationUser User { get; set; } = null!;
    public ICollection<DoctorService> Services { get; set; } = new List<DoctorService>();
    public ICollection<DoctorCompensationHistory> CompensationHistory { get; set; } = new List<DoctorCompensationHistory>();
    public ICollection<DoctorBranchSchedule> BranchSchedules { get; set; } = new List<DoctorBranchSchedule>();
    public DoctorVisitFieldConfig? VisitFieldConfig { get; set; }

    public Doctor()
    {
        IsEnabled = true;
        UrgentCaseMode = UrgentCaseMode.UrgentNext;
        UrgentEnabled = true;
        UrgentInsertAfterCount = 0;
        AvgVisitDurationMinutes = 15;
        CompensationMode = DoctorCompensationMode.Percentage;
        CompensationValue = 0;
        CompensationEffectiveFrom = DateTime.UtcNow.Date;
    }
}
