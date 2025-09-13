namespace Dockex.API.Services;

public interface IImageStorageService
{
    Task<(bool Success, string Url, string? Error)> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default);
}

