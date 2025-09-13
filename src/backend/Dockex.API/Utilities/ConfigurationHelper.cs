using System.Text.RegularExpressions;

namespace Dockex.API.Utilities;

public static class ConfigurationHelper
{
    public static string GetConnectionString(IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        
        if (string.IsNullOrEmpty(connectionString))
        {
            connectionString = Environment.GetEnvironmentVariable("DATABASE_URL");
        }
        
        if (string.IsNullOrEmpty(connectionString))
        {
            throw new InvalidOperationException("No database connection string found. Check CONNECTION_STRINGS:DefaultConnection or DATABASE_URL environment variable.");
        }
        
        // Si es una URL de PostgreSQL, convertirla al formato de connection string
        if (connectionString.StartsWith("postgres://") || connectionString.StartsWith("postgresql://"))
        {
            return ConvertPostgreSqlUrlToConnectionString(connectionString);
        }
        
        return connectionString;
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