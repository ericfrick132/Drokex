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
public class CompaniesController : BaseTenantController
{
    private readonly ApplicationDbContext _context;

    public CompaniesController(
        ApplicationDbContext context,
        ITenantResolutionService tenantResolution,
        ITenantService tenantService,
        ILogger<CompaniesController> logger)
        : base(tenantResolution, tenantService, logger)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<ApiResponseDto<PagedResponseDto<CompanyDto>>>> GetCompanies(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] bool? isApproved = null)
    {
        try
        {
            var query = _context.Companies.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(c => c.Name.Contains(search) || c.Description.Contains(search));
            }

            if (isApproved.HasValue)
            {
                query = query.Where(c => c.IsApproved == isApproved.Value);
            }

            query = query.Where(c => c.IsActive);

            var totalRecords = await query.CountAsync();
            var companies = await query
                .Include(c => c.Products)
                .Include(c => c.Users)
                .OrderByDescending(c => c.CreatedAt)
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
                    ApprovedAt = c.ApprovedAt,
                    UpdatedAt = c.UpdatedAt,
                    ProductsCount = c.Products.Count(p => p.IsActive),
                    UsersCount = c.Users.Count(u => u.IsActive)
                })
                .ToListAsync();

            var pagedResponse = new PagedResponseDto<CompanyDto>(companies, totalRecords, page, pageSize);
            return Ok(new ApiResponseDto<PagedResponseDto<CompanyDto>>(pagedResponse));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving companies");
            return StatusCode(500, new ApiResponseDto<PagedResponseDto<CompanyDto>>("Internal server error"));
        }
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ApiResponseDto<CompanyDto>>> GetCompany(int id)
    {
        try
        {
            var company = await _context.Companies
                .Include(c => c.Products)
                .Include(c => c.Users)
                .FirstOrDefaultAsync(c => c.Id == id && c.IsActive);

            if (company == null)
            {
                return NotFound(new ApiResponseDto<CompanyDto>("Company not found"));
            }

            var companyDto = new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                Description = company.Description,
                ContactEmail = company.ContactEmail,
                Phone = company.Phone,
                Address = company.Address,
                Website = company.Website,
                Logo = company.Logo,
                IsApproved = company.IsApproved,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                ApprovedAt = company.ApprovedAt,
                ProductsCount = company.Products.Count(p => p.IsActive),
                UsersCount = company.Users.Count(u => u.IsActive)
            };

            return Ok(new ApiResponseDto<CompanyDto>(companyDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving company {CompanyId}", id);
            return StatusCode(500, new ApiResponseDto<CompanyDto>("Internal server error"));
        }
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<CompanyDto>>> CreateCompany([FromBody] CreateCompanyDto createCompanyDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<CompanyDto>(errors));
            }

            // Check if company email already exists
            if (await _context.Companies.AnyAsync(c => c.ContactEmail == createCompanyDto.ContactEmail))
            {
                return BadRequest(new ApiResponseDto<CompanyDto>("Company with this email already exists"));
            }

            var company = new Company
            {
                Name = createCompanyDto.Name,
                Description = createCompanyDto.Description,
                ContactEmail = createCompanyDto.ContactEmail,
                Phone = createCompanyDto.Phone,
                Address = createCompanyDto.Address,
                Website = createCompanyDto.Website,
                IsApproved = false, // Admin needs to approve
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Companies.Add(company);
            await _context.SaveChangesAsync();

            var companyDto = new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                Description = company.Description,
                ContactEmail = company.ContactEmail,
                Phone = company.Phone,
                Address = company.Address,
                Website = company.Website,
                Logo = company.Logo,
                IsApproved = company.IsApproved,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                ApprovedAt = company.ApprovedAt,
                ProductsCount = 0,
                UsersCount = 0
            };

            return CreatedAtAction(nameof(GetCompany), new { id = company.Id }, 
                new ApiResponseDto<CompanyDto>(companyDto, "Company created successfully. Awaiting admin approval."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating company");
            return StatusCode(500, new ApiResponseDto<CompanyDto>("Internal server error"));
        }
    }

    [HttpPut("{id}")]
    [Authorize]
    public async Task<ActionResult<ApiResponseDto<CompanyDto>>> UpdateCompany(int id, [FromBody] UpdateCompanyDto updateCompanyDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<CompanyDto>(errors));
            }

            var company = await _context.Companies.FindAsync(id);
            if (company == null || !company.IsActive)
            {
                return NotFound(new ApiResponseDto<CompanyDto>("Company not found"));
            }

            // Check authorization: User must be admin or belong to this company
            var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
            var userCompanyId = User.FindFirst("CompanyId")?.Value;

            if (userRole != "Admin" && (userCompanyId == null || int.Parse(userCompanyId) != id))
            {
                return Forbid();
            }

            // Check if new email already exists (excluding current company)
            if (updateCompanyDto.ContactEmail != company.ContactEmail &&
                await _context.Companies.AnyAsync(c => c.ContactEmail == updateCompanyDto.ContactEmail && c.Id != id))
            {
                return BadRequest(new ApiResponseDto<CompanyDto>("Company with this email already exists"));
            }

            company.Name = updateCompanyDto.Name;
            company.Description = updateCompanyDto.Description;
            company.ContactEmail = updateCompanyDto.ContactEmail;
            company.Phone = updateCompanyDto.Phone;
            company.Address = updateCompanyDto.Address;
            company.Website = updateCompanyDto.Website;
            if (!string.IsNullOrWhiteSpace(updateCompanyDto.Logo))
            {
                company.Logo = updateCompanyDto.Logo!;
            }

            await _context.SaveChangesAsync();

            var companyDto = new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                Description = company.Description,
                ContactEmail = company.ContactEmail,
                Phone = company.Phone,
                Address = company.Address,
                Website = company.Website,
                Logo = company.Logo,
                IsApproved = company.IsApproved,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                ApprovedAt = company.ApprovedAt,
                ProductsCount = await _context.Products.CountAsync(p => p.CompanyId == id && p.IsActive),
                UsersCount = await _context.Users.CountAsync(u => u.CompanyId == id && u.IsActive)
            };

            return Ok(new ApiResponseDto<CompanyDto>(companyDto, "Company updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating company {CompanyId}", id);
            return StatusCode(500, new ApiResponseDto<CompanyDto>("Internal server error"));
        }
    }

    [HttpPost("{id}/approve")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<CompanyDto>>> ApproveCompany(int id)
    {
        try
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null || !company.IsActive)
            {
                return NotFound(new ApiResponseDto<CompanyDto>("Company not found"));
            }

            company.IsApproved = true;
            company.ApprovedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var companyDto = new CompanyDto
            {
                Id = company.Id,
                Name = company.Name,
                Description = company.Description,
                ContactEmail = company.ContactEmail,
                Phone = company.Phone,
                Address = company.Address,
                Website = company.Website,
                Logo = company.Logo,
                IsApproved = company.IsApproved,
                IsActive = company.IsActive,
                CreatedAt = company.CreatedAt,
                ApprovedAt = company.ApprovedAt,
                ProductsCount = await _context.Products.CountAsync(p => p.CompanyId == id && p.IsActive),
                UsersCount = await _context.Users.CountAsync(u => u.CompanyId == id && u.IsActive)
            };

            return Ok(new ApiResponseDto<CompanyDto>(companyDto, "Company approved successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error approving company {CompanyId}", id);
            return StatusCode(500, new ApiResponseDto<CompanyDto>("Internal server error"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<bool>>> DeleteCompany(int id)
    {
        try
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
            {
                return NotFound(new ApiResponseDto<bool>("Company not found"));
            }

            company.IsActive = false;
            await _context.SaveChangesAsync();

            return Ok(new ApiResponseDto<bool>(true, "Company deactivated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting company {CompanyId}", id);
            return StatusCode(500, new ApiResponseDto<bool>("Internal server error"));
        }
    }

    [HttpPost("{id}/reject")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<bool>>> RejectCompany(int id, [FromBody] RejectCompanyDto dto)
    {
        try
        {
            var company = await _context.Companies.FindAsync(id);
            if (company == null)
            {
                return NotFound(new ApiResponseDto<bool>("Company not found"));
            }

            // Rechazar: mantener IsApproved = false y opcionalmente desactivar la compañía
            company.IsApproved = false;
            if (dto.Deactivate)
            {
                company.IsActive = false;
            }
            company.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Notificación (placeholder): loggear envío de correo al contacto
            _logger.LogInformation("Company {CompanyId} rejected. Reason: {Reason}. Email: {Email}", id, dto.Reason, company.ContactEmail);

            return Ok(new ApiResponseDto<bool>(true, "Company rejected"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error rejecting company {CompanyId}", id);
            return StatusCode(500, new ApiResponseDto<bool>("Internal server error"));
        }
    }
}

public class RejectCompanyDto
{
    public string Reason { get; set; } = string.Empty;
    public bool Deactivate { get; set; } = true;
}
