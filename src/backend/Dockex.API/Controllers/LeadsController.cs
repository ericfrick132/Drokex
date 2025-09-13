using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Dockex.API.Data;
using Dockex.API.DTOs;
using Dockex.API.Models;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LeadsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<LeadsController> _logger;

    public LeadsController(ApplicationDbContext context, ILogger<LeadsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpPost]
    public async Task<ActionResult<ApiResponseDto<LeadDto>>> CreateLead([FromBody] CreateLeadDto createLeadDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<LeadDto>(errors));
            }

            // Check if lead with this email already exists in the last 24 hours (prevent spam)
            var existingLead = await _context.Leads
                .FirstOrDefaultAsync(l => l.Email == createLeadDto.Email && 
                                        l.CreatedAt > DateTime.UtcNow.AddHours(-24));

            if (existingLead != null)
            {
                return BadRequest(new ApiResponseDto<LeadDto>("You have already submitted a request in the last 24 hours"));
            }

            var lead = new Lead
            {
                CompanyName = createLeadDto.CompanyName,
                ContactName = createLeadDto.ContactName,
                Email = createLeadDto.Email,
                Phone = createLeadDto.Phone,
                Message = createLeadDto.Message,
                CreatedAt = DateTime.UtcNow,
                IsContacted = false
            };

            _context.Leads.Add(lead);
            await _context.SaveChangesAsync();

            var leadDto = new LeadDto
            {
                Id = lead.Id,
                CompanyName = lead.CompanyName,
                ContactName = lead.ContactName,
                Email = lead.Email,
                Phone = lead.Phone,
                Message = lead.Message,
                CreatedAt = lead.CreatedAt,
                ContactedAt = lead.ContactedAt,
                IsContacted = lead.IsContacted,
                Notes = lead.Notes
            };

            return CreatedAtAction(nameof(GetLead), new { id = lead.Id }, 
                new ApiResponseDto<LeadDto>(leadDto, "Thank you for your interest! We will contact you soon."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating lead");
            return StatusCode(500, new ApiResponseDto<LeadDto>("Internal server error"));
        }
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<PagedResponseDto<LeadDto>>>> GetLeads(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] bool? isContacted = null,
        [FromQuery] string? search = null)
    {
        try
        {
            var query = _context.Leads.AsQueryable();

            if (isContacted.HasValue)
            {
                query = query.Where(l => l.IsContacted == isContacted.Value);
            }

            if (!string.IsNullOrEmpty(search))
            {
                query = query.Where(l => l.CompanyName.Contains(search) || 
                                       l.ContactName.Contains(search) || 
                                       l.Email.Contains(search));
            }

            var totalRecords = await query.CountAsync();
            var leads = await query
                .OrderByDescending(l => l.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(l => new LeadDto
                {
                    Id = l.Id,
                    CompanyName = l.CompanyName,
                    ContactName = l.ContactName,
                    Email = l.Email,
                    Phone = l.Phone,
                    Message = l.Message,
                    CreatedAt = l.CreatedAt,
                    ContactedAt = l.ContactedAt,
                    IsContacted = l.IsContacted,
                    Notes = l.Notes
                })
                .ToListAsync();

            var pagedResponse = new PagedResponseDto<LeadDto>(leads, totalRecords, page, pageSize);
            return Ok(new ApiResponseDto<PagedResponseDto<LeadDto>>(pagedResponse));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving leads");
            return StatusCode(500, new ApiResponseDto<PagedResponseDto<LeadDto>>("Internal server error"));
        }
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<LeadDto>>> GetLead(int id)
    {
        try
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null)
            {
                return NotFound(new ApiResponseDto<LeadDto>("Lead not found"));
            }

            var leadDto = new LeadDto
            {
                Id = lead.Id,
                CompanyName = lead.CompanyName,
                ContactName = lead.ContactName,
                Email = lead.Email,
                Phone = lead.Phone,
                Message = lead.Message,
                CreatedAt = lead.CreatedAt,
                ContactedAt = lead.ContactedAt,
                IsContacted = lead.IsContacted,
                Notes = lead.Notes
            };

            return Ok(new ApiResponseDto<LeadDto>(leadDto));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving lead {LeadId}", id);
            return StatusCode(500, new ApiResponseDto<LeadDto>("Internal server error"));
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<LeadDto>>> UpdateLead(int id, [FromBody] UpdateLeadDto updateLeadDto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return BadRequest(new ApiResponseDto<LeadDto>(errors));
            }

            var lead = await _context.Leads.FindAsync(id);
            if (lead == null)
            {
                return NotFound(new ApiResponseDto<LeadDto>("Lead not found"));
            }

            lead.IsContacted = updateLeadDto.IsContacted;
            lead.Notes = updateLeadDto.Notes;

            if (updateLeadDto.IsContacted && !lead.ContactedAt.HasValue)
            {
                lead.ContactedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();

            var leadDto = new LeadDto
            {
                Id = lead.Id,
                CompanyName = lead.CompanyName,
                ContactName = lead.ContactName,
                Email = lead.Email,
                Phone = lead.Phone,
                Message = lead.Message,
                CreatedAt = lead.CreatedAt,
                ContactedAt = lead.ContactedAt,
                IsContacted = lead.IsContacted,
                Notes = lead.Notes
            };

            return Ok(new ApiResponseDto<LeadDto>(leadDto, "Lead updated successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating lead {LeadId}", id);
            return StatusCode(500, new ApiResponseDto<LeadDto>("Internal server error"));
        }
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponseDto<bool>>> DeleteLead(int id)
    {
        try
        {
            var lead = await _context.Leads.FindAsync(id);
            if (lead == null)
            {
                return NotFound(new ApiResponseDto<bool>("Lead not found"));
            }

            _context.Leads.Remove(lead);
            await _context.SaveChangesAsync();

            return Ok(new ApiResponseDto<bool>(true, "Lead deleted successfully"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting lead {LeadId}", id);
            return StatusCode(500, new ApiResponseDto<bool>("Internal server error"));
        }
    }
}