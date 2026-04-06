namespace EliteClinic.Domain.Entities;

public class EmployeeBranchAssignment : TenantBaseEntity
{
    public Guid EmployeeId { get; set; }
    public Guid BranchId { get; set; }
    public bool IsPrimary { get; set; }

    // Navigation
    public Employee Employee { get; set; } = null!;
    public Branch Branch { get; set; } = null!;
}