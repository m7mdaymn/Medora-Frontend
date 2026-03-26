using System.ComponentModel.DataAnnotations;

namespace EliteClinic.Application.Features.Platform.FeatureFlags.DTOs;

public class FeatureFlagDto
{
    public Guid Id { get; set; }
    public Guid TenantId { get; set; }
    public bool OnlineBooking { get; set; }
    public bool WhatsappAutomation { get; set; }
    public bool PwaNotifications { get; set; }
    public bool ExpensesModule { get; set; }
    public bool AdvancedMedicalTemplates { get; set; }
    public bool Ratings { get; set; }
    public bool Export { get; set; }
    public bool ConsultationVisitTypeEnabled { get; set; }
    public bool UrgentInsertPolicyEnabled { get; set; }
    public bool EncounterPendingSettlementEnabled { get; set; }
    public bool PatientDocumentsEnabled { get; set; }
    public bool CompensationRulesEnabled { get; set; }
    public bool DailyClosingSnapshotEnabled { get; set; }
}

public class UpdateFeatureFlagRequest
{
    [Required]
    public bool OnlineBooking { get; set; }

    [Required]
    public bool WhatsappAutomation { get; set; }

    [Required]
    public bool PwaNotifications { get; set; }

    [Required]
    public bool ExpensesModule { get; set; }

    [Required]
    public bool AdvancedMedicalTemplates { get; set; }

    [Required]
    public bool Ratings { get; set; }

    [Required]
    public bool Export { get; set; }

    [Required]
    public bool ConsultationVisitTypeEnabled { get; set; }

    [Required]
    public bool UrgentInsertPolicyEnabled { get; set; }

    [Required]
    public bool EncounterPendingSettlementEnabled { get; set; }

    [Required]
    public bool PatientDocumentsEnabled { get; set; }

    [Required]
    public bool CompensationRulesEnabled { get; set; }

    [Required]
    public bool DailyClosingSnapshotEnabled { get; set; }
}
