namespace EliteClinic.Domain.Entities;

public class PatientCreditBalance : TenantBaseEntity
{
    public Guid PatientId { get; set; }
    public decimal Balance { get; set; }
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public Patient Patient { get; set; } = null!;
    public ICollection<PatientCreditTransaction> Transactions { get; set; } = new List<PatientCreditTransaction>();

    public PatientCreditBalance()
    {
        Balance = 0;
    }
}
