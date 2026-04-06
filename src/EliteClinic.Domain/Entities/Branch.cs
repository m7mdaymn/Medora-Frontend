namespace EliteClinic.Domain.Entities;

public class Branch : TenantBaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<DoctorBranchSchedule> DoctorSchedules { get; set; } = new List<DoctorBranchSchedule>();
    public ICollection<EmployeeBranchAssignment> EmployeeAssignments { get; set; } = new List<EmployeeBranchAssignment>();
    public ICollection<ClinicPaymentMethod> PaymentMethods { get; set; } = new List<ClinicPaymentMethod>();
}
