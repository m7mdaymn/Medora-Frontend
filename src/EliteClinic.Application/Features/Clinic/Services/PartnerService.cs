using EliteClinic.Application.Common.Models;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace EliteClinic.Application.Features.Clinic.Services;

public class PartnerService : IPartnerService
{
    private readonly EliteClinicDbContext _context;
    private readonly IBranchAccessService _branchAccessService;

    public PartnerService(EliteClinicDbContext context, IBranchAccessService branchAccessService)
    {
        _context = context;
        _branchAccessService = branchAccessService;
    }

    public async Task<ApiResponse<PagedResult<PartnerDto>>> ListPartnersAsync(Guid tenantId, PartnerType? type, bool activeOnly, int pageNumber = 1, int pageSize = 20)
    {
        var q = _context.Partners
            .Where(p => p.TenantId == tenantId && !p.IsDeleted)
            .AsQueryable();

        if (type.HasValue)
            q = q.Where(p => p.Type == type.Value);

        if (activeOnly)
            q = q.Where(p => p.IsActive);

        var safePageNumber = pageNumber <= 0 ? 1 : pageNumber;
        var safePageSize = pageSize <= 0 ? 20 : Math.Min(pageSize, 200);

        var total = await q.CountAsync();
        var rows = await q
            .OrderBy(p => p.Type)
            .ThenBy(p => p.Name)
            .Skip((safePageNumber - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        return ApiResponse<PagedResult<PartnerDto>>.Ok(new PagedResult<PartnerDto>
        {
            Items = rows.Select(MapPartner).ToList(),
            TotalCount = total,
            PageNumber = safePageNumber,
            PageSize = safePageSize
        }, $"Retrieved {rows.Count} partner(s)");
    }

    public async Task<ApiResponse<PartnerDto>> CreatePartnerAsync(Guid tenantId, CreatePartnerRequest request)
    {
        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return ApiResponse<PartnerDto>.Error("Partner name is required");

        var exists = await _context.Partners
            .AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Type == request.Type && p.Name == name);

        if (exists)
            return ApiResponse<PartnerDto>.Error("Partner with same name and type already exists");

        var entity = new Partner
        {
            TenantId = tenantId,
            Name = name,
            Type = request.Type,
            ContactName = request.ContactName?.Trim(),
            ContactPhone = request.ContactPhone?.Trim(),
            ContactEmail = request.ContactEmail?.Trim(),
            Address = request.Address?.Trim(),
            Notes = request.Notes?.Trim(),
            IsActive = true
        };

        _context.Partners.Add(entity);
        await _context.SaveChangesAsync();

        return ApiResponse<PartnerDto>.Created(MapPartner(entity), "Partner created successfully");
    }

    public async Task<ApiResponse<PartnerDto>> UpdatePartnerAsync(Guid tenantId, Guid partnerId, UpdatePartnerRequest request)
    {
        var entity = await _context.Partners
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == partnerId);

        if (entity == null)
            return ApiResponse<PartnerDto>.Error("Partner not found");

        var name = request.Name.Trim();
        if (string.IsNullOrWhiteSpace(name))
            return ApiResponse<PartnerDto>.Error("Partner name is required");

        var duplicate = await _context.Partners
            .AnyAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id != partnerId && p.Type == request.Type && p.Name == name);

        if (duplicate)
            return ApiResponse<PartnerDto>.Error("Partner with same name and type already exists");

        entity.Name = name;
        entity.Type = request.Type;
        entity.ContactName = request.ContactName?.Trim();
        entity.ContactPhone = request.ContactPhone?.Trim();
        entity.ContactEmail = request.ContactEmail?.Trim();
        entity.Address = request.Address?.Trim();
        entity.Notes = request.Notes?.Trim();

        await _context.SaveChangesAsync();

        return ApiResponse<PartnerDto>.Ok(MapPartner(entity), "Partner updated successfully");
    }

    public async Task<ApiResponse<PartnerDto>> SetPartnerActivationAsync(Guid tenantId, Guid partnerId, bool isActive)
    {
        var entity = await _context.Partners
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == partnerId);

        if (entity == null)
            return ApiResponse<PartnerDto>.Error("Partner not found");

        entity.IsActive = isActive;
        await _context.SaveChangesAsync();

        return ApiResponse<PartnerDto>.Ok(MapPartner(entity), isActive
            ? "Partner activated successfully"
            : "Partner deactivated successfully");
    }

    public async Task<ApiResponse<List<PartnerContractDto>>> ListContractsAsync(Guid tenantId, PartnerContractsQuery query)
    {
        var q = _context.PartnerContracts
            .Include(c => c.Partner)
            .Where(c => c.TenantId == tenantId && !c.IsDeleted)
            .AsQueryable();

        if (query.PartnerId.HasValue)
            q = q.Where(c => c.PartnerId == query.PartnerId.Value);

        if (query.BranchId.HasValue)
            q = q.Where(c => c.BranchId == query.BranchId.Value);

        if (query.ActiveOnly)
            q = q.Where(c => c.IsActive);

        var rows = await q
            .OrderByDescending(c => c.EffectiveFrom)
            .ThenByDescending(c => c.CreatedAt)
            .ToListAsync();

        return ApiResponse<List<PartnerContractDto>>.Ok(rows.Select(MapContract).ToList(), $"Retrieved {rows.Count} contract(s)");
    }

    public async Task<ApiResponse<PartnerContractDto>> CreateContractAsync(Guid tenantId, CreatePartnerContractRequest request)
    {
        var partner = await _context.Partners
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == request.PartnerId);

        if (partner == null)
            return ApiResponse<PartnerContractDto>.Error("Partner not found");

        if (request.EffectiveTo.HasValue && request.EffectiveTo.Value.Date < request.EffectiveFrom.Date)
            return ApiResponse<PartnerContractDto>.Error("effectiveTo must be on or after effectiveFrom");

        if (request.BranchId.HasValue)
        {
            var branchExists = await _context.Branches
                .AnyAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.IsActive && b.Id == request.BranchId.Value);
            if (!branchExists)
                return ApiResponse<PartnerContractDto>.Error("Branch not found or inactive");
        }

        var effectiveFrom = request.EffectiveFrom == default ? DateTime.UtcNow.Date : request.EffectiveFrom.Date;

        var entity = new PartnerContract
        {
            TenantId = tenantId,
            PartnerId = partner.Id,
            BranchId = request.BranchId,
            ServiceScope = request.ServiceScope?.Trim(),
            CommissionPercentage = request.CommissionPercentage,
            FlatFee = request.FlatFee,
            EffectiveFrom = effectiveFrom,
            EffectiveTo = request.EffectiveTo?.Date,
            IsActive = true,
            Notes = request.Notes?.Trim()
        };

        _context.PartnerContracts.Add(entity);
        await _context.SaveChangesAsync();

        var saved = await _context.PartnerContracts
            .Include(c => c.Partner)
            .FirstAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.Id == entity.Id);

        return ApiResponse<PartnerContractDto>.Created(MapContract(saved), "Contract created successfully");
    }

    public async Task<ApiResponse<PartnerContractDto>> UpdateContractAsync(Guid tenantId, Guid contractId, UpdatePartnerContractRequest request)
    {
        var entity = await _context.PartnerContracts
            .Include(c => c.Partner)
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.Id == contractId);

        if (entity == null)
            return ApiResponse<PartnerContractDto>.Error("Contract not found");

        if (request.EffectiveTo.HasValue && request.EffectiveTo.Value.Date < request.EffectiveFrom.Date)
            return ApiResponse<PartnerContractDto>.Error("effectiveTo must be on or after effectiveFrom");

        if (request.BranchId.HasValue)
        {
            var branchExists = await _context.Branches
                .AnyAsync(b => b.TenantId == tenantId && !b.IsDeleted && b.IsActive && b.Id == request.BranchId.Value);
            if (!branchExists)
                return ApiResponse<PartnerContractDto>.Error("Branch not found or inactive");
        }

        entity.BranchId = request.BranchId;
        entity.ServiceScope = request.ServiceScope?.Trim();
        entity.CommissionPercentage = request.CommissionPercentage;
        entity.FlatFee = request.FlatFee;
        entity.EffectiveFrom = request.EffectiveFrom == default ? entity.EffectiveFrom : request.EffectiveFrom.Date;
        entity.EffectiveTo = request.EffectiveTo?.Date;
        entity.IsActive = request.IsActive;
        entity.Notes = request.Notes?.Trim();

        await _context.SaveChangesAsync();

        return ApiResponse<PartnerContractDto>.Ok(MapContract(entity), "Contract updated successfully");
    }

    public async Task<ApiResponse<PartnerOrderDto>> CreateLabOrderAsync(Guid tenantId, Guid visitId, Guid labRequestId, Guid callerUserId, CreateLabPartnerOrderRequest request)
    {
        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.TenantId == tenantId && !v.IsDeleted && v.Id == visitId);

        if (visit == null)
            return ApiResponse<PartnerOrderDto>.Error("Visit not found");

        var doctorOwnership = await EnsureDoctorVisitOwnershipAsync(tenantId, callerUserId, visit.DoctorId);
        if (doctorOwnership != null)
            return ApiResponse<PartnerOrderDto>.Error(doctorOwnership);

        if (!visit.BranchId.HasValue)
            return ApiResponse<PartnerOrderDto>.Error("Visit has no branch context");

        var branchAccess = await _branchAccessService.EnsureCanAccessBranchAsync(tenantId, callerUserId, visit.BranchId.Value);
        if (!branchAccess.Success)
            return ApiResponse<PartnerOrderDto>.Error(branchAccess.Message);

        var labRequest = await _context.LabRequests
            .FirstOrDefaultAsync(l => l.TenantId == tenantId && !l.IsDeleted && l.Id == labRequestId && l.VisitId == visitId);

        if (labRequest == null)
            return ApiResponse<PartnerOrderDto>.Error("Lab request not found");

        if (labRequest.PartnerOrderId.HasValue)
            return ApiResponse<PartnerOrderDto>.Error("Lab request already linked to a partner order");

        var partner = await _context.Partners
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == request.PartnerId && p.IsActive);

        if (partner == null)
            return ApiResponse<PartnerOrderDto>.Error("Partner not found or inactive");

        var expectedType = labRequest.Type == LabRequestType.Lab
            ? PartnerType.Laboratory
            : PartnerType.Radiology;

        if (partner.Type != expectedType)
            return ApiResponse<PartnerOrderDto>.Error($"Selected partner must be of type {expectedType}");

        var contractResult = await ResolveContractAsync(tenantId, request.PartnerContractId, partner.Id, visit.BranchId.Value);
        if (!contractResult.Success)
            return ApiResponse<PartnerOrderDto>.Error(contractResult.Message);

        var order = new PartnerOrder
        {
            TenantId = tenantId,
            PartnerId = partner.Id,
            PartnerContractId = contractResult.Data?.Id,
            BranchId = visit.BranchId.Value,
            VisitId = visit.Id,
            LabRequestId = labRequest.Id,
            PartnerType = partner.Type,
            OrderedByUserId = callerUserId,
            OrderedAt = DateTime.UtcNow,
            Status = PartnerOrderStatus.Sent,
            SentAt = DateTime.UtcNow,
            EstimatedCost = request.EstimatedCost,
            ExternalReference = request.ExternalReference?.Trim(),
            Notes = request.Notes?.Trim()
        };

        _context.PartnerOrders.Add(order);
        _context.PartnerOrderStatusHistories.Add(new PartnerOrderStatusHistory
        {
            TenantId = tenantId,
            PartnerOrderId = order.Id,
            OldStatus = null,
            NewStatus = PartnerOrderStatus.Sent,
            ChangedByUserId = callerUserId,
            Notes = "Partner order created from lab request"
        });

        labRequest.PartnerOrderId = order.Id;

        await AddInAppNotificationsForOrderChangeAsync(tenantId, visit.PatientId, visit.DoctorId, callerUserId, order.Id, PartnerOrderStatus.Sent);
        await _context.SaveChangesAsync();

        var saved = await GetOrderWithIncludesAsync(tenantId, order.Id);
        return ApiResponse<PartnerOrderDto>.Created(MapOrder(saved!), "Lab partner order created successfully");
    }

    public async Task<ApiResponse<PartnerOrderDto>> CreatePrescriptionOrderAsync(Guid tenantId, Guid visitId, Guid prescriptionId, Guid callerUserId, CreatePrescriptionPartnerOrderRequest request)
    {
        var visit = await _context.Visits
            .FirstOrDefaultAsync(v => v.TenantId == tenantId && !v.IsDeleted && v.Id == visitId);

        if (visit == null)
            return ApiResponse<PartnerOrderDto>.Error("Visit not found");

        var doctorOwnership = await EnsureDoctorVisitOwnershipAsync(tenantId, callerUserId, visit.DoctorId);
        if (doctorOwnership != null)
            return ApiResponse<PartnerOrderDto>.Error(doctorOwnership);

        if (!visit.BranchId.HasValue)
            return ApiResponse<PartnerOrderDto>.Error("Visit has no branch context");

        var branchAccess = await _branchAccessService.EnsureCanAccessBranchAsync(tenantId, callerUserId, visit.BranchId.Value);
        if (!branchAccess.Success)
            return ApiResponse<PartnerOrderDto>.Error(branchAccess.Message);

        var prescription = await _context.Prescriptions
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == prescriptionId && p.VisitId == visitId);

        if (prescription == null)
            return ApiResponse<PartnerOrderDto>.Error("Prescription not found");

        if (prescription.PartnerOrderId.HasValue)
            return ApiResponse<PartnerOrderDto>.Error("Prescription already linked to a partner order");

        var partner = await _context.Partners
            .FirstOrDefaultAsync(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == request.PartnerId && p.IsActive);

        if (partner == null)
            return ApiResponse<PartnerOrderDto>.Error("Partner not found or inactive");

        if (partner.Type != PartnerType.Pharmacy)
            return ApiResponse<PartnerOrderDto>.Error("Selected partner must be of type Pharmacy");

        var contractResult = await ResolveContractAsync(tenantId, request.PartnerContractId, partner.Id, visit.BranchId.Value);
        if (!contractResult.Success)
            return ApiResponse<PartnerOrderDto>.Error(contractResult.Message);

        var order = new PartnerOrder
        {
            TenantId = tenantId,
            PartnerId = partner.Id,
            PartnerContractId = contractResult.Data?.Id,
            BranchId = visit.BranchId.Value,
            VisitId = visit.Id,
            PrescriptionId = prescription.Id,
            PartnerType = partner.Type,
            OrderedByUserId = callerUserId,
            OrderedAt = DateTime.UtcNow,
            Status = PartnerOrderStatus.Sent,
            SentAt = DateTime.UtcNow,
            EstimatedCost = request.EstimatedCost,
            ExternalReference = request.ExternalReference?.Trim(),
            Notes = request.Notes?.Trim()
        };

        _context.PartnerOrders.Add(order);
        _context.PartnerOrderStatusHistories.Add(new PartnerOrderStatusHistory
        {
            TenantId = tenantId,
            PartnerOrderId = order.Id,
            OldStatus = null,
            NewStatus = PartnerOrderStatus.Sent,
            ChangedByUserId = callerUserId,
            Notes = "Partner order created from prescription"
        });

        prescription.PartnerOrderId = order.Id;

        await AddInAppNotificationsForOrderChangeAsync(tenantId, visit.PatientId, visit.DoctorId, callerUserId, order.Id, PartnerOrderStatus.Sent);
        await _context.SaveChangesAsync();

        var saved = await GetOrderWithIncludesAsync(tenantId, order.Id);
        return ApiResponse<PartnerOrderDto>.Created(MapOrder(saved!), "Prescription partner order created successfully");
    }

    public async Task<ApiResponse<PagedResult<PartnerOrderDto>>> ListOrdersAsync(Guid tenantId, Guid callerUserId, PartnerOrdersQuery query)
    {
        var scopedBranchIds = await _branchAccessService.GetScopedBranchIdsAsync(tenantId, callerUserId);
        var callerDoctorId = await ResolveCallerDoctorIdAsync(tenantId, callerUserId);

        var q = _context.PartnerOrders
            .Include(o => o.Partner)
            .Include(o => o.StatusHistory.Where(h => !h.IsDeleted))
            .Include(o => o.Visit)
            .Where(o => o.TenantId == tenantId && !o.IsDeleted)
            .AsQueryable();

        if (scopedBranchIds != null)
        {
            if (scopedBranchIds.Count == 0)
            {
                return ApiResponse<PagedResult<PartnerOrderDto>>.Ok(new PagedResult<PartnerOrderDto>
                {
                    Items = new List<PartnerOrderDto>(),
                    TotalCount = 0,
                    PageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber,
                    PageSize = query.PageSize <= 0 ? 20 : query.PageSize
                }, "No accessible branches for current user");
            }

            var branchIds = scopedBranchIds.ToList();
            q = q.Where(o => branchIds.Contains(o.BranchId));
        }

        if (callerDoctorId.HasValue)
            q = q.Where(o => o.Visit.DoctorId == callerDoctorId.Value);

        if (query.BranchId.HasValue)
            q = q.Where(o => o.BranchId == query.BranchId.Value);

        if (query.PartnerId.HasValue)
            q = q.Where(o => o.PartnerId == query.PartnerId.Value);

        if (query.PartnerType.HasValue)
            q = q.Where(o => o.PartnerType == query.PartnerType.Value);

        if (query.Status.HasValue)
            q = q.Where(o => o.Status == query.Status.Value);

        if (query.FromDate.HasValue)
            q = q.Where(o => o.CreatedAt >= query.FromDate.Value.Date);

        if (query.ToDate.HasValue)
            q = q.Where(o => o.CreatedAt < query.ToDate.Value.Date.AddDays(1));

        var pageNumber = query.PageNumber <= 0 ? 1 : query.PageNumber;
        var pageSize = query.PageSize <= 0 ? 20 : Math.Min(query.PageSize, 200);

        var total = await q.CountAsync();
        var rows = await q
            .OrderByDescending(o => o.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return ApiResponse<PagedResult<PartnerOrderDto>>.Ok(new PagedResult<PartnerOrderDto>
        {
            Items = rows.Select(MapOrder).ToList(),
            TotalCount = total,
            PageNumber = pageNumber,
            PageSize = pageSize
        }, $"Retrieved {rows.Count} partner order(s)");
    }

    public async Task<ApiResponse<PartnerOrderDto>> GetOrderByIdAsync(Guid tenantId, Guid callerUserId, Guid orderId)
    {
        var order = await GetOrderWithIncludesAsync(tenantId, orderId);
        if (order == null)
            return ApiResponse<PartnerOrderDto>.Error("Partner order not found");

        var access = await EnsureCanReadOrderAsync(tenantId, callerUserId, order);
        if (!access.Success)
            return ApiResponse<PartnerOrderDto>.Error(access.Message);

        return ApiResponse<PartnerOrderDto>.Ok(MapOrder(order), "Partner order retrieved successfully");
    }

    public async Task<ApiResponse<PartnerOrderDto>> UpdateOrderStatusAsync(Guid tenantId, Guid callerUserId, Guid orderId, UpdatePartnerOrderStatusRequest request)
    {
        var order = await GetOrderWithIncludesAsync(tenantId, orderId);
        if (order == null)
            return ApiResponse<PartnerOrderDto>.Error("Partner order not found");

        var access = await EnsureCanReadOrderAsync(tenantId, callerUserId, order);
        if (!access.Success)
            return ApiResponse<PartnerOrderDto>.Error(access.Message);

        if (order.Status == request.Status)
            return ApiResponse<PartnerOrderDto>.Error("Order already in requested status");

        if (!IsValidTransition(order.Status, request.Status))
            return ApiResponse<PartnerOrderDto>.Error($"Invalid status transition from {order.Status} to {request.Status}");

        var oldStatus = order.Status;
        order.Status = request.Status;

        var now = DateTime.UtcNow;
        if (request.Status == PartnerOrderStatus.Sent)
            order.SentAt ??= now;
        if (request.Status == PartnerOrderStatus.Accepted)
            order.AcceptedAt ??= now;
        if (request.Status == PartnerOrderStatus.Completed)
            order.CompletedAt ??= now;
        if (request.Status == PartnerOrderStatus.Cancelled)
            order.CancelledAt ??= now;

        if (!string.IsNullOrWhiteSpace(request.ExternalReference))
            order.ExternalReference = request.ExternalReference.Trim();

        if (request.FinalCost.HasValue)
            order.FinalCost = request.FinalCost.Value;

        if (!string.IsNullOrWhiteSpace(request.Notes))
        {
            order.Notes = string.IsNullOrWhiteSpace(order.Notes)
                ? request.Notes.Trim()
                : $"{order.Notes} | {request.Notes.Trim()}";
        }

        _context.PartnerOrderStatusHistories.Add(new PartnerOrderStatusHistory
        {
            TenantId = tenantId,
            PartnerOrderId = order.Id,
            OldStatus = oldStatus,
            NewStatus = request.Status,
            ChangedByUserId = callerUserId,
            Notes = request.Notes
        });

        await AddInAppNotificationsForOrderChangeAsync(tenantId, order.Visit.PatientId, order.Visit.DoctorId, callerUserId, order.Id, request.Status);
        await _context.SaveChangesAsync();

        var updated = await GetOrderWithIncludesAsync(tenantId, orderId);
        return ApiResponse<PartnerOrderDto>.Ok(MapOrder(updated!), "Partner order status updated successfully");
    }

    private async Task<ApiResponse<PartnerContract?>> ResolveContractAsync(Guid tenantId, Guid? contractId, Guid partnerId, Guid branchId)
    {
        if (!contractId.HasValue)
            return ApiResponse<PartnerContract?>.Ok(null);

        var contract = await _context.PartnerContracts
            .FirstOrDefaultAsync(c => c.TenantId == tenantId && !c.IsDeleted && c.Id == contractId.Value && c.PartnerId == partnerId && c.IsActive);

        if (contract == null)
            return ApiResponse<PartnerContract?>.Error("Partner contract not found or inactive");

        if (contract.BranchId.HasValue && contract.BranchId.Value != branchId)
            return ApiResponse<PartnerContract?>.Error("Partner contract branch does not match visit branch");

        if (contract.EffectiveTo.HasValue && contract.EffectiveTo.Value.Date < DateTime.UtcNow.Date)
            return ApiResponse<PartnerContract?>.Error("Partner contract is expired");

        return ApiResponse<PartnerContract?>.Ok(contract);
    }

    private async Task<PartnerOrder?> GetOrderWithIncludesAsync(Guid tenantId, Guid orderId)
    {
        return await _context.PartnerOrders
            .Include(o => o.Partner)
            .Include(o => o.StatusHistory.Where(h => !h.IsDeleted))
            .Include(o => o.Visit)
            .FirstOrDefaultAsync(o => o.TenantId == tenantId && !o.IsDeleted && o.Id == orderId);
    }

    private async Task<ApiResponse> EnsureCanReadOrderAsync(Guid tenantId, Guid callerUserId, PartnerOrder order)
    {
        var branchAccess = await _branchAccessService.EnsureCanAccessBranchAsync(tenantId, callerUserId, order.BranchId);
        if (!branchAccess.Success)
            return branchAccess;

        var callerDoctorId = await ResolveCallerDoctorIdAsync(tenantId, callerUserId);
        if (callerDoctorId.HasValue && order.Visit.DoctorId != callerDoctorId.Value)
            return ApiResponse.Error("Doctors can only access partner orders linked to their own visits");

        return ApiResponse.Ok();
    }

    private async Task<Guid?> ResolveCallerDoctorIdAsync(Guid tenantId, Guid callerUserId)
    {
        return await _context.Doctors
            .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.UserId == callerUserId)
            .Select(d => (Guid?)d.Id)
            .FirstOrDefaultAsync();
    }

    private async Task<string?> EnsureDoctorVisitOwnershipAsync(Guid tenantId, Guid callerUserId, Guid visitDoctorId)
    {
        var callerDoctorId = await ResolveCallerDoctorIdAsync(tenantId, callerUserId);
        if (callerDoctorId.HasValue && callerDoctorId.Value != visitDoctorId)
            return "Doctors can only manage partner orders for their own visits";

        return null;
    }

    private async Task AddInAppNotificationsForOrderChangeAsync(
        Guid tenantId,
        Guid patientId,
        Guid doctorId,
        Guid actorUserId,
        Guid orderId,
        PartnerOrderStatus status)
    {
        var patientUserId = await _context.Patients
            .Where(p => p.TenantId == tenantId && !p.IsDeleted && p.Id == patientId)
            .Select(p => (Guid?)p.UserId)
            .FirstOrDefaultAsync();

        var doctorUserId = await _context.Doctors
            .Where(d => d.TenantId == tenantId && !d.IsDeleted && d.Id == doctorId)
            .Select(d => (Guid?)d.UserId)
            .FirstOrDefaultAsync();

        var recipients = new HashSet<Guid>();
        if (patientUserId.HasValue)
            recipients.Add(patientUserId.Value);
        if (doctorUserId.HasValue)
            recipients.Add(doctorUserId.Value);
        recipients.Remove(actorUserId);

        foreach (var userId in recipients)
        {
            _context.InAppNotifications.Add(new InAppNotification
            {
                TenantId = tenantId,
                UserId = userId,
                Type = InAppNotificationType.PartnerOrderStatusChanged,
                Title = "Partner order updated",
                Body = $"Partner order status changed to {status}",
                EntityType = nameof(PartnerOrder),
                EntityId = orderId
            });
        }
    }

    private static bool IsValidTransition(PartnerOrderStatus current, PartnerOrderStatus next)
    {
        if (current == PartnerOrderStatus.Cancelled || current == PartnerOrderStatus.Completed)
            return false;

        return next switch
        {
            PartnerOrderStatus.Sent => current == PartnerOrderStatus.Draft,
            PartnerOrderStatus.Accepted => current == PartnerOrderStatus.Sent || current == PartnerOrderStatus.InProgress,
            PartnerOrderStatus.InProgress => current == PartnerOrderStatus.Sent || current == PartnerOrderStatus.Accepted,
            PartnerOrderStatus.Completed => current == PartnerOrderStatus.Accepted || current == PartnerOrderStatus.InProgress,
            PartnerOrderStatus.Cancelled => current == PartnerOrderStatus.Draft || current == PartnerOrderStatus.Sent || current == PartnerOrderStatus.Accepted || current == PartnerOrderStatus.InProgress,
            _ => false
        };
    }

    private static PartnerDto MapPartner(Partner partner)
    {
        return new PartnerDto
        {
            Id = partner.Id,
            Name = partner.Name,
            Type = partner.Type,
            ContactName = partner.ContactName,
            ContactPhone = partner.ContactPhone,
            ContactEmail = partner.ContactEmail,
            Address = partner.Address,
            Notes = partner.Notes,
            IsActive = partner.IsActive,
            CreatedAt = partner.CreatedAt
        };
    }

    private static PartnerContractDto MapContract(PartnerContract contract)
    {
        return new PartnerContractDto
        {
            Id = contract.Id,
            PartnerId = contract.PartnerId,
            PartnerName = contract.Partner?.Name ?? string.Empty,
            PartnerType = contract.Partner?.Type ?? PartnerType.Laboratory,
            BranchId = contract.BranchId,
            ServiceScope = contract.ServiceScope,
            CommissionPercentage = contract.CommissionPercentage,
            FlatFee = contract.FlatFee,
            EffectiveFrom = contract.EffectiveFrom,
            EffectiveTo = contract.EffectiveTo,
            IsActive = contract.IsActive,
            Notes = contract.Notes,
            CreatedAt = contract.CreatedAt
        };
    }

    private static PartnerOrderDto MapOrder(PartnerOrder order)
    {
        return new PartnerOrderDto
        {
            Id = order.Id,
            PartnerId = order.PartnerId,
            PartnerName = order.Partner?.Name ?? string.Empty,
            PartnerType = order.PartnerType,
            PartnerContractId = order.PartnerContractId,
            BranchId = order.BranchId,
            VisitId = order.VisitId,
            LabRequestId = order.LabRequestId,
            PrescriptionId = order.PrescriptionId,
            Status = order.Status,
            OrderedByUserId = order.OrderedByUserId,
            OrderedAt = order.OrderedAt,
            SentAt = order.SentAt,
            AcceptedAt = order.AcceptedAt,
            CompletedAt = order.CompletedAt,
            CancelledAt = order.CancelledAt,
            EstimatedCost = order.EstimatedCost,
            FinalCost = order.FinalCost,
            ExternalReference = order.ExternalReference,
            Notes = order.Notes,
            StatusHistory = order.StatusHistory
                .Where(h => !h.IsDeleted)
                .OrderByDescending(h => h.ChangedAt)
                .Select(h => new PartnerOrderStatusHistoryDto
                {
                    Id = h.Id,
                    OldStatus = h.OldStatus,
                    NewStatus = h.NewStatus,
                    ChangedByUserId = h.ChangedByUserId,
                    ChangedAt = h.ChangedAt,
                    Notes = h.Notes
                })
                .ToList(),
            CreatedAt = order.CreatedAt
        };
    }
}
