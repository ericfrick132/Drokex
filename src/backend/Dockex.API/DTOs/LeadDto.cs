namespace Dockex.API.DTOs;

public class LeadDto
{
    public int Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ContactedAt { get; set; }
    public bool IsContacted { get; set; }
    public string? Notes { get; set; }
}

public class CreateLeadDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string ContactName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}

public class UpdateLeadDto
{
    public bool IsContacted { get; set; }
    public string? Notes { get; set; }
}