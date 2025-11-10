using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public class TenantSupportedCountry
{
    public int Id { get; set; }

    [Required]
    public int TenantId { get; set; }
    public Tenant Tenant { get; set; } = null!;

    [Required]
    [MaxLength(3)]
    public string CountryCode { get; set; } = string.Empty; // ISO-3166-1 alpha-2 (2) o alpha-3 compatible
}

