namespace EliteClinic.Domain.Entities;

public class ClinicPaymentMethod : TenantBaseEntity
{
    public string MethodName { get; set; } = string.Empty;
    public string? ProviderName { get; set; }
    public string? AccountName { get; set; }
    public string? AccountNumber { get; set; }
    public string? Iban { get; set; }
    public string? WalletNumber { get; set; }
    public string? Instructions { get; set; }
    public bool IsActive { get; set; } = true;
    public int DisplayOrder { get; set; }
}
