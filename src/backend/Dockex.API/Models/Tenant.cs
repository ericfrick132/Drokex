using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public class Tenant
{
    public int Id { get; set; }
    
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty; // "Drokex Honduras"
    
    [Required]
    [MaxLength(50)]
    public string Subdomain { get; set; } = string.Empty; // "honduras", "guatemala"
    
    [Required]
    [MaxLength(100)]
    public string Country { get; set; } = string.Empty; // "Honduras", "Guatemala"
    
    [Required]
    [MaxLength(3)]
    public string CountryCode { get; set; } = string.Empty; // "HN", "GT", "MX"
    
    [Required]
    [MaxLength(3)]
    public string Currency { get; set; } = string.Empty; // "HNL", "GTQ", "MXN"
    
    [Required]
    [MaxLength(5)]
    public string CurrencySymbol { get; set; } = string.Empty; // "L", "Q", "$"
    
    [Required]
    [EmailAddress]
    [MaxLength(256)]
    public string AdminEmail { get; set; } = string.Empty;
    
    // Configuración visual por región (Drokex branding)
    [MaxLength(7)]
    public string PrimaryColor { get; set; } = "#abd305"; // Verde lima Drokex
    
    [MaxLength(7)]
    public string SecondaryColor { get; set; } = "#006d5a"; // Verde teal Drokex
    
    [MaxLength(500)]
    public string? LogoUrl { get; set; }
    
    [MaxLength(1000)]
    public string? CustomCss { get; set; }
    
    // Configuración comercial
    [Range(0, 100)]
    public decimal TransactionFeePercent { get; set; } = 2.0m;
    
    [Range(0, 1000)]
    public int MaxCompanies { get; set; } = 50;
    
    [Range(0, 10000)]
    public int MaxProducts { get; set; } = 500;
    
    // Plan y billing
    public bool IsTrialPeriod { get; set; } = true;
    public DateTime? TrialEndsAt { get; set; }
    public string PlanType { get; set; } = "Trial"; // Trial, Starter, Business, Enterprise
    public bool IsPaid { get; set; } = false;
    
    // Estado y actividad
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastActivityAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    // Configuración adicional LATAM
    [MaxLength(50)]
    public string? TimeZone { get; set; } // "America/Tegucigalpa"
    
    [MaxLength(5)]
    public string? LanguageCode { get; set; } = "es"; // "es", "en"
    
    public bool AllowsInternationalShipping { get; set; } = true;
    public bool RequiresTaxId { get; set; } = true;
    
    // Métricas
    public int TotalCompanies { get; set; } = 0;
    public int TotalProducts { get; set; } = 0;
    public int TotalOrders { get; set; } = 0;
    public decimal TotalRevenue { get; set; } = 0;
    
    // Relaciones
    public ICollection<Company> Companies { get; set; } = new List<Company>();
    public ICollection<User> Users { get; set; } = new List<User>();
}