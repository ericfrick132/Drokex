using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Dockex.API.Models;

public class Product : IMultiTenant
{
    public int Id { get; set; }
    
    // Multi-tenancy
    [Required]
    public int TenantId { get; set; }
    public virtual Tenant Tenant { get; set; } = null!;
    
    public int CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    [Column(TypeName = "decimal(18,2)")]
    public decimal Price { get; set; }
    
    // Precio en USD para conversiones internacionales
    [Column(TypeName = "decimal(18,2)")]
    public decimal? PriceUSD { get; set; }
    
    public int Stock { get; set; }
    public int MinOrderQuantity { get; set; } = 1;
    
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    
    // Campos adicionales para exportación
    public string? OriginCountry { get; set; } = string.Empty;
    public string? HsCode { get; set; } = string.Empty; // Código arancelario
    public decimal Weight { get; set; } = 0; // Peso en kg
    public string? Dimensions { get; set; } = string.Empty; // "LxWxH cm"
    public bool RequiresImportLicense { get; set; } = false;
    
    public bool IsActive { get; set; } = true;
    public bool IsFeatured { get; set; } = false;
    public bool IsAvailableForExport { get; set; } = true;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    
    // Relaciones
    public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
}