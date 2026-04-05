BEGIN TRANSACTION;
ALTER TABLE [Visits] ADD [BranchId] uniqueidentifier NULL;

ALTER TABLE [Visits] ADD [Source] int NOT NULL DEFAULT 0;

ALTER TABLE [QueueTickets] ADD [BranchId] uniqueidentifier NULL;

ALTER TABLE [QueueTickets] ADD [Source] int NOT NULL DEFAULT 0;

ALTER TABLE [QueueSessions] ADD [BranchId] uniqueidentifier NULL;

ALTER TABLE [Prescriptions] ADD [PartnerOrderId] uniqueidentifier NULL;

ALTER TABLE [LabRequests] ADD [PartnerOrderId] uniqueidentifier NULL;

ALTER TABLE [Invoices] ADD [BranchId] uniqueidentifier NULL;

ALTER TABLE [Expenses] ADD [BranchId] uniqueidentifier NULL;

ALTER TABLE [Employees] ADD [WorkerMode] int NOT NULL DEFAULT 0;

ALTER TABLE [Doctors] ADD [CompensationEffectiveFrom] datetime2 NOT NULL DEFAULT '0001-01-01T00:00:00.0000000';

ALTER TABLE [Doctors] ADD [CompensationMode] int NOT NULL DEFAULT 0;

ALTER TABLE [Doctors] ADD [CompensationValue] decimal(18,2) NOT NULL DEFAULT 0.0;

ALTER TABLE [ClinicSettings] ADD [SelfServicePaymentPolicy] int NOT NULL DEFAULT 0;

ALTER TABLE [ClinicSettings] ADD [SelfServiceRequestExpiryHours] int NOT NULL DEFAULT 24;

ALTER TABLE [Bookings] ADD [BranchId] uniqueidentifier NULL;

ALTER TABLE [Bookings] ADD [Source] int NOT NULL DEFAULT 0;

ALTER TABLE [Bookings] ADD [VisitType] int NOT NULL DEFAULT 0;

ALTER TABLE [AttendanceRecords] ADD [BranchId] uniqueidentifier NULL;

ALTER TABLE [AttendanceRecords] ADD [EnteredByUserId] uniqueidentifier NULL;

ALTER TABLE [ClinicSettings] ADD CONSTRAINT [AK_ClinicSettings_TenantId] UNIQUE ([TenantId]);

CREATE TABLE [Branches] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Code] nvarchar(50) NULL,
    [Address] nvarchar(1000) NULL,
    [Phone] nvarchar(20) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_Branches] PRIMARY KEY ([Id])
);

CREATE TABLE [ClinicPaymentMethods] (
    [Id] uniqueidentifier NOT NULL,
    [MethodName] nvarchar(100) NOT NULL,
    [ProviderName] nvarchar(120) NULL,
    [AccountName] nvarchar(120) NULL,
    [AccountNumber] nvarchar(120) NULL,
    [Iban] nvarchar(120) NULL,
    [WalletNumber] nvarchar(80) NULL,
    [Instructions] nvarchar(1500) NULL,
    [IsActive] bit NOT NULL,
    [DisplayOrder] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_ClinicPaymentMethods] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ClinicPaymentMethods_ClinicSettings_TenantId] FOREIGN KEY ([TenantId]) REFERENCES [ClinicSettings] ([TenantId]) ON DELETE CASCADE
);

CREATE TABLE [DoctorCompensationHistories] (
    [Id] uniqueidentifier NOT NULL,
    [DoctorId] uniqueidentifier NOT NULL,
    [Mode] int NOT NULL,
    [Value] decimal(18,2) NOT NULL,
    [EffectiveFrom] datetime2 NOT NULL,
    [ChangedByUserId] uniqueidentifier NOT NULL,
    [Notes] nvarchar(1000) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_DoctorCompensationHistories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DoctorCompensationHistories_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [InAppNotifications] (
    [Id] uniqueidentifier NOT NULL,
    [UserId] uniqueidentifier NOT NULL,
    [Type] int NOT NULL,
    [Title] nvarchar(300) NOT NULL,
    [Body] nvarchar(2000) NOT NULL,
    [EntityType] nvarchar(120) NULL,
    [EntityId] uniqueidentifier NULL,
    [IsRead] bit NOT NULL,
    [ReadAt] datetime2 NULL,
    [MetadataJson] nvarchar(4000) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_InAppNotifications] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InAppNotifications_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Partners] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Type] int NOT NULL,
    [ContactName] nvarchar(200) NULL,
    [ContactPhone] nvarchar(50) NULL,
    [ContactEmail] nvarchar(120) NULL,
    [Address] nvarchar(1000) NULL,
    [Notes] nvarchar(2000) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_Partners] PRIMARY KEY ([Id])
);

CREATE TABLE [PatientMedicalDocumentThreads] (
    [Id] uniqueidentifier NOT NULL,
    [PatientId] uniqueidentifier NOT NULL,
    [DocumentId] uniqueidentifier NOT NULL,
    [CreatedByUserId] uniqueidentifier NOT NULL,
    [Subject] nvarchar(300) NOT NULL,
    [Status] int NOT NULL,
    [ClosedAt] datetime2 NULL,
    [ClosedByUserId] uniqueidentifier NULL,
    [Notes] nvarchar(1000) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PatientMedicalDocumentThreads] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PatientMedicalDocumentThreads_PatientMedicalDocuments_DocumentId] FOREIGN KEY ([DocumentId]) REFERENCES [PatientMedicalDocuments] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_PatientMedicalDocumentThreads_Patients_PatientId] FOREIGN KEY ([PatientId]) REFERENCES [Patients] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [PrescriptionRevisions] (
    [Id] uniqueidentifier NOT NULL,
    [PrescriptionId] uniqueidentifier NOT NULL,
    [VisitId] uniqueidentifier NOT NULL,
    [RevisionNumber] int NOT NULL,
    [Action] nvarchar(30) NOT NULL,
    [MedicationName] nvarchar(200) NOT NULL,
    [Dosage] nvarchar(100) NULL,
    [Frequency] nvarchar(100) NULL,
    [Duration] nvarchar(100) NULL,
    [Instructions] nvarchar(500) NULL,
    [Reason] nvarchar(500) NULL,
    [ChangedByUserId] uniqueidentifier NOT NULL,
    [ChangedAt] datetime2 NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PrescriptionRevisions] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PrescriptionRevisions_Prescriptions_PrescriptionId] FOREIGN KEY ([PrescriptionId]) REFERENCES [Prescriptions] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PrescriptionRevisions_Visits_VisitId] FOREIGN KEY ([VisitId]) REFERENCES [Visits] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [AbsenceRecords] (
    [Id] uniqueidentifier NOT NULL,
    [DoctorId] uniqueidentifier NULL,
    [EmployeeId] uniqueidentifier NULL,
    [FromDate] datetime2 NOT NULL,
    [ToDate] datetime2 NOT NULL,
    [Reason] nvarchar(500) NOT NULL,
    [IsPaid] bit NOT NULL,
    [Notes] nvarchar(2000) NULL,
    [EnteredByUserId] uniqueidentifier NOT NULL,
    [BranchId] uniqueidentifier NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_AbsenceRecords] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_AbsenceRecords_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_AbsenceRecords_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_AbsenceRecords_Employees_EmployeeId] FOREIGN KEY ([EmployeeId]) REFERENCES [Employees] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [DoctorBranchSchedules] (
    [Id] uniqueidentifier NOT NULL,
    [DoctorId] uniqueidentifier NOT NULL,
    [BranchId] uniqueidentifier NOT NULL,
    [DayOfWeek] int NOT NULL,
    [StartTime] time NOT NULL,
    [EndTime] time NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_DoctorBranchSchedules] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DoctorBranchSchedules_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_DoctorBranchSchedules_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [InventoryItems] (
    [Id] uniqueidentifier NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [Description] nvarchar(2000) NULL,
    [SkuCode] nvarchar(100) NOT NULL,
    [ItemType] int NOT NULL,
    [Unit] nvarchar(50) NOT NULL,
    [SalePrice] decimal(18,2) NOT NULL,
    [CostPrice] decimal(18,2) NOT NULL,
    [QuantityOnHand] decimal(18,4) NOT NULL,
    [LowStockThreshold] decimal(18,4) NOT NULL,
    [UsableInVisit] bit NOT NULL,
    [SellablePublicly] bit NOT NULL,
    [InternalOnly] bit NOT NULL,
    [BillableInVisit] bit NOT NULL,
    [Active] bit NOT NULL,
    [BranchId] uniqueidentifier NOT NULL,
    [ShowInLanding] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_InventoryItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InventoryItems_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [PatientSelfServiceRequests] (
    [Id] uniqueidentifier NOT NULL,
    [PatientId] uniqueidentifier NOT NULL,
    [DoctorId] uniqueidentifier NOT NULL,
    [BranchId] uniqueidentifier NOT NULL,
    [DoctorServiceId] uniqueidentifier NOT NULL,
    [RequestType] int NOT NULL,
    [Status] int NOT NULL,
    [VisitType] int NOT NULL,
    [Source] int NOT NULL,
    [RequestedDate] datetime2 NOT NULL,
    [RequestedTime] time NULL,
    [ServiceNameSnapshot] nvarchar(200) NOT NULL,
    [ServicePriceSnapshot] decimal(18,2) NULL,
    [ServiceDurationMinutesSnapshot] int NULL,
    [Complaint] nvarchar(2000) NULL,
    [Symptoms] nvarchar(2000) NULL,
    [DurationNotes] nvarchar(1000) NULL,
    [HasChronicConditions] bit NOT NULL,
    [ChronicConditionsDetails] nvarchar(2000) NULL,
    [CurrentMedications] nvarchar(2000) NULL,
    [KnownAllergies] nvarchar(2000) NULL,
    [IsPregnant] bit NULL,
    [EmergencyContactName] nvarchar(200) NULL,
    [EmergencyContactPhone] nvarchar(50) NULL,
    [Notes] nvarchar(2000) NULL,
    [DeclaredPaidAmount] decimal(18,2) NULL,
    [AdjustedPaidAmount] decimal(18,2) NULL,
    [PaymentMethod] nvarchar(100) NULL,
    [TransferReference] nvarchar(120) NULL,
    [TransferSenderName] nvarchar(200) NULL,
    [TransferDate] datetime2 NULL,
    [PaymentProofOriginalFileName] nvarchar(255) NOT NULL,
    [PaymentProofStoredFileName] nvarchar(255) NOT NULL,
    [PaymentProofRelativePath] nvarchar(1200) NOT NULL,
    [PaymentProofPublicUrl] nvarchar(1200) NOT NULL,
    [PaymentProofContentType] nvarchar(120) NOT NULL,
    [PaymentProofFileSizeBytes] bigint NOT NULL,
    [IsWithinClinicWorkingHours] bit NULL,
    [IsWithinDoctorSchedule] bit NULL,
    [DoctorShiftOpenAtSubmission] bit NULL,
    [AvailabilityCheckedAt] datetime2 NULL,
    [AvailabilityCheckNotes] nvarchar(2000) NULL,
    [ExpiresAt] datetime2 NOT NULL,
    [ReuploadCount] int NOT NULL,
    [ReuploadReason] nvarchar(1000) NULL,
    [ReuploadRequestedAt] datetime2 NULL,
    [ReuploadRequestedByUserId] uniqueidentifier NULL,
    [RejectionReason] nvarchar(1000) NULL,
    [RejectedAt] datetime2 NULL,
    [RejectedByUserId] uniqueidentifier NULL,
    [ApprovalNotes] nvarchar(1000) NULL,
    [ApprovedAt] datetime2 NULL,
    [ApprovedByUserId] uniqueidentifier NULL,
    [ConvertedQueueTicketId] uniqueidentifier NULL,
    [ConvertedBookingId] uniqueidentifier NULL,
    [ConvertedAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PatientSelfServiceRequests] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PatientSelfServiceRequests_Bookings_ConvertedBookingId] FOREIGN KEY ([ConvertedBookingId]) REFERENCES [Bookings] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_PatientSelfServiceRequests_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PatientSelfServiceRequests_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PatientSelfServiceRequests_Patients_PatientId] FOREIGN KEY ([PatientId]) REFERENCES [Patients] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PatientSelfServiceRequests_QueueTickets_ConvertedQueueTicketId] FOREIGN KEY ([ConvertedQueueTicketId]) REFERENCES [QueueTickets] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [SalesInvoices] (
    [Id] uniqueidentifier NOT NULL,
    [InvoiceNumber] nvarchar(40) NOT NULL,
    [BranchId] uniqueidentifier NOT NULL,
    [MarketplaceOrderId] uniqueidentifier NOT NULL,
    [CustomerNameSnapshot] nvarchar(200) NOT NULL,
    [PhoneSnapshot] nvarchar(50) NOT NULL,
    [SubtotalAmount] decimal(18,2) NOT NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [Status] int NOT NULL,
    [IssuedAt] datetime2 NOT NULL,
    [CancelledAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_SalesInvoices] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SalesInvoices_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [PartnerContracts] (
    [Id] uniqueidentifier NOT NULL,
    [PartnerId] uniqueidentifier NOT NULL,
    [BranchId] uniqueidentifier NULL,
    [ServiceScope] nvarchar(200) NULL,
    [CommissionPercentage] decimal(18,4) NULL,
    [FlatFee] decimal(18,2) NULL,
    [EffectiveFrom] datetime2 NOT NULL,
    [EffectiveTo] datetime2 NULL,
    [IsActive] bit NOT NULL,
    [Notes] nvarchar(2000) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PartnerContracts] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PartnerContracts_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_PartnerContracts_Partners_PartnerId] FOREIGN KEY ([PartnerId]) REFERENCES [Partners] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [PatientMedicalDocumentThreadReplies] (
    [Id] uniqueidentifier NOT NULL,
    [ThreadId] uniqueidentifier NOT NULL,
    [AuthorUserId] uniqueidentifier NOT NULL,
    [Message] nvarchar(4000) NOT NULL,
    [IsInternalNote] bit NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PatientMedicalDocumentThreadReplies] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PatientMedicalDocumentThreadReplies_PatientMedicalDocumentThreads_ThreadId] FOREIGN KEY ([ThreadId]) REFERENCES [PatientMedicalDocumentThreads] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [InventoryItemImages] (
    [Id] uniqueidentifier NOT NULL,
    [InventoryItemId] uniqueidentifier NOT NULL,
    [ImageUrl] nvarchar(1200) NOT NULL,
    [DisplayOrder] int NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_InventoryItemImages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InventoryItemImages_InventoryItems_InventoryItemId] FOREIGN KEY ([InventoryItemId]) REFERENCES [InventoryItems] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [VisitInventoryUsages] (
    [Id] uniqueidentifier NOT NULL,
    [InventoryItemId] uniqueidentifier NOT NULL,
    [DoctorId] uniqueidentifier NOT NULL,
    [PatientId] uniqueidentifier NOT NULL,
    [VisitId] uniqueidentifier NOT NULL,
    [Quantity] decimal(18,4) NOT NULL,
    [BilledAmount] decimal(18,2) NOT NULL,
    [UsedAt] datetime2 NOT NULL,
    [BranchId] uniqueidentifier NOT NULL,
    [BilledToInvoice] bit NOT NULL,
    [InvoiceId] uniqueidentifier NULL,
    [Notes] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_VisitInventoryUsages] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_VisitInventoryUsages_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_VisitInventoryUsages_Doctors_DoctorId] FOREIGN KEY ([DoctorId]) REFERENCES [Doctors] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_VisitInventoryUsages_InventoryItems_InventoryItemId] FOREIGN KEY ([InventoryItemId]) REFERENCES [InventoryItems] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_VisitInventoryUsages_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_VisitInventoryUsages_Patients_PatientId] FOREIGN KEY ([PatientId]) REFERENCES [Patients] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_VisitInventoryUsages_Visits_VisitId] FOREIGN KEY ([VisitId]) REFERENCES [Visits] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [PatientSelfServiceRequestDocuments] (
    [Id] uniqueidentifier NOT NULL,
    [RequestId] uniqueidentifier NOT NULL,
    [UploadedByUserId] uniqueidentifier NOT NULL,
    [OriginalFileName] nvarchar(255) NOT NULL,
    [StoredFileName] nvarchar(255) NOT NULL,
    [RelativePath] nvarchar(1200) NOT NULL,
    [PublicUrl] nvarchar(1200) NOT NULL,
    [ContentType] nvarchar(120) NOT NULL,
    [FileSizeBytes] bigint NOT NULL,
    [Notes] nvarchar(500) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PatientSelfServiceRequestDocuments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PatientSelfServiceRequestDocuments_PatientSelfServiceRequests_RequestId] FOREIGN KEY ([RequestId]) REFERENCES [PatientSelfServiceRequests] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [MarketplaceOrders] (
    [Id] uniqueidentifier NOT NULL,
    [BranchId] uniqueidentifier NOT NULL,
    [CustomerName] nvarchar(200) NOT NULL,
    [Phone] nvarchar(50) NOT NULL,
    [Notes] nvarchar(1000) NULL,
    [Status] int NOT NULL,
    [WhatsAppRedirectedAt] datetime2 NULL,
    [SalesInvoiceId] uniqueidentifier NULL,
    [SubtotalAmount] decimal(18,2) NOT NULL,
    [TotalAmount] decimal(18,2) NOT NULL,
    [ConfirmedAt] datetime2 NULL,
    [CancelledAt] datetime2 NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_MarketplaceOrders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MarketplaceOrders_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_MarketplaceOrders_SalesInvoices_SalesInvoiceId] FOREIGN KEY ([SalesInvoiceId]) REFERENCES [SalesInvoices] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [SalesInvoiceLineItems] (
    [Id] uniqueidentifier NOT NULL,
    [SalesInvoiceId] uniqueidentifier NOT NULL,
    [InventoryItemId] uniqueidentifier NOT NULL,
    [ItemNameSnapshot] nvarchar(250) NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [Quantity] decimal(18,4) NOT NULL,
    [LineTotal] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_SalesInvoiceLineItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_SalesInvoiceLineItems_InventoryItems_InventoryItemId] FOREIGN KEY ([InventoryItemId]) REFERENCES [InventoryItems] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_SalesInvoiceLineItems_SalesInvoices_SalesInvoiceId] FOREIGN KEY ([SalesInvoiceId]) REFERENCES [SalesInvoices] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [PartnerOrders] (
    [Id] uniqueidentifier NOT NULL,
    [PartnerId] uniqueidentifier NOT NULL,
    [PartnerContractId] uniqueidentifier NULL,
    [BranchId] uniqueidentifier NOT NULL,
    [VisitId] uniqueidentifier NOT NULL,
    [LabRequestId] uniqueidentifier NULL,
    [PrescriptionId] uniqueidentifier NULL,
    [PartnerType] int NOT NULL,
    [Status] int NOT NULL,
    [OrderedByUserId] uniqueidentifier NOT NULL,
    [OrderedAt] datetime2 NOT NULL,
    [SentAt] datetime2 NULL,
    [AcceptedAt] datetime2 NULL,
    [CompletedAt] datetime2 NULL,
    [CancelledAt] datetime2 NULL,
    [EstimatedCost] decimal(18,2) NULL,
    [FinalCost] decimal(18,2) NULL,
    [ExternalReference] nvarchar(120) NULL,
    [Notes] nvarchar(2000) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PartnerOrders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PartnerOrders_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PartnerOrders_PartnerContracts_PartnerContractId] FOREIGN KEY ([PartnerContractId]) REFERENCES [PartnerContracts] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_PartnerOrders_Partners_PartnerId] FOREIGN KEY ([PartnerId]) REFERENCES [Partners] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_PartnerOrders_Visits_VisitId] FOREIGN KEY ([VisitId]) REFERENCES [Visits] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [MarketplaceOrderItems] (
    [Id] uniqueidentifier NOT NULL,
    [MarketplaceOrderId] uniqueidentifier NOT NULL,
    [InventoryItemId] uniqueidentifier NOT NULL,
    [ItemNameSnapshot] nvarchar(250) NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [Quantity] decimal(18,4) NOT NULL,
    [LineTotal] decimal(18,2) NOT NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_MarketplaceOrderItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_MarketplaceOrderItems_InventoryItems_InventoryItemId] FOREIGN KEY ([InventoryItemId]) REFERENCES [InventoryItems] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_MarketplaceOrderItems_MarketplaceOrders_MarketplaceOrderId] FOREIGN KEY ([MarketplaceOrderId]) REFERENCES [MarketplaceOrders] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [PartnerOrderStatusHistories] (
    [Id] uniqueidentifier NOT NULL,
    [PartnerOrderId] uniqueidentifier NOT NULL,
    [OldStatus] int NULL,
    [NewStatus] int NOT NULL,
    [ChangedByUserId] uniqueidentifier NOT NULL,
    [ChangedAt] datetime2 NOT NULL,
    [Notes] nvarchar(1000) NULL,
    [CreatedAt] datetime2 NOT NULL,
    [UpdatedAt] datetime2 NOT NULL,
    [IsDeleted] bit NOT NULL,
    [DeletedAt] datetime2 NULL,
    [TenantId] uniqueidentifier NOT NULL,
    CONSTRAINT [PK_PartnerOrderStatusHistories] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PartnerOrderStatusHistories_PartnerOrders_PartnerOrderId] FOREIGN KEY ([PartnerOrderId]) REFERENCES [PartnerOrders] ([Id]) ON DELETE CASCADE
);

CREATE INDEX [IX_Visits_BranchId] ON [Visits] ([BranchId]);

CREATE INDEX [IX_QueueTickets_BranchId] ON [QueueTickets] ([BranchId]);

CREATE INDEX [IX_QueueSessions_BranchId] ON [QueueSessions] ([BranchId]);

CREATE INDEX [IX_Prescriptions_TenantId_VisitId_PartnerOrderId] ON [Prescriptions] ([TenantId], [VisitId], [PartnerOrderId]);

CREATE INDEX [IX_LabRequests_TenantId_VisitId_PartnerOrderId] ON [LabRequests] ([TenantId], [VisitId], [PartnerOrderId]);

CREATE INDEX [IX_Invoices_BranchId] ON [Invoices] ([BranchId]);

CREATE INDEX [IX_Expenses_BranchId] ON [Expenses] ([BranchId]);

CREATE INDEX [IX_Bookings_BranchId] ON [Bookings] ([BranchId]);

CREATE INDEX [IX_AttendanceRecords_BranchId] ON [AttendanceRecords] ([BranchId]);

CREATE INDEX [IX_AbsenceRecords_BranchId] ON [AbsenceRecords] ([BranchId]);

CREATE INDEX [IX_AbsenceRecords_DoctorId] ON [AbsenceRecords] ([DoctorId]);

CREATE INDEX [IX_AbsenceRecords_EmployeeId] ON [AbsenceRecords] ([EmployeeId]);

CREATE INDEX [IX_AbsenceRecords_TenantId_DoctorId_FromDate_ToDate] ON [AbsenceRecords] ([TenantId], [DoctorId], [FromDate], [ToDate]);

CREATE INDEX [IX_AbsenceRecords_TenantId_EmployeeId_FromDate_ToDate] ON [AbsenceRecords] ([TenantId], [EmployeeId], [FromDate], [ToDate]);

CREATE UNIQUE INDEX [IX_Branches_TenantId_Name] ON [Branches] ([TenantId], [Name]) WHERE [IsDeleted] = 0;

CREATE INDEX [IX_ClinicPaymentMethods_TenantId_DisplayOrder_CreatedAt] ON [ClinicPaymentMethods] ([TenantId], [DisplayOrder], [CreatedAt]);

CREATE INDEX [IX_DoctorBranchSchedules_BranchId] ON [DoctorBranchSchedules] ([BranchId]);

CREATE INDEX [IX_DoctorBranchSchedules_DoctorId] ON [DoctorBranchSchedules] ([DoctorId]);

CREATE UNIQUE INDEX [IX_DoctorBranchSchedules_TenantId_DoctorId_BranchId_DayOfWeek_StartTime_EndTime] ON [DoctorBranchSchedules] ([TenantId], [DoctorId], [BranchId], [DayOfWeek], [StartTime], [EndTime]) WHERE [IsDeleted] = 0;

CREATE INDEX [IX_DoctorCompensationHistories_DoctorId] ON [DoctorCompensationHistories] ([DoctorId]);

CREATE INDEX [IX_DoctorCompensationHistories_TenantId_DoctorId_EffectiveFrom] ON [DoctorCompensationHistories] ([TenantId], [DoctorId], [EffectiveFrom]);

CREATE INDEX [IX_InAppNotifications_TenantId_UserId_IsRead_CreatedAt] ON [InAppNotifications] ([TenantId], [UserId], [IsRead], [CreatedAt]);

CREATE INDEX [IX_InAppNotifications_UserId] ON [InAppNotifications] ([UserId]);

CREATE INDEX [IX_InventoryItemImages_InventoryItemId] ON [InventoryItemImages] ([InventoryItemId]);

CREATE INDEX [IX_InventoryItemImages_TenantId_InventoryItemId_DisplayOrder] ON [InventoryItemImages] ([TenantId], [InventoryItemId], [DisplayOrder]);

CREATE INDEX [IX_InventoryItems_BranchId] ON [InventoryItems] ([BranchId]);

CREATE INDEX [IX_InventoryItems_TenantId_BranchId_Active_SellablePublicly_InternalOnly] ON [InventoryItems] ([TenantId], [BranchId], [Active], [SellablePublicly], [InternalOnly]);

CREATE UNIQUE INDEX [IX_InventoryItems_TenantId_BranchId_SkuCode] ON [InventoryItems] ([TenantId], [BranchId], [SkuCode]) WHERE [IsDeleted] = 0;

CREATE INDEX [IX_MarketplaceOrderItems_InventoryItemId] ON [MarketplaceOrderItems] ([InventoryItemId]);

CREATE INDEX [IX_MarketplaceOrderItems_MarketplaceOrderId] ON [MarketplaceOrderItems] ([MarketplaceOrderId]);

CREATE INDEX [IX_MarketplaceOrderItems_TenantId_MarketplaceOrderId_InventoryItemId] ON [MarketplaceOrderItems] ([TenantId], [MarketplaceOrderId], [InventoryItemId]);

CREATE INDEX [IX_MarketplaceOrders_BranchId] ON [MarketplaceOrders] ([BranchId]);

CREATE INDEX [IX_MarketplaceOrders_SalesInvoiceId] ON [MarketplaceOrders] ([SalesInvoiceId]);

CREATE INDEX [IX_MarketplaceOrders_TenantId_BranchId_Status_CreatedAt] ON [MarketplaceOrders] ([TenantId], [BranchId], [Status], [CreatedAt]);

CREATE INDEX [IX_PartnerContracts_BranchId] ON [PartnerContracts] ([BranchId]);

CREATE INDEX [IX_PartnerContracts_PartnerId] ON [PartnerContracts] ([PartnerId]);

CREATE INDEX [IX_PartnerContracts_TenantId_PartnerId_BranchId_EffectiveFrom] ON [PartnerContracts] ([TenantId], [PartnerId], [BranchId], [EffectiveFrom]);

CREATE INDEX [IX_PartnerOrders_BranchId] ON [PartnerOrders] ([BranchId]);

CREATE INDEX [IX_PartnerOrders_PartnerContractId] ON [PartnerOrders] ([PartnerContractId]);

CREATE INDEX [IX_PartnerOrders_PartnerId] ON [PartnerOrders] ([PartnerId]);

CREATE INDEX [IX_PartnerOrders_TenantId_BranchId_Status_CreatedAt] ON [PartnerOrders] ([TenantId], [BranchId], [Status], [CreatedAt]);

CREATE UNIQUE INDEX [IX_PartnerOrders_TenantId_LabRequestId] ON [PartnerOrders] ([TenantId], [LabRequestId]) WHERE [IsDeleted] = 0 AND [LabRequestId] IS NOT NULL;

CREATE UNIQUE INDEX [IX_PartnerOrders_TenantId_PrescriptionId] ON [PartnerOrders] ([TenantId], [PrescriptionId]) WHERE [IsDeleted] = 0 AND [PrescriptionId] IS NOT NULL;

CREATE INDEX [IX_PartnerOrders_VisitId] ON [PartnerOrders] ([VisitId]);

CREATE INDEX [IX_PartnerOrderStatusHistories_PartnerOrderId] ON [PartnerOrderStatusHistories] ([PartnerOrderId]);

CREATE INDEX [IX_PartnerOrderStatusHistories_TenantId_PartnerOrderId_ChangedAt] ON [PartnerOrderStatusHistories] ([TenantId], [PartnerOrderId], [ChangedAt]);

CREATE UNIQUE INDEX [IX_Partners_TenantId_Type_Name] ON [Partners] ([TenantId], [Type], [Name]) WHERE [IsDeleted] = 0;

CREATE INDEX [IX_PatientMedicalDocumentThreadReplies_TenantId_ThreadId_CreatedAt] ON [PatientMedicalDocumentThreadReplies] ([TenantId], [ThreadId], [CreatedAt]);

CREATE INDEX [IX_PatientMedicalDocumentThreadReplies_ThreadId] ON [PatientMedicalDocumentThreadReplies] ([ThreadId]);

CREATE INDEX [IX_PatientMedicalDocumentThreads_DocumentId] ON [PatientMedicalDocumentThreads] ([DocumentId]);

CREATE INDEX [IX_PatientMedicalDocumentThreads_PatientId] ON [PatientMedicalDocumentThreads] ([PatientId]);

CREATE INDEX [IX_PatientMedicalDocumentThreads_TenantId_PatientId_DocumentId_Status_CreatedAt] ON [PatientMedicalDocumentThreads] ([TenantId], [PatientId], [DocumentId], [Status], [CreatedAt]);

CREATE INDEX [IX_PatientSelfServiceRequestDocuments_RequestId] ON [PatientSelfServiceRequestDocuments] ([RequestId]);

CREATE INDEX [IX_PatientSelfServiceRequestDocuments_TenantId_RequestId_CreatedAt] ON [PatientSelfServiceRequestDocuments] ([TenantId], [RequestId], [CreatedAt]);

CREATE INDEX [IX_PatientSelfServiceRequests_BranchId] ON [PatientSelfServiceRequests] ([BranchId]);

CREATE INDEX [IX_PatientSelfServiceRequests_ConvertedBookingId] ON [PatientSelfServiceRequests] ([ConvertedBookingId]);

CREATE INDEX [IX_PatientSelfServiceRequests_ConvertedQueueTicketId] ON [PatientSelfServiceRequests] ([ConvertedQueueTicketId]);

CREATE INDEX [IX_PatientSelfServiceRequests_DoctorId] ON [PatientSelfServiceRequests] ([DoctorId]);

CREATE INDEX [IX_PatientSelfServiceRequests_PatientId] ON [PatientSelfServiceRequests] ([PatientId]);

CREATE INDEX [IX_PatientSelfServiceRequests_TenantId_PatientId_CreatedAt] ON [PatientSelfServiceRequests] ([TenantId], [PatientId], [CreatedAt]);

CREATE INDEX [IX_PatientSelfServiceRequests_TenantId_Status_CreatedAt] ON [PatientSelfServiceRequests] ([TenantId], [Status], [CreatedAt]);

CREATE INDEX [IX_PrescriptionRevisions_PrescriptionId] ON [PrescriptionRevisions] ([PrescriptionId]);

CREATE UNIQUE INDEX [IX_PrescriptionRevisions_TenantId_PrescriptionId_RevisionNumber] ON [PrescriptionRevisions] ([TenantId], [PrescriptionId], [RevisionNumber]) WHERE [IsDeleted] = 0;

CREATE INDEX [IX_PrescriptionRevisions_VisitId] ON [PrescriptionRevisions] ([VisitId]);

CREATE INDEX [IX_SalesInvoiceLineItems_InventoryItemId] ON [SalesInvoiceLineItems] ([InventoryItemId]);

CREATE INDEX [IX_SalesInvoiceLineItems_SalesInvoiceId] ON [SalesInvoiceLineItems] ([SalesInvoiceId]);

CREATE INDEX [IX_SalesInvoiceLineItems_TenantId_SalesInvoiceId_InventoryItemId] ON [SalesInvoiceLineItems] ([TenantId], [SalesInvoiceId], [InventoryItemId]);

CREATE INDEX [IX_SalesInvoices_BranchId] ON [SalesInvoices] ([BranchId]);

CREATE UNIQUE INDEX [IX_SalesInvoices_TenantId_InvoiceNumber] ON [SalesInvoices] ([TenantId], [InvoiceNumber]) WHERE [IsDeleted] = 0;

CREATE UNIQUE INDEX [IX_SalesInvoices_TenantId_MarketplaceOrderId] ON [SalesInvoices] ([TenantId], [MarketplaceOrderId]) WHERE [IsDeleted] = 0;

CREATE INDEX [IX_VisitInventoryUsages_BranchId] ON [VisitInventoryUsages] ([BranchId]);

CREATE INDEX [IX_VisitInventoryUsages_DoctorId] ON [VisitInventoryUsages] ([DoctorId]);

CREATE INDEX [IX_VisitInventoryUsages_InventoryItemId] ON [VisitInventoryUsages] ([InventoryItemId]);

CREATE INDEX [IX_VisitInventoryUsages_InvoiceId] ON [VisitInventoryUsages] ([InvoiceId]);

CREATE INDEX [IX_VisitInventoryUsages_PatientId] ON [VisitInventoryUsages] ([PatientId]);

CREATE INDEX [IX_VisitInventoryUsages_TenantId_InventoryItemId_UsedAt] ON [VisitInventoryUsages] ([TenantId], [InventoryItemId], [UsedAt]);

CREATE INDEX [IX_VisitInventoryUsages_TenantId_VisitId_UsedAt] ON [VisitInventoryUsages] ([TenantId], [VisitId], [UsedAt]);

CREATE INDEX [IX_VisitInventoryUsages_VisitId] ON [VisitInventoryUsages] ([VisitId]);

ALTER TABLE [AttendanceRecords] ADD CONSTRAINT [FK_AttendanceRecords_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL;

ALTER TABLE [Bookings] ADD CONSTRAINT [FK_Bookings_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL;

ALTER TABLE [Expenses] ADD CONSTRAINT [FK_Expenses_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL;

ALTER TABLE [Invoices] ADD CONSTRAINT [FK_Invoices_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]);

ALTER TABLE [QueueSessions] ADD CONSTRAINT [FK_QueueSessions_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL;

ALTER TABLE [QueueTickets] ADD CONSTRAINT [FK_QueueTickets_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL;

ALTER TABLE [Visits] ADD CONSTRAINT [FK_Visits_Branches_BranchId] FOREIGN KEY ([BranchId]) REFERENCES [Branches] ([Id]) ON DELETE SET NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260404175657_Phase13_Phase1CoreStabilizationReports', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260404183649_Phase14_Phase2SelfServiceRequestFlow', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260404192914_Phase15_Phase3InventoryMarketplaceSales', N'9.0.0');

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260404202657_Phase16_Phase4PartnersThreadsNotifications', N'9.0.0');

COMMIT;
GO

