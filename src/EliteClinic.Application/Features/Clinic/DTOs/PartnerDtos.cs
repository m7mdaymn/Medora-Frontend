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
    public PartnerSettlementTarget SettlementTarget { get; set; }
    public decimal? ClinicDoctorSharePercentage { get; set; }
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

    public PartnerSettlementTarget SettlementTarget { get; set; } = PartnerSettlementTarget.Clinic;

    [Range(0, 1000)]
    public decimal? ClinicDoctorSharePercentage { get; set; }

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

    public PartnerSettlementTarget SettlementTarget { get; set; } = PartnerSettlementTarget.Clinic;

    [Range(0, 1000)]
    public decimal? ClinicDoctorSharePercentage { get; set; }

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
    public Guid PatientId { get; set; }
    public string PatientName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public string DoctorName { get; set; } = string.Empty;
    public Guid? LabRequestId { get; set; }
    public Guid? PrescriptionId { get; set; }
    public Guid? PartnerServiceCatalogItemId { get; set; }
    public PartnerOrderStatus Status { get; set; }
    public Guid OrderedByUserId { get; set; }
    public DateTime OrderedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PatientArrivedAt { get; set; }
    public DateTime? ResultUploadedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public Guid? CompletedByUserId { get; set; }
    public string? ServiceNameSnapshot { get; set; }
    public decimal? ServicePrice { get; set; }
    public PartnerSettlementTarget? SettlementTarget { get; set; }
    public decimal? SettlementPercentage { get; set; }
    public decimal? ClinicDoctorSharePercentage { get; set; }
    public decimal? DoctorPayoutAmount { get; set; }
    public decimal? ClinicRevenueAmount { get; set; }
    public string? ResultSummary { get; set; }
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

    public Guid? PartnerServiceCatalogItemId { get; set; }

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

    public Guid? PartnerServiceCatalogItemId { get; set; }

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

public class PartnerServiceCatalogItemDto
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public Guid? BranchId { get; set; }
    public string ServiceName { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public PartnerSettlementTarget SettlementTarget { get; set; }
    public decimal SettlementPercentage { get; set; }
    public decimal? ClinicDoctorSharePercentage { get; set; }
    public bool IsActive { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePartnerServiceCatalogItemRequest
{
    [Required]
    public Guid PartnerId { get; set; }

    public Guid? BranchId { get; set; }

    [Required]
    [StringLength(200)]
    public string ServiceName { get; set; } = string.Empty;

    [Range(0.01, 1000000000)]
    public decimal Price { get; set; }

    public PartnerSettlementTarget SettlementTarget { get; set; } = PartnerSettlementTarget.Clinic;

    [Range(0.01, 1000)]
    public decimal SettlementPercentage { get; set; }

    [Range(0, 1000)]
    public decimal? ClinicDoctorSharePercentage { get; set; }

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class UpdatePartnerServiceCatalogItemRequest
{
    public Guid? BranchId { get; set; }

    [Required]
    [StringLength(200)]
    public string ServiceName { get; set; } = string.Empty;

    [Range(0.01, 1000000000)]
    public decimal Price { get; set; }

    public PartnerSettlementTarget SettlementTarget { get; set; } = PartnerSettlementTarget.Clinic;

    [Range(0.01, 1000)]
    public decimal SettlementPercentage { get; set; }

    [Range(0, 1000)]
    public decimal? ClinicDoctorSharePercentage { get; set; }

    public bool IsActive { get; set; } = true;

    [StringLength(2000)]
    public string? Notes { get; set; }
}

public class PartnerServiceCatalogQuery
{
    public Guid? PartnerId { get; set; }
    public Guid? BranchId { get; set; }
    public bool ActiveOnly { get; set; } = true;
}

public class PartnerUserDto
{
    public Guid Id { get; set; }
    public Guid PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public Guid UserId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePartnerUserRequest
{
    [Required]
    [StringLength(100)]
    public string Username { get; set; } = string.Empty;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = string.Empty;

    [Required]
    [StringLength(200)]
    public string DisplayName { get; set; } = string.Empty;

    [StringLength(50)]
    public string? Phone { get; set; }

    public bool IsPrimary { get; set; }
}

public class SchedulePartnerOrderRequest
{
    public DateTime ScheduledAt { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class AcceptPartnerOrderRequest
{
    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class MarkPartnerOrderArrivedRequest
{
    public DateTime? ArrivedAt { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class UploadPartnerOrderResultRequest
{
    [Required]
    [StringLength(4000)]
    public string ResultSummary { get; set; } = string.Empty;

    public DateTime? ResultUploadedAt { get; set; }

    [Range(0, 1000000000)]
    public decimal? FinalCost { get; set; }

    [StringLength(120)]
    public string? ExternalReference { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class PatientPartnerOrderTimelineDto
{
    public Guid Id { get; set; }
    public Guid VisitId { get; set; }
    public Guid PartnerId { get; set; }
    public string PartnerName { get; set; } = string.Empty;
    public PartnerType PartnerType { get; set; }
    public string? ServiceName { get; set; }
    public PartnerOrderStatus Status { get; set; }
    public DateTime OrderedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PatientArrivedAt { get; set; }
    public DateTime? ResultUploadedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public decimal? Price { get; set; }
    public decimal? FinalCost { get; set; }
    public decimal? DoctorPayoutAmount { get; set; }
    public decimal? ClinicRevenueAmount { get; set; }
    public string? ResultSummary { get; set; }
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
