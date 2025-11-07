using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.Models;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/superadmin/business-types")]
[Authorize]
public class SuperAdminBusinessTypesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SuperAdminBusinessTypesController> _logger;

    public SuperAdminBusinessTypesController(ApplicationDbContext context, ILogger<SuperAdminBusinessTypesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private bool IsSuperAdmin() => User.FindFirst("IsSuperAdmin")?.Value == "true";

    // List
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!IsSuperAdmin()) return Forbid();
        var list = await _context.BusinessTypes
            .OrderBy(b => b.DisplayOrder).ThenBy(b => b.Name)
            .Select(b => new { b.Id, b.Name, b.Description, b.DisplayOrder, b.IsActive, b.CreatedAt, b.UpdatedAt })
            .ToListAsync();
        return Ok(new { success = true, data = list });
    }

    public class UpsertRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? DisplayOrder { get; set; }
        public bool? IsActive { get; set; }
    }

    // Create
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertRequest req)
    {
        if (!IsSuperAdmin()) return Forbid();
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { success = false, message = "Name is required" });
        if (await _context.BusinessTypes.AnyAsync(b => b.Name.ToLower() == req.Name.Trim().ToLower()))
            return BadRequest(new { success = false, message = "Business type already exists" });

        var entity = new BusinessType
        {
            Name = req.Name.Trim(),
            Description = req.Description?.Trim(),
            DisplayOrder = req.DisplayOrder ?? 0,
            IsActive = req.IsActive ?? true,
            CreatedAt = DateTime.UtcNow
        };
        _context.BusinessTypes.Add(entity);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = entity });
    }

    // Update
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpsertRequest req)
    {
        if (!IsSuperAdmin()) return Forbid();
        var entity = await _context.BusinessTypes.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Not found" });
        if (!string.IsNullOrWhiteSpace(req.Name))
        {
            var name = req.Name.Trim();
            if (!string.Equals(name, entity.Name, StringComparison.OrdinalIgnoreCase) &&
                await _context.BusinessTypes.AnyAsync(b => b.Name.ToLower() == name.ToLower() && b.Id != id))
            {
                return BadRequest(new { success = false, message = "Business type with this name already exists" });
            }
            entity.Name = name;
        }
        entity.Description = req.Description?.Trim();
        if (req.DisplayOrder.HasValue) entity.DisplayOrder = req.DisplayOrder.Value;
        if (req.IsActive.HasValue) entity.IsActive = req.IsActive.Value;
        entity.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = entity });
    }

    // Delete
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        if (!IsSuperAdmin()) return Forbid();
        var entity = await _context.BusinessTypes.FindAsync(id);
        if (entity == null) return NotFound(new { success = false, message = "Not found" });
        _context.BusinessTypes.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = true });
    }
}

