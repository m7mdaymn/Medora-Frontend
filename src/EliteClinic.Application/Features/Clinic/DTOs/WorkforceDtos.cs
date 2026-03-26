using EliteClinic.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class DoctorCompensationRuleDto
{
    public Guid Id { get; set; }
    public Guid DoctorId { get; set; }
    public DoctorCompensationMode Mode { get; set; }
    public decimal Value { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateDoctorCompensationRuleRequest
{
    [Required]
    public DoctorCompensationMode Mode { get; set; }

    [Range(0.01, 1000000000)]
    public decimal Value { get; set; }

    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class AttendanceRecordDto
{
    public Guid Id { get; set; }
    public Guid? EmployeeId { get; set; }
    public string? EmployeeName { get; set; }
    public Guid? DoctorId { get; set; }
    public string? DoctorName { get; set; }
    public DateTime CheckInAt { get; set; }
    public DateTime? CheckOutAt { get; set; }
    public int? LateMinutes { get; set; }
    public int? OvertimeMinutes { get; set; }
    public bool IsAbsent { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateAttendanceRecordRequest
{
    public Guid? EmployeeId { get; set; }
    public Guid? DoctorId { get; set; }
    public DateTime? CheckInAt { get; set; }
    public int? LateMinutes { get; set; }
    public bool IsAbsent { get; set; }
}

public class CheckOutAttendanceRequest
{
    public DateTime? CheckOutAt { get; set; }
    public int? OvertimeMinutes { get; set; }
}

public class CreateSalaryPayoutRequest
{
    public Guid? EmployeeId { get; set; }
    public Guid? DoctorId { get; set; }

    [Range(0.01, 1000000000)]
    public decimal Amount { get; set; }

    public DateTime? PayoutDate { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class SalaryPayoutExpenseDto
{
    public Guid ExpenseId { get; set; }
    public decimal Amount { get; set; }
    public DateTime ExpenseDate { get; set; }
    public string Category { get; set; } = string.Empty;
    public string? Notes { get; set; }
}

public class DailyClosingSnapshotDto
{
    public Guid Id { get; set; }
    public DateTime SnapshotDate { get; set; }
    public Guid GeneratedByUserId { get; set; }
    public decimal TotalInvoiced { get; set; }
    public decimal TotalCollected { get; set; }
    public decimal TotalExpenses { get; set; }
    public decimal NetCashFlow { get; set; }
    public int VisitsCompleted { get; set; }
    public int PaymentsCount { get; set; }
    public int ExpensesCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
