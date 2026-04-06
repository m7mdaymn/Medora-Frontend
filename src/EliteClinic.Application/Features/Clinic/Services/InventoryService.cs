using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class InventoryService : IInventoryService
{
    private readonly EliteClinicDbContext _context;
    private readonly IInvoiceService _invoiceService;
    private readonly IBranchAccessService _branchAccessService;

    public InventoryService(
        EliteClinicDbContext context,
        IInvoiceService invoiceService,
        IBranchAccessService branchAccessService)
    {
        _context = context;
        _invoiceService = invoiceService;
        _branchAccessService = branchAccessService;
    }

    public async Task<ApiResponse<InventoryItemDto>> CreateItemAsync(Guid tenantId, CreateInventoryItemRequest request)
    {
        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.Id == request.BranchId && b.IsActive);
        if (branch == null)
            return ApiResponse<InventoryItemDto>.Error("Branch not found or inactive");

        var normalized = NormalizeFlags(
            request.InternalOnly,
            request.SellablePublicly,
            request.BillableInVisit,
            request.ShowInLanding,
            request.UsableInVisit);

        var sku = request.SkuCode.Trim();
        if (string.IsNullOrWhiteSpace(sku))
            return ApiResponse<InventoryItemDto>.Error("SKU/code is required");

        var skuExists = await _context.InventoryItems
            .AnyAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.BranchId == request.BranchId && i.SkuCode == sku);
        if (skuExists)
            return ApiResponse<InventoryItemDto>.Error("SKU/code already exists in this branch");

        var entity = new InventoryItem
        {
            TenantId = tenantId,
            Name = request.Name.Trim(),
            Description = request.Description,
            SkuCode = sku,
            ItemType = request.ItemType,
            Unit = string.IsNullOrWhiteSpace(request.Unit) ? "unit" : request.Unit.Trim(),
            SalePrice = Math.Max(request.SalePrice, 0m),
            CostPrice = Math.Max(request.CostPrice, 0m),
            QuantityOnHand = Math.Max(request.QuantityOnHand, 0m),
            LowStockThreshold = Math.Max(request.LowStockThreshold, 0m),
            UsableInVisit = normalized.UsableInVisit,
            SellablePublicly = normalized.SellablePublicly,
            InternalOnly = normalized.InternalOnly,
            BillableInVisit = normalized.BillableInVisit,
            Active = request.Active,
            BranchId = request.BranchId,
            ShowInLanding = normalized.ShowInLanding
        };

        _context.InventoryItems.Add(entity);
        _context.InventoryItemImages.AddRange(BuildImageEntities(entity.TenantId, entity.Id, request.Images));
        await _context.SaveChangesAsync();

        var saved = await _context.InventoryItems
            .Include(i => i.Branch)
            .Include(i => i.Images.Where(img => !img.IsDeleted))
            .FirstAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.Id == entity.Id);

        return ApiResponse<InventoryItemDto>.Created(MapItem(saved), "Inventory item created successfully");
    }

    public async Task<ApiResponse<InventoryItemDto>> UpdateItemAsync(Guid tenantId, Guid itemId, UpdateInventoryItemRequest request)
    {
        var exists = await _context.InventoryItems
            .AnyAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.Id == itemId);
        if (!exists)
            return ApiResponse<InventoryItemDto>.Error("Inventory item not found");

        var branch = await _context.Branches
            .FirstOrDefaultAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.Id == request.BranchId && b.IsActive);
        if (branch == null)
            return ApiResponse<InventoryItemDto>.Error("Branch not found or inactive");

        var sku = request.SkuCode.Trim();
        if (string.IsNullOrWhiteSpace(sku))
            return ApiResponse<InventoryItemDto>.Error("SKU/code is required");

        var skuExists = await _context.InventoryItems
            .AnyAsync(i => i.TenantId == tenantId
                && !i.IsDeleted
                && i.Id != itemId
                && i.BranchId == request.BranchId
                && i.SkuCode == sku);
        if (skuExists)
            return ApiResponse<InventoryItemDto>.Error("SKU/code already exists in this branch");

        var normalized = NormalizeFlags(
            request.InternalOnly,
            request.SellablePublicly,
            request.BillableInVisit,
            request.ShowInLanding,
            request.UsableInVisit);

        var now = DateTime.UtcNow;
        var affected = await _context.InventoryItems
            .Where(i => i.TenantId == tenantId && !i.IsDeleted && i.Id == itemId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(i => i.Name, request.Name.Trim())
                .SetProperty(i => i.Description, request.Description)
                .SetProperty(i => i.SkuCode, sku)
                .SetProperty(i => i.ItemType, request.ItemType)
                .SetProperty(i => i.Unit, string.IsNullOrWhiteSpace(request.Unit) ? "unit" : request.Unit.Trim())
                .SetProperty(i => i.SalePrice, Math.Max(request.SalePrice, 0m))
                .SetProperty(i => i.CostPrice, Math.Max(request.CostPrice, 0m))
                .SetProperty(i => i.QuantityOnHand, Math.Max(request.QuantityOnHand, 0m))
                .SetProperty(i => i.LowStockThreshold, Math.Max(request.LowStockThreshold, 0m))
                .SetProperty(i => i.UsableInVisit, normalized.UsableInVisit)
                .SetProperty(i => i.SellablePublicly, normalized.SellablePublicly)
                .SetProperty(i => i.InternalOnly, normalized.InternalOnly)
                .SetProperty(i => i.BillableInVisit, normalized.BillableInVisit)
                .SetProperty(i => i.Active, request.Active)
                .SetProperty(i => i.BranchId, request.BranchId)
                .SetProperty(i => i.ShowInLanding, normalized.ShowInLanding)
                .SetProperty(i => i.UpdatedAt, now));

        if (affected == 0)
            return ApiResponse<InventoryItemDto>.Error("Inventory item update failed");

        if (request.Images != null)
        {
            await _context.InventoryItemImages
                .Where(img => img.TenantId == tenantId
                    && img.InventoryItemId == itemId
                    && !img.IsDeleted)
                .ExecuteUpdateAsync(setters => setters
                    .SetProperty(i => i.IsDeleted, true)
                    .SetProperty(i => i.DeletedAt, now)
                    .SetProperty(i => i.UpdatedAt, now));

            _context.InventoryItemImages.AddRange(BuildImageEntities(tenantId, itemId, request.Images));
            await _context.SaveChangesAsync();
        }

        var updated = await _context.InventoryItems
            .AsNoTracking()
            .Include(i => i.Branch)
            .Include(i => i.Images.Where(img => !img.IsDeleted))
            .FirstAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.Id == itemId);

        return ApiResponse<InventoryItemDto>.Ok(MapItem(updated), "Inventory item updated successfully");
    }

    public async Task<ApiResponse<InventoryItemDto>> GetItemByIdAsync(Guid tenantId, Guid callerUserId, Guid itemId)
    {
        var entity = await _context.InventoryItems
            .Include(i => i.Branch)
            .Include(i => i.Images.Where(img => !img.IsDeleted))
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.Id == itemId);

        if (entity == null)
            return ApiResponse<InventoryItemDto>.Error("Inventory item not found");

        var scopedBranchIds = await _branchAccessService.GetScopedBranchIdsAsync(tenantId, callerUserId);
        if (scopedBranchIds != null && !scopedBranchIds.Contains(entity.BranchId))
            return ApiResponse<InventoryItemDto>.Error("Inventory item not found");

        return ApiResponse<InventoryItemDto>.Ok(MapItem(entity), "Inventory item retrieved successfully");
    }

    public async Task<ApiResponse<PagedResult<InventoryItemDto>>> ListItemsAsync(Guid tenantId, Guid callerUserId, InventoryItemsQuery query)
    {
        var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 200);

        var scopedBranchIds = await _branchAccessService.GetScopedBranchIdsAsync(tenantId, callerUserId);
        if (scopedBranchIds != null)
        {
            if (query.BranchId.HasValue && !scopedBranchIds.Contains(query.BranchId.Value))
            {
                return ApiResponse<PagedResult<InventoryItemDto>>.Ok(new PagedResult<InventoryItemDto>
                {
                    Items = new List<InventoryItemDto>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                }, "No accessible inventory items for requested branch");
            }

            if (scopedBranchIds.Count == 0)
            {
                return ApiResponse<PagedResult<InventoryItemDto>>.Ok(new PagedResult<InventoryItemDto>
                {
                    Items = new List<InventoryItemDto>(),
                    TotalCount = 0,
                    PageNumber = pageNumber,
                    PageSize = pageSize
                }, "No accessible branches for current user");
            }
        }

        var q = _context.InventoryItems
            .Include(i => i.Branch)
            .Include(i => i.Images.Where(img => !img.IsDeleted))
            .Where(i => i.TenantId == tenantId && !i.IsDeleted)
            .AsQueryable();

        if (scopedBranchIds != null)
        {
            var branchIds = scopedBranchIds.ToList();
            q = q.Where(i => branchIds.Contains(i.BranchId));
        }

        if (query.ActiveOnly)
            q = q.Where(i => i.Active);

        if (query.BranchId.HasValue)
            q = q.Where(i => i.BranchId == query.BranchId.Value);

        if (query.UsableInVisit.HasValue)
            q = q.Where(i => i.UsableInVisit == query.UsableInVisit.Value);

        if (query.SellablePublicly.HasValue)
            q = q.Where(i => i.SellablePublicly == query.SellablePublicly.Value);

        if (!query.IncludeInternalOnly)
            q = q.Where(i => !i.InternalOnly);

        if (query.LowStockOnly == true)
            q = q.Where(i => i.QuantityOnHand <= i.LowStockThreshold);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim().ToLower();
            q = q.Where(i => i.Name.ToLower().Contains(search)
                || i.SkuCode.ToLower().Contains(search)
                || (i.Description != null && i.Description.ToLower().Contains(search)));
        }

        var total = await q.CountAsync();
        var rows = await q
            .OrderBy(i => i.Name)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var paged = new PagedResult<InventoryItemDto>
        {
            Items = rows.Select(MapItem).ToList(),
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        };

        return ApiResponse<PagedResult<InventoryItemDto>>.Ok(paged, $"Retrieved {paged.Items.Count} inventory item(s)");
    }

    public async Task<ApiResponse<InventoryItemDto>> SetActivationAsync(Guid tenantId, Guid itemId, SetInventoryItemActivationRequest request)
    {
        var entity = await _context.InventoryItems
            .Include(i => i.Branch)
            .Include(i => i.Images.Where(img => !img.IsDeleted))
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.Id == itemId);

        if (entity == null)
            return ApiResponse<InventoryItemDto>.Error("Inventory item not found");

        entity.Active = request.Active;
        await _context.SaveChangesAsync();

        return ApiResponse<InventoryItemDto>.Ok(MapItem(entity), request.Active
            ? "Inventory item activated successfully"
            : "Inventory item deactivated successfully");
    }

    public async Task<ApiResponse<VisitInventoryUsageDto>> RecordVisitUsageAsync(Guid tenantId, Guid visitId, Guid callerUserId, RecordVisitInventoryUsageRequest request)
    {
        if (request.Quantity <= 0)
            return ApiResponse<VisitInventoryUsageDto>.Error("Quantity must be greater than zero");

        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.TenantId == tenantId && !v.IsDeleted && v.Id == visitId);
        if (visit == null)
            return ApiResponse<VisitInventoryUsageDto>.Error("Visit not found");

        if (visit.Status != VisitStatus.Open)
            return ApiResponse<VisitInventoryUsageDto>.Error("Inventory usage can only be recorded for open visits");

        var callerDoctorId = await _context.Doctors
            .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.UserId == callerUserId)
            .Select(d => (Guid?)d.Id)
            .FirstOrDefaultAsync();

        if (callerDoctorId.HasValue && visit.DoctorId != callerDoctorId.Value)
            return ApiResponse<VisitInventoryUsageDto>.Error("Doctors can only use inventory in their own visits");

        if (!visit.BranchId.HasValue)
            return ApiResponse<VisitInventoryUsageDto>.Error("Visit has no branch context");

        var item = await _context.InventoryItems
            .FirstOrDefaultAsync(i => i.TenantId == tenantId && !i.IsDeleted && i.Id == request.InventoryItemId);
        if (item == null)
            return ApiResponse<VisitInventoryUsageDto>.Error("Inventory item not found");

        if (!item.Active)
            return ApiResponse<VisitInventoryUsageDto>.Error("Inventory item is inactive");

        if (!item.UsableInVisit)
            return ApiResponse<VisitInventoryUsageDto>.Error("Inventory item is not usable in visits");

        if (item.BranchId != visit.BranchId.Value)
            return ApiResponse<VisitInventoryUsageDto>.Error("Inventory item branch does not match visit branch");

        if (item.QuantityOnHand < request.Quantity)
            return ApiResponse<VisitInventoryUsageDto>.Error("Insufficient stock quantity");

        var shouldBill = item.BillableInVisit && !item.InternalOnly;
        var billedAmount = shouldBill ? Math.Round(item.SalePrice * request.Quantity, 2) : 0m;

        Guid? invoiceId = null;
        if (shouldBill)
        {
            var ensuredInvoice = await _invoiceService.EnsureInvoiceForVisitAsync(tenantId, visit.Id, callerUserId, "Auto-created for inventory usage");
            if (!ensuredInvoice.Success)
                return ApiResponse<VisitInventoryUsageDto>.Error(ensuredInvoice.Message);

            invoiceId = ensuredInvoice.Data!.Id;
        }

        item.QuantityOnHand -= request.Quantity;

        var usage = new VisitInventoryUsage
        {
            TenantId = tenantId,
            InventoryItemId = item.Id,
            DoctorId = visit.DoctorId,
            PatientId = visit.PatientId,
            VisitId = visit.Id,
            Quantity = request.Quantity,
            BilledAmount = billedAmount,
            UsedAt = DateTime.UtcNow,
            BranchId = visit.BranchId.Value,
            BilledToInvoice = shouldBill,
            InvoiceId = invoiceId,
            Notes = request.Notes
        };
        _context.VisitInventoryUsages.Add(usage);

        if (shouldBill && invoiceId.HasValue)
        {
            var addLineItem = await _invoiceService.AddLineItemAsync(
                tenantId,
                invoiceId.Value,
                new AddInvoiceLineItemRequest
                {
                    ItemName = $"Inventory: {item.Name} x {request.Quantity:0.####}",
                    UnitPrice = billedAmount,
                    Quantity = 1,
                    Notes = "Added from visit inventory usage"
                },
                callerUserId);

            if (!addLineItem.Success)
                return ApiResponse<VisitInventoryUsageDto>.Error(addLineItem.Message);
        }
        else
        {
            await _context.SaveChangesAsync();
        }

        return ApiResponse<VisitInventoryUsageDto>.Ok(MapUsage(usage, item.Name), "Inventory usage recorded successfully");
    }

    private static (bool InternalOnly, bool SellablePublicly, bool BillableInVisit, bool ShowInLanding, bool UsableInVisit) NormalizeFlags(
        bool internalOnly,
        bool sellablePublicly,
        bool billableInVisit,
        bool showInLanding,
        bool usableInVisit)
    {
        if (internalOnly)
        {
            return (
                InternalOnly: true,
                SellablePublicly: false,
                BillableInVisit: false,
                ShowInLanding: false,
                UsableInVisit: usableInVisit);
        }

        if (!sellablePublicly)
            showInLanding = false;

        if (!usableInVisit)
            billableInVisit = false;

        return (
            InternalOnly: false,
            SellablePublicly: sellablePublicly,
            BillableInVisit: billableInVisit,
            ShowInLanding: showInLanding,
            UsableInVisit: usableInVisit);
    }

    private static List<InventoryItemImage> BuildImageEntities(Guid tenantId, Guid itemId, List<string>? images)
    {
        if (images == null)
            return new List<InventoryItemImage>();

        var normalized = images
            .Where(i => !string.IsNullOrWhiteSpace(i))
            .Select(i => i.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        var output = new List<InventoryItemImage>(normalized.Count);

        for (var i = 0; i < normalized.Count; i++)
        {
            output.Add(new InventoryItemImage
            {
                TenantId = tenantId,
                InventoryItemId = itemId,
                ImageUrl = normalized[i],
                DisplayOrder = i
            });
        }

        return output;
    }

    private static InventoryItemDto MapItem(InventoryItem item)
    {
        return new InventoryItemDto
        {
            Id = item.Id,
            Name = item.Name,
            Description = item.Description,
            SkuCode = item.SkuCode,
            ItemType = item.ItemType,
            Unit = item.Unit,
            SalePrice = item.SalePrice,
            CostPrice = item.CostPrice,
            QuantityOnHand = item.QuantityOnHand,
            LowStockThreshold = item.LowStockThreshold,
            UsableInVisit = item.UsableInVisit,
            SellablePublicly = item.SellablePublicly,
            InternalOnly = item.InternalOnly,
            BillableInVisit = item.BillableInVisit,
            Active = item.Active,
            BranchId = item.BranchId,
            BranchName = item.Branch?.Name ?? string.Empty,
            ShowInLanding = item.ShowInLanding,
            IsLowStock = item.QuantityOnHand <= item.LowStockThreshold,
            Images = item.Images
                .Where(img => !img.IsDeleted)
                .OrderBy(img => img.DisplayOrder)
                .Select(img => new InventoryItemImageDto
                {
                    Id = img.Id,
                    ImageUrl = img.ImageUrl,
                    DisplayOrder = img.DisplayOrder
                })
                .ToList(),
            CreatedAt = item.CreatedAt,
            UpdatedAt = item.UpdatedAt
        };
    }

    private static VisitInventoryUsageDto MapUsage(VisitInventoryUsage usage, string itemName)
    {
        return new VisitInventoryUsageDto
        {
            Id = usage.Id,
            InventoryItemId = usage.InventoryItemId,
            InventoryItemName = itemName,
            DoctorId = usage.DoctorId,
            PatientId = usage.PatientId,
            VisitId = usage.VisitId,
            Quantity = usage.Quantity,
            BilledAmount = usage.BilledAmount,
            UsedAt = usage.UsedAt,
            BranchId = usage.BranchId,
            InvoiceId = usage.InvoiceId,
            BilledToInvoice = usage.BilledToInvoice,
            Notes = usage.Notes
        };
    }
}
