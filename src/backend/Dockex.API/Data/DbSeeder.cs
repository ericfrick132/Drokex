using Dockex.API.Models;
using Microsoft.EntityFrameworkCore;

namespace Dockex.API.Data;

public class DbSeeder
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DbSeeder> _logger;

    public DbSeeder(ApplicationDbContext context, ILogger<DbSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            // Crear la base de datos si no existe
            await _context.Database.EnsureCreatedAsync();

            // Asegurar tenants por defecto si no existen (cuando no hay migraciones)
            if (!await _context.Tenants.AnyAsync())
            {
                _logger.LogInformation("Seeding default tenants (company subdomains)");
                await _context.Tenants.AddRangeAsync(new[]
                {
                    new Tenant
                    {
                        Id = 1,
                        Name = "Café Monte Verde",
                        Subdomain = "cafemonteverde",
                        Country = "Honduras",
                        CountryCode = "HN",
                        Currency = "HNL",
                        CurrencySymbol = "L",
                        AdminEmail = "admin@cafemonteverde.drokex.com",
                        PrimaryColor = "#abd305",
                        SecondaryColor = "#006d5a",
                        TimeZone = "America/Tegucigalpa",
                        LanguageCode = "es",
                        IsActive = true,
                        CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                        IsTrialPeriod = false,
                        IsPaid = true,
                        PlanType = "Business"
                    },
                    new Tenant
                    {
                        Id = 2,
                        Name = "Textiles Maya",
                        Subdomain = "textilesmaya",
                        Country = "Guatemala",
                        CountryCode = "GT",
                        Currency = "GTQ",
                        CurrencySymbol = "Q",
                        AdminEmail = "admin@textilesmaya.drokex.com",
                        PrimaryColor = "#abd305",
                        SecondaryColor = "#006d5a",
                        TimeZone = "America/Guatemala",
                        LanguageCode = "es",
                        IsActive = true,
                        CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                        IsTrialPeriod = false,
                        IsPaid = true,
                        PlanType = "Business"
                    },
                    new Tenant
                    {
                        Id = 3,
                        Name = "Tequila Los Altos",
                        Subdomain = "tequilalosaltos",
                        Country = "México",
                        CountryCode = "MX",
                        Currency = "MXN",
                        CurrencySymbol = "$",
                        AdminEmail = "admin@tequilalosaltos.drokex.com",
                        PrimaryColor = "#abd305",
                        SecondaryColor = "#006d5a",
                        TimeZone = "America/Mexico_City",
                        LanguageCode = "es",
                        IsActive = true,
                        CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                        IsTrialPeriod = false,
                        IsPaid = true,
                        PlanType = "Enterprise"
                    }
                });
                await _context.SaveChangesAsync();
            }

            // Verificar si ya hay usuarios
            if (await _context.Users.AnyAsync())
            {
                _logger.LogInformation("Database already seeded");
                // Pero siempre crear Super Admin si no existe
                await SeedSuperAdminsAsync();
                return;
            }

            _logger.LogInformation("Starting database seeding...");

            // Obtener tenants existentes (ya creados por migrations)
            // Migrar posibles subdominios antiguos (honduras/guatemala/mexico) a nombres de empresa
            async Task<Tenant> GetOrMigrateTenantAsync(string newSub, string oldSub, string newName, string country, string code, string currency, string symbol, string timeZone)
            {
                var existing = await _context.Tenants.FirstOrDefaultAsync(t => t.Subdomain == newSub);
                if (existing != null) return existing;
                var legacy = await _context.Tenants.FirstOrDefaultAsync(t => t.Subdomain == oldSub);
                if (legacy != null)
                {
                    legacy.Subdomain = newSub;
                    legacy.Name = newName;
                    legacy.AdminEmail = $"admin@{newSub}.drokex.com";
                    legacy.Country = country;
                    legacy.CountryCode = code;
                    legacy.Currency = currency;
                    legacy.CurrencySymbol = symbol;
                    legacy.TimeZone = timeZone;
                    await _context.SaveChangesAsync();
                    return legacy;
                }
                var t = new Tenant
                {
                    Name = newName,
                    Subdomain = newSub,
                    Country = country,
                    CountryCode = code,
                    Currency = currency,
                    CurrencySymbol = symbol,
                    AdminEmail = $"admin@{newSub}.drokex.com",
                    PrimaryColor = "#abd305",
                    SecondaryColor = "#006d5a",
                    TimeZone = timeZone,
                    LanguageCode = "es",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    IsTrialPeriod = false,
                    IsPaid = true,
                    PlanType = "Business"
                };
                await _context.Tenants.AddAsync(t);
                await _context.SaveChangesAsync();
                return t;
            }

            var t1 = await GetOrMigrateTenantAsync(
                newSub: "cafemonteverde",
                oldSub: "honduras",
                newName: "Café Monte Verde",
                country: "Honduras",
                code: "HN",
                currency: "HNL",
                symbol: "L",
                timeZone: "America/Tegucigalpa");

            var t2 = await GetOrMigrateTenantAsync(
                newSub: "textilesmaya",
                oldSub: "guatemala",
                newName: "Textiles Maya",
                country: "Guatemala",
                code: "GT",
                currency: "GTQ",
                symbol: "Q",
                timeZone: "America/Guatemala");

            var t3 = await GetOrMigrateTenantAsync(
                newSub: "tequilalosaltos",
                oldSub: "mexico",
                newName: "Tequila Los Altos",
                country: "México",
                code: "MX",
                currency: "MXN",
                symbol: "$",
                timeZone: "America/Mexico_City");

            await SeedCategoriesAsync();
            await SeedUsersAndCompaniesAsync(t1, t2, t3);
            await SeedProductsAsync();
            await SeedLeadsAsync();
            await SeedActivitiesAsync();
            await SeedSuperAdminsAsync();

            await _context.SaveChangesAsync();

            _logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }
    }

    private async Task SeedCategoriesAsync()
    {
        var categories = new[]
        {
            new Category { Name = "Agricultura", Description = "Productos agrícolas y alimentarios", TenantId = 1, DisplayOrder = 1, IsActive = true },
            new Category { Name = "Textiles", Description = "Ropa y productos textiles", TenantId = 1, DisplayOrder = 2, IsActive = true },
            new Category { Name = "Artesanías", Description = "Productos artesanales y tradicionales", TenantId = 1, DisplayOrder = 3, IsActive = true },
            new Category { Name = "Café", Description = "Café de especialidad", TenantId = 1, DisplayOrder = 4, IsActive = true },
            new Category { Name = "Miel", Description = "Miel y productos apícolas", TenantId = 1, DisplayOrder = 5, IsActive = true },
            
            new Category { Name = "Agricultura", Description = "Productos agrícolas y alimentarios", TenantId = 2, DisplayOrder = 1, IsActive = true },
            new Category { Name = "Textiles", Description = "Ropa y productos textiles", TenantId = 2, DisplayOrder = 2, IsActive = true },
            new Category { Name = "Artesanías", Description = "Productos artesanales y tradicionales", TenantId = 2, DisplayOrder = 3, IsActive = true },
            new Category { Name = "Cardamomo", Description = "Cardamomo de alta calidad", TenantId = 2, DisplayOrder = 4, IsActive = true },
            
            new Category { Name = "Agricultura", Description = "Productos agrícolas y alimentarios", TenantId = 3, DisplayOrder = 1, IsActive = true },
            new Category { Name = "Textiles", Description = "Ropa y productos textiles", TenantId = 3, DisplayOrder = 2, IsActive = true },
            new Category { Name = "Artesanías", Description = "Productos artesanales y tradicionales", TenantId = 3, DisplayOrder = 3, IsActive = true },
            new Category { Name = "Aguacate", Description = "Aguacate Hass de exportación", TenantId = 3, DisplayOrder = 4, IsActive = true },
            new Category { Name = "Tequila", Description = "Tequila y bebidas espirituosas", TenantId = 3, DisplayOrder = 5, IsActive = true },
        };

        await _context.Categories.AddRangeAsync(categories);
    }

    private async Task SeedUsersAndCompaniesAsync(Tenant hondurasTenant, Tenant guatemalaTenant, Tenant mexicoTenant)
    {
        // Crear empresas de muestra
        var companies = new[]
        {
            // Honduras
            new Company
            {
                TenantId = hondurasTenant.Id,
                Name = "Café Monte Verde Honduras",
                BusinessType = "Exportador de Café",
                Description = "Productores de café de alta calidad de las montañas de Honduras",
                ContactEmail = "info@cafemonteverde.hn",
                Phone = "+504 9999-9999",
                Address = "Marcala, La Paz",
                Website = "https://cafemonteverde.hn",
                IsApproved = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-30),
                ApprovedAt = DateTime.UtcNow.AddDays(-25)
            },
            new Company
            {
                TenantId = hondurasTenant.Id,
                Name = "Miel Dorada",
                BusinessType = "Productora de Miel",
                Description = "Miel pura y orgánica de Honduras",
                ContactEmail = "ventas@mieldorada.hn",
                Phone = "+504 8888-8888",
                Address = "Siguatepeque, Comayagua",
                IsApproved = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-20),
                ApprovedAt = DateTime.UtcNow.AddDays(-18)
            },

            // Guatemala
            new Company
            {
                TenantId = guatemalaTenant.Id,
                Name = "Textiles Maya Guatemala",
                BusinessType = "Textiles Tradicionales",
                Description = "Textiles tradicionales guatemaltecos hechos a mano",
                ContactEmail = "info@textilesmaya.gt",
                Phone = "+502 5555-5555",
                Address = "Chichicastenango, Quiché",
                Website = "https://textilesmaya.gt",
                IsApproved = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-25),
                ApprovedAt = DateTime.UtcNow.AddDays(-20)
            },
            new Company
            {
                TenantId = guatemalaTenant.Id,
                Name = "Cardamomo Premium GT",
                BusinessType = "Exportador de Especias",
                Description = "Cardamomo de la más alta calidad de Guatemala",
                ContactEmail = "export@cardamomopremium.gt",
                Phone = "+502 4444-4444",
                Address = "Cobán, Alta Verapaz",
                IsApproved = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-15),
                ApprovedAt = DateTime.UtcNow.AddDays(-10)
            },

            // México
            new Company
            {
                TenantId = mexicoTenant.Id,
                Name = "Aguacates Michoacán",
                BusinessType = "Exportador de Aguacate",
                Description = "Aguacate Hass premium directo del productor",
                ContactEmail = "ventas@aguacatesmichoacan.mx",
                Phone = "+52 443 123-4567",
                Address = "Uruapan, Michoacán",
                Website = "https://aguacatesmichoacan.mx",
                IsApproved = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-40),
                ApprovedAt = DateTime.UtcNow.AddDays(-35)
            },
            new Company
            {
                TenantId = mexicoTenant.Id,
                Name = "Tequila Artesanal Los Altos",
                BusinessType = "Destilería",
                Description = "Tequila 100% agave azul de Los Altos de Jalisco",
                ContactEmail = "info@tequilalosaltos.mx",
                Phone = "+52 378 123-4567",
                Address = "Arandas, Jalisco",
                Website = "https://tequilalosaltos.mx",
                IsApproved = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-35),
                ApprovedAt = DateTime.UtcNow.AddDays(-30)
            }
        };

        await _context.Companies.AddRangeAsync(companies);
        await _context.SaveChangesAsync(); // Guardar empresas primero para obtener IDs

        // Crear usuarios administradores para cada empresa
        var users = new[]
        {
            // Honduras
            new User
            {
                TenantId = hondurasTenant.Id,
                CompanyId = companies[0].Id,
                Email = "admin@cafemonteverde.hn",
                FirstName = "Carlos",
                LastName = "Mendoza",
                PasswordHash = HashPassword("Admin123!"),
                Role = UserRole.Provider,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-30)
            },
            new User
            {
                TenantId = hondurasTenant.Id,
                CompanyId = companies[1].Id,
                Email = "admin@mieldorada.hn",
                FirstName = "Maria",
                LastName = "Rodriguez",
                PasswordHash = HashPassword("Admin123!"),
                Role = UserRole.Provider,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-20)
            },

            // Guatemala
            new User
            {
                TenantId = guatemalaTenant.Id,
                CompanyId = companies[2].Id,
                Email = "admin@textilesmaya.gt",
                FirstName = "Ana",
                LastName = "Ixchel",
                PasswordHash = HashPassword("Admin123!"),
                Role = UserRole.Provider,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-25)
            },
            new User
            {
                TenantId = guatemalaTenant.Id,
                CompanyId = companies[3].Id,
                Email = "admin@cardamomopremium.gt",
                FirstName = "Luis",
                LastName = "Garcia",
                PasswordHash = HashPassword("Admin123!"),
                Role = UserRole.Provider,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-15)
            },

            // México
            new User
            {
                TenantId = mexicoTenant.Id,
                CompanyId = companies[4].Id,
                Email = "admin@aguacatesmichoacan.mx",
                FirstName = "Roberto",
                LastName = "Hernandez",
                PasswordHash = HashPassword("Admin123!"),
                Role = UserRole.Provider,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-40)
            },
            new User
            {
                TenantId = mexicoTenant.Id,
                CompanyId = companies[5].Id,
                Email = "admin@tequilalosaltos.mx",
                FirstName = "Miguel",
                LastName = "Ramirez",
                PasswordHash = HashPassword("Admin123!"),
                Role = UserRole.Provider,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-35)
            },

            // Usuarios Super Admin
            new User
            {
                TenantId = hondurasTenant.Id,
                Email = "superadmin@honduras.drokex.com",
                FirstName = "Super",
                LastName = "Admin HN",
                PasswordHash = HashPassword("SuperAdmin123!"),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-50)
            },
            new User
            {
                TenantId = guatemalaTenant.Id,
                Email = "superadmin@guatemala.drokex.com",
                FirstName = "Super",
                LastName = "Admin GT",
                PasswordHash = HashPassword("SuperAdmin123!"),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-50)
            },
            new User
            {
                TenantId = mexicoTenant.Id,
                Email = "superadmin@mexico.drokex.com",
                FirstName = "Super",
                LastName = "Admin MX",
                PasswordHash = HashPassword("SuperAdmin123!"),
                Role = UserRole.Admin,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddDays(-50)
            }
        };

        await _context.Users.AddRangeAsync(users);
    }

    private async Task SeedProductsAsync()
    {
        await _context.SaveChangesAsync(); // Asegurar que empresas y categorías existan

        var companies = await _context.Companies.ToListAsync();
        var categories = await _context.Categories.ToListAsync();

        var products = new List<Product>();

        // Productos para cada empresa
        foreach (var company in companies)
        {
            var companyCategoriesIds = categories
                .Where(c => c.TenantId == company.TenantId)
                .Select(c => c.Id)
                .ToList();

            switch (company.Name)
            {
                case "Café Monte Verde Honduras":
                    var cafeCategory = categories.First(c => c.Name == "Café" && c.TenantId == company.TenantId);
                    products.AddRange(new[]
                    {
                        new Product
                        {
                            TenantId = company.TenantId,
                            CompanyId = company.Id,
                            CategoryId = cafeCategory.Id,
                            Name = "Café Arábica Premium",
                            Description = "Café de especialidad cultivado a 1,200 metros de altura en las montañas de Marcala",
                            Price = 12.50m,
                            PriceUSD = 12.50m,
                            Stock = 25,
                            OriginCountry = "Honduras",
                            HsCode = "0901.11",
                            Weight = 1.0m,
                            Dimensions = "20x15x10 cm",
                            IsActive = true,
                            IsFeatured = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-20)
                        },
                        new Product
                        {
                            TenantId = company.TenantId,
                            CompanyId = company.Id,
                            CategoryId = cafeCategory.Id,
                            Name = "Café Orgánico Certificado",
                            Description = "Café orgánico con certificación internacional, cultivo sostenible",
                            Price = 15.00m,
                            PriceUSD = 15.00m,
                            Stock = 300,
                            OriginCountry = "Honduras",
                            HsCode = "0901.11",
                            Weight = 1.0m,
                            Dimensions = "20x15x10 cm",
                            IsActive = true,
                            IsFeatured = false,
                            CreatedAt = DateTime.UtcNow.AddDays(-15)
                        }
                    });
                    break;

                case "Miel Dorada":
                    var mielCategory = categories.First(c => c.Name == "Miel" && c.TenantId == company.TenantId);
                    products.AddRange(new[]
                    {
                        new Product
                        {
                            TenantId = company.TenantId,
                            CompanyId = company.Id,
                            CategoryId = mielCategory.Id,
                            Name = "Miel Pura de Flores Silvestres",
                            Description = "Miel 100% pura extraída de flores silvestres de los bosques hondureños",
                            Price = 8.00m,
                            PriceUSD = 8.00m,
                            Stock = 200,
                            OriginCountry = "Honduras",
                            HsCode = "0409.00",
                            Weight = 0.5m,
                            Dimensions = "8x8x12 cm",
                            IsActive = true,
                            IsFeatured = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-18)
                        }
                    });
                    break;

                case "Textiles Maya Guatemala":
                    var textilesCategory = categories.First(c => c.Name == "Textiles" && c.TenantId == company.TenantId);
                    products.AddRange(new[]
                    {
                        new Product
                        {
                            TenantId = company.TenantId,
                            CompanyId = company.Id,
                            CategoryId = textilesCategory.Id,
                            Name = "Huipil Tradicional Maya",
                            Description = "Huipil tejido a mano por artesanas mayas con técnicas ancestrales",
                            Price = 85.00m,
                            PriceUSD = 85.00m,
                            Stock = 50,
                            OriginCountry = "Guatemala",
                            HsCode = "6204.42",
                            Weight = 0.3m,
                            Dimensions = "Talla única",
                            IsActive = true,
                            IsFeatured = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-22)
                        }
                    });
                    break;

                case "Cardamomo Premium GT":
                    var cardamomoCategory = categories.First(c => c.Name == "Cardamomo" && c.TenantId == company.TenantId);
                    products.AddRange(new[]
                    {
                        new Product
                        {
                            TenantId = company.TenantId,
                            CompanyId = company.Id,
                            CategoryId = cardamomoCategory.Id,
                            Name = "Cardamomo Verde Premium",
                            Description = "Cardamomo verde de primera calidad, ideal para exportación",
                            Price = 25.00m,
                            PriceUSD = 25.00m,
                            Stock = 1000,
                            OriginCountry = "Guatemala",
                            HsCode = "0908.31",
                            Weight = 1.0m,
                            Dimensions = "25x20x15 cm",
                            IsActive = true,
                            IsFeatured = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-12)
                        }
                    });
                    break;

                case "Aguacates Michoacán":
                    var aguacateCategory = categories.First(c => c.Name == "Aguacate" && c.TenantId == company.TenantId);
                    products.AddRange(new[]
                    {
                        new Product
                        {
                            TenantId = company.TenantId,
                            CompanyId = company.Id,
                            CategoryId = aguacateCategory.Id,
                            Name = "Aguacate Hass Extra",
                            Description = "Aguacate Hass de primera calidad, calibre 32-36",
                            Price = 2.50m,
                            PriceUSD = 2.50m,
                            Stock = 5000,
                            OriginCountry = "México",
                            HsCode = "0804.40",
                            Weight = 0.2m,
                            Dimensions = "Variable",
                            IsActive = true,
                            IsFeatured = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-30)
                        }
                    });
                    break;

                case "Tequila Artesanal Los Altos":
                    var tequilaCategory = categories.First(c => c.Name == "Tequila" && c.TenantId == company.TenantId);
                    products.AddRange(new[]
                    {
                        new Product
                        {
                            TenantId = company.TenantId,
                            CompanyId = company.Id,
                            CategoryId = tequilaCategory.Id,
                            Name = "Tequila Blanco 100% Agave",
                            Description = "Tequila blanco premium 100% agave azul de Los Altos de Jalisco",
                            Price = 45.00m,
                            PriceUSD = 45.00m,
                            Stock = 100,
                            OriginCountry = "México",
                            HsCode = "2208.90",
                            Weight = 0.7m,
                            Dimensions = "8x8x30 cm",
                            IsActive = true,
                            IsFeatured = true,
                            CreatedAt = DateTime.UtcNow.AddDays(-28)
                        }
                    });
                    break;
            }
        }

        await _context.Products.AddRangeAsync(products);
        await _context.SaveChangesAsync();

        // Agregar imágenes placeholder a cada producto para la demo
        var allProducts = await _context.Products.ToListAsync();
        var images = new List<ProductImage>();
        foreach (var p in allProducts)
        {
            // Usamos picsum.photos con seed estable para obtener imágenes reproducibles
            images.Add(new ProductImage
            {
                TenantId = p.TenantId,
                ProductId = p.Id,
                ImageUrl = $"https://picsum.photos/seed/drokex-{p.Id}-1/1200/800",
                IsPrimary = true,
                DisplayOrder = 0
            });
            images.Add(new ProductImage
            {
                TenantId = p.TenantId,
                ProductId = p.Id,
                ImageUrl = $"https://picsum.photos/seed/drokex-{p.Id}-2/1200/800",
                IsPrimary = false,
                DisplayOrder = 1
            });
            images.Add(new ProductImage
            {
                TenantId = p.TenantId,
                ProductId = p.Id,
                ImageUrl = $"https://picsum.photos/seed/drokex-{p.Id}-3/1200/800",
                IsPrimary = false,
                DisplayOrder = 2
            });
        }
        await _context.ProductImages.AddRangeAsync(images);
    }

    private async Task SeedLeadsAsync()
    {
        var tenants = await _context.Tenants.ToListAsync();

        var leads = new List<Lead>();

        foreach (var tenant in tenants)
        {
            leads.AddRange(new[]
            {
                new Lead
                {
                    TenantId = tenant.Id,
                    CompanyName = $"Importadora Internacional {tenant.Country}",
                    ContactName = "John Smith",
                    Email = $"john.smith@import{tenant.CountryCode.ToLower()}.com",
                    Phone = "+1 555-0123",
                    InterestedProducts = "Productos agrícolas orgánicos",
                    ImportVolume = "50-100 toneladas mensuales",
                    TargetMarkets = "Estados Unidos, Canadá",
                    Notes = "Interesado en productos con certificación orgánica",
                    Status = LeadStatus.New,
                    CreatedAt = DateTime.UtcNow.AddDays(-5)
                },
                new Lead
                {
                    TenantId = tenant.Id,
                    CompanyName = $"European Traders {tenant.Country}",
                    ContactName = "Marie Dubois",
                    Email = $"marie@eurotraders{tenant.CountryCode.ToLower()}.eu",
                    Phone = "+33 1 23 45 67 89",
                    InterestedProducts = "Artesanías y textiles tradicionales",
                    ImportVolume = "Pedidos mensuales de $10,000",
                    TargetMarkets = "Francia, Alemania, España",
                    Notes = "Busca productos únicos para tiendas especializadas",
                    Status = LeadStatus.Contacted,
                    CreatedAt = DateTime.UtcNow.AddDays(-10),
                    ContactedAt = DateTime.UtcNow.AddDays(-8)
                }
            });
        }

        await _context.Leads.AddRangeAsync(leads);
    }

    private async Task SeedActivitiesAsync()
    {
        if (await _context.Activities.AnyAsync())
        {
            _logger.LogInformation("Activities already seeded");
            return;
        }

        try
        {
            var tenants = await _context.Tenants.ToListAsync();
            var now = DateTime.UtcNow;
            var list = new List<Activity>();

            foreach (var t in tenants)
            {
                list.AddRange(new[]
                {
                    new Activity
                    {
                        TenantId = t.Id,
                        Title = "Nuevo lead interesado",
                        Description = "European Traders está interesado en Café Arábica Premium",
                        Status = ActivityStatus.New,
                        CreatedAt = now.AddMinutes(-30)
                    },
                    new Activity
                    {
                        TenantId = t.Id,
                        Title = "Producto más visto",
                        Description = "Café Orgánico Certificado ha sido visto 45 veces hoy",
                        Status = ActivityStatus.Completed,
                        CreatedAt = now.AddHours(-2)
                    },
                    new Activity
                    {
                        TenantId = t.Id,
                        Title = "Stock bajo",
                        Description = "Café Arábica Premium - Solo quedan 25 unidades",
                        Status = ActivityStatus.Urgent,
                        CreatedAt = now.AddHours(-4)
                    },
                    new Activity
                    {
                        TenantId = t.Id,
                        Title = "Consulta de precio",
                        Description = "Importadora Internacional solicita cotización para 500kg",
                        Status = ActivityStatus.Pending,
                        CreatedAt = now.AddHours(-6)
                    },
                    new Activity
                    {
                        TenantId = t.Id,
                        Title = "Perfil actualizado",
                        Description = "Información de la empresa fue actualizada exitosamente",
                        Status = ActivityStatus.Completed,
                        CreatedAt = now.AddDays(-1)
                    }
                });
            }

            await _context.Activities.AddRangeAsync(list);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Skipping Activities seed (table may not exist yet)");
        }
    }

    private async Task SeedSuperAdminsAsync()
    {
        // Verificar si ya existe un super admin
        if (await _context.SuperAdmins.AnyAsync())
        {
            _logger.LogInformation("Super Admins already exist");
            return;
        }

        var superAdmins = new[]
        {
            new SuperAdmin
            {
                Email = "master@drokex.com",
                FirstName = "Master",
                LastName = "Admin",
                PasswordHash = HashPassword("Master@Drokex2024!"),
                Phone = "+1 555-0100",
                IsActive = true,
                IsMasterAdmin = true,
                CanManageTenants = true,
                CanViewAnalytics = true,
                CanManageUsers = true,
                CanManageBilling = true,
                CanAccessAllTenants = true,
                CreatedAt = DateTime.UtcNow,
                Notes = "Master administrator with full system access"
            },
            new SuperAdmin
            {
                Email = "admin@drokex.com",
                FirstName = "Admin",
                LastName = "General",
                PasswordHash = HashPassword("Admin@Drokex2024!"),
                Phone = "+1 555-0101",
                IsActive = true,
                IsMasterAdmin = false,
                CanManageTenants = true,
                CanViewAnalytics = true,
                CanManageUsers = true,
                CanManageBilling = false,
                CanAccessAllTenants = true,
                CreatedAt = DateTime.UtcNow,
                Notes = "General administrator"
            },
            new SuperAdmin
            {
                Email = "support@drokex.com",
                FirstName = "Support",
                LastName = "Admin",
                PasswordHash = HashPassword("Support@Drokex2024!"),
                Phone = "+1 555-0102",
                IsActive = true,
                IsMasterAdmin = false,
                CanManageTenants = false,
                CanViewAnalytics = true,
                CanManageUsers = true,
                CanManageBilling = false,
                CanAccessAllTenants = true,
                CreatedAt = DateTime.UtcNow,
                Notes = "Support administrator for user assistance"
            }
        };

        await _context.SuperAdmins.AddRangeAsync(superAdmins);
        _logger.LogInformation($"Created {superAdmins.Length} Super Admin accounts");
    }

    private static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }
}
