using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public class City
{
    public int Id { get; set; }

    [Required]
    [MaxLength(3)]
    public string CountryCode { get; set; } = string.Empty; // ISO-3166-1 alpha-2 (2) o alpha-3 compatible

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    public int DisplayOrder { get; set; } = 0;
    public bool IsActive { get; set; } = true;
}

