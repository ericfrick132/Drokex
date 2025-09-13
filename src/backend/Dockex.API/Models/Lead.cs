using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public class Lead : IMultiTenant
{
    public int Id { get; set; }
    
    // Multi-tenancy
    [Required]
    public int TenantId { get; set; }
    public virtual Tenant Tenant { get; set; } = null!;
    
    [Required]
    public string CompanyName { get; set; } = string.Empty;
    
    [Required]
    public string ContactName { get; set; } = string.Empty;
    
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
    
    public string Phone { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    
    // Campos adicionales LATAM
    public string? InterestedProducts { get; set; } = string.Empty;
    public string? ImportVolume { get; set; } = string.Empty; // Monthly/Annual
    public string? TargetMarkets { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ContactedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    
    public bool IsContacted { get; set; } = false;
    public bool IsQualified { get; set; } = false;
    public string? Notes { get; set; }
    public LeadStatus Status { get; set; } = LeadStatus.New;
}

public enum LeadStatus
{
    New,
    Contacted,
    Qualified,
    Proposal,
    Won,
    Lost
}