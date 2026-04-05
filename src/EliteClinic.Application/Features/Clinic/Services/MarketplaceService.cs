using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class MarketplaceService : IMarketplaceService
{
    private readonly EliteClinicDbContext _context;

    public MarketplaceService(EliteClinicDbContext context)
    {
        _context = context;
    }

    public async Task<ApiResponse<PagedResult<PublicMarketplaceItemDto>>> GetPublicItemsAsync(string tenantSlug, PublicMarketplaceItemsQuery query)
    {
        var tenant = await ResolveTenantBySlugAsync(tenantSlug);
        if (tenant == null)
            return ApiResponse<PagedResult<PublicMarketplaceItemDto>>.Error("Clinic not found");

        var q = _context.InventoryItems.IgnoreQueryFilters()
            .Include(i => i.Images.Where(img => !img.IsDeleted))
            .Where(i => i.TenantId == tenant.Id
                && !i.IsDeleted
                && i.Active
                && i.SellablePublicly
                && !i.InternalOnly)
            .AsQueryable();

        if (query.BranchId.HasValue)
            q = q.Where(i => i.BranchId == query.BranchId.Value);

        if (query.FeaturedOnly)
            q = q.Where(i => i.ShowInLanding);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            q = q.Where(i => i.Name.ToLower().Contains(search)
                || i.SkuCode.ToLower().Contains(search)
                || (i.Description != null && i.Description.ToLower().Contains(search)));
        }

        var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 100);

        var total = await q.CountAsync();
        var rows = await q
            .OrderByDescending(i => i.ShowInLanding)
            .ThenBy(i => i.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var paged = new PagedResult<PublicMarketplaceItemDto>
        {
            Items = rows.Select(MapPublicItem).ToList(),
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<PublicMarketplaceItemDto>>.Ok(paged, $"Retrieved {paged.Items.Count} marketplace item(s)");
    }

    public async Task<ApiResponse<PublicMarketplaceItemDto>> GetPublicItemByIdAsync(string tenantSlug, Guid itemId)
    {
        var tenant = await ResolveTenantBySlugAsync(tenantSlug);
        if (tenant == null)
            return ApiResponse<PublicMarketplaceItemDto>.Error("Clinic not found");

        var item = await _context.InventoryItems.IgnoreQueryFilters()
            .Include(i => i.Images.Where(img => !img.IsDeleted))
            .FirstOrDefaultAsync(i => i.TenantId == tenant.Id
                && !i.IsDeleted
                && i.Id == itemId
                && i.Active
                && i.SellablePublicly
                && !i.InternalOnly);

        if (item == null)
            return ApiResponse<PublicMarketplaceItemDto>.Error("Marketplace item not found");

        return ApiResponse<PublicMarketplaceItemDto>.Ok(MapPublicItem(item), "Marketplace item retrieved successfully");
    }

    public async Task<ApiResponse<MarketplaceOrderDto>> CreatePublicOrderAsync(string tenantSlug, CreatePublicMarketplaceOrderRequest request)
    {
        var tenant = await ResolveTenantBySlugAsync(tenantSlug);
        if (tenant == null)
            return ApiResponse<MarketplaceOrderDto>.Error("Clinic not found");

        if (request.Items == null || request.Items.Count == 0)
            return ApiResponse<MarketplaceOrderDto>.Error("At least one order item is required");

        var branch = await _context.Branches.IgnoreQueryFilters()
            .FirstOrDefaultAsync(b => b.TenantId == tenant.Id && !b.IsDeleted && b.IsActive && b.Id == request.BranchId);
        if (branch == null)
            return ApiResponse<MarketplaceOrderDto>.Error("Branch not found or inactive");

        var groupedItems = request.Items
            .GroupBy(i => i.InventoryItemId)
            .Select(g => new
            {
                InventoryItemId = g.Key,
                Quantity = g.Sum(x => x.Quantity)
            })
            .ToList();

        if (groupedItems.Any(i => i.Quantity <= 0))
            return ApiResponse<MarketplaceOrderDto>.Error("Order item quantities must be greater than zero");

        var itemIds = groupedItems.Select(i => i.InventoryItemId).Distinct().ToList();
        var inventoryItems = await _context.InventoryItems.IgnoreQueryFilters()
            .Where(i => i.TenantId == tenant.Id
                && !i.IsDeleted
                && i.Active
                && i.SellablePublicly
                && !i.InternalOnly
                && i.BranchId == request.BranchId
                && itemIds.Contains(i.Id))
            .ToListAsync();

        if (inventoryItems.Count != itemIds.Count)
            return ApiResponse<MarketplaceOrderDto>.Error("One or more marketplace items are invalid for this branch");

        var order = new MarketplaceOrder
        {
            TenantId = tenant.Id,
            BranchId = request.BranchId,
            CustomerName = request.CustomerName.Trim(),
            Phone = request.Phone.Trim(),
            Notes = request.Notes,
            Status = MarketplaceOrderStatus.WhatsAppRedirected,
            WhatsAppRedirectedAt = DateTime.UtcNow
        };

        foreach (var requested in groupedItems)
        {
            var item = inventoryItems.First(i => i.Id == requested.InventoryItemId);
            var lineTotal = Math.Round(item.SalePrice * requested.Quantity, 2);

            order.Items.Add(new MarketplaceOrderItem
            {
                TenantId = tenant.Id,
                InventoryItemId = item.Id,
                ItemNameSnapshot = item.Name,
                UnitPrice = item.SalePrice,
                Quantity = requested.Quantity,
                LineTotal = lineTotal
            });

            order.SubtotalAmount += lineTotal;
        }

        order.TotalAmount = order.SubtotalAmount;

        _context.MarketplaceOrders.Add(order);
        await _context.SaveChangesAsync();

        var saved = await _context.MarketplaceOrders
            .Include(o => o.Items.Where(i => !i.IsDeleted))
            .FirstAsync(o => o.TenantId == tenant.Id && !o.IsDeleted && o.Id == order.Id);

        return ApiResponse<MarketplaceOrderDto>.Created(MapOrder(saved), "Marketplace order created and WhatsApp redirect state recorded");
    }

    public async Task<ApiResponse<PagedResult<MarketplaceOrderDto>>> GetClinicOrdersAsync(Guid tenantId, MarketplaceOrdersQuery query)
    {
        var q = _context.MarketplaceOrders
            .Include(o => o.Items.Where(i => !i.IsDeleted))
            .Include(o => o.SalesInvoice)
                .ThenInclude(si => si!.LineItems.Where(li => !li.IsDeleted))
            .Where(o => o.TenantId == tenantId && !o.IsDeleted)
            .AsQueryable();

        if (query.BranchId.HasValue)
            q = q.Where(o => o.BranchId == query.BranchId.Value);

        if (query.Status.HasValue)
            q = q.Where(o => o.Status == query.Status.Value);

        if (query.FromDate.HasValue)
            q = q.Where(o => o.CreatedAt >= query.FromDate.Value.Date);

        if (query.ToDate.HasValue)
            q = q.Where(o => o.CreatedAt < query.ToDate.Value.Date.AddDays(1));

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            q = q.Where(o => o.CustomerName.ToLower().Contains(search)
                || o.Phone.ToLower().Contains(search));
        }

        var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 200);

        var total = await q.CountAsync();
        var rows = await q
            .OrderByDescending(o => o.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var paged = new PagedResult<MarketplaceOrderDto>
        {
            Items = rows.Select(MapOrder).ToList(),
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<MarketplaceOrderDto>>.Ok(paged, $"Retrieved {paged.Items.Count} marketplace order(s)");
    }

    public async Task<ApiResponse<MarketplaceOrderDto>> GetClinicOrderByIdAsync(Guid tenantId, Guid orderId)
    {
        var order = await _context.MarketplaceOrders
            .Include(o => o.Items.Where(i => !i.IsDeleted))
            .Include(o => o.SalesInvoice)
                .ThenInclude(si => si!.LineItems.Where(li => !li.IsDeleted))
            .FirstOrDefaultAsync(o => o.TenantId == tenantId && !o.IsDeleted && o.Id == orderId);

        if (order == null)
            return ApiResponse<MarketplaceOrderDto>.Error("Marketplace order not found");

        return ApiResponse<MarketplaceOrderDto>.Ok(MapOrder(order), "Marketplace order retrieved successfully");
    }

    public async Task<ApiResponse<MarketplaceOrderDto>> UpdateOrderStatusAsync(Guid tenantId, Guid orderId, Guid changedByUserId, UpdateMarketplaceOrderStatusRequest request)
    {
        _ = changedByUserId;

        var order = await _context.MarketplaceOrders
            .Include(o => o.Items.Where(i => !i.IsDeleted))
            .Include(o => o.SalesInvoice)
                .ThenInclude(si => si!.LineItems.Where(li => !li.IsDeleted))
            .FirstOrDefaultAsync(o => o.TenantId == tenantId && !o.IsDeleted && o.Id == orderId);

        if (order == null)
            return ApiResponse<MarketplaceOrderDto>.Error("Marketplace order not found");

        switch (request.Status)
        {
            case MarketplaceOrderStatus.Pending:
                if (order.Status == MarketplaceOrderStatus.Confirmed && order.SalesInvoiceId.HasValue)
                    return ApiResponse<MarketplaceOrderDto>.Error("Confirmed order with sales invoice cannot return to pending");
                order.Status = MarketplaceOrderStatus.Pending;
                break;

            case MarketplaceOrderStatus.WhatsAppRedirected:
                order.Status = MarketplaceOrderStatus.WhatsAppRedirected;
                order.WhatsAppRedirectedAt ??= DateTime.UtcNow;
                break;

            case MarketplaceOrderStatus.Confirmed:
                if (order.Status == MarketplaceOrderStatus.Cancelled)
                    return ApiResponse<MarketplaceOrderDto>.Error("Cancelled orders cannot be confirmed");

                order.Status = MarketplaceOrderStatus.Confirmed;
                order.ConfirmedAt = DateTime.UtcNow;

                if (!order.SalesInvoiceId.HasValue)
                {
                    var salesInvoice = await BuildSalesInvoiceFromOrderAsync(order);
                    _context.SalesInvoices.Add(salesInvoice);
                    order.SalesInvoice = salesInvoice;
                    order.SalesInvoiceId = salesInvoice.Id;
                }
                break;

            case MarketplaceOrderStatus.Cancelled:
                order.Status = MarketplaceOrderStatus.Cancelled;
                order.CancelledAt = DateTime.UtcNow;

                if (order.SalesInvoice != null)
                {
                    order.SalesInvoice.Status = SalesInvoiceStatus.Cancelled;
                    order.SalesInvoice.CancelledAt = DateTime.UtcNow;
                }
                break;
        }

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            order.Notes = string.IsNullOrWhiteSpace(order.Notes)
                ? request.Notes.Trim()
                : $"{order.Notes} | {request.Notes.Trim()}";
        }

        await _context.SaveChangesAsync();

        return ApiResponse<MarketplaceOrderDto>.Ok(MapOrder(order), "Marketplace order status updated successfully");
    }

    private async Task<Tenant?> ResolveTenantBySlugAsync(string tenantSlug)
    {
        return await _context.Tenants
            .IgnoreQueryFilters()
            .FirstOrDefaultAsync(t => !t.IsDeleted && t.Slug == tenantSlug && t.Status == TenantStatus.Active);
    }

    private async Task<SalesInvoice> BuildSalesInvoiceFromOrderAsync(MarketplaceOrder order)
    {
        var invoice = new SalesInvoice
        {
            TenantId = order.TenantId,
            InvoiceNumber = await GenerateSalesInvoiceNumberAsync(order.TenantId),
            BranchId = order.BranchId,
            MarketplaceOrderId = order.Id,
            CustomerNameSnapshot = order.CustomerName,
            PhoneSnapshot = order.Phone,
            SubtotalAmount = order.SubtotalAmount,
            TotalAmount = order.TotalAmount,
            Status = SalesInvoiceStatus.Issued,
            IssuedAt = DateTime.UtcNow
        };

        foreach (var item in order.Items.Where(i => !i.IsDeleted))
        {
            invoice.LineItems.Add(new SalesInvoiceLineItem
            {
                TenantId = order.TenantId,
                InventoryItemId = item.InventoryItemId,
                ItemNameSnapshot = item.ItemNameSnapshot,
                UnitPrice = item.UnitPrice,
                Quantity = item.Quantity,
                LineTotal = item.LineTotal
            });
        }

        return invoice;
    }

    private async Task<string> GenerateSalesInvoiceNumberAsync(Guid tenantId)
    {
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var candidate = $"SLS-{DateTime.UtcNow:yyyyMMddHHmmss}-{Random.Shared.Next(1000, 9999)}";
            var exists = await _context.SalesInvoices
                .AnyAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.InvoiceNumber == candidate);
            if (!exists)
                return candidate;
        }

        return $"SLS-{DateTime.UtcNow:yyyyMMddHHmmssfff}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";
    }

    private static PublicMarketplaceItemDto MapPublicItem(InventoryItem item)
    {
        return new PublicMarketplaceItemDto
        {
            Id = item.Id,
            BranchId = item.BranchId,
            Name = item.Name,
            Description = item.Description,
            SkuCode = item.SkuCode,
            ItemType = item.ItemType,
            Unit = item.Unit,
            SalePrice = item.SalePrice,
            QuantityOnHand = item.QuantityOnHand,
            ShowInLanding = item.ShowInLanding,
            Images = item.Images
                .Where(img => !img.IsDeleted)
                .OrderBy(img => img.DisplayOrder)
                .Select(img => new InventoryItemImageDto
                {
                    Id = img.Id,
                    ImageUrl = img.ImageUrl,
                    DisplayOrder = img.DisplayOrder
                })
                .ToList()
        };
    }

    private static MarketplaceOrderDto MapOrder(MarketplaceOrder order)
    {
        return new MarketplaceOrderDto
        {
            Id = order.Id,
            BranchId = order.BranchId,
            CustomerName = order.CustomerName,
            Phone = order.Phone,
            Notes = order.Notes,
            Status = order.Status,
            WhatsAppRedirectedAt = order.WhatsAppRedirectedAt,
            SalesInvoiceId = order.SalesInvoiceId,
            SubtotalAmount = order.SubtotalAmount,
            TotalAmount = order.TotalAmount,
            ConfirmedAt = order.ConfirmedAt,
            CancelledAt = order.CancelledAt,
            Items = order.Items
                .Where(i => !i.IsDeleted)
                .OrderBy(i => i.CreatedAt)
                .Select(i => new MarketplaceOrderItemDto
                {
                    Id = i.Id,
                    InventoryItemId = i.InventoryItemId,
                    ItemName = i.ItemNameSnapshot,
                    UnitPrice = i.UnitPrice,
                    Quantity = i.Quantity,
                    LineTotal = i.LineTotal
                })
                .ToList(),
            SalesInvoice = order.SalesInvoice == null || order.SalesInvoice.IsDeleted
                ? null
                : MapSalesInvoice(order.SalesInvoice),
            CreatedAt = order.CreatedAt
        };
    }

    private static SalesInvoiceDto MapSalesInvoice(SalesInvoice invoice)
    {
        return new SalesInvoiceDto
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            BranchId = invoice.BranchId,
            MarketplaceOrderId = invoice.MarketplaceOrderId,
            CustomerName = invoice.CustomerNameSnapshot,
            Phone = invoice.PhoneSnapshot,
            SubtotalAmount = invoice.SubtotalAmount,
            TotalAmount = invoice.TotalAmount,
            Status = invoice.Status,
            IssuedAt = invoice.IssuedAt,
            CancelledAt = invoice.CancelledAt,
            LineItems = invoice.LineItems
                .Where(li => !li.IsDeleted)
                .OrderBy(li => li.CreatedAt)
                .Select(li => new SalesInvoiceLineItemDto
                {
                    Id = li.Id,
                    InventoryItemId = li.InventoryItemId,
                    ItemName = li.ItemNameSnapshot,
                    UnitPrice = li.UnitPrice,
                    Quantity = li.Quantity,
                    LineTotal = li.LineTotal
                })
                .ToList()
        };
    }
}
