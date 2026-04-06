using EliteClinic.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

// ───── Staff DTOs ─────

public class StaffDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public decimal? Salary { get; set; }
    public WorkerMode WorkerMode { get; set; }
    public DateTime? HireDate { get; set; }
    public string? Notes { get; set; }
    public bool IsEnabled { get; set; }
    public List<Guid> AssignedBranchIds { get; set; } = new();
    public List<StaffBranchDto> AssignedBranches { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class StaffBranchDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
}

public class CreateStaffRequest
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

    /// <summary>
    /// Staff role: "ClinicManager" or "Receptionist". Defaults to "ClinicManager" if not specified.
    /// </summary>
    public string? Role { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    public WorkerMode WorkerMode { get; set; } = WorkerMode.LoginBased;

    public decimal? Salary { get; set; }
    public DateTime? HireDate { get; set; }
    public string? Notes { get; set; }
    public List<Guid>? BranchIds { get; set; }
}

public class UpdateStaffRequest
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; set; }

    public WorkerMode WorkerMode { get; set; } = WorkerMode.LoginBased;

    public decimal? Salary { get; set; }
    public DateTime? HireDate { get; set; }
    public string? Notes { get; set; }
    public List<Guid>? BranchIds { get; set; }
}

public class PatchStaffRequest
{
    [StringLength(200)] public string? Name { get; set; }
    [StringLength(20)] public string? Phone { get; set; }
    public WorkerMode? WorkerMode { get; set; }
    public decimal? Salary { get; set; }
    public DateTime? HireDate { get; set; }
    public string? Notes { get; set; }
    public List<Guid>? BranchIds { get; set; }
}

public class CreatePayrollOnlyWorkerRequest
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(200, ErrorMessage = "Name cannot exceed 200 characters")]
    public string Name { get; set; } = string.Empty;

    [StringLength(20)]
    public string? Phone { get; set; }

    [StringLength(50)]
    public string? Role { get; set; }

    public decimal? Salary { get; set; }
    public DateTime? HireDate { get; set; }
    public string? Notes { get; set; }
    public List<Guid>? BranchIds { get; set; }
}
