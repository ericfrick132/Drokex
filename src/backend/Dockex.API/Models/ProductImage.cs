using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public class ProductImage : IMultiTenant
{
    public int Id { get; set; }
    
    // Multi-tenancy
    [Required]
    public int TenantId { get; set; }
    public virtual Tenant Tenant { get; set; } = null!;
    
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    
    [Required]
    public string ImageUrl { get; set; } = string.Empty;
    
    public bool IsPrimary { get; set; } = false;
    public int DisplayOrder { get; set; } = 0;
    
    // Metadatos adicionales
    public string? AltText { get; set; } = string.Empty;
    public long? FileSizeBytes { get; set; }
    public string? MimeType { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}