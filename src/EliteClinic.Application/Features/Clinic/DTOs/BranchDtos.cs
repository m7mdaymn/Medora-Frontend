using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class BranchDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Code { get; set; }
    public string? Address { get; set; }
    public string? Phone { get; set; }
    public bool IsActive { get; set; }
    public int AssignedStaffCount { get; set; }
}

public class CreateBranchRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Code { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }
}

public class UpdateBranchRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Code { get; set; }

    [StringLength(500)]
    public string? Address { get; set; }

    [StringLength(20)]
    public string? Phone { get; set; }

    public bool IsActive { get; set; }
}