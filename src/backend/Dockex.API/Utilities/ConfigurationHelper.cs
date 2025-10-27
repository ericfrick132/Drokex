using System.Text.RegularExpressions;

namespace Dockex.API.Utilities;

public static class ConfigurationHelper
{
    public static string GetConnectionString(IConfiguration configuration)
    {
        // Preferir DATABASE_URL en entornos gestionados (DO, Heroku, etc.)
        var databaseUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        if (!string.IsNullOrWhiteSpace(databaseUrl))
        {
            try { Console.WriteLine("DB Config: Using DATABASE_URL"); } catch { }
            if (databaseUrl.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
                databaseUrl.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            {
                return ConvertPostgreSqlUrlToConnectionString(databaseUrl);
            }
            return databaseUrl;
        }

        // Fallback: ConnectionStrings:DefaultConnection (appsettings o env ConnectionStrings__DefaultConnection)
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (!string.IsNullOrWhiteSpace(connectionString))
        {
            try { Console.WriteLine("DB Config: Using ConnectionStrings:DefaultConnection"); } catch { }
            if (connectionString.StartsWith("postgres://", StringComparison.OrdinalIgnoreCase) ||
                connectionString.StartsWith("postgresql://", StringComparison.OrdinalIgnoreCase))
            {
                return ConvertPostgreSqlUrlToConnectionString(connectionString);
            }
            return connectionString;
        }

        throw new InvalidOperationException("No database connection string found. Set DATABASE_URL or ConnectionStrings:DefaultConnection.");
    }
    
    private static string ConvertPostgreSqlUrlToConnectionString(string databaseUrl)
    {
        var regex = new Regex(@"^postgres(?:ql)?://(?<username>[^:]+):(?<password>[^@]+)@(?<host>[^:]+):(?<port>\d+)/(?<database>[^?]+)(?:\?(?<params>.*))?$");
        var match = regex.Match(databaseUrl);
        
        if (!match.Success)
        {
            // Si no coincide el patrón, devolver la URL original y dejar que EF maneje el error
            return databaseUrl;
        }
        
        var host = match.Groups["host"].Value;
        var port = match.Groups["port"].Value;
        var database = match.Groups["database"].Value;
        var username = match.Groups["username"].Value;
        var password = match.Groups["password"].Value;
        var parameters = match.Groups["params"].Value;
        
        var connectionString = $"Host={host};Port={port};Database={database};Username={username};Password={password}";
        
        // Agregar SSL si está en los parámetros
        if (parameters.Contains("sslmode=require", StringComparison.OrdinalIgnoreCase))
        {
            connectionString += ";SslMode=Require";
        }
        
        return connectionString;
    }
}
