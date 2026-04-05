namespace EliteClinic.Domain.Entities;

public class InventoryItemImage : TenantBaseEntity
{
    public Guid InventoryItemId { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }

    public InventoryItem InventoryItem { get; set; } = null!;
}
