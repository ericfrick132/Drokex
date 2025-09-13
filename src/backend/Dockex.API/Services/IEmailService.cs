using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using System.Net;
using System.Net.Mail;

namespace Dockex.API.Services;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string htmlBody);
}

public class SmtpEmailService : IEmailService
{
    private readonly ILogger<SmtpEmailService> _logger;
    private readonly IConfiguration _config;

    public SmtpEmailService(ILogger<SmtpEmailService> logger, IConfiguration config)
    {
        _logger = logger;
        _config = config;
    }

    public async Task SendEmailAsync(string to, string subject, string htmlBody)
    {
        var host = _config["Email:Smtp:Host"];
        var port = int.TryParse(_config["Email:Smtp:Port"], out var p) ? p : 587;
        var user = _config["Email:Smtp:User"];
        var pass = _config["Email:Smtp:Password"];
        var from = _config["Email:FromEmail"] ?? "noreply@drokex.com";
        var fromName = _config["Email:FromName"] ?? "Drokex";

        if (string.IsNullOrEmpty(host) || string.IsNullOrEmpty(user) || string.IsNullOrEmpty(pass))
        {
            _logger.LogWarning("EmailService not configured. To: {To}, Subject: {Subject}", to, subject);
            _logger.LogInformation("Email body: {Body}", htmlBody);
            return;
        }

        using var client = new SmtpClient(host, port)
        {
            Credentials = new NetworkCredential(user, pass),
            EnableSsl = true
        };
        using var msg = new MailMessage()
        {
            From = new MailAddress(from, fromName),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };
        msg.To.Add(to);
        await client.SendMailAsync(msg);
        _logger.LogInformation("Email sent to {To} — Subject: {Subject}", to, subject);
    }
}

