namespace EliteClinic.Domain.Entities;

public class DoctorBranchSchedule : TenantBaseEntity
{
    public Guid DoctorId { get; set; }
    public Guid BranchId { get; set; }
    public DayOfWeek DayOfWeek { get; set; }
    public TimeSpan StartTime { get; set; }
    public TimeSpan EndTime { get; set; }
    public bool IsActive { get; set; } = true;

    public Doctor Doctor { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
}
