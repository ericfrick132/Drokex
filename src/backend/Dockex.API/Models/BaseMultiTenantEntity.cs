using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public abstract class BaseMultiTenantEntity
{
    public int Id { get; set; }
    
    [Required]
    public int TenantId { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    
    // Relación con Tenant
    public virtual Tenant Tenant { get; set; } = null!;
}

public interface IMultiTenant
{
    int TenantId { get; set; }
    Tenant Tenant { get; set; }
}