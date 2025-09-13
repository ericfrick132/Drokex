using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Dockex.API.Data;
using Dockex.API.DTOs;
using Dockex.API.Models;
using Dockex.API.Services;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProductsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ProductsController> _logger;
    private readonly ITenantResolutionService _tenantResolution;

    public ProductsController(ApplicationDbContext context, ILogger<ProductsController> logger, ITenantResolutionService tenantResolution)
    {
        _context = context;
        _logger = logger;
        _tenantResolution = tenantResolution;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<PagedResponseDto<ProductDto>>>> GetProducts(
        [FromQuery] ProductSearchDto searchDto)
    {
        try
        {
            var currentTenantId = _tenantResolution.GetCurrentTenantId();
            if (!currentTenantId.HasValue)
            {
                return BadRequest(new ApiResponseDto<PagedResponseDto<ProductDto>>("Tenant requerido"));
            }
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userCompanyId = User.FindFirst("CompanyId")?.Value;

            var query = _context.Products
                .Include(p => p.Company)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Where(p => p.TenantId == currentTenantId.Value)
                .AsQueryable();

            // Filter by company for providers
            if (userRole == "Provider" && userCompanyId != null)
            {
                query = query.Where(p => p.CompanyId == int.Parse(userCompanyId));
            }

            // Search and filters
            if (!string.IsNullOrEmpty(searchDto.Search))
            {
                query = query.Where(p => p.Name.Contains(searchDto.Search) || p.Description.Contains(searchDto.Search));
            }

            if (searchDto.CategoryId.HasValue)
            {
                query = query.Where(p => p.CategoryId == searchDto.CategoryId.Value);
            }

            if (searchDto.MinPrice.HasValue)
            {
                query = query.Where(p => p.Price >= searchDto.MinPrice.Value);
            }

            if (searchDto.MaxPrice.HasValue)
            {
                query = query.Where(p => p.Price <= searchDto.MaxPrice.Value);
            }

            // Sorting
            var sortBy = (searchDto.SortBy ?? "CreatedAt").ToLower();
            var sortOrder = (searchDto.SortOrder ?? "desc").ToLower();
            query = sortBy switch
            {
                "name" => sortOrder == "desc" ? query.OrderByDescending(p => p.Name) : query.OrderBy(p => p.Name),
                "price" => sortOrder == "desc" ? query.OrderByDescending(p => p.Price) : query.OrderBy(p => p.Price),
                "stock" => sortOrder == "desc" ? query.OrderByDescending(p => p.Stock) : query.OrderBy(p => p.Stock),
                "isactive" => sortOrder == "desc" ? query.OrderByDescending(p => p.IsActive) : query.OrderBy(p => p.IsActive),
                _ => sortOrder == "desc" ? query.OrderByDescending(p => p.CreatedAt) : query.OrderBy(p => p.CreatedAt)
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
            _logger.LogError(ex, "Error retrieving products");
            return StatusCode(500, new ApiResponseDto<PagedResponseDto<ProductDto>>("Internal server error"));
        }
    }

    [HttpPost("{id}/images")]
    [Authorize(Roles = "Provider")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> AddImage(int id, [FromBody] CreateProductImageRequest request)
    {
        try
        {
            var userCompanyId = User.FindFirst("CompanyId")?.Value;
            if (userCompanyId == null || !int.TryParse(userCompanyId, out var companyId))
            {
                return BadRequest(new ApiResponseDto<ProductDto>("User must belong to a company"));
            }

            var product = await _context.Products
                .Include(p => p.Images)
                .Include(p => p.Company)
                .FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == companyId);

            if (product == null)
            {
                return NotFound(new ApiResponseDto<ProductDto>("Product not found"));
            }

            var nextOrder = product.Images.Any() ? product.Images.Max(i => i.DisplayOrder) + 1 : 0;
            var image = new ProductImage
            {
                ProductId = id,
                TenantId = product.TenantId,
                ImageUrl = request.ImageUrl,
                IsPrimary = request.IsPrimary && !product.Images.Any(i => i.IsPrimary),
                DisplayOrder = request.DisplayOrder ?? nextOrder,
                MimeType = request.MimeType,
                FileSizeBytes = request.FileSizeBytes,
            };

            // If forced primary, unset others
            if (request.IsPrimary)
            {
                foreach (var img in product.Images)
                {
                    img.IsPrimary = false;
                }
                image.IsPrimary = true;
            }

            _context.ProductImages.Add(image);
            await _context.SaveChangesAsync();

            await _context.Entry(product).Collection(p => p.Images).LoadAsync();

            var dto = await BuildProductDto(product.Id);
            return Ok(new ApiResponseDto<ProductDto>(dto, "Image added"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding product image {ProductId}", id);
            return StatusCode(500, new ApiResponseDto<ProductDto>("Internal server error"));
        }
    }

    [HttpDelete("{id}/images/{imageId}")]
    [Authorize(Roles = "Provider")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> DeleteImage(int id, int imageId)
    {
        try
        {
            var userCompanyId = User.FindFirst("CompanyId")?.Value;
            if (userCompanyId == null || !int.TryParse(userCompanyId, out var companyId))
            {
                return BadRequest(new ApiResponseDto<ProductDto>("User must belong to a company"));
            }

            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == companyId);

            if (product == null)
            {
                return NotFound(new ApiResponseDto<ProductDto>("Product not found"));
            }

            var imgToDelete = product.Images.FirstOrDefault(i => i.Id == imageId);
            if (imgToDelete == null)
            {
                return NotFound(new ApiResponseDto<ProductDto>("Image not found"));
            }

            var wasPrimary = imgToDelete.IsPrimary;
            _context.ProductImages.Remove(imgToDelete);
            await _context.SaveChangesAsync();

            if (wasPrimary)
            {
                var first = await _context.ProductImages.Where(i => i.ProductId == id).OrderBy(i => i.DisplayOrder).FirstOrDefaultAsync();
                if (first != null)
                {
                    first.IsPrimary = true;
                    await _context.SaveChangesAsync();
                }
            }

            var dto = await BuildProductDto(id);
            return Ok(new ApiResponseDto<ProductDto>(dto, "Image deleted"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product image {ProductId}/{ImageId}", id, imageId);
            return StatusCode(500, new ApiResponseDto<ProductDto>("Internal server error"));
        }
    }

    [HttpPost("{id}/images/{imageId}/primary")]
    [Authorize(Roles = "Provider")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> SetPrimaryImage(int id, int imageId)
    {
        try
        {
            var userCompanyId = User.FindFirst("CompanyId")?.Value;
            if (userCompanyId == null || !int.TryParse(userCompanyId, out var companyId))
            {
                return BadRequest(new ApiResponseDto<ProductDto>("User must belong to a company"));
            }

            var product = await _context.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == companyId);

            if (product == null)
            {
                return NotFound(new ApiResponseDto<ProductDto>("Product not found"));
            }

            var toPrimary = product.Images.FirstOrDefault(i => i.Id == imageId);
            if (toPrimary == null)
            {
                return NotFound(new ApiResponseDto<ProductDto>("Image not found"));
            }

            foreach (var img in product.Images) img.IsPrimary = false;
            toPrimary.IsPrimary = true;
            await _context.SaveChangesAsync();

            var dto = await BuildProductDto(id);
            return Ok(new ApiResponseDto<ProductDto>(dto, "Primary image set"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error setting primary image {ProductId}/{ImageId}", id, imageId);
            return StatusCode(500, new ApiResponseDto<ProductDto>("Internal server error"));
        }
    }

    private async Task<ProductDto> BuildProductDto(int id)
    {
        var product = await _context.Products
            .Include(p => p.Company)
            .Include(p => p.Category)
            .Include(p => p.Images)
            .FirstAsync(p => p.Id == id);

        return new ProductDto
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
    }
    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> GetProduct(int id)
    {
        try
        {
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userCompanyId = User.FindFirst("CompanyId")?.Value;

            var query = _context.Products
                .Include(p => p.Company)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .AsQueryable();

            // Filter by company for providers
            if (userRole == "Provider" && userCompanyId != null)
            {
                query = query.Where(p => p.CompanyId == int.Parse(userCompanyId));
            }

            var product = await query.FirstOrDefaultAsync(p => p.Id == id);

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

    [HttpPost]
    [Authorize(Roles = "Provider")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> CreateProduct([FromBody] CreateProductDto createProductDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<ProductDto>(errors));
            }

            var userCompanyId = User.FindFirst("CompanyId")?.Value;
            if (userCompanyId == null || !int.TryParse(userCompanyId, out var companyId))
            {
                return BadRequest(new ApiResponseDto<ProductDto>("User must belong to a company to create products"));
            }

            // Verify company exists and is approved
            var company = await _context.Companies.FindAsync(companyId);
            if (company == null || !company.IsApproved || !company.IsActive)
            {
                return BadRequest(new ApiResponseDto<ProductDto>("Company not found or not approved"));
            }

            var product = new Product
            {
                CompanyId = companyId,
                Name = createProductDto.Name,
                Description = createProductDto.Description,
                Price = createProductDto.Price,
                Stock = createProductDto.Stock,
                CategoryId = createProductDto.CategoryId,
                IsFeatured = createProductDto.IsFeatured,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            // Load related data for response
            await _context.Entry(product)
                .Reference(p => p.Company)
                .LoadAsync();
            await _context.Entry(product)
                .Reference(p => p.Category)
                .LoadAsync();

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
                Images = new List<ProductImageDto>()
            };

            return CreatedAtAction(nameof(GetProduct), new { id = product.Id },
                new ApiResponseDto<ProductDto>(productDto, "Product created successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating product");
            return StatusCode(500, new ApiResponseDto<ProductDto>("Internal server error"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Provider")]
    public async Task<ActionResult<ApiResponseDto<ProductDto>>> UpdateProduct(int id, [FromBody] UpdateProductDto updateProductDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<ProductDto>(errors));
            }

            var userCompanyId = User.FindFirst("CompanyId")?.Value;
            if (userCompanyId == null || !int.TryParse(userCompanyId, out var companyId))
            {
                return BadRequest(new ApiResponseDto<ProductDto>("User must belong to a company"));
            }

            var product = await _context.Products
                .Include(p => p.Company)
                .Include(p => p.Category)
                .FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == companyId);

            if (product == null)
            {
                return NotFound(new ApiResponseDto<ProductDto>("Product not found"));
            }

            product.Name = updateProductDto.Name;
            product.Description = updateProductDto.Description;
            product.Price = updateProductDto.Price;
            product.Stock = updateProductDto.Stock;
            product.CategoryId = updateProductDto.CategoryId;
            product.IsActive = updateProductDto.IsActive;
            product.IsFeatured = updateProductDto.IsFeatured;
            product.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

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
                Images = await _context.ProductImages
                    .Where(pi => pi.ProductId == id)
                    .OrderBy(pi => pi.DisplayOrder)
                    .Select(pi => new ProductImageDto
                    {
                        Id = pi.Id,
                        ImageUrl = pi.ImageUrl,
                        IsPrimary = pi.IsPrimary,
                        DisplayOrder = pi.DisplayOrder
                    })
                    .ToListAsync()
            };

            return Ok(new ApiResponseDto<ProductDto>(productDto, "Product updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating product {ProductId}", id);
            return StatusCode(500, new ApiResponseDto<ProductDto>("Internal server error"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Provider")]
    public async Task<ActionResult<ApiResponseDto<bool>>> DeleteProduct(int id)
    {
        try
        {
            var userCompanyId = User.FindFirst("CompanyId")?.Value;
            if (userCompanyId == null || !int.TryParse(userCompanyId, out var companyId))
            {
                return BadRequest(new ApiResponseDto<bool>("User must belong to a company"));
            }

            var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id && p.CompanyId == companyId);
            if (product == null)
            {
                return NotFound(new ApiResponseDto<bool>("Product not found"));
            }

            product.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponseDto<bool>(true, "Product deactivated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting product {ProductId}", id);
            return StatusCode(500, new ApiResponseDto<bool>("Internal server error"));
        }
    }
}
