using EliteClinic.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Clinic.DTOs;

public class PublicMarketplaceItemDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string SkuCode { get; set; } = string.Empty;
    public InventoryItemType ItemType { get; set; }
    public string Unit { get; set; } = string.Empty;
    public decimal SalePrice { get; set; }
    public decimal QuantityOnHand { get; set; }
    public bool ShowInLanding { get; set; }
    public List<InventoryItemImageDto> Images { get; set; } = new();
}

public class PublicMarketplaceItemsQuery
{
    public Guid? BranchId { get; set; }
    public bool FeaturedOnly { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class CreatePublicMarketplaceOrderRequest
{
    [Required]
    [StringLength(200)]
    public string CustomerName { get; set; } = string.Empty;

    [Required]
    [StringLength(50)]
    public string Phone { get; set; } = string.Empty;

    public Guid BranchId { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }

    [Required]
    [MinLength(1)]
    public List<CreatePublicMarketplaceOrderItemRequest> Items { get; set; } = new();
}

public class CreatePublicMarketplaceOrderItemRequest
{
    public Guid InventoryItemId { get; set; }

    [Range(0.0001, double.MaxValue)]
    public decimal Quantity { get; set; }
}

public class MarketplaceOrderItemDto
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal LineTotal { get; set; }
}

public class MarketplaceOrderDto
{
    public Guid Id { get; set; }
    public Guid BranchId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public MarketplaceOrderStatus Status { get; set; }
    public DateTime? WhatsAppRedirectedAt { get; set; }
    public Guid? SalesInvoiceId { get; set; }
    public decimal SubtotalAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public List<MarketplaceOrderItemDto> Items { get; set; } = new();
    public SalesInvoiceDto? SalesInvoice { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class MarketplaceOrdersQuery
{
    public Guid? BranchId { get; set; }
    public MarketplaceOrderStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public string? Search { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}

public class UpdateMarketplaceOrderStatusRequest
{
    public MarketplaceOrderStatus Status { get; set; }

    [StringLength(1000)]
    public string? Notes { get; set; }
}

public class SalesInvoiceDto
{
    public Guid Id { get; set; }
    public string InvoiceNumber { get; set; } = string.Empty;
    public Guid BranchId { get; set; }
    public Guid MarketplaceOrderId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public decimal SubtotalAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public SalesInvoiceStatus Status { get; set; }
    public DateTime IssuedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public List<SalesInvoiceLineItemDto> LineItems { get; set; } = new();
}

public class SalesInvoiceLineItemDto
{
    public Guid Id { get; set; }
    public Guid InventoryItemId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal UnitPrice { get; set; }
    public decimal Quantity { get; set; }
    public decimal LineTotal { get; set; }
}

public class PublicBranchDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? Phone { get; set; }
}

public class PublicLandingDto
{
    public PublicClinicDto Clinic { get; set; } = new();
    public List<PublicDoctorServiceDto> FeaturedServices { get; set; } = new();
    public List<PublicMarketplaceItemDto> FeaturedProducts { get; set; } = new();
    public List<PublicDoctorDto> DoctorsAvailableNow { get; set; } = new();
    public List<PublicBranchDto> Branches { get; set; } = new();
    public List<ClinicPaymentMethodDto> PaymentMethods { get; set; } = new();
}
