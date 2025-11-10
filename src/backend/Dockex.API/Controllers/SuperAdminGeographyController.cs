using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.Models;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/superadmin")]
[Authorize]
public class SuperAdminGeographyController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SuperAdminGeographyController> _logger;

    public SuperAdminGeographyController(ApplicationDbContext context, ILogger<SuperAdminGeographyController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private bool IsSuperAdmin() => User.FindFirst("IsSuperAdmin")?.Value == "true";

    // =============== Cities CRUD (global) ===============
    [HttpGet("cities")]
    public async Task<IActionResult> GetCities([FromQuery] string? countryCode = null)
    {
        if (!IsSuperAdmin()) return Forbid();
        var q = _context.Cities.AsQueryable();
        if (!string.IsNullOrWhiteSpace(countryCode))
        {
            var code = countryCode.Trim().ToUpper();
            q = q.Where(c => c.CountryCode == code);
        }
        var items = await q
            .OrderBy(c => c.CountryCode).ThenBy(c => c.DisplayOrder).ThenBy(c => c.Name)
            .Select(c => new { c.Id, c.CountryCode, c.Name, c.DisplayOrder, c.IsActive })
            .ToListAsync();
        return Ok(new { success = true, data = items });
    }

    public class UpsertCityRequest
    {
        public string CountryCode { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int? DisplayOrder { get; set; }
        public bool? IsActive { get; set; }
    }

    [HttpPost("cities")]
    public async Task<IActionResult> CreateCity([FromBody] UpsertCityRequest req)
    {
        if (!IsSuperAdmin()) return Forbid();
        if (string.IsNullOrWhiteSpace(req.CountryCode) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { success = false, message = "CountryCode y Name son requeridos" });

        var entity = new City
        {
            CountryCode = req.CountryCode.Trim().ToUpper(),
            Name = req.Name.Trim(),
            DisplayOrder = req.DisplayOrder ?? 0,
            IsActive = req.IsActive ?? true
        };
        _context.Cities.Add(entity);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { id = entity.Id } });
    }

    [HttpPut("cities/{id:int}")]
    public async Task<IActionResult> UpdateCity([FromRoute] int id, [FromBody] UpsertCityRequest req)
    {
        if (!IsSuperAdmin()) return Forbid();
        var entity = await _context.Cities.FirstOrDefaultAsync(c => c.Id == id);
        if (entity == null) return NotFound(new { success = false, message = "Not found" });

        if (!string.IsNullOrWhiteSpace(req.CountryCode)) entity.CountryCode = req.CountryCode.Trim().ToUpper();
        if (!string.IsNullOrWhiteSpace(req.Name)) entity.Name = req.Name.Trim();
        if (req.DisplayOrder.HasValue) entity.DisplayOrder = req.DisplayOrder.Value;
        if (req.IsActive.HasValue) entity.IsActive = req.IsActive.Value;
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = true });
    }

    [HttpDelete("cities/{id:int}")]
    public async Task<IActionResult> DeleteCity([FromRoute] int id)
    {
        if (!IsSuperAdmin()) return Forbid();
        var entity = await _context.Cities.FirstOrDefaultAsync(c => c.Id == id);
        if (entity == null) return NotFound(new { success = false, message = "Not found" });
        _context.Cities.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = true });
    }

    // =============== Tenant Supported Countries ===============

    [HttpGet("tenants/{tenantId:int}/supported-countries")]
    public async Task<IActionResult> GetSupportedCountries([FromRoute] int tenantId)
    {
        if (!IsSuperAdmin()) return Forbid();
        var exists = await _context.Tenants.AnyAsync(t => t.Id == tenantId);
        if (!exists) return NotFound(new { success = false, message = "Tenant not found" });
        var items = await _context.TenantSupportedCountries
            .Where(x => x.TenantId == tenantId)
            .OrderBy(x => x.CountryCode)
            .Select(x => x.CountryCode)
            .ToListAsync();
        return Ok(new { success = true, data = items });
    }

    public class SetSupportedCountriesRequest
    {
        public List<string> CountryCodes { get; set; } = new();
    }

    [HttpPut("tenants/{tenantId:int}/supported-countries")]
    public async Task<IActionResult> SetSupportedCountries([FromRoute] int tenantId, [FromBody] SetSupportedCountriesRequest req)
    {
        if (!IsSuperAdmin()) return Forbid();
        var tenant = await _context.Tenants.FirstOrDefaultAsync(t => t.Id == tenantId);
        if (tenant == null) return NotFound(new { success = false, message = "Tenant not found" });

        var normalized = (req.CountryCodes ?? new()).Where(c => !string.IsNullOrWhiteSpace(c))
            .Select(c => c.Trim().ToUpper())
            .Distinct()
            .ToList();

        var existing = await _context.TenantSupportedCountries.Where(x => x.TenantId == tenantId).ToListAsync();
        _context.TenantSupportedCountries.RemoveRange(existing);
        foreach (var code in normalized)
        {
            _context.TenantSupportedCountries.Add(new TenantSupportedCountry { TenantId = tenantId, CountryCode = code });
        }
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = normalized });
    }
}

