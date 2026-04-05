namespace EliteClinic.Domain.Entities;

public class AbsenceRecord : TenantBaseEntity
{
    public Guid? DoctorId { get; set; }
    public Guid? EmployeeId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime ToDate { get; set; }
    public string Reason { get; set; } = string.Empty;
    public bool IsPaid { get; set; }
    public string? Notes { get; set; }
    public Guid EnteredByUserId { get; set; }
    public Guid? BranchId { get; set; }

    public Doctor? Doctor { get; set; }
    public Employee? Employee { get; set; }
    public Branch? Branch { get; set; }
}
