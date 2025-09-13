using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Dockex.API.Data;
using Dockex.API.Services;
using Dockex.API.Utilities;
using Dockex.API.Middleware;

Console.WriteLine("=== INICIANDO APLICACIÓN DROKEX MULTI-TENANT ===");
Console.WriteLine($"Puerto Environment Variable: {Environment.GetEnvironmentVariable("PORT")}");
Console.WriteLine($"Environment: {Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}");
Console.WriteLine($"Brand: DROKEX - Connecting LATAM Businesses");

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// ==========================================
// CONFIGURACIÓN MULTI-TENANT DROKEX
// ==========================================

// Servicios HTTP Context para resolución de tenants
builder.Services.AddHttpContextAccessor();

// Servicios de Multi-Tenancy
builder.Services.AddScoped<ITenantResolutionService, TenantResolutionService>();
builder.Services.AddScoped<ITenantService, TenantService>();

// Configure CORS para multi-tenant
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowDrokexTenants", policy =>
    {
        var origins = new List<string> {
            "http://localhost:3100",
            "https://drokex.com",
            "https://www.drokex.com",
            "https://app.drokex.com",
            "https://admin.drokex.com",
            // Dominios multi-tenant LATAM
            "https://honduras.drokex.com",
            "https://guatemala.drokex.com",
            "https://mexico.drokex.com",
            "https://dominicana.drokex.com",
            "https://elsalvador.drokex.com"
        };

        var frontendUrl = builder.Configuration["FrontendUrl"];
        if (!string.IsNullOrEmpty(frontendUrl))
        {
            origins.Add(frontendUrl);
        }

        var additionalOrigins = builder.Configuration["AdditionalCorsOrigins"];
        if (!string.IsNullOrEmpty(additionalOrigins))
        {
            origins.AddRange(additionalOrigins.Split(',', StringSplitOptions.RemoveEmptyEntries));
        }

        policy.WithOrigins(origins.ToArray())
              .SetIsOriginAllowed(origin =>
              {
                  try
                  {
                      var uri = new Uri(origin);
                      var host = uri.Host.ToLower();
                      // Permitir subdominios de drokex.com
                      if (host.EndsWith(".drokex.com")) return true;
                      // Permitir subdominios de localhost en dev (e.g., honduras.localhost:3100)
                      if ((host == "localhost" || host.EndsWith(".localhost")) && (uri.Port == 3100 || uri.Port == 3000 || uri.Port == 5173)) return true;
                  }
                  catch { }
                  return origins.Contains(origin);
              })
              .AllowAnyMethod()
              .AllowAnyHeader()
              .AllowCredentials();
    });
});

// Configure JWT Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(
                builder.Configuration["Jwt:Key"] ?? "dockex-secret-key-minimum-32-characters-long")),
            ValidateIssuer = false,
            ValidateAudience = false,
            ClockSkew = TimeSpan.Zero
        };

        // Permitir leer token desde cookie y query para flujos de impersonación
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                // 1) Token en cookie (preferido)
                var cookieToken = context.Request.Cookies["drokex_auth"];
                if (!string.IsNullOrEmpty(cookieToken) && string.IsNullOrEmpty(context.Token))
                {
                    context.Token = cookieToken;
                }

                // 2) Token en query (solo para endpoints explícitos)
                if (string.IsNullOrEmpty(context.Token))
                {
                    var q = context.Request.Query["token"].FirstOrDefault();
                    if (!string.IsNullOrEmpty(q))
                    {
                        context.Token = q;
                    }
                }

                return Task.CompletedTask;
            }
        };
    });

// Configure DbContext
builder.Services.AddDbContext<ApplicationDbContext>(options =>
{
    var connectionString = ConfigurationHelper.GetConnectionString(builder.Configuration);
    options.UseNpgsql(connectionString);
    options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
});

// Register Services
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddSingleton<IImageStorageService, CloudinaryImageStorageService>();
Console.WriteLine("🖼️ Using Cloudinary image storage (forced)");
builder.Services.AddSingleton<IEmailService, SmtpEmailService>();
builder.Services.AddScoped<DbSeeder>();

// Configure Swagger with JWT support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "DROKEX API - Multi-Tenant",
        Version = "v1",
        Description = "API para la plataforma DROKEX - Connecting LATAM Businesses | Multi-Tenant Architecture",
        Contact = new OpenApiContact
        {
            Name = "Drokex Team",
            Email = "developers@drokex.com"
        },
        License = new OpenApiLicense
        {
            Name = "Drokex License"
        }
    });
   
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
   
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Apply migrations on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    try
    {
        var hasMigrations = (dbContext.Database.GetMigrations()?.Any() ?? false);
        if (hasMigrations)
        {
            dbContext.Database.Migrate();
            Console.WriteLine("✅ Drokex database migrations applied successfully");
        }
        else
        {
            await dbContext.Database.EnsureCreatedAsync();
            Console.WriteLine("✅ Database created from model (no migrations present)");
        }
        Console.WriteLine("✅ Multi-tenant schema initialized");
        
        // Verificar tenants por defecto
        var tenantCount = dbContext.Tenants.Count();
        Console.WriteLine($"✅ Tenants configurados: {tenantCount}");
        
        if (tenantCount > 0)
        {
            var tenants = dbContext.Tenants.Select(t => new { t.Subdomain, t.Country }).ToList();
            foreach (var tenant in tenants)
            {
                Console.WriteLine($"   • {tenant.Country}: https://{tenant.Subdomain}.drokex.com");
            }
        }

        // Ejecutar seeder para datos de ejemplo
        var seeder = scope.ServiceProvider.GetRequiredService<DbSeeder>();
        await seeder.SeedAsync();
        Console.WriteLine("✅ Database seeding completed");
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "❌ An error occurred while migrating the Drokex database");
    }
}

// ==========================================
// PIPELINE DE DROKEX MULTI-TENANT
// ==========================================

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment() || builder.Configuration.GetValue<bool>("EnableSwaggerInProduction", false))
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "DROKEX API v1 - Multi-Tenant");
        c.DocumentTitle = "Drokex API Documentation";
        c.RoutePrefix = "swagger";
    });
}

app.UseHttpsRedirection();
app.UseCors("AllowDrokexTenants");

// MIDDLEWARE CRÍTICO: Resolución de tenant ANTES de auth
app.UseTenantResolution();

app.UseAuthentication();
app.UseAuthorization();

// Health check endpoints para Drokex
app.MapGet("/health", () => Results.Ok(new { 
    status = "healthy", 
    application = "Drokex Multi-Tenant API",
    version = "1.0.0",
    brand = "Connecting LATAM Businesses",
    timestamp = DateTime.UtcNow,
    multiTenant = true
}));

app.MapGet("/ping", () => Results.Ok(new { 
    status = "pong",
    application = "Drokex",
    timestamp = DateTime.UtcNow 
}));

// Endpoint para información de tenant (debugging)
app.MapGet("/tenant-info", (ITenantResolutionService tenantResolution) => 
{
    return Results.Ok(new
    {
        currentTenantId = tenantResolution.GetCurrentTenantId(),
        currentTenantSubdomain = tenantResolution.GetCurrentTenantSubdomain(),
        hasTenant = tenantResolution.HasCurrentTenant(),
        timestamp = DateTime.UtcNow,
        message = "Drokex Tenant Resolution Info"
    });
});

app.MapControllers();

// Configure port for Digital Ocean (CRITICAL for deployment)
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
var url = $"http://0.0.0.0:{port}";

Console.WriteLine("==========================================");
Console.WriteLine("🚀 DROKEX MULTI-TENANT API INICIADA");
Console.WriteLine($"📡 Escuchando en: {url}");
Console.WriteLine("🌎 Regiones disponibles:");
Console.WriteLine("   • Honduras: honduras.drokex.com");
Console.WriteLine("   • Guatemala: guatemala.drokex.com"); 
Console.WriteLine("   • México: mexico.drokex.com");
Console.WriteLine("🔧 Desarrollo: honduras.localhost:3100");
Console.WriteLine("📚 Documentación: /swagger");
Console.WriteLine("💚 Drokex - Connecting LATAM Businesses");
Console.WriteLine("==========================================");

app.Run(url);
