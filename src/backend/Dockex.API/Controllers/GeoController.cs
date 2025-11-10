using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/geo")]
public class GeoController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<GeoController> _logger;

    public GeoController(ApplicationDbContext context, ILogger<GeoController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet("cities/{countryCode}")]
    [ResponseCache(Duration = 60)]
    public async Task<IActionResult> GetCities(string countryCode)
    {
        if (string.IsNullOrWhiteSpace(countryCode))
            return BadRequest(new { success = false, message = "countryCode requerido" });

        try
        {
            var code = countryCode.Trim().ToUpper();
            var cities = await _context.Cities
                .Where(c => c.CountryCode == code && c.IsActive)
                .OrderBy(c => c.DisplayOrder).ThenBy(c => c.Name)
                .Select(c => new { c.Id, c.Name, c.DisplayOrder })
                .ToListAsync();

            return Ok(new { success = true, data = cities });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting cities for {CountryCode}", countryCode);
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }

    /// <summary>
    /// Lista de países (por country/countryCode) en los que existen Tenants activos. Útil para landing.
    /// </summary>
    [HttpGet("coverage")]
    [ResponseCache(Duration = 60)]
    public async Task<IActionResult> GetCoverage()
    {
        try
        {
            var coverage = await _context.Tenants
                .Where(t => t.IsActive)
                .GroupBy(t => new { t.CountryCode, t.Country })
                .Select(g => new
                {
                    countryCode = g.Key.CountryCode,
                    country = g.Key.Country,
                    tenants = g.Count()
                })
                .OrderBy(x => x.country)
                .ToListAsync();
            return Ok(new { success = true, data = coverage });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting coverage countries");
            return StatusCode(500, new { success = false, message = "Internal server error" });
        }
    }
}

