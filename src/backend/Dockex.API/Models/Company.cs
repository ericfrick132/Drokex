using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public class Company : IMultiTenant
{
    public int Id { get; set; }
    
    // Multi-tenancy
    [Required]
    public int TenantId { get; set; }
    public virtual Tenant Tenant { get; set; } = null!;
    
    [Required]
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string ContactEmail { get; set; } = string.Empty;
    
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public string Website { get; set; } = string.Empty;
    public string Logo { get; set; } = string.Empty;
    
    // Campos adicionales para LATAM
    public string? TaxId { get; set; } = string.Empty; // RTN, NIT, RFC
    public string? BusinessType { get; set; } = string.Empty; // Exportador, Distribuidor, Fabricante
    public string? CertificationsJson { get; set; } = string.Empty; // JSON con certificaciones
    
    public bool IsApproved { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public bool CanExportInternational { get; set; } = false;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ApprovedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Relaciones
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}