using Microsoft.AspNetCore.Hosting;

namespace Dockex.API.Services;

public class LocalImageStorageService : IImageStorageService
{
    private readonly string _uploadsPath;
    private readonly string _baseUrl;

    public LocalImageStorageService(IWebHostEnvironment env, IConfiguration config)
    {
        _uploadsPath = Path.Combine(env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot"), "uploads");
        Directory.CreateDirectory(_uploadsPath);
        _baseUrl = config["PublicBaseUrl"]?.TrimEnd('/') ?? string.Empty;
    }

    public async Task<(bool Success, string Url, string? Error)> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        try
        {
            var ext = Path.GetExtension(fileName);
            var safeName = $"{Guid.NewGuid():N}{ext}";
            var fullPath = Path.Combine(_uploadsPath, safeName);
            using (var fs = new FileStream(fullPath, FileMode.Create, FileAccess.Write, FileShare.None))
            {
                await stream.CopyToAsync(fs, ct);
            }
            var urlPath = $"/uploads/{safeName}";
            var url = string.IsNullOrEmpty(_baseUrl) ? urlPath : _baseUrl + urlPath;
            return (true, url, null);
        }
        catch (Exception ex)
        {
            return (false, string.Empty, ex.Message);
        }
    }
}

