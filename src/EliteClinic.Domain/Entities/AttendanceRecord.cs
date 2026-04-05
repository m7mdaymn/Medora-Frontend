namespace EliteClinic.Domain.Entities;

public class AttendanceRecord : TenantBaseEntity
{
    public Guid? EmployeeId { get; set; }
    public Guid? DoctorId { get; set; }
    public Guid? BranchId { get; set; }
    public Guid? EnteredByUserId { get; set; }
    public DateTime CheckInAt { get; set; }
    public DateTime? CheckOutAt { get; set; }
    public int? LateMinutes { get; set; }
    public int? OvertimeMinutes { get; set; }
    public bool IsAbsent { get; set; }

    public Employee? Employee { get; set; }
    public Doctor? Doctor { get; set; }
    public Branch? Branch { get; set; }
}
