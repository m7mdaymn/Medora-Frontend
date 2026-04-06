using EliteClinic.Domain.Entities;
using EliteClinic.Domain.Enums;
using EliteClinic.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace EliteClinic.Infrastructure.Data;

public class EliteClinicDbContext : IdentityDbContext<ApplicationUser, ApplicationRole, Guid>
{
    private readonly ITenantContext? _tenantContext;

    // Property for EF Core query filter parameterization (re-evaluated per query)
    private Guid CurrentTenantId => _tenantContext?.IsTenantResolved == true ? _tenantContext.TenantId : Guid.Empty;

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<AuditLog> AuditLogs { get; set; }
    public DbSet<Subscription> Subscriptions { get; set; }
    public DbSet<TenantFeatureFlag> TenantFeatureFlags { get; set; }
    public DbSet<ClinicSettings> ClinicSettings { get; set; }
    public DbSet<WorkingHour> WorkingHours { get; set; }
    public DbSet<Employee> Employees { get; set; }
    public DbSet<Doctor> Doctors { get; set; }
    public DbSet<DoctorService> DoctorServices { get; set; }
    public DbSet<DoctorVisitFieldConfig> DoctorVisitFieldConfigs { get; set; }
    public DbSet<Patient> Patients { get; set; }
    public DbSet<QueueSession> QueueSessions { get; set; }
    public DbSet<QueueTicket> QueueTickets { get; set; }
    public DbSet<Visit> Visits { get; set; }
    public DbSet<Prescription> Prescriptions { get; set; }
    public DbSet<PrescriptionRevision> PrescriptionRevisions { get; set; }
    public DbSet<LabRequest> LabRequests { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<InvoiceLineItem> InvoiceLineItems { get; set; }
    public DbSet<InvoiceNumberCounter> InvoiceNumberCounters { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<PatientMedicalDocument> PatientMedicalDocuments { get; set; }
    public DbSet<PatientMedicalDocumentThread> PatientMedicalDocumentThreads { get; set; }
    public DbSet<PatientMedicalDocumentThreadReply> PatientMedicalDocumentThreadReplies { get; set; }
    public DbSet<PatientChronicProfile> PatientChronicProfiles { get; set; }
    public DbSet<DoctorCompensationRule> DoctorCompensationRules { get; set; }
    public DbSet<DoctorCompensationHistory> DoctorCompensationHistories { get; set; }
    public DbSet<AttendanceRecord> AttendanceRecords { get; set; }
    public DbSet<AbsenceRecord> AbsenceRecords { get; set; }
    public DbSet<DailyClosingSnapshot> DailyClosingSnapshots { get; set; }
    public DbSet<ClinicPaymentMethod> ClinicPaymentMethods { get; set; }
    public DbSet<MediaFile> MediaFiles { get; set; }
    public DbSet<Branch> Branches { get; set; }
    public DbSet<DoctorBranchSchedule> DoctorBranchSchedules { get; set; }
    public DbSet<PatientSelfServiceRequest> PatientSelfServiceRequests { get; set; }
    public DbSet<PatientSelfServiceRequestDocument> PatientSelfServiceRequestDocuments { get; set; }
    public DbSet<InventoryItem> InventoryItems { get; set; }
    public DbSet<InventoryItemImage> InventoryItemImages { get; set; }
    public DbSet<VisitInventoryUsage> VisitInventoryUsages { get; set; }
    public DbSet<MarketplaceOrder> MarketplaceOrders { get; set; }
    public DbSet<MarketplaceOrderItem> MarketplaceOrderItems { get; set; }
    public DbSet<SalesInvoice> SalesInvoices { get; set; }
    public DbSet<SalesInvoiceLineItem> SalesInvoiceLineItems { get; set; }
    public DbSet<Partner> Partners { get; set; }
    public DbSet<PartnerContract> PartnerContracts { get; set; }
    public DbSet<PartnerServiceCatalogItem> PartnerServiceCatalogItems { get; set; }
    public DbSet<PartnerUser> PartnerUsers { get; set; }
    public DbSet<PartnerOrder> PartnerOrders { get; set; }
    public DbSet<PartnerOrderStatusHistory> PartnerOrderStatusHistories { get; set; }

    // Phase 5 entities
    public DbSet<ClinicService> ClinicServicesCatalog { get; set; }
    public DbSet<DoctorServiceLink> DoctorServiceLinks { get; set; }

    // Phase 4 entities
    public DbSet<MessageLog> MessageLogs { get; set; }
    public DbSet<MessageTemplate> MessageTemplates { get; set; }
    public DbSet<Booking> Bookings { get; set; }
    public DbSet<DoctorNote> DoctorNotes { get; set; }
    public DbSet<NotificationSubscription> NotificationSubscriptions { get; set; }
    public DbSet<InAppNotification> InAppNotifications { get; set; }

    public EliteClinicDbContext(DbContextOptions<EliteClinicDbContext> options, ITenantContext? tenantContext = null)
        : base(options)
    {
        _tenantContext = tenantContext;
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Tenant entity configuration
        builder.Entity<Tenant>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Slug)
                .IsRequired()
                .HasMaxLength(100);
            entity.HasIndex(e => e.Slug).IsUnique();
            entity.Property(e => e.Status).HasConversion<int>();
        });

        // AuditLog entity configuration
        builder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EntityType).IsRequired();
            entity.Property(e => e.EntityId).IsRequired();
            entity.Property(e => e.Action).IsRequired();
        });

        // Subscription entity configuration
        builder.Entity<Subscription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PlanName).IsRequired();
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.Currency).HasMaxLength(10);
            entity.Property(e => e.Status).HasConversion<int>();
            
            entity.HasOne(e => e.Tenant)
                .WithMany(t => t.Subscriptions)
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // TenantFeatureFlag entity configuration
        builder.Entity<TenantFeatureFlag>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId).IsUnique();
            
            entity.HasOne(e => e.Tenant)
                .WithOne(t => t.FeatureFlags)
                .HasForeignKey<TenantFeatureFlag>(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ApplicationUser → Tenant FK
        builder.Entity<ApplicationUser>(entity =>
        {
            entity.HasOne(e => e.Tenant)
                .WithMany()
                .HasForeignKey(e => e.TenantId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ClinicSettings entity configuration (1:1 with Tenant)
        builder.Entity<ClinicSettings>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.TenantId).IsUnique();
            entity.Property(e => e.ClinicName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.WhatsAppSenderNumber).HasMaxLength(20);
            entity.Property(e => e.SupportWhatsAppNumber).HasMaxLength(20);
            entity.Property(e => e.SupportPhoneNumber).HasMaxLength(20);
            entity.Property(e => e.City).HasMaxLength(100);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.SocialLinksJson).HasMaxLength(4000);
            entity.Property(e => e.SelfServicePaymentPolicy).HasConversion<int>();
            entity.Property(e => e.SelfServiceRequestExpiryHours).HasDefaultValue(24);

            entity.HasOne(e => e.Tenant)
                .WithOne()
                .HasForeignKey<ClinicSettings>(e => e.TenantId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.WorkingHours)
                .WithOne(w => w.ClinicSettings)
                .HasForeignKey(w => w.ClinicSettingsId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.PaymentMethods)
                .WithOne()
                .HasForeignKey(pm => pm.TenantId)
                .HasPrincipalKey(s => s.TenantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WorkingHour entity configuration
        builder.Entity<WorkingHour>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.DayOfWeek).HasConversion<int>();
        });

        // Employee entity configuration (1:1 with ApplicationUser)
        builder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Salary).HasPrecision(18, 2);
            entity.Property(e => e.WorkerMode).HasConversion<int>();

            entity.HasOne(e => e.User)
                .WithOne()
                .HasForeignKey<Employee>(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Doctor entity configuration (1:1 with ApplicationUser)
        builder.Entity<Doctor>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique();
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Specialty).HasMaxLength(100);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.Property(e => e.UrgentCaseMode).HasConversion<int>();
            entity.Property(e => e.UrgentEnabled).HasDefaultValue(true);
            entity.Property(e => e.UrgentInsertAfterCount).HasDefaultValue(0);
            entity.Property(e => e.CompensationMode).HasConversion<int>();
            entity.Property(e => e.CompensationValue).HasPrecision(18, 2);

            entity.HasOne(e => e.User)
                .WithOne()
                .HasForeignKey<Doctor>(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Services)
                .WithOne(s => s.Doctor)
                .HasForeignKey(s => s.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.VisitFieldConfig)
                .WithOne(v => v.Doctor)
                .HasForeignKey<DoctorVisitFieldConfig>(v => v.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.CompensationHistory)
                .WithOne(h => h.Doctor)
                .HasForeignKey(h => h.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.BranchSchedules)
                .WithOne(s => s.Doctor)
                .HasForeignKey(s => s.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // DoctorService entity configuration
        builder.Entity<DoctorService>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ServiceName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasPrecision(18, 2);
        });

        // DoctorVisitFieldConfig entity configuration
        builder.Entity<DoctorVisitFieldConfig>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.DoctorId).IsUnique();
        });

        // Patient entity configuration (many patients can share same ApplicationUser for sub-profiles)
        builder.Entity<Patient>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId); // Not unique: parent + sub-profiles share same user
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Phone).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Gender).HasConversion<int>();

            // Prevent duplicate patients within a tenant (same phone + name)
            entity.HasIndex(e => new { e.TenantId, e.Phone, e.Name }).IsUnique().HasFilter("[IsDeleted] = 0");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.ParentPatient)
                .WithMany(p => p.SubProfiles)
                .HasForeignKey(e => e.ParentPatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // QueueSession entity configuration
        builder.Entity<QueueSession>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Notes).HasMaxLength(500);

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Tickets)
                .WithOne(t => t.Session)
                .HasForeignKey(t => t.SessionId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // QueueTicket entity configuration
        builder.Entity<QueueTicket>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.Source).HasConversion<int>();
            entity.Property(e => e.Notes).HasMaxLength(500);

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.DoctorService)
                .WithMany()
                .HasForeignKey(e => e.DoctorServiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Visit entity configuration
        builder.Entity<Visit>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.VisitType).HasConversion<int>();
            entity.Property(e => e.Source).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.LifecycleState).HasConversion<int>();
            entity.Property(e => e.FinancialState).HasConversion<int>();
            entity.Property(e => e.Complaint).HasMaxLength(2000);
            entity.Property(e => e.Diagnosis).HasMaxLength(2000);
            entity.Property(e => e.Notes).HasMaxLength(4000);
            entity.Property(e => e.Temperature).HasPrecision(5, 2);
            entity.Property(e => e.Weight).HasPrecision(6, 2);
            entity.Property(e => e.Height).HasPrecision(5, 2);
            entity.Property(e => e.BMI).HasPrecision(5, 2);
            entity.Property(e => e.BloodSugar).HasPrecision(6, 2);
            entity.Property(e => e.OxygenSaturation).HasPrecision(5, 2);

            entity.HasIndex(e => e.QueueTicketId).IsUnique().HasFilter("[QueueTicketId] IS NOT NULL");

            entity.HasOne(e => e.QueueTicket)
                .WithOne()
                .HasForeignKey<Visit>(e => e.QueueTicketId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Prescriptions)
                .WithOne(p => p.Visit)
                .HasForeignKey(p => p.VisitId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.LabRequests)
                .WithOne(l => l.Visit)
                .HasForeignKey(l => l.VisitId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Invoice)
                .WithOne(i => i.Visit)
                .HasForeignKey<Invoice>(i => i.VisitId)
                .OnDelete(DeleteBehavior.Cascade);
        });

            builder.Entity<InvoiceNumberCounter>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => new { e.TenantId, e.Year }).IsUnique().HasFilter("[IsDeleted] = 0");
                entity.Property(e => e.NextNumber).IsRequired();
                entity.Property(e => e.RowVersion).IsRowVersion();
            });

        // Prescription entity configuration
        builder.Entity<Prescription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MedicationName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Dosage).HasMaxLength(100);
            entity.Property(e => e.Frequency).HasMaxLength(100);
            entity.Property(e => e.Duration).HasMaxLength(100);
            entity.Property(e => e.Instructions).HasMaxLength(500);
            entity.HasIndex(e => new { e.TenantId, e.VisitId, e.PartnerOrderId });

            entity.HasMany(e => e.Revisions)
                .WithOne()
                .HasForeignKey(r => r.PrescriptionId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PrescriptionRevision>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Action).IsRequired().HasMaxLength(30);
            entity.Property(e => e.MedicationName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Dosage).HasMaxLength(100);
            entity.Property(e => e.Frequency).HasMaxLength(100);
            entity.Property(e => e.Duration).HasMaxLength(100);
            entity.Property(e => e.Instructions).HasMaxLength(500);
            entity.Property(e => e.Reason).HasMaxLength(500);
            entity.HasIndex(e => new { e.TenantId, e.PrescriptionId, e.RevisionNumber }).IsUnique().HasFilter("[IsDeleted] = 0");

            entity.HasOne(e => e.Visit)
                .WithMany()
                .HasForeignKey(e => e.VisitId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // LabRequest entity configuration
        builder.Entity<LabRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TestName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Type).HasConversion<int>();
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.ResultText).HasMaxLength(4000);
            entity.HasIndex(e => new { e.TenantId, e.VisitId, e.PartnerOrderId });
        });

        // Invoice entity configuration (1:1 with Visit)
        builder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.VisitId).IsUnique();
            entity.HasIndex(e => new { e.TenantId, e.InvoiceNumber }).IsUnique().HasFilter("[IsDeleted] = 0 AND [InvoiceNumber] <> ''");
            entity.Property(e => e.InvoiceNumber).IsRequired().HasMaxLength(30);
            entity.Property(e => e.PatientNameSnapshot).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PatientPhoneSnapshot).HasMaxLength(20);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.PaidAmount).HasPrecision(18, 2);
            entity.Property(e => e.RemainingAmount).HasPrecision(18, 2);
            entity.Property(e => e.PendingSettlementAmount).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.Notes).HasMaxLength(500);

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Payments)
                .WithOne(p => p.Invoice)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.LineItems)
                .WithOne(li => li.Invoice)
                .HasForeignKey(li => li.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<InvoiceLineItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ItemName).IsRequired().HasMaxLength(250);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.TotalPrice).HasPrecision(18, 2);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.HasIndex(e => new { e.TenantId, e.InvoiceId, e.CreatedAt });
        });

        // Payment entity configuration (many per Invoice)
        builder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.PaymentMethod).HasMaxLength(50);
            entity.Property(e => e.ReferenceNumber).HasMaxLength(100);
            entity.Property(e => e.Notes).HasMaxLength(500);
        });

        // Expense entity configuration
        builder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.Notes).HasMaxLength(1000);

            entity.HasOne(e => e.RecordedBy)
                .WithMany()
                .HasForeignKey(e => e.RecordedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<PatientMedicalDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Category).HasConversion<int>();
            entity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.StoredFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.RelativePath).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.PublicUrl).IsRequired().HasMaxLength(1200);
            entity.Property(e => e.ContentType).IsRequired().HasMaxLength(120);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.CreatedAt });

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Threads)
                .WithOne(t => t.Document)
                .HasForeignKey(t => t.DocumentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PatientMedicalDocumentThread>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Subject).IsRequired().HasMaxLength(300);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.DocumentId, e.Status, e.CreatedAt });

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Replies)
                .WithOne(r => r.Thread)
                .HasForeignKey(r => r.ThreadId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PatientMedicalDocumentThreadReply>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(4000);
            entity.HasIndex(e => new { e.TenantId, e.ThreadId, e.CreatedAt });
        });

        builder.Entity<PatientChronicProfile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OtherNotes).HasMaxLength(1000);
            entity.HasIndex(e => new { e.TenantId, e.PatientId }).IsUnique().HasFilter("[IsDeleted] = 0");

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<DoctorCompensationRule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Mode).HasConversion<int>();
            entity.Property(e => e.Value).HasPrecision(18, 2);
            entity.HasIndex(e => new { e.TenantId, e.DoctorId, e.EffectiveFrom });

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

            builder.Entity<DoctorCompensationHistory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Mode).HasConversion<int>();
                entity.Property(e => e.Value).HasPrecision(18, 2);
                entity.Property(e => e.Notes).HasMaxLength(1000);
                entity.HasIndex(e => new { e.TenantId, e.DoctorId, e.EffectiveFrom });

                entity.HasOne(e => e.Doctor)
                .WithMany(d => d.CompensationHistory)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);
            });

        builder.Entity<AttendanceRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.DoctorId, e.CheckInAt });
            entity.HasIndex(e => new { e.TenantId, e.EmployeeId, e.CheckInAt });

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Employee)
                .WithMany()
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<AbsenceRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Reason).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.HasIndex(e => new { e.TenantId, e.DoctorId, e.FromDate, e.ToDate });
            entity.HasIndex(e => new { e.TenantId, e.EmployeeId, e.FromDate, e.ToDate });

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Employee)
                .WithMany()
                .HasForeignKey(e => e.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<Branch>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Code).HasMaxLength(50);
            entity.Property(e => e.Address).HasMaxLength(1000);
            entity.Property(e => e.Phone).HasMaxLength(20);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique().HasFilter("[IsDeleted] = 0");
        });

        builder.Entity<DoctorBranchSchedule>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.DoctorId, e.BranchId, e.DayOfWeek, e.StartTime, e.EndTime })
                .IsUnique()
                .HasFilter("[IsDeleted] = 0");

            entity.HasOne(e => e.Doctor)
                .WithMany(d => d.BranchSchedules)
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Branch)
                .WithMany(b => b.DoctorSchedules)
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PatientSelfServiceRequest>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.RequestType).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.VisitType).HasConversion<int>();
            entity.Property(e => e.Source).HasConversion<int>();
            entity.Property(e => e.ServiceNameSnapshot).IsRequired().HasMaxLength(200);
            entity.Property(e => e.ServicePriceSnapshot).HasPrecision(18, 2);
            entity.Property(e => e.Complaint).HasMaxLength(2000);
            entity.Property(e => e.Symptoms).HasMaxLength(2000);
            entity.Property(e => e.DurationNotes).HasMaxLength(1000);
            entity.Property(e => e.ChronicConditionsDetails).HasMaxLength(2000);
            entity.Property(e => e.CurrentMedications).HasMaxLength(2000);
            entity.Property(e => e.KnownAllergies).HasMaxLength(2000);
            entity.Property(e => e.EmergencyContactName).HasMaxLength(200);
            entity.Property(e => e.EmergencyContactPhone).HasMaxLength(50);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.Property(e => e.DeclaredPaidAmount).HasPrecision(18, 2);
            entity.Property(e => e.AdjustedPaidAmount).HasPrecision(18, 2);
            entity.Property(e => e.PaymentMethod).HasMaxLength(100);
            entity.Property(e => e.TransferReference).HasMaxLength(120);
            entity.Property(e => e.TransferSenderName).HasMaxLength(200);
            entity.Property(e => e.PaymentProofOriginalFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PaymentProofStoredFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.PaymentProofRelativePath).IsRequired().HasMaxLength(1200);
            entity.Property(e => e.PaymentProofPublicUrl).IsRequired().HasMaxLength(1200);
            entity.Property(e => e.PaymentProofContentType).IsRequired().HasMaxLength(120);
            entity.Property(e => e.AvailabilityCheckNotes).HasMaxLength(2000);
            entity.Property(e => e.ReuploadReason).HasMaxLength(1000);
            entity.Property(e => e.RejectionReason).HasMaxLength(1000);
            entity.Property(e => e.ApprovalNotes).HasMaxLength(1000);
            entity.HasIndex(e => new { e.TenantId, e.Status, e.CreatedAt });
            entity.HasIndex(e => new { e.TenantId, e.PatientId, e.CreatedAt });

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne<QueueTicket>()
                .WithMany()
                .HasForeignKey(e => e.ConvertedQueueTicketId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne<Booking>()
                .WithMany()
                .HasForeignKey(e => e.ConvertedBookingId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Documents)
                .WithOne(d => d.Request)
                .HasForeignKey(d => d.RequestId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PatientSelfServiceRequestDocument>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.StoredFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.RelativePath).IsRequired().HasMaxLength(1200);
            entity.Property(e => e.PublicUrl).IsRequired().HasMaxLength(1200);
            entity.Property(e => e.ContentType).IsRequired().HasMaxLength(120);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.HasIndex(e => new { e.TenantId, e.RequestId, e.CreatedAt });
        });

        builder.Entity<InventoryItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(2000);
            entity.Property(e => e.SkuCode).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ItemType).HasConversion<int>();
            entity.Property(e => e.Unit).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SalePrice).HasPrecision(18, 2);
            entity.Property(e => e.CostPrice).HasPrecision(18, 2);
            entity.Property(e => e.QuantityOnHand).HasPrecision(18, 4);
            entity.Property(e => e.LowStockThreshold).HasPrecision(18, 4);
            entity.HasIndex(e => new { e.TenantId, e.BranchId, e.SkuCode }).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.HasIndex(e => new { e.TenantId, e.BranchId, e.Active, e.SellablePublicly, e.InternalOnly });

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.Images)
                .WithOne(i => i.InventoryItem)
                .HasForeignKey(i => i.InventoryItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.VisitUsages)
                .WithOne(v => v.InventoryItem)
                .HasForeignKey(v => v.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<InventoryItemImage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(1200);
            entity.HasIndex(e => new { e.TenantId, e.InventoryItemId, e.DisplayOrder });
        });

        builder.Entity<VisitInventoryUsage>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.BilledAmount).HasPrecision(18, 2);
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.HasIndex(e => new { e.TenantId, e.VisitId, e.UsedAt });
            entity.HasIndex(e => new { e.TenantId, e.InventoryItemId, e.UsedAt });

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Visit)
                .WithMany()
                .HasForeignKey(e => e.VisitId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Invoice)
                .WithMany()
                .HasForeignKey(e => e.InvoiceId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<MarketplaceOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Phone).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.SubtotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.HasIndex(e => new { e.TenantId, e.BranchId, e.Status, e.CreatedAt });

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.SalesInvoice)
                .WithMany()
                .HasForeignKey(e => e.SalesInvoiceId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasMany(e => e.Items)
                .WithOne(i => i.MarketplaceOrder)
                .HasForeignKey(i => i.MarketplaceOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<MarketplaceOrderItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ItemNameSnapshot).IsRequired().HasMaxLength(250);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.LineTotal).HasPrecision(18, 2);
            entity.HasIndex(e => new { e.TenantId, e.MarketplaceOrderId, e.InventoryItemId });

            entity.HasOne(e => e.InventoryItem)
                .WithMany()
                .HasForeignKey(e => e.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<SalesInvoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.InvoiceNumber).IsRequired().HasMaxLength(40);
            entity.Property(e => e.CustomerNameSnapshot).IsRequired().HasMaxLength(200);
            entity.Property(e => e.PhoneSnapshot).IsRequired().HasMaxLength(50);
            entity.Property(e => e.SubtotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.HasIndex(e => new { e.TenantId, e.InvoiceNumber }).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.HasIndex(e => new { e.TenantId, e.MarketplaceOrderId }).IsUnique().HasFilter("[IsDeleted] = 0");

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasMany(e => e.LineItems)
                .WithOne(i => i.SalesInvoice)
                .HasForeignKey(i => i.SalesInvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<SalesInvoiceLineItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ItemNameSnapshot).IsRequired().HasMaxLength(250);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.Quantity).HasPrecision(18, 4);
            entity.Property(e => e.LineTotal).HasPrecision(18, 2);
            entity.HasIndex(e => new { e.TenantId, e.SalesInvoiceId, e.InventoryItemId });

            entity.HasOne(e => e.InventoryItem)
                .WithMany()
                .HasForeignKey(e => e.InventoryItemId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<Partner>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Type).HasConversion<int>();
            entity.Property(e => e.ContactName).HasMaxLength(200);
            entity.Property(e => e.ContactPhone).HasMaxLength(50);
            entity.Property(e => e.ContactEmail).HasMaxLength(120);
            entity.Property(e => e.Address).HasMaxLength(1000);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.HasIndex(e => new { e.TenantId, e.Type, e.Name }).IsUnique().HasFilter("[IsDeleted] = 0");
        });

        builder.Entity<PartnerContract>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ServiceScope).HasMaxLength(200);
            entity.Property(e => e.CommissionPercentage).HasPrecision(18, 4);
            entity.Property(e => e.SettlementTarget).HasConversion<int>();
            entity.Property(e => e.ClinicDoctorSharePercentage).HasPrecision(18, 4);
            entity.Property(e => e.FlatFee).HasPrecision(18, 2);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.HasIndex(e => new { e.TenantId, e.PartnerId, e.BranchId, e.EffectiveFrom });

            entity.HasOne(e => e.Partner)
                .WithMany(p => p.Contracts)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<PartnerServiceCatalogItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ServiceName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Price).HasPrecision(18, 2);
            entity.Property(e => e.SettlementTarget).HasConversion<int>();
            entity.Property(e => e.SettlementPercentage).HasPrecision(18, 4);
            entity.Property(e => e.ClinicDoctorSharePercentage).HasPrecision(18, 4);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.HasIndex(e => new { e.TenantId, e.PartnerId, e.BranchId, e.ServiceName }).HasFilter("[IsDeleted] = 0");

            entity.HasOne(e => e.Partner)
                .WithMany(p => p.ServiceCatalogItems)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        builder.Entity<PartnerUser>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.TenantId, e.PartnerId, e.UserId }).IsUnique().HasFilter("[IsDeleted] = 0");
            entity.HasIndex(e => new { e.TenantId, e.UserId, e.IsActive });

            entity.HasOne(e => e.Partner)
                .WithMany(p => p.PartnerUsers)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PartnerOrder>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.PartnerType).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.ServiceNameSnapshot).HasMaxLength(200);
            entity.Property(e => e.ServicePrice).HasPrecision(18, 2);
            entity.Property(e => e.SettlementTarget).HasConversion<int>();
            entity.Property(e => e.SettlementPercentage).HasPrecision(18, 4);
            entity.Property(e => e.ClinicDoctorSharePercentage).HasPrecision(18, 4);
            entity.Property(e => e.DoctorPayoutAmount).HasPrecision(18, 2);
            entity.Property(e => e.ClinicRevenueAmount).HasPrecision(18, 2);
            entity.Property(e => e.ResultSummary).HasMaxLength(4000);
            entity.Property(e => e.EstimatedCost).HasPrecision(18, 2);
            entity.Property(e => e.FinalCost).HasPrecision(18, 2);
            entity.Property(e => e.ExternalReference).HasMaxLength(120);
            entity.Property(e => e.Notes).HasMaxLength(2000);
            entity.HasIndex(e => new { e.TenantId, e.BranchId, e.Status, e.CreatedAt });
            entity.HasIndex(e => new { e.TenantId, e.LabRequestId }).IsUnique().HasFilter("[IsDeleted] = 0 AND [LabRequestId] IS NOT NULL");
            entity.HasIndex(e => new { e.TenantId, e.PrescriptionId }).IsUnique().HasFilter("[IsDeleted] = 0 AND [PrescriptionId] IS NOT NULL");

            entity.HasOne(e => e.Partner)
                .WithMany(p => p.Orders)
                .HasForeignKey(e => e.PartnerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.PartnerContract)
                .WithMany(c => c.Orders)
                .HasForeignKey(e => e.PartnerContractId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.PartnerServiceCatalogItem)
                .WithMany()
                .HasForeignKey(e => e.PartnerServiceCatalogItemId)
                .OnDelete(DeleteBehavior.NoAction);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Visit)
                .WithMany()
                .HasForeignKey(e => e.VisitId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<PartnerOrderStatusHistory>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OldStatus).HasConversion<int>();
            entity.Property(e => e.NewStatus).HasConversion<int>();
            entity.Property(e => e.Notes).HasMaxLength(1000);
            entity.HasIndex(e => new { e.TenantId, e.PartnerOrderId, e.ChangedAt });

            entity.HasOne(e => e.PartnerOrder)
                .WithMany(o => o.StatusHistory)
                .HasForeignKey(e => e.PartnerOrderId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<DailyClosingSnapshot>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MetricsJson).IsRequired().HasMaxLength(4000);
            entity.HasIndex(e => new { e.TenantId, e.SnapshotDate }).IsUnique().HasFilter("[IsDeleted] = 0");
        });

        builder.Entity<ClinicPaymentMethod>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MethodName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ProviderName).HasMaxLength(120);
            entity.Property(e => e.AccountName).HasMaxLength(120);
            entity.Property(e => e.AccountNumber).HasMaxLength(120);
            entity.Property(e => e.Iban).HasMaxLength(120);
            entity.Property(e => e.WalletNumber).HasMaxLength(80);
            entity.Property(e => e.Instructions).HasMaxLength(1500);
            entity.HasIndex(e => new { e.TenantId, e.DisplayOrder, e.CreatedAt });
        });

        builder.Entity<MediaFile>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Category).IsRequired().HasMaxLength(50);
            entity.Property(e => e.EntityType).IsRequired().HasMaxLength(100);
            entity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.StoredFileName).IsRequired().HasMaxLength(255);
            entity.Property(e => e.RelativePath).IsRequired().HasMaxLength(1000);
            entity.Property(e => e.PublicUrl).IsRequired().HasMaxLength(1200);
            entity.Property(e => e.ContentType).IsRequired().HasMaxLength(120);
            entity.HasIndex(e => new { e.TenantId, e.Category, e.EntityType, e.EntityId, e.IsActive });
        });

        // === Phase 4 Entity Configurations ===

        // MessageLog entity configuration
        builder.Entity<MessageLog>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TemplateName).IsRequired().HasMaxLength(100);
            entity.Property(e => e.RecipientPhone).HasMaxLength(20);
            entity.Property(e => e.Channel).HasConversion<int>();
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.ProviderMessageId).HasMaxLength(200);
            entity.Property(e => e.LastProviderStatus).HasMaxLength(200);
            entity.Property(e => e.ProviderRawResponse).HasMaxLength(4000);
            entity.Property(e => e.FailureReason).HasMaxLength(1000);
            entity.Property(e => e.Variables).HasMaxLength(4000);
            entity.Property(e => e.RenderedBody).HasMaxLength(4000);
            entity.HasIndex(e => new { e.TenantId, e.Status, e.NextAttemptAt });
        });

        builder.Entity<MessageTemplate>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.TemplateKey).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Language).IsRequired().HasMaxLength(10);
            entity.Property(e => e.Channel).HasConversion<int>();
            entity.Property(e => e.TitleTemplate).HasMaxLength(500);
            entity.Property(e => e.BodyTemplate).IsRequired().HasMaxLength(4000);
            entity.HasIndex(e => new { e.TenantId, e.TemplateKey, e.Channel, e.Language }).IsUnique().HasFilter("[IsDeleted] = 0");
        });

        // Booking entity configuration
        builder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Status).HasConversion<int>();
            entity.Property(e => e.VisitType).HasConversion<int>();
            entity.Property(e => e.Source).HasConversion<int>();
            entity.Property(e => e.Notes).HasMaxLength(500);
            entity.Property(e => e.CancellationReason).HasMaxLength(500);

            // Prevent double-booking a doctor at the same date/time
            entity.HasIndex(e => new { e.DoctorId, e.BookingDate, e.BookingTime })
                .IsUnique().HasFilter("[IsDeleted] = 0 AND [Status] <> 3"); // Status 3 = Cancelled

            entity.HasOne(e => e.Patient)
                .WithMany()
                .HasForeignKey(e => e.PatientId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.Branch)
                .WithMany()
                .HasForeignKey(e => e.BranchId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(e => e.DoctorService)
                .WithMany()
                .HasForeignKey(e => e.DoctorServiceId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(e => e.QueueTicket)
                .WithMany()
                .HasForeignKey(e => e.QueueTicketId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // DoctorNote entity configuration
        builder.Entity<DoctorNote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Message).IsRequired().HasMaxLength(2000);

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // NotificationSubscription entity configuration
        builder.Entity<NotificationSubscription>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Endpoint).IsRequired().HasMaxLength(500);
            entity.Property(e => e.P256dh).IsRequired().HasMaxLength(500);
            entity.Property(e => e.Auth).IsRequired().HasMaxLength(500);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

            builder.Entity<InAppNotification>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).HasConversion<int>();
                entity.Property(e => e.Title).IsRequired().HasMaxLength(300);
                entity.Property(e => e.Body).IsRequired().HasMaxLength(2000);
                entity.Property(e => e.EntityType).HasMaxLength(120);
                entity.Property(e => e.MetadataJson).HasMaxLength(4000);
                entity.HasIndex(e => new { e.TenantId, e.UserId, e.IsRead, e.CreatedAt });

                entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
            });

        // === Phase 5 Entity Configurations ===

        // ClinicService entity configuration (tenant-level service catalog)
        builder.Entity<ClinicService>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasMaxLength(1000);
            entity.Property(e => e.DefaultPrice).HasPrecision(18, 2);
            entity.HasIndex(e => new { e.TenantId, e.Name }).IsUnique().HasFilter("[IsDeleted] = 0");

            entity.HasMany(e => e.DoctorLinks)
                .WithOne(l => l.ClinicService)
                .HasForeignKey(l => l.ClinicServiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // DoctorServiceLink entity configuration
        builder.Entity<DoctorServiceLink>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OverridePrice).HasPrecision(18, 2);
            entity.HasIndex(e => new { e.ClinicServiceId, e.DoctorId }).IsUnique().HasFilter("[IsDeleted] = 0");

            entity.HasOne(e => e.Doctor)
                .WithMany()
                .HasForeignKey(e => e.DoctorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Global query filter for tenant-scoped entities
        // Uses property reference so EF Core parameterizes per-query (not captured once at model build)
        builder.Entity<ClinicSettings>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<WorkingHour>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Employee>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Doctor>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<DoctorService>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<DoctorVisitFieldConfig>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Patient>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<QueueSession>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<QueueTicket>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Visit>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Prescription>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PrescriptionRevision>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<LabRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Invoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Payment>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Expense>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PatientMedicalDocument>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PatientMedicalDocumentThread>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PatientMedicalDocumentThreadReply>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PatientChronicProfile>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<DoctorCompensationRule>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<DoctorCompensationHistory>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<AttendanceRecord>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<AbsenceRecord>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<DailyClosingSnapshot>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<ClinicPaymentMethod>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Branch>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<DoctorBranchSchedule>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PatientSelfServiceRequest>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PatientSelfServiceRequestDocument>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<InventoryItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<InventoryItemImage>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<VisitInventoryUsage>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<MarketplaceOrder>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<MarketplaceOrderItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<SalesInvoice>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<SalesInvoiceLineItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Partner>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PartnerContract>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PartnerServiceCatalogItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PartnerUser>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PartnerOrder>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<PartnerOrderStatusHistory>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);

        // Phase 4 query filters
        builder.Entity<MessageLog>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<Booking>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<DoctorNote>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<NotificationSubscription>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<InAppNotification>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);

        // Phase 5 query filters
        builder.Entity<ClinicService>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<DoctorServiceLink>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<InvoiceNumberCounter>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<MediaFile>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<MessageTemplate>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
        builder.Entity<InvoiceLineItem>().HasQueryFilter(e => !e.IsDeleted && e.TenantId == CurrentTenantId);
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // Handle audit trail before saving
        var entries = ChangeTracker.Entries()
            .Where(e => e.Entity is BaseEntity && e.State != EntityState.Unchanged)
            .ToList();

        foreach (var entry in entries)
        {
            if (entry.Entity is BaseEntity baseEntity)
            {
                baseEntity.UpdatedAt = DateTime.UtcNow;

                if (entry.State == EntityState.Added)
                {
                    baseEntity.CreatedAt = DateTime.UtcNow;
                }
                else if (entry.State == EntityState.Deleted)
                {
                    entry.State = EntityState.Modified;
                    baseEntity.IsDeleted = true;
                    baseEntity.DeletedAt = DateTime.UtcNow;
                }
            }
        }

        // Log audit entries
        foreach (var entry in entries)
        {
            var auditLog = CreateAuditLog(entry);
            if (auditLog != null)
            {
                AuditLogs.Add(auditLog);
            }
        }

        return await base.SaveChangesAsync(cancellationToken);
    }

    private AuditLog? CreateAuditLog(Microsoft.EntityFrameworkCore.ChangeTracking.EntityEntry entry)
    {
        if (entry.Entity is BaseEntity baseEntity && entry.Entity is not AuditLog)
        {
            var action = entry.State switch
            {
                EntityState.Added => "Create",
                EntityState.Modified => "Update",
                EntityState.Deleted => "Delete",
                _ => null
            };

            if (action == null)
                return null;

            var userIdStr = _tenantContext?.UserId;
            Guid? userId = !string.IsNullOrEmpty(userIdStr) && Guid.TryParse(userIdStr, out var uid) ? uid : _tenantContext?.TenantId;
            var tenantId = entry.Entity is TenantBaseEntity tenantEntity ? tenantEntity.TenantId : _tenantContext?.TenantId;

            var auditLog = new AuditLog(
                userId: userId,
                tenantId: tenantId,
                entityType: entry.Entity.GetType().Name,
                entityId: baseEntity.Id.ToString(),
                action: action
            );

            var oldValues = new Dictionary<string, object>();
            var newValues = new Dictionary<string, object>();

            foreach (var property in entry.Properties)
            {
                if (property.IsTemporary)
                    continue;

                if (entry.State == EntityState.Modified)
                {
                    if (property.OriginalValue != null)
                        oldValues[property.Metadata.Name] = property.OriginalValue;

                    if (property.CurrentValue != null)
                        newValues[property.Metadata.Name] = property.CurrentValue;
                }
                else if (entry.State == EntityState.Added && property.CurrentValue != null)
                {
                    newValues[property.Metadata.Name] = property.CurrentValue;
                }
            }

            var options = new JsonSerializerOptions { DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull };
            if (oldValues.Any())
                auditLog.OldValues = JsonSerializer.Serialize(oldValues, options);
            if (newValues.Any())
                auditLog.NewValues = JsonSerializer.Serialize(newValues, options);

            return auditLog;
        }

        return null;
    }
}
