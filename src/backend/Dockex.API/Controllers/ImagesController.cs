using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Dockex.API.DTOs;
using Dockex.API.Services;

namespace Dockex.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ImagesController : ControllerBase
{
    private readonly IImageStorageService _storage;
    private readonly ILogger<ImagesController> _logger;

    public ImagesController(IImageStorageService storage, ILogger<ImagesController> logger)
    {
        _storage = storage;
        _logger = logger;
    }

    [HttpPost("upload")]
    [Authorize(Roles = "Provider,Admin")]
    [RequestSizeLimit(20_000_000)] // 20 MB
    public async Task<ActionResult<ApiResponseDto<string>>> Upload()
    {
        try
        {
            if (Request.Form.Files.Count == 0)
            {
                return BadRequest(new ApiResponseDto<string>("No file provided"));
            }

            var file = Request.Form.Files[0];
            if (file.Length == 0)
            {
                return BadRequest(new ApiResponseDto<string>("Empty file"));
            }

            var result = await _storage.UploadAsync(file.OpenReadStream(), file.FileName, file.ContentType, HttpContext.RequestAborted);
            if (!result.Success)
            {
                return StatusCode(500, new ApiResponseDto<string>($"Upload failed: {result.Error}"));
            }

            return Ok(new ApiResponseDto<string>(result.Url, "Uploaded"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading image");
            return StatusCode(500, new ApiResponseDto<string>("Internal server error"));
        }
    }
}

