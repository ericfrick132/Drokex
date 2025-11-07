using Microsoft.EntityFrameworkCore;
using Dockex.API.Models;
using Dockex.API.Services;

namespace Dockex.API.Data;

public class ApplicationDbContext : DbContext
{
    private readonly ITenantResolutionService? _tenantResolution;

    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public ApplicationDbContext(
        DbContextOptions<ApplicationDbContext> options,
        ITenantResolutionService tenantResolution)
        : base(options)
    {
        _tenantResolution = tenantResolution;
    }

    public DbSet<Tenant> Tenants { get; set; }
    public DbSet<User> Users { get; set; }
    public DbSet<Company> Companies { get; set; }
    public DbSet<Product> Products { get; set; }
    public DbSet<ProductImage> ProductImages { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Lead> Leads { get; set; }
    public DbSet<SuperAdmin> SuperAdmins { get; set; }
    public DbSet<Activity> Activities { get; set; }
    public DbSet<BusinessType> BusinessTypes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ==========================================
        // CONFIGURACIONES MULTI-TENANT DROKEX
        // ==========================================

        // Tenant configurations
        modelBuilder.Entity<Tenant>(entity =>
        {
            entity.HasIndex(t => t.Subdomain).IsUnique();
            entity.Property(t => t.Name).HasMaxLength(200).IsRequired();
            entity.Property(t => t.Subdomain).HasMaxLength(50).IsRequired();
            entity.Property(t => t.Country).HasMaxLength(100).IsRequired();
            entity.Property(t => t.CountryCode).HasMaxLength(3).IsRequired();
            entity.Property(t => t.Currency).HasMaxLength(3).IsRequired();
            entity.Property(t => t.CurrencySymbol).HasMaxLength(5).IsRequired();
            entity.Property(t => t.AdminEmail).HasMaxLength(256).IsRequired();
            entity.Property(t => t.PrimaryColor).HasMaxLength(7).HasDefaultValue("#abd305");
            entity.Property(t => t.SecondaryColor).HasMaxLength(7).HasDefaultValue("#006d5a");
            entity.Property(t => t.LogoUrl).HasMaxLength(500);
            entity.Property(t => t.CustomCss).HasMaxLength(1000);
            entity.Property(t => t.TimeZone).HasMaxLength(50);
            entity.Property(t => t.LanguageCode).HasMaxLength(5).HasDefaultValue("es");
            entity.Property(t => t.PlanType).HasMaxLength(20).HasDefaultValue("Trial");
            entity.Property(t => t.TransactionFeePercent).HasColumnType("decimal(5,2)").HasDefaultValue(2.0m);
            
            entity.HasIndex(t => new { t.IsActive, t.Country });
            entity.HasIndex(t => t.CreatedAt);
        });

        // FILTROS GLOBALES MULTI-TENANT
        var currentTenantId = _tenantResolution?.GetCurrentTenantId();

        // User configurations
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => new { u.TenantId, u.Email }).IsUnique();
            entity.Property(u => u.Email).HasMaxLength(256);
            entity.Property(u => u.FirstName).HasMaxLength(100);
            entity.Property(u => u.LastName).HasMaxLength(100);
            entity.Property(u => u.PasswordHash).HasMaxLength(512);
            
            // Relación con Tenant
            entity.HasOne(u => u.Tenant)
                  .WithMany(t => t.Users)
                  .HasForeignKey(u => u.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Relación User-Company
            entity.HasOne(u => u.Company)
                  .WithMany(c => c.Users)
                  .HasForeignKey(u => u.CompanyId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Filtro global por tenant
            if (currentTenantId.HasValue)
            {
                entity.HasQueryFilter(u => u.TenantId == currentTenantId.Value);
            }
        });

        // Company configurations
        modelBuilder.Entity<Company>(entity =>
        {
            entity.HasIndex(c => new { c.TenantId, c.ContactEmail }).IsUnique();
            entity.Property(c => c.Name).HasMaxLength(200);
            entity.Property(c => c.ContactEmail).HasMaxLength(256);
            entity.Property(c => c.Phone).HasMaxLength(50);
            entity.Property(c => c.Website).HasMaxLength(500);
            entity.Property(c => c.Logo).HasMaxLength(500);
            entity.Property(c => c.TaxId).HasMaxLength(50);
            entity.Property(c => c.BusinessType).HasMaxLength(100);
            entity.Property(c => c.CertificationsJson).HasMaxLength(2000);
            
            // Relación con Tenant
            entity.HasOne(c => c.Tenant)
                  .WithMany(t => t.Companies)
                  .HasForeignKey(c => c.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Filtro global por tenant
            if (currentTenantId.HasValue)
            {
                entity.HasQueryFilter(c => c.TenantId == currentTenantId.Value);
            }
        });

        // Product configurations
        modelBuilder.Entity<Product>(entity =>
        {
            entity.Property(p => p.Name).HasMaxLength(200);
            entity.Property(p => p.Price).HasColumnType("decimal(18,2)");
            entity.Property(p => p.PriceUSD).HasColumnType("decimal(18,2)");
            entity.Property(p => p.OriginCountry).HasMaxLength(100);
            entity.Property(p => p.HsCode).HasMaxLength(20);
            entity.Property(p => p.Dimensions).HasMaxLength(100);
            entity.Property(p => p.Weight).HasColumnType("decimal(10,2)");
            
            // Relación con Tenant
            entity.HasOne(p => p.Tenant)
                  .WithMany()
                  .HasForeignKey(p => p.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Relación Product-Company
            entity.HasOne(p => p.Company)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CompanyId)
                  .OnDelete(DeleteBehavior.Cascade);
                  
            // Relación Product-Category
            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Índices para rendimiento
            entity.HasIndex(p => new { p.TenantId, p.CompanyId, p.IsActive });
            entity.HasIndex(p => new { p.TenantId, p.CategoryId });
            entity.HasIndex(p => new { p.TenantId, p.IsFeatured });

            // Filtro global por tenant
            if (currentTenantId.HasValue)
            {
                entity.HasQueryFilter(p => p.TenantId == currentTenantId.Value);
            }
        });

        // ProductImage configurations
        modelBuilder.Entity<ProductImage>(entity =>
        {
            entity.Property(pi => pi.ImageUrl).HasMaxLength(500);
            entity.Property(pi => pi.AltText).HasMaxLength(200);
            entity.Property(pi => pi.MimeType).HasMaxLength(50);
            
            // Relación con Tenant
            entity.HasOne(pi => pi.Tenant)
                  .WithMany()
                  .HasForeignKey(pi => pi.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Relación ProductImage-Product
            entity.HasOne(pi => pi.Product)
                  .WithMany(p => p.Images)
                  .HasForeignKey(pi => pi.ProductId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Filtro global por tenant
            if (currentTenantId.HasValue)
            {
                entity.HasQueryFilter(pi => pi.TenantId == currentTenantId.Value);
            }
        });

        // Category configurations
        modelBuilder.Entity<Category>(entity =>
        {
            entity.Property(c => c.Name).HasMaxLength(100);
            entity.Property(c => c.IconUrl).HasMaxLength(500);
            entity.Property(c => c.ColorHex).HasMaxLength(7);
            
            // Relación con Tenant
            entity.HasOne(c => c.Tenant)
                  .WithMany()
                  .HasForeignKey(c => c.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);
            
            // Relación Category self-referencing
            entity.HasOne(c => c.ParentCategory)
                  .WithMany(c => c.SubCategories)
                  .HasForeignKey(c => c.ParentCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Índices
            entity.HasIndex(c => new { c.TenantId, c.IsActive, c.DisplayOrder });

            // Filtro global por tenant
            if (currentTenantId.HasValue)
            {
                entity.HasQueryFilter(c => c.TenantId == currentTenantId.Value);
            }
        });

        // Lead configurations
        modelBuilder.Entity<Lead>(entity =>
        {
            entity.Property(l => l.CompanyName).HasMaxLength(200);
            entity.Property(l => l.ContactName).HasMaxLength(100);
            entity.Property(l => l.Email).HasMaxLength(256);
            entity.Property(l => l.Phone).HasMaxLength(50);
            entity.Property(l => l.InterestedProducts).HasMaxLength(500);
            entity.Property(l => l.ImportVolume).HasMaxLength(100);
            entity.Property(l => l.TargetMarkets).HasMaxLength(200);
            entity.Property(l => l.Notes).HasMaxLength(1000);
            
            // Relación con Tenant
            entity.HasOne(l => l.Tenant)
                  .WithMany()
                  .HasForeignKey(l => l.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Índices
            entity.HasIndex(l => new { l.TenantId, l.Status });
            entity.HasIndex(l => new { l.TenantId, l.CreatedAt });

            // Filtro global por tenant
            if (currentTenantId.HasValue)
            {
                entity.HasQueryFilter(l => l.TenantId == currentTenantId.Value);
            }
        });

        // BusinessType configurations (global, not tenant-scoped)
        modelBuilder.Entity<BusinessType>(entity =>
        {
            entity.Property(b => b.Name).HasMaxLength(100).IsRequired();
            entity.Property(b => b.Description).HasMaxLength(300);
            entity.HasIndex(b => b.Name).IsUnique();
            entity.HasIndex(b => new { b.IsActive, b.DisplayOrder });
        });

        // Activity configurations
        modelBuilder.Entity<Activity>(entity =>
        {
            entity.Property(a => a.Title).HasMaxLength(150).IsRequired();
            entity.Property(a => a.Description).HasMaxLength(500).IsRequired();

            // Relationship with Tenant
            entity.HasOne(a => a.Tenant)
                  .WithMany()
                  .HasForeignKey(a => a.TenantId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Index for queries by tenant and recency
            entity.HasIndex(a => new { a.TenantId, a.CreatedAt });

            // Global tenant filter
            if (currentTenantId.HasValue)
            {
                entity.HasQueryFilter(a => a.TenantId == currentTenantId.Value);
            }
        });

        // SuperAdmin configurations (sin filtro de tenant)
        modelBuilder.Entity<SuperAdmin>(entity =>
        {
            entity.HasIndex(sa => sa.Email).IsUnique();
            entity.Property(sa => sa.Email).HasMaxLength(255).IsRequired();
            entity.Property(sa => sa.FirstName).HasMaxLength(100).IsRequired();
            entity.Property(sa => sa.LastName).HasMaxLength(100).IsRequired();
            entity.Property(sa => sa.PasswordHash).HasMaxLength(512).IsRequired();
            entity.Property(sa => sa.Phone).HasMaxLength(20);
            entity.Property(sa => sa.LastLoginIp).HasMaxLength(45);
            entity.Property(sa => sa.RefreshToken).HasMaxLength(512);
            entity.Property(sa => sa.Notes).HasMaxLength(1000);
            entity.Property(sa => sa.ModifiedBy).HasMaxLength(255);
            
            // Relación opcional con Tenant actual
            entity.HasOne(sa => sa.CurrentTenant)
                  .WithMany()
                  .HasForeignKey(sa => sa.CurrentTenantId)
                  .OnDelete(DeleteBehavior.SetNull);
                  
            // Índices
            entity.HasIndex(sa => sa.IsActive);
            entity.HasIndex(sa => sa.IsMasterAdmin);
        });

        // ==========================================
        // ÍNDICES ADICIONALES PARA RENDIMIENTO
        // ==========================================
        
        // Índices globales para búsquedas frecuentes
        modelBuilder.Entity<Company>()
            .HasIndex(c => new { c.TenantId, c.IsApproved, c.IsActive });
            
        // Índice para búsquedas de texto en productos
        modelBuilder.Entity<Product>()
            .HasIndex(p => new { p.TenantId, p.Name });
        
        // Índice para estadísticas de tenant
        modelBuilder.Entity<User>()
            .HasIndex(u => new { u.TenantId, u.IsActive, u.Role });

        // Seed data para tenants por defecto LATAM
        SeedDefaultTenants(modelBuilder);
    }

    private static void SeedDefaultTenants(ModelBuilder modelBuilder)
    {
        // Tenants por defecto con subdominios de empresas (no países)
        modelBuilder.Entity<Tenant>().HasData(
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
        );
    }

    public override int SaveChanges()
    {
        UpdateTimestamps();
        AssignTenantToNewEntities();
        return base.SaveChanges();
    }

    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        UpdateTimestamps();
        AssignTenantToNewEntities();
        return await base.SaveChangesAsync(cancellationToken);
    }

    private void UpdateTimestamps()
    {
        var entries = ChangeTracker.Entries()
            .Where(e => (e.Entity is Product || e.Entity is Company || e.Entity is User || 
                        e.Entity is Category || e.Entity is Lead) && 
                       e.State == EntityState.Modified);

        foreach (var entry in entries)
        {
            if (entry.Entity is Product product)
                product.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is Company company)
                company.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is User user)
                user.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is Category category)
                category.UpdatedAt = DateTime.UtcNow;
            else if (entry.Entity is Lead lead)
                lead.UpdatedAt = DateTime.UtcNow;
        }
    }

    private void AssignTenantToNewEntities()
    {
        var currentTenantId = _tenantResolution?.GetCurrentTenantId();
        if (!currentTenantId.HasValue)
            return;

        var newEntries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added && e.Entity is IMultiTenant)
            .ToList();

        foreach (var entry in newEntries)
        {
            var entity = (IMultiTenant)entry.Entity;
            if (entity.TenantId == 0) // Solo asignar si no tiene tenant
            {
                entity.TenantId = currentTenantId.Value;
            }
        }
    }
}
