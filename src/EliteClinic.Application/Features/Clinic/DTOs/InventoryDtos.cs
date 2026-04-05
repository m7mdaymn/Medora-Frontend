using EliteClinic.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class InventoryItemDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SkuCode { get; set; } = string.Empty;
    public InventoryItemType ItemType { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal SalePrice { get; set; }
    public decimal CostPrice { get; set; }
    public decimal QuantityOnHand { get; set; }
    public decimal LowStockThreshold { get; set; }
    public bool UsableInVisit { get; set; }
    public bool SellablePublicly { get; set; }
    public bool InternalOnly { get; set; }
    public bool BillableInVisit { get; set; }
    public bool Active { get; set; }
    public Guid BranchId { get; set; }
    public string BranchName { get; set; } = string.Empty;
    public bool ShowInLanding { get; set; }
    public bool IsLowStock { get; set; }
    public List<InventoryItemImageDto> Images { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class InventoryItemImageDto
{
    public Guid Id { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
}

public class CreateInventoryItemRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(100)]
    public string SkuCode { get; set; } = string.Empty;

    public InventoryItemType ItemType { get; set; } = InventoryItemType.Consumable;

    [Required]
    [StringLength(50)]
    public string Unit { get; set; } = "unit";

    [Range(0, double.MaxValue)]
    public decimal SalePrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal QuantityOnHand { get; set; }

    [Range(0, double.MaxValue)]
    public decimal LowStockThreshold { get; set; }

    public bool UsableInVisit { get; set; }
    public bool SellablePublicly { get; set; }
    public bool InternalOnly { get; set; }
    public bool BillableInVisit { get; set; }
    public bool Active { get; set; } = true;
    public Guid BranchId { get; set; }
    public bool ShowInLanding { get; set; }
    public List<string>? Images { get; set; }
}

public class UpdateInventoryItemRequest
{
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;

    [StringLength(2000)]
    public string? Description { get; set; }

    [Required]
    [StringLength(100)]
    public string SkuCode { get; set; } = string.Empty;

    public InventoryItemType ItemType { get; set; } = InventoryItemType.Consumable;

    [Required]
    [StringLength(50)]
    public string Unit { get; set; } = "unit";

    [Range(0, double.MaxValue)]
    public decimal SalePrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal CostPrice { get; set; }

    [Range(0, double.MaxValue)]
    public decimal QuantityOnHand { get; set; }

    [Range(0, double.MaxValue)]
    public decimal LowStockThreshold { get; set; }

    public bool UsableInVisit { get; set; }
    public bool SellablePublicly { get; set; }
    public bool InternalOnly { get; set; }
    public bool BillableInVisit { get; set; }
    public bool Active { get; set; }
    public Guid BranchId { get; set; }
    public bool ShowInLanding { get; set; }
    public List<string>? Images { get; set; }
}

public class InventoryItemsQuery
{
    public Guid? BranchId { get; set; }
    public bool ActiveOnly { get; set; } = true;
    public bool? UsableInVisit { get; set; }
    public bool? SellablePublicly { get; set; }
    public bool IncludeInternalOnly { get; set; }
    public bool? LowStockOnly { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class SetInventoryItemActivationRequest
{
    public bool Active { get; set; }
}

public class RecordVisitInventoryUsageRequest
{
    public Guid InventoryItemId { get; set; }

    [Range(0.0001, double.MaxValue)]
    public decimal Quantity { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

public class VisitInventoryUsageDto
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public string InventoryItemName { get; set; } = string.Empty;
    public Guid DoctorId { get; set; }
    public Guid PatientId { get; set; }
    public Guid VisitId { get; set; }
    public decimal Quantity { get; set; }
    public decimal BilledAmount { get; set; }
    public DateTime UsedAt { get; set; }
    public Guid BranchId { get; set; }
    public Guid? InvoiceId { get; set; }
    public bool BilledToInvoice { get; set; }
    public string? Notes { get; set; }
}
