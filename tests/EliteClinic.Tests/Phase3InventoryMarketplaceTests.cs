using EliteClinic.Api.Controllers;
using EliteClinic.Application.Features.Clinic.DTOs;
using EliteClinic.Application.Features.Clinic.Services;
using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.Reflection;
using Xunit;

namespace EliteClinic.Tests;

public class Phase3InventoryMarketplaceTests
{
    [Fact]
    public async Task Inventory_CreateListUpdate_ShouldWork()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);

        var inventoryService = BuildInventoryService(ctx);

        var created = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Amoxicillin",
            Description = "Antibiotic",
            SkuCode = "MED-001",
            ItemType = InventoryItemType.Medicine,
            Unit = "box",
            SalePrice = 200m,
            CostPrice = 120m,
            QuantityOnHand = 50m,
            LowStockThreshold = 10m,
            UsableInVisit = true,
            SellablePublicly = true,
            InternalOnly = false,
            BillableInVisit = true,
            BranchId = seed.BranchId,
            ShowInLanding = true,
            Images = new List<string> { "https://cdn/items/med-001.png" }
        });

        Assert.True(created.Success);
        Assert.Equal("Amoxicillin", created.Data!.Name);

        var list = await inventoryService.ListItemsAsync(tenantId, new InventoryItemsQuery { BranchId = seed.BranchId });
        Assert.True(list.Success);
        Assert.Contains(list.Data!.Items, i => i.Id == created.Data.Id);

        var updated = await inventoryService.UpdateItemAsync(tenantId, created.Data.Id, new UpdateInventoryItemRequest
        {
            Name = "Amoxicillin 500mg",
            Description = "Updated",
            SkuCode = "MED-001",
            ItemType = InventoryItemType.Medicine,
            Unit = "box",
            SalePrice = 240m,
            CostPrice = 130m,
            QuantityOnHand = 60m,
            LowStockThreshold = 12m,
            UsableInVisit = true,
            SellablePublicly = true,
            InternalOnly = false,
            BillableInVisit = true,
            Active = true,
            BranchId = seed.BranchId,
            ShowInLanding = true,
            Images = new List<string> { "https://cdn/items/med-001-v2.png" }
        });

        Assert.True(updated.Success);
        Assert.Equal("Amoxicillin 500mg", updated.Data!.Name);
        Assert.Equal(240m, updated.Data.SalePrice);
        Assert.Single(updated.Data.Images);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task InternalOnlyItem_ShouldNotAppearInPublicMarketplace()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);

        var inventoryService = BuildInventoryService(ctx);
        var marketplaceService = new MarketplaceService(ctx);
        var slug = await GetTenantSlugAsync(ctx, tenantId);

        var created = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Internal Syringe",
            SkuCode = "INT-001",
            ItemType = InventoryItemType.Consumable,
            Unit = "piece",
            SalePrice = 15m,
            CostPrice = 8m,
            QuantityOnHand = 100m,
            LowStockThreshold = 20m,
            UsableInVisit = true,
            SellablePublicly = true,
            InternalOnly = true,
            BillableInVisit = true,
            BranchId = seed.BranchId,
            ShowInLanding = true
        });

        Assert.True(created.Success);
        Assert.True(created.Data!.InternalOnly);
        Assert.False(created.Data.SellablePublicly);
        Assert.False(created.Data.BillableInVisit);

        var publicList = await marketplaceService.GetPublicItemsAsync(slug, new PublicMarketplaceItemsQuery());
        Assert.True(publicList.Success);
        Assert.DoesNotContain(publicList.Data!.Items, i => i.Id == created.Data.Id);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task SellablePubliclyItem_ShouldAppearInPublicMarketplace()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);

        var inventoryService = BuildInventoryService(ctx);
        var marketplaceService = new MarketplaceService(ctx);
        var slug = await GetTenantSlugAsync(ctx, tenantId);

        var created = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Mouthwash",
            SkuCode = "PUB-001",
            ItemType = InventoryItemType.Consumable,
            Unit = "bottle",
            SalePrice = 80m,
            CostPrice = 40m,
            QuantityOnHand = 20m,
            LowStockThreshold = 5m,
            UsableInVisit = false,
            SellablePublicly = true,
            InternalOnly = false,
            BillableInVisit = false,
            BranchId = seed.BranchId,
            ShowInLanding = true
        });

        Assert.True(created.Success);

        var publicList = await marketplaceService.GetPublicItemsAsync(slug, new PublicMarketplaceItemsQuery());
        Assert.True(publicList.Success);
        Assert.Contains(publicList.Data!.Items, i => i.Id == created.Data!.Id);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task DoctorCanUseInventory_InOwnVisit_ShouldDecreaseStock()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);
        var inventoryService = BuildInventoryService(ctx);

        var item = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Visit Gel",
            SkuCode = "VIS-001",
            ItemType = InventoryItemType.Consumable,
            Unit = "tube",
            SalePrice = 90m,
            CostPrice = 50m,
            QuantityOnHand = 10m,
            LowStockThreshold = 2m,
            UsableInVisit = true,
            SellablePublicly = false,
            InternalOnly = false,
            BillableInVisit = false,
            BranchId = seed.BranchId,
            ShowInLanding = false
        });

        Assert.True(item.Success);

        var usage = await inventoryService.RecordVisitUsageAsync(
            tenantId,
            seed.VisitDoctor1Id,
            seed.Doctor1UserId,
            new RecordVisitInventoryUsageRequest
            {
                InventoryItemId = item.Data!.Id,
                Quantity = 2m,
                Notes = "Applied in visit"
            });

        Assert.True(usage.Success);
        Assert.Equal(0m, usage.Data!.BilledAmount);

        var saved = await ctx.InventoryItems.FirstAsync(i => i.Id == item.Data!.Id);
        Assert.Equal(8m, saved.QuantityOnHand);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task DoctorCannotUseInventory_InAnotherDoctorVisit()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);
        var inventoryService = BuildInventoryService(ctx);

        var item = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Disposable Tip",
            SkuCode = "VIS-002",
            ItemType = InventoryItemType.Consumable,
            Unit = "piece",
            SalePrice = 10m,
            CostPrice = 2m,
            QuantityOnHand = 100m,
            LowStockThreshold = 10m,
            UsableInVisit = true,
            SellablePublicly = false,
            InternalOnly = false,
            BillableInVisit = false,
            BranchId = seed.BranchId,
            ShowInLanding = false
        });

        Assert.True(item.Success);

        var denied = await inventoryService.RecordVisitUsageAsync(
            tenantId,
            seed.VisitDoctor2Id,
            seed.Doctor1UserId,
            new RecordVisitInventoryUsageRequest
            {
                InventoryItemId = item.Data!.Id,
                Quantity = 1m
            });

        Assert.False(denied.Success);
        Assert.Contains("own visits", denied.Message, StringComparison.OrdinalIgnoreCase);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task BillableInVisit_True_ShouldIncreaseMedicalInvoice()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);
        var inventoryService = BuildInventoryService(ctx);

        var item = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Whitening Kit",
            SkuCode = "BIL-001",
            ItemType = InventoryItemType.Medicine,
            Unit = "kit",
            SalePrice = 300m,
            CostPrice = 180m,
            QuantityOnHand = 10m,
            LowStockThreshold = 2m,
            UsableInVisit = true,
            SellablePublicly = false,
            InternalOnly = false,
            BillableInVisit = true,
            BranchId = seed.BranchId,
            ShowInLanding = false
        });

        Assert.True(item.Success);

        var usage = await inventoryService.RecordVisitUsageAsync(
            tenantId,
            seed.VisitDoctor1Id,
            seed.Doctor1UserId,
            new RecordVisitInventoryUsageRequest
            {
                InventoryItemId = item.Data!.Id,
                Quantity = 2m
            });

        Assert.True(usage.Success);
        Assert.Equal(600m, usage.Data!.BilledAmount);
        Assert.True(usage.Data.BilledToInvoice);

        var invoice = await ctx.Invoices.FirstAsync(i => i.VisitId == seed.VisitDoctor1Id);
        Assert.Equal(600m, invoice.Amount);
        Assert.Equal(600m, invoice.RemainingAmount);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task BillableInVisit_False_ShouldNotCreateOrIncreaseMedicalInvoice()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);
        var inventoryService = BuildInventoryService(ctx);

        var item = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Non Billable Cotton",
            SkuCode = "BIL-002",
            ItemType = InventoryItemType.Consumable,
            Unit = "pack",
            SalePrice = 50m,
            CostPrice = 20m,
            QuantityOnHand = 30m,
            LowStockThreshold = 5m,
            UsableInVisit = true,
            SellablePublicly = false,
            InternalOnly = false,
            BillableInVisit = false,
            BranchId = seed.BranchId,
            ShowInLanding = false
        });

        Assert.True(item.Success);

        var usage = await inventoryService.RecordVisitUsageAsync(
            tenantId,
            seed.VisitDoctor1Id,
            seed.Doctor1UserId,
            new RecordVisitInventoryUsageRequest
            {
                InventoryItemId = item.Data!.Id,
                Quantity = 3m
            });

        Assert.True(usage.Success);
        Assert.Equal(0m, usage.Data!.BilledAmount);
        Assert.False(usage.Data.BilledToInvoice);
        Assert.Equal(0, await ctx.Invoices.CountAsync());

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task PublicOrder_ShouldPersistWithWhatsAppRedirect_AndNoMedicalInvoice()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);
        var slug = await GetTenantSlugAsync(ctx, tenantId);
        var inventoryService = BuildInventoryService(ctx);
        var marketplaceService = new MarketplaceService(ctx);

        var item = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Marketplace Toothbrush",
            SkuCode = "MK-001",
            ItemType = InventoryItemType.Tool,
            Unit = "piece",
            SalePrice = 60m,
            CostPrice = 25m,
            QuantityOnHand = 100m,
            LowStockThreshold = 10m,
            UsableInVisit = false,
            SellablePublicly = true,
            InternalOnly = false,
            BillableInVisit = false,
            BranchId = seed.BranchId,
            ShowInLanding = true
        });

        Assert.True(item.Success);

        var order = await marketplaceService.CreatePublicOrderAsync(slug, new CreatePublicMarketplaceOrderRequest
        {
            CustomerName = "Public Buyer",
            Phone = "0109998887",
            BranchId = seed.BranchId,
            Notes = "Please contact on WhatsApp",
            Items = new List<CreatePublicMarketplaceOrderItemRequest>
            {
                new() { InventoryItemId = item.Data!.Id, Quantity = 2m }
            }
        });

        Assert.True(order.Success);
        Assert.Equal(MarketplaceOrderStatus.WhatsAppRedirected, order.Data!.Status);
        Assert.NotNull(order.Data.WhatsAppRedirectedAt);
        Assert.Null(order.Data.SalesInvoiceId);
        Assert.Equal(0, await ctx.Invoices.CountAsync());

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task ConfirmedMarketplaceOrder_ShouldCreateSeparateSalesInvoice()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);
        var slug = await GetTenantSlugAsync(ctx, tenantId);

        var inventoryService = BuildInventoryService(ctx);
        var marketplaceService = new MarketplaceService(ctx);

        var billableVisitItem = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Visit Composite",
            SkuCode = "SEP-001",
            ItemType = InventoryItemType.Consumable,
            Unit = "unit",
            SalePrice = 200m,
            CostPrice = 120m,
            QuantityOnHand = 50m,
            LowStockThreshold = 5m,
            UsableInVisit = true,
            SellablePublicly = false,
            InternalOnly = false,
            BillableInVisit = true,
            BranchId = seed.BranchId,
            ShowInLanding = false
        });

        Assert.True(billableVisitItem.Success);

        var usage = await inventoryService.RecordVisitUsageAsync(
            tenantId,
            seed.VisitDoctor1Id,
            seed.Doctor1UserId,
            new RecordVisitInventoryUsageRequest
            {
                InventoryItemId = billableVisitItem.Data!.Id,
                Quantity = 1m
            });

        Assert.True(usage.Success);
        var medicalInvoice = await ctx.Invoices.FirstAsync(i => i.VisitId == seed.VisitDoctor1Id);

        var publicItem = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Marketplace Paste",
            SkuCode = "SEP-002",
            ItemType = InventoryItemType.Consumable,
            Unit = "piece",
            SalePrice = 70m,
            CostPrice = 30m,
            QuantityOnHand = 100m,
            LowStockThreshold = 10m,
            UsableInVisit = false,
            SellablePublicly = true,
            InternalOnly = false,
            BillableInVisit = false,
            BranchId = seed.BranchId,
            ShowInLanding = true
        });

        Assert.True(publicItem.Success);

        var order = await marketplaceService.CreatePublicOrderAsync(slug, new CreatePublicMarketplaceOrderRequest
        {
            CustomerName = "Retail Buyer",
            Phone = "0101112233",
            BranchId = seed.BranchId,
            Items = new List<CreatePublicMarketplaceOrderItemRequest>
            {
                new() { InventoryItemId = publicItem.Data!.Id, Quantity = 3m }
            }
        });

        Assert.True(order.Success);

        var confirmed = await marketplaceService.UpdateOrderStatusAsync(
            tenantId,
            order.Data!.Id,
            seed.OwnerUserId,
            new UpdateMarketplaceOrderStatusRequest { Status = MarketplaceOrderStatus.Confirmed });

        Assert.True(confirmed.Success);
        Assert.Equal(MarketplaceOrderStatus.Confirmed, confirmed.Data!.Status);
        Assert.NotNull(confirmed.Data.SalesInvoiceId);

        var salesInvoice = await ctx.SalesInvoices.FirstAsync(si => si.Id == confirmed.Data.SalesInvoiceId!.Value);
        Assert.Equal(seed.BranchId, salesInvoice.BranchId);
        Assert.NotEqual(medicalInvoice.Id, salesInvoice.Id);

        Assert.Single(await ctx.Invoices.Where(i => !i.IsDeleted).ToListAsync());
        Assert.Single(await ctx.SalesInvoices.Where(i => !i.IsDeleted).ToListAsync());

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public async Task BranchId_ShouldPersistAcrossInventoryOrderAndSalesInvoice()
    {
        var tenantId = Guid.NewGuid();
        var (ctx, conn) = DbContextFactory.Create(tenantId);
        var seed = await SeedAsync(ctx, tenantId);
        var slug = await GetTenantSlugAsync(ctx, tenantId);

        var inventoryService = BuildInventoryService(ctx);
        var marketplaceService = new MarketplaceService(ctx);

        var item = await inventoryService.CreateItemAsync(tenantId, new CreateInventoryItemRequest
        {
            Name = "Branch Product",
            SkuCode = "BR-001",
            ItemType = InventoryItemType.Equipment,
            Unit = "piece",
            SalePrice = 150m,
            CostPrice = 90m,
            QuantityOnHand = 10m,
            LowStockThreshold = 2m,
            UsableInVisit = false,
            SellablePublicly = true,
            InternalOnly = false,
            BillableInVisit = false,
            BranchId = seed.BranchId,
            ShowInLanding = true
        });

        Assert.True(item.Success);
        Assert.Equal(seed.BranchId, item.Data!.BranchId);

        var order = await marketplaceService.CreatePublicOrderAsync(slug, new CreatePublicMarketplaceOrderRequest
        {
            CustomerName = "Branch Buyer",
            Phone = "0104445566",
            BranchId = seed.BranchId,
            Items = new List<CreatePublicMarketplaceOrderItemRequest>
            {
                new() { InventoryItemId = item.Data!.Id, Quantity = 1m }
            }
        });

        Assert.True(order.Success);
        Assert.Equal(seed.BranchId, order.Data!.BranchId);

        var confirmed = await marketplaceService.UpdateOrderStatusAsync(
            tenantId,
            order.Data.Id,
            seed.OwnerUserId,
            new UpdateMarketplaceOrderStatusRequest { Status = MarketplaceOrderStatus.Confirmed });

        Assert.True(confirmed.Success);
        var salesInvoice = await ctx.SalesInvoices.FirstAsync(si => si.Id == confirmed.Data!.SalesInvoiceId!.Value);
        Assert.Equal(seed.BranchId, salesInvoice.BranchId);

        await ctx.DisposeAsync();
        await conn.DisposeAsync();
    }

    [Fact]
    public void Phase3EndpointRoles_ShouldMatchOwnerManagerDoctorRules()
    {
        AssertMethodRoles(typeof(InventoryController), nameof(InventoryController.Create), "ClinicOwner", "ClinicManager");
        AssertMethodRoles(typeof(InventoryController), nameof(InventoryController.Update), "ClinicOwner", "ClinicManager");
        AssertMethodRoles(typeof(InventoryController), nameof(InventoryController.GetItems), "Doctor");
        AssertMethodRoles(typeof(VisitsController), nameof(VisitsController.RecordInventoryUsage), "Doctor", "ClinicOwner", "ClinicManager");
        AssertMethodRoles(typeof(MarketplaceOrdersController), nameof(MarketplaceOrdersController.GetOrders), "ClinicOwner", "ClinicManager", "Receptionist");
        AssertMethodRoles(typeof(MarketplaceOrdersController), nameof(MarketplaceOrdersController.UpdateStatus), "ClinicOwner", "ClinicManager", "Receptionist");
    }

    private static void AssertMethodRoles(Type controllerType, string methodName, params string[] requiredRoles)
    {
        var method = controllerType.GetMethod(methodName);
        Assert.NotNull(method);

        var authorize = method!.GetCustomAttribute<AuthorizeAttribute>();
        Assert.NotNull(authorize);
        Assert.False(string.IsNullOrWhiteSpace(authorize!.Roles));

        var roles = authorize.Roles!
            .Split(',', StringSplitOptions.TrimEntries | StringSplitOptions.RemoveEmptyEntries);

        foreach (var role in requiredRoles)
            Assert.Contains(role, roles, StringComparer.OrdinalIgnoreCase);
    }

    private static InventoryService BuildInventoryService(EliteClinicDbContext ctx)
    {
        var invoiceService = new InvoiceService(ctx, new SequentialInvoiceNumberService());
        return new InventoryService(ctx, invoiceService);
    }

    private static async Task<string> GetTenantSlugAsync(EliteClinicDbContext ctx, Guid tenantId)
    {
        return await ctx.Tenants
            .IgnoreQueryFilters()
            .Where(t => !t.IsDeleted && t.Id == tenantId)
            .Select(t => t.Slug)
            .FirstAsync();
    }

    private static async Task<SeedData> SeedAsync(EliteClinicDbContext ctx, Guid tenantId)
    {
        var patientUser = new ApplicationUser("phase3-patient", "Phase3 Patient") { TenantId = tenantId };
        var doctor1User = new ApplicationUser("phase3-doctor1", "Doctor One") { TenantId = tenantId };
        var doctor2User = new ApplicationUser("phase3-doctor2", "Doctor Two") { TenantId = tenantId };
        var ownerUser = new ApplicationUser("phase3-owner", "Owner") { TenantId = tenantId };

        var patient = new Patient
        {
            TenantId = tenantId,
            UserId = patientUser.Id,
            Name = "Patient Phase3",
            Phone = "0100001000",
            IsDefault = true
        };

        var doctor1 = new Doctor
        {
            TenantId = tenantId,
            UserId = doctor1User.Id,
            Name = "Doctor Phase3 One",
            IsEnabled = true
        };

        var doctor2 = new Doctor
        {
            TenantId = tenantId,
            UserId = doctor2User.Id,
            Name = "Doctor Phase3 Two",
            IsEnabled = true
        };

        var branch = new Branch
        {
            TenantId = tenantId,
            Name = "Main Branch",
            IsActive = true
        };

        ctx.Users.AddRange(patientUser, doctor1User, doctor2User, ownerUser);
        ctx.Patients.Add(patient);
        ctx.Doctors.AddRange(doctor1, doctor2);
        ctx.Branches.Add(branch);
        await ctx.SaveChangesAsync();

        var visit1 = new Visit
        {
            TenantId = tenantId,
            DoctorId = doctor1.Id,
            PatientId = patient.Id,
            BranchId = branch.Id,
            Status = VisitStatus.Open,
            Source = VisitSource.WalkInTicket,
            VisitType = VisitType.Exam,
            StartedAt = DateTime.UtcNow
        };

        var visit2 = new Visit
        {
            TenantId = tenantId,
            DoctorId = doctor2.Id,
            PatientId = patient.Id,
            BranchId = branch.Id,
            Status = VisitStatus.Open,
            Source = VisitSource.WalkInTicket,
            VisitType = VisitType.Exam,
            StartedAt = DateTime.UtcNow
        };

        ctx.Visits.AddRange(visit1, visit2);
        await ctx.SaveChangesAsync();

        return new SeedData(
            Doctor1UserId: doctor1User.Id,
            Doctor2UserId: doctor2User.Id,
            OwnerUserId: ownerUser.Id,
            VisitDoctor1Id: visit1.Id,
            VisitDoctor2Id: visit2.Id,
            BranchId: branch.Id);
    }

    private readonly record struct SeedData(
        Guid Doctor1UserId,
        Guid Doctor2UserId,
        Guid OwnerUserId,
        Guid VisitDoctor1Id,
        Guid VisitDoctor2Id,
        Guid BranchId);

    private sealed class SequentialInvoiceNumberService : IInvoiceNumberService
    {
        private int _counter;

        public Task<string> GenerateNextAsync(Guid tenantId, DateTime? issuedAtUtc = null, CancellationToken cancellationToken = default)
        {
            _ = tenantId;
            _ = issuedAtUtc;
            _ = cancellationToken;
            _counter++;
            return Task.FromResult($"INV-{DateTime.UtcNow:yyyy}-{_counter:000000}");
        }
    }
}
