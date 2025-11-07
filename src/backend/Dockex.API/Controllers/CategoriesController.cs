using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.DTOs;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : BaseTenantController
{
    private readonly ApplicationDbContext _context;

    public CategoriesController(
        ApplicationDbContext context,
        Services.ITenantResolutionService tenantResolution,
        Services.ITenantService tenantService,
        ILogger<CategoriesController> logger
    ) : base(tenantResolution, tenantService, logger)
    {
        _context = context;
    }

    public class CreateCategoryRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? DisplayOrder { get; set; }
        public int? ParentCategoryId { get; set; }
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SuperAdmin")]
    public async Task<ActionResult<ApiResponseDto<CategoryDto>>> Create([FromBody] CreateCategoryRequest req)
    {
        try
        {
            var tenantValidation = ValidateTenantRequired();
            if (tenantValidation != null) return tenantValidation;

            if (string.IsNullOrWhiteSpace(req.Name))
            {
                return BadRequest(new ApiResponseDto<CategoryDto>("El nombre es requerido"));
            }

            var nextOrder = req.DisplayOrder ?? await _context.Categories.CountAsync() + 1;

            var entity = new Models.Category
            {
                Name = req.Name.Trim(),
                Description = req.Description ?? string.Empty,
                ParentCategoryId = req.ParentCategoryId,
                DisplayOrder = nextOrder,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };
            AssignCurrentTenant(entity);

            _context.Categories.Add(entity);
            await _context.SaveChangesAsync();

            var dto = new CategoryDto
            {
                Id = entity.Id,
                Name = entity.Name,
                Description = entity.Description,
                ParentCategoryId = entity.ParentCategoryId,
                DisplayOrder = entity.DisplayOrder,
                ProductsCount = 0
            };

            return Ok(new ApiResponseDto<CategoryDto>(dto, "Categoría creada"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating category");
            return StatusCode(500, new ApiResponseDto<CategoryDto>("Internal server error"));
        }
    }
}

