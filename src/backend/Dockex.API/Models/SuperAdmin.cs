using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public class SuperAdmin
{
    [Key]
    public int Id { get; set; }

    [Required]
    [EmailAddress]
    [MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string LastName { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsMasterAdmin { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? LastLoginAt { get; set; }

    public string? LastLoginIp { get; set; }

    public string? RefreshToken { get; set; }
    
    public DateTime? RefreshTokenExpiryTime { get; set; }

    // Permisos específicos
    public bool CanManageTenants { get; set; } = true;
    public bool CanViewAnalytics { get; set; } = true;
    public bool CanManageUsers { get; set; } = true;
    public bool CanManageBilling { get; set; } = true;
    public bool CanAccessAllTenants { get; set; } = true;

    // Tenant actual seleccionado (para navegación)
    public int? CurrentTenantId { get; set; }
    public virtual Tenant? CurrentTenant { get; set; }

    // Auditoría
    public string? Notes { get; set; }
    public DateTime? ModifiedAt { get; set; }
    public string? ModifiedBy { get; set; }
}