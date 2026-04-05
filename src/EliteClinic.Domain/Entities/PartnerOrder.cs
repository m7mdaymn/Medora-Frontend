using EliteClinic.Domain.Enums;

namespace EliteClinic.Domain.Entities;

public class PartnerOrder : TenantBaseEntity
{
    public Guid PartnerId { get; set; }
    public Guid? PartnerContractId { get; set; }
    public Guid BranchId { get; set; }
    public Guid VisitId { get; set; }
    public Guid? LabRequestId { get; set; }
    public Guid? PrescriptionId { get; set; }
    public Guid? PartnerServiceCatalogItemId { get; set; }
    public PartnerType PartnerType { get; set; }
    public PartnerOrderStatus Status { get; set; }
    public Guid OrderedByUserId { get; set; }
    public DateTime OrderedAt { get; set; }
    public DateTime? SentAt { get; set; }
    public DateTime? AcceptedAt { get; set; }
    public DateTime? ScheduledAt { get; set; }
    public DateTime? PatientArrivedAt { get; set; }
    public DateTime? ResultUploadedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public DateTime? CancelledAt { get; set; }
    public Guid? CompletedByUserId { get; set; }
    public string? ServiceNameSnapshot { get; set; }
    public decimal? ServicePrice { get; set; }
    public PartnerSettlementTarget? SettlementTarget { get; set; }
    public decimal? SettlementPercentage { get; set; }
    public decimal? ClinicDoctorSharePercentage { get; set; }
    public decimal? DoctorPayoutAmount { get; set; }
    public decimal? ClinicRevenueAmount { get; set; }
    public string? ResultSummary { get; set; }
    public decimal? EstimatedCost { get; set; }
    public decimal? FinalCost { get; set; }
    public string? ExternalReference { get; set; }
    public string? Notes { get; set; }

    public Partner Partner { get; set; } = null!;
    public PartnerContract? PartnerContract { get; set; }
    public PartnerServiceCatalogItem? PartnerServiceCatalogItem { get; set; }
    public Branch Branch { get; set; } = null!;
    public Visit Visit { get; set; } = null!;
    public ICollection<PartnerOrderStatusHistory> StatusHistory { get; set; } = new List<PartnerOrderStatusHistory>();

    public PartnerOrder()
    {
        Status = PartnerOrderStatus.Draft;
        OrderedAt = DateTime.UtcNow;
    }
}
