using EliteClinic.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class PartnerDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public PartnerType Type { get; set; }
    public string? ContactName { get; set; }
    public string? ContactPhone { get; set; }
    public string? ContactEmail { get; set; }
    public string? Address { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePartnerRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    public PartnerType Type { get; set; }

    [StringLength(200)]
    public string? ContactName { get; set; }

    [StringLength(50)]
    public string? ContactPhone { get; set; }

    [StringLength(120)]
    public string? ContactEmail { get; set; }

    [StringLength(1000)]
    public string? Address { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class UpdatePartnerRequest : CreatePartnerRequest
{
}

public class SetPartnerActivationRequest
{
    public bool IsActive { get; set; }
}

public class PartnerContractDto
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public PartnerType PartnerType { get; set; }
    public Guid? BranchId { get; set; }
    public string? ServiceScope { get; set; }
    public decimal? CommissionPercentage { get; set; }
    public decimal? FlatFee { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePartnerContractRequest
{
    [Required]
    public Guid PartnerId { get; set; }

    public Guid? BranchId { get; set; }

    [StringLength(200)]
    public string? ServiceScope { get; set; }

    [Range(0, 1000)]
    public decimal? CommissionPercentage { get; set; }

    [Range(0, 1000000000)]
    public decimal? FlatFee { get; set; }

    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class UpdatePartnerContractRequest
{
    public Guid? BranchId { get; set; }

    [StringLength(200)]
    public string? ServiceScope { get; set; }

    [Range(0, 1000)]
    public decimal? CommissionPercentage { get; set; }

    [Range(0, 1000000000)]
    public decimal? FlatFee { get; set; }

    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    public bool IsActive { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class PartnerContractsQuery
{
    public Guid? PartnerId { get; set; }
    public Guid? BranchId { get; set; }
    public bool ActiveOnly { get; set; } = true;
}

public class PartnerOrderDto
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public PartnerType PartnerType { get; set; }
    public Guid? PartnerContractId { get; set; }
    public Guid BranchId { get; set; }
    public Guid VisitId { get; set; }
    public Guid? LabRequestId { get; set; }
    public Guid? PrescriptionId { get; set; }
    public PartnerOrderStatus Status { get; set; }
    public Guid OrderedByUserId { get; set; }
    public DateTime OrderedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? FinalCost { get; set; }
    public string? ExternalReference { get; set; }
    public string? Notes { get; set; }
    public List<PartnerOrderStatusHistoryDto> StatusHistory { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class PartnerOrderStatusHistoryDto
{
    public Guid Id { get; set; }
    public PartnerOrderStatus? OldStatus { get; set; }
    public PartnerOrderStatus NewStatus { get; set; }
    public Guid ChangedByUserId { get; set; }
    public DateTime ChangedAt { get; set; }
    public string? Notes { get; set; }
}

public class CreateLabPartnerOrderRequest
{
    [Required]
    public Guid PartnerId { get; set; }

    public Guid? PartnerContractId { get; set; }

    [Range(0, 1000000000)]
    public decimal? EstimatedCost { get; set; }

    [StringLength(120)]
    public string? ExternalReference { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class CreatePrescriptionPartnerOrderRequest
{
    [Required]
    public Guid PartnerId { get; set; }

    public Guid? PartnerContractId { get; set; }

    [Range(0, 1000000000)]
    public decimal? EstimatedCost { get; set; }

    [StringLength(120)]
    public string? ExternalReference { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class UpdatePartnerOrderStatusRequest
{
    [Required]
    public PartnerOrderStatus Status { get; set; }

    [Range(0, 1000000000)]
    public decimal? FinalCost { get; set; }

    [StringLength(120)]
    public string? ExternalReference { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class PartnerOrdersQuery
{
    public Guid? BranchId { get; set; }
    public Guid? PartnerId { get; set; }
    public PartnerType? PartnerType { get; set; }
    public PartnerOrderStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
