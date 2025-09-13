using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.DTOs;
using Dockex.API.Models;
using Dockex.API.Services;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ActivitiesController : BaseTenantController
{
    private readonly ApplicationDbContext _context;

    public ActivitiesController(
        ApplicationDbContext context,
        ITenantResolutionService tenantResolution,
        ITenantService tenantService,
        ILogger<ActivitiesController> logger) : base(tenantResolution, tenantService, logger)
    {
        _context = context;
    }

    [HttpGet("recent")]
    public async Task<ActionResult<ApiResponseDto<List<ActivityDto>>>> GetRecent([FromQuery] int take = 10)
    {
        var validation = ValidateTenantRequired();
        if (validation != null) return validation;

        take = Math.Clamp(take, 1, 50);

        try
        {
            var activities = await _context.Activities
                .OrderByDescending(a => a.CreatedAt)
                .Take(take)
                .Select(a => new ActivityDto
                {
                    Id = a.Id,
                    Title = a.Title,
                    Description = a.Description,
                    Status = a.Status.ToString().ToLowerInvariant(),
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();

            return Ok(new ApiResponseDto<List<ActivityDto>>(activities));
        }
        catch (Exception ex)
        {
            // Si el esquema aún no incluye la tabla Activities, devolver una lista de ejemplo
            _logger.LogWarning(ex, "Activities table not available yet. Returning sample data.");
            var sample = BuildSampleActivities(take);
            return Ok(new ApiResponseDto<List<ActivityDto>>(sample, "sample"));
        }
    }

    private static List<ActivityDto> BuildSampleActivities(int take)
    {
        var now = DateTime.UtcNow;
        var all = new List<ActivityDto>
        {
            new() { Id = 0, Title = "Nuevo lead interesado", Description = "European Traders está interesado en Café Arábica Premium", Status = "new", CreatedAt = now.AddMinutes(-30) },
            new() { Id = 0, Title = "Producto más visto", Description = "Café Orgánico Certificado ha sido visto 45 veces hoy", Status = "completed", CreatedAt = now.AddHours(-2) },
            new() { Id = 0, Title = "Stock bajo", Description = "Café Arábica Premium - Solo quedan 25 unidades", Status = "urgent", CreatedAt = now.AddHours(-4) },
            new() { Id = 0, Title = "Consulta de precio", Description = "Importadora Internacional solicita cotización para 500kg", Status = "pending", CreatedAt = now.AddHours(-6) },
            new() { Id = 0, Title = "Perfil actualizado", Description = "Información de la empresa fue actualizada exitosamente", Status = "completed", CreatedAt = now.AddDays(-1) }
        };
        return all
            .OrderByDescending(a => a.CreatedAt)
            .Take(take)
            .ToList();
    }
}
