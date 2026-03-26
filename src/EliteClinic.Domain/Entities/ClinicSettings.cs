namespace EliteClinic.Domain.Entities;

public class ClinicSettings : TenantBaseEntity
{
    public string ClinicName { get; set; } = string.Empty;
    public string? Phone { get; set; }
    public string? WhatsAppSenderNumber { get; set; }
    public string? SupportWhatsAppNumber { get; set; }
    public string? SupportPhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? MapUrl { get; set; }
    public string? LogoUrl { get; set; }
    public string? ImgUrl { get; set; }     //implement it now
    public string? Description { get; set; }
    public string? SocialLinksJson { get; set; }
    public bool BookingEnabled { get; set; }
    public int CancellationWindowHours { get; set; }
    public bool RetainCreditOnNoShow { get; set; }

    // Navigation properties
    public Tenant Tenant { get; set; } = null!;
    public ICollection<WorkingHour> WorkingHours { get; set; } = new List<WorkingHour>();

    public ClinicSettings()
    {
        BookingEnabled = false;
        CancellationWindowHours = 2;
        RetainCreditOnNoShow = false;
    }

    public ClinicSettings(Guid tenantId, string clinicName) : this()
    {
        TenantId = tenantId;
        ClinicName = clinicName;
    }
}
