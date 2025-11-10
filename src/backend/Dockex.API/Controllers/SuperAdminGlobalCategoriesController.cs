using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.Models;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/superadmin/categories")]
[Authorize]
public class SuperAdminGlobalCategoriesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SuperAdminGlobalCategoriesController> _logger;

    public SuperAdminGlobalCategoriesController(ApplicationDbContext context, ILogger<SuperAdminGlobalCategoriesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private bool IsSuperAdmin() => User.FindFirst("IsSuperAdmin")?.Value == "true";

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        if (!IsSuperAdmin()) return Forbid();
        var items = await _context.Categories
            .Include(c => c.Products)
            .OrderBy(c => c.DisplayOrder).ThenBy(c => c.Name)
            .Select(c => new
            {
                id = c.Id,
                name = c.Name,
                description = c.Description,
                parentCategoryId = c.ParentCategoryId,
                displayOrder = c.DisplayOrder,
                isActive = c.IsActive,
                productsCount = c.Products.Count(p => p.IsActive)
            })
            .ToListAsync();
        return Ok(new { success = true, data = items });
    }

    public class UpsertCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? DisplayOrder { get; set; }
        public int? ParentCategoryId { get; set; }
        public bool? IsActive { get; set; }
        public string? IconUrl { get; set; }
        public string? ColorHex { get; set; }
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] UpsertCategoryRequest req)
    {
        if (!IsSuperAdmin()) return Forbid();
        if (string.IsNullOrWhiteSpace(req.Name)) return BadRequest(new { success = false, message = "Name is required" });
        var nextOrder = req.DisplayOrder ?? await _context.Categories.CountAsync();
        var entity = new Category
        {
            Name = req.Name.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            ParentCategoryId = req.ParentCategoryId,
            DisplayOrder = nextOrder,
            IsActive = req.IsActive ?? true,
            IconUrl = req.IconUrl,
            ColorHex = req.ColorHex,
            CreatedAt = DateTime.UtcNow
        };
        _context.Categories.Add(entity);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = new { id = entity.Id } });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update([FromRoute] int id, [FromBody] UpsertCategoryRequest req)
    {
        if (!IsSuperAdmin()) return Forbid();
        var entity = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (entity == null) return NotFound(new { success = false, message = "Not found" });

        if (!string.IsNullOrWhiteSpace(req.Name)) entity.Name = req.Name.Trim();
        if (req.Description != null) entity.Description = req.Description.Trim();
        if (req.DisplayOrder.HasValue) entity.DisplayOrder = req.DisplayOrder.Value;
        entity.ParentCategoryId = req.ParentCategoryId;
        if (req.IsActive.HasValue) entity.IsActive = req.IsActive.Value;
        entity.IconUrl = req.IconUrl;
        entity.ColorHex = req.ColorHex;
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = true });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete([FromRoute] int id)
    {
        if (!IsSuperAdmin()) return Forbid();
        var entity = await _context.Categories.FirstOrDefaultAsync(c => c.Id == id);
        if (entity == null) return NotFound(new { success = false, message = "Not found" });
        _context.Categories.Remove(entity);
        await _context.SaveChangesAsync();
        return Ok(new { success = true, data = true });
    }
}

