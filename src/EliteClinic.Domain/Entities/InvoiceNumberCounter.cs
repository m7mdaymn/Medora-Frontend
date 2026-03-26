namespace EliteClinic.Domain.Entities;

public class InvoiceNumberCounter : TenantBaseEntity
{
    public int Year { get; set; }
    public int NextNumber { get; set; }
    public DateTime? LastIssuedAt { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public InvoiceNumberCounter()
    {
        NextNumber = 1;
    }
}
