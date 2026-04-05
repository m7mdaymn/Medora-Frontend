namespace EliteClinic.Domain.Entities;

public class PartnerUser : TenantBaseEntity
{
    public Guid PartnerId { get; set; }
    public Guid UserId { get; set; }
    public bool IsPrimary { get; set; }
    public bool IsActive { get; set; } = true;

    public Partner Partner { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}