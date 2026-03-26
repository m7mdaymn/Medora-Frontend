namespace EliteClinic.Domain.Entities;

public class TenantFeatureFlag : BaseEntity
{
    public Guid TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    // Feature flags with defaults matching PLAN.md §13
    public bool OnlineBooking { get; set; } = false;
    public bool WhatsappAutomation { get; set; } = true;
    public bool PwaNotifications { get; set; } = false;
    public bool ExpensesModule { get; set; } = true;
    public bool AdvancedMedicalTemplates { get; set; } = false;
    public bool Ratings { get; set; } = false;
    public bool Export { get; set; } = false;

    // Operational feature flags
    public bool ConsultationVisitTypeEnabled { get; set; } = false;
    public bool UrgentInsertPolicyEnabled { get; set; } = false;
    public bool EncounterPendingSettlementEnabled { get; set; } = false;
    public bool PatientDocumentsEnabled { get; set; } = false;
    public bool CompensationRulesEnabled { get; set; } = false;
    public bool DailyClosingSnapshotEnabled { get; set; } = false;
}
