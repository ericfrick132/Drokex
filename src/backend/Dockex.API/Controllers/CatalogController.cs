using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.DTOs;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<CatalogController> _logger;
    private static readonly object _viewLock = new();
    // Views per day (UTC) per productId
    private static readonly Dictionary<string, int> _viewsToday = new(); // key: yyyyMMdd:productId

    public CatalogController(ApplicationDbContext context, ILogger<CatalogController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private static string ViewKey(int productId)
    {
        var day = DateTime.UtcNow.ToString("yyyyMMdd");
        return $"{day}:{productId}";
    }

    [HttpPost("products/{id}/view")]
    public IActionResult RegisterView(int id)
    {
        lock (_viewLock)
        {
            var key = ViewKey(id);
            _viewsToday[key] = _viewsToday.TryGetValue(key, out var c) ? c + 1 : 1;
        }
        return Ok(new { success = true });
    }

    [HttpGet("products/most-viewed")]
    public async Task<IActionResult> GetMostViewed()
    {
        var day = DateTime.UtcNow.ToString("yyyyMMdd");
        KeyValuePair<string, int>? max = null;
        lock (_viewLock)
        {
            foreach (var kv in _viewsToday)
            {
                if (!kv.Key.StartsWith(day + ":")) continue;
                if (max == null || kv.Value > max.Value.Value) max = kv;
            }
        }
        if (max == null) return Ok(new { success = true, data = (object?)null });
        var productId = int.Parse(max.Value.Key.Split(':')[1]);
        var product = await _context.Products.Include(p => p.Company).FirstOrDefaultAsync(p => p.Id == productId);
        if (product == null)
            return Ok(new { success = true, data = (object?)null });
        return Ok(new { success = true, data = new { id = product.Id, name = product.Name, views = max.Value.Value, company = product.Company.Name } });
    }

    [HttpGet("products")]
    public async Task<ActionResult<ApiResponseDto<PagedResponseDto<ProductDto>>>> GetProducts([FromQuery] ProductSearchDto searchDto)
    {
        try
        {
            var query = _context.Products
                .Include(p => p.Company)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsActive && p.Company.IsApproved && p.Company.IsActive);

            // Apply search filters
            if (!string.IsNullOrEmpty(searchDto.Search))
            {
                query = query.Where(p => p.Name.Contains(searchDto.Search) || 
                                       p.Description.Contains(searchDto.Search) ||
                                       p.Company.Name.Contains(searchDto.Search));
            }

            if (searchDto.CategoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == searchDto.CategoryId.Value);
            }

            if (searchDto.CompanyId.HasValue)
            {
                query = query.Where(p => p.CompanyId == searchDto.CompanyId.Value);
            }

            if (searchDto.MinPrice.HasValue)
            {
                query = query.Where(p => p.Price >= searchDto.MinPrice.Value);
            }

            if (searchDto.MaxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= searchDto.MaxPrice.Value);
            }

            if (searchDto.IsFeatured.HasValue)
            {
                query = query.Where(p => p.IsFeatured == searchDto.IsFeatured.Value);
            }

            // Apply sorting
            query = searchDto.SortBy.ToLower() switch
            {
                "name" => searchDto.SortOrder.ToLower() == "desc" 
                    ? query.OrderByDescending(p => p.Name)
                    : query.OrderBy(p => p.Name),
                "price" => searchDto.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.Price)
                    : query.OrderBy(p => p.Price),
                "company" => searchDto.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.Company.Name)
                    : query.OrderBy(p => p.Company.Name),
                _ => searchDto.SortOrder.ToLower() == "desc"
                    ? query.OrderByDescending(p => p.CreatedAt)
                    : query.OrderBy(p => p.CreatedAt)
            };

            var totalRecords = await query.CountAsync();
            var products = await query
                .Skip((searchDto.Page - 1) * searchDto.PageSize)
                .Take(searchDto.PageSize)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    Stock = p.Stock,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    IsActive = p.IsActive,
                    IsFeatured = p.IsFeatured,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    CompanyId = p.CompanyId,
                    CompanyName = p.Company.Name,
                    CompanyContactEmail = p.Company.ContactEmail,
                    CompanyPhone = p.Company.Phone,
                    Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        IsPrimary = i.IsPrimary,
                        DisplayOrder = i.DisplayOrder
                    }).ToList()
                })
                .ToListAsync();

            var pagedResponse = new PagedResponseDto<ProductDto>(products, totalRecords, searchDto.Page, searchDto.PageSize);
            return Ok(new ApiResponseDto<PagedResponseDto<ProductDto>>(pagedResponse));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving catalog products");
            return StatusCode(500, new ApiResponseDto<PagedResponseDto<ProductDto>>("Internal server error"));
        }
    }

    [HttpGet("products/{id}")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> GetProduct(int id)
    {
        try
        {
            var product = await _context.Products
                .Include(p => p.Company)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive && 
                                        p.Company.IsApproved && p.Company.IsActive);

            if (product == null)
            {
                return NotFound(new ApiResponseDto<ProductDto>("Product not found"));
            }

            var productDto = new ProductDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                Price = product.Price,
                Stock = product.Stock,
                CategoryName = product.Category?.Name,
                IsActive = product.IsActive,
                IsFeatured = product.IsFeatured,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                CompanyId = product.CompanyId,
                CompanyName = product.Company.Name,
                CompanyContactEmail = product.Company.ContactEmail,
                CompanyPhone = product.Company.Phone,
                Images = product.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto
                {
                    Id = i.Id,
                    ImageUrl = i.ImageUrl,
                    IsPrimary = i.IsPrimary,
                    DisplayOrder = i.DisplayOrder
                }).ToList()
            };

            return Ok(new ApiResponseDto<ProductDto>(productDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving product {ProductId}", id);
            return StatusCode(500, new ApiResponseDto<ProductDto>("Internal server error"));
        }
    }

    [HttpGet("companies")]
    public async Task<ActionResult<ApiResponseDto<PagedResponseDto<CompanyDto>>>> GetCompanies(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null)
    {
        try
        {
            var query = _context.Companies
                .Where(c => c.IsApproved && c.IsActive);

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.Name.Contains(search) || c.Description.Contains(search));
            }

            var totalRecords = await query.CountAsync();
            var companies = await query
                .Include(c => c.Products.Where(p => p.IsActive))
                .OrderBy(c => c.Name)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(c => new CompanyDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ContactEmail = c.ContactEmail,
                    Phone = c.Phone,
                    Address = c.Address,
                    Website = c.Website,
                    Logo = c.Logo,
                    IsApproved = c.IsApproved,
                    IsActive = c.IsActive,
                    CreatedAt = c.CreatedAt,
                    ProductsCount = c.Products.Count()
                })
                .ToListAsync();

            var pagedResponse = new PagedResponseDto<CompanyDto>(companies, totalRecords, page, pageSize);
            return Ok(new ApiResponseDto<PagedResponseDto<CompanyDto>>(pagedResponse));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving catalog companies");
            return StatusCode(500, new ApiResponseDto<PagedResponseDto<CompanyDto>>("Internal server error"));
        }
    }

    [HttpGet("categories")]
    public async Task<ActionResult<ApiResponseDto<List<CategoryDto>>>> GetCategories()
    {
        try
        {
            var categories = await _context.Categories
                .Where(c => c.IsActive)
                .Include(c => c.Products.Where(p => p.IsActive && p.Company.IsApproved && p.Company.IsActive))
                .OrderBy(c => c.DisplayOrder)
                .ThenBy(c => c.Name)
                .Select(c => new CategoryDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description,
                    ParentCategoryId = c.ParentCategoryId,
                    DisplayOrder = c.DisplayOrder,
                    ProductsCount = c.Products.Count()
                })
                .ToListAsync();

            return Ok(new ApiResponseDto<List<CategoryDto>>(categories));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving categories");
            return StatusCode(500, new ApiResponseDto<List<CategoryDto>>("Internal server error"));
        }
    }

    [HttpGet("featured-products")]
    public async Task<ActionResult<ApiResponseDto<List<ProductDto>>>> GetFeaturedProducts([FromQuery] int take = 8)
    {
        try
        {
            var products = await _context.Products
                .Include(p => p.Company)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.IsFeatured && p.IsActive && p.Company.IsApproved && p.Company.IsActive)
                .OrderByDescending(p => p.CreatedAt)
                .Take(take)
                .Select(p => new ProductDto
                {
                    Id = p.Id,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    Stock = p.Stock,
                    CategoryName = p.Category != null ? p.Category.Name : null,
                    IsActive = p.IsActive,
                    IsFeatured = p.IsFeatured,
                    CreatedAt = p.CreatedAt,
                    UpdatedAt = p.UpdatedAt,
                    CompanyId = p.CompanyId,
                    CompanyName = p.Company.Name,
                    CompanyContactEmail = p.Company.ContactEmail,
                    CompanyPhone = p.Company.Phone,
                    Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        IsPrimary = i.IsPrimary,
                        DisplayOrder = i.DisplayOrder
                    }).ToList()
                })
                .ToListAsync();

            return Ok(new ApiResponseDto<List<ProductDto>>(products));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving featured products");
            return StatusCode(500, new ApiResponseDto<List<ProductDto>>("Internal server error"));
        }
    }
}

public class CategoryDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int? ParentCategoryId { get; set; }
    public int DisplayOrder { get; set; }
    public int ProductsCount { get; set; }
}
