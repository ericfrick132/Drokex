using System.ComponentModel.DataAnnotations;

namespace Dockex.API.Models;

public enum ActivityStatus
{
    New,
    Pending,
    Completed,
    Urgent
}

public class Activity : BaseMultiTenantEntity, IMultiTenant
{
    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Description { get; set; } = string.Empty;

    [Required]
    public ActivityStatus Status { get; set; } = ActivityStatus.New;
}

