using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace Dockex.API.Services;

public class CloudinaryImageStorageService : IImageStorageService
{
    private readonly HttpClient _http;
    private readonly string _cloudName;
    private readonly string _apiKey;
    private readonly string _apiSecret;
    private readonly string? _uploadPreset; // If set, use unsigned upload
    private readonly string? _folder;

    public CloudinaryImageStorageService(IConfiguration config)
    {
        _http = new HttpClient();
        _cloudName = config["Cloudinary:CloudName"] ?? string.Empty;
        _apiKey = config["Cloudinary:ApiKey"] ?? string.Empty;
        _apiSecret = config["Cloudinary:ApiSecret"] ?? string.Empty;
        _uploadPreset = config["Cloudinary:UploadPreset"]; // optional (unsigned)
        _folder = config["Cloudinary:Folder"]; // optional
        if (string.IsNullOrWhiteSpace(_cloudName)) throw new InvalidOperationException("Cloudinary CloudName not configured");
        // For unsigned uploads, ApiKey/Secret can be empty if UploadPreset is configured to allow unsigned
    }

    public async Task<(bool Success, string Url, string? Error)> UploadAsync(Stream stream, string fileName, string contentType, CancellationToken ct = default)
    {
        try
        {
            var endpoint = $"https://api.cloudinary.com/v1_1/{_cloudName}/image/upload";
            using var form = new MultipartFormDataContent();

            // File content
            var fileContent = new StreamContent(stream);
            if (!string.IsNullOrEmpty(contentType))
            {
                fileContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
            }
            form.Add(fileContent, "file", fileName);

            if (!string.IsNullOrWhiteSpace(_uploadPreset))
            {
                // Unsigned upload
                form.Add(new StringContent(_uploadPreset), "upload_preset");
                if (!string.IsNullOrWhiteSpace(_folder))
                {
                    form.Add(new StringContent(_folder), "folder");
                }
            }
            else
            {
                // Signed upload requires api_key, timestamp and signature
                if (string.IsNullOrWhiteSpace(_apiKey) || string.IsNullOrWhiteSpace(_apiSecret))
                {
                    return (false, string.Empty, "Cloudinary signed upload requires ApiKey and ApiSecret or an unsigned UploadPreset");
                }

                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString();
                var publicId = Path.GetFileNameWithoutExtension(fileName) + "_" + Guid.NewGuid().ToString("N");

                // Build parameters to sign (alphabetical order). Exclude 'file'.
                var parameters = new SortedDictionary<string, string>(StringComparer.Ordinal)
                {
                    {"public_id", publicId},
                    {"timestamp", timestamp}
                };
                if (!string.IsNullOrWhiteSpace(_folder)) parameters.Add("folder", _folder!);

                var toSign = string.Join("&", parameters.Select(kv => $"{kv.Key}={kv.Value}")) + _apiSecret;
                var signature = Sha1Hex(toSign);

                form.Add(new StringContent(_apiKey), "api_key");
                form.Add(new StringContent(timestamp), "timestamp");
                form.Add(new StringContent(signature), "signature");
                form.Add(new StringContent(publicId), "public_id");
                if (!string.IsNullOrWhiteSpace(_folder)) form.Add(new StringContent(_folder!), "folder");
            }

            using var resp = await _http.PostAsync(endpoint, form, ct);
            var body = await resp.Content.ReadAsStringAsync(ct);
            if (!resp.IsSuccessStatusCode)
            {
                return (false, string.Empty, $"Cloudinary error {resp.StatusCode}: {body}");
            }

            using var doc = JsonDocument.Parse(body);
            var root = doc.RootElement;
            var secureUrl = root.TryGetProperty("secure_url", out var su) ? su.GetString() : null;
            var url = secureUrl ?? (root.TryGetProperty("url", out var u) ? u.GetString() : null);
            if (string.IsNullOrEmpty(url))
            {
                return (false, string.Empty, "Upload succeeded but no URL returned");
            }
            return (true, url!, null);
        }
        catch (Exception ex)
        {
            return (false, string.Empty, ex.Message);
        }
    }

    private static string Sha1Hex(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        var hash = SHA1.HashData(bytes);
        var sb = new StringBuilder(hash.Length * 2);
        foreach (var b in hash) sb.Append(b.ToString("x2"));
        return sb.ToString();
    }
}

