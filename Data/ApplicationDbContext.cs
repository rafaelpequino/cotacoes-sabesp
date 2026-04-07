using Microsoft.EntityFrameworkCore;
using CotacoesEPC.Models;

namespace CotacoesEPC.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Quotation> Quotations { get; set; }
        public DbSet<Input> Inputs { get; set; }
        public DbSet<Service> Services { get; set; }
        public DbSet<Spreadsheet> Spreadsheets { get; set; }
        public DbSet<Sector> Sectors { get; set; }
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<AllowedRegistration> AllowedRegistrations { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<CompanyDetail> CompanyDetails { get; set; }
        public DbSet<CompanyContactLog> CompanyContactLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // User configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Email).IsRequired();
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Name).IsRequired();
                entity.Property(e => e.PasswordHash).IsRequired();
                entity.Property(e => e.Registration).HasMaxLength(50);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
            });

            // Quotation configuration
            modelBuilder.Entity<Quotation>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OriginalId).IsRequired();
                entity.Property(e => e.Item).IsRequired();
                entity.Property(e => e.Unit).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Concluída");
                entity.Property(e => e.PriceFornecedor).HasPrecision(18, 2);
                entity.Property(e => e.PrecoMontagem).HasPrecision(18, 2);
                entity.Property(e => e.PrecoAdotado).HasPrecision(18, 2);
                entity.Property(e => e.MediaAdotada).HasMaxLength(500);
                entity.Property(e => e.MediaSaneada).HasPrecision(18, 2);
                entity.Property(e => e.MenorValor).HasPrecision(18, 2);
                entity.Property(e => e.MediaAritmetica).HasPrecision(18, 2);
                entity.Property(e => e.Mediana).HasPrecision(18, 2);
                entity.Property(e => e.Empresa1).HasPrecision(18, 2);
                entity.Property(e => e.Empresa2).HasPrecision(18, 2);
                entity.Property(e => e.Empresa3).HasPrecision(18, 2);
                entity.Property(e => e.Empresa4).HasPrecision(18, 2);
                entity.Property(e => e.Empresa5).HasPrecision(18, 2);
                entity.Property(e => e.Empresa6).HasPrecision(18, 2);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Quotations)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Sector)
                    .WithMany(s => s.Quotations)
                    .HasForeignKey(e => e.SectorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Spreadsheet configuration
            modelBuilder.Entity<Spreadsheet>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Spreadsheets)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Sector)
                    .WithMany(s => s.Spreadsheets)
                    .HasForeignKey(e => e.SectorId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // Sector configuration
            modelBuilder.Entity<Sector>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired();
            });

            // Supplier configuration
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.NomeFantasia).IsRequired().HasMaxLength(200);
                entity.Property(e => e.CNPJ).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Telefone).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Endereco).IsRequired().HasMaxLength(500);
                entity.Property(e => e.DataCadastro).HasDefaultValueSql("GETUTCDATE()");
            });

            // AllowedRegistration configuration
            modelBuilder.Entity<AllowedRegistration>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.RegistrationNumber).IsRequired();
                entity.HasIndex(e => e.RegistrationNumber).IsUnique();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.UsedByUser)
                    .WithMany()
                    .HasForeignKey(e => e.UsedByUserId)
                    .OnDelete(DeleteBehavior.SetNull);
            });

            // CompanyDetail configuration
            modelBuilder.Entity<CompanyDetail>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.EmpresaIndex).IsRequired();
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasIndex(e => new { e.EntityType, e.EntityId, e.EmpresaIndex }).IsUnique();
            });

            // CompanyContactLog configuration
            modelBuilder.Entity<CompanyContactLog>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Assunto).IsRequired().HasMaxLength(500);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.CompanyDetail)
                    .WithMany(c => c.ContactLogs)
                    .HasForeignKey(e => e.CompanyDetailId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Responsavel)
                    .WithMany()
                    .HasForeignKey(e => e.ResponsavelId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Input configuration
            modelBuilder.Entity<Input>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OriginalId).IsRequired();
                entity.Property(e => e.Item).IsRequired();
                entity.Property(e => e.Unit).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Concluída");
                entity.Property(e => e.PriceFornecedor).HasPrecision(18, 2);
                entity.Property(e => e.PrecoMontagem).HasPrecision(18, 2);
                entity.Property(e => e.PrecoAdotado).HasPrecision(18, 2);
                entity.Property(e => e.MediaAdotada).HasMaxLength(500);
                entity.Property(e => e.MediaSaneada).HasPrecision(18, 2);
                entity.Property(e => e.MenorValor).HasPrecision(18, 2);
                entity.Property(e => e.MediaAritmetica).HasPrecision(18, 2);
                entity.Property(e => e.Mediana).HasPrecision(18, 2);
                entity.Property(e => e.Empresa1).HasPrecision(18, 2);
                entity.Property(e => e.Empresa2).HasPrecision(18, 2);
                entity.Property(e => e.Empresa3).HasPrecision(18, 2);
                entity.Property(e => e.Empresa4).HasPrecision(18, 2);
                entity.Property(e => e.Empresa5).HasPrecision(18, 2);
                entity.Property(e => e.Empresa6).HasPrecision(18, 2);
                entity.Property(e => e.PriceFornecedor).HasPrecision(18, 2);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Sector)
                    .WithMany()
                    .HasForeignKey(e => e.SectorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Service configuration
            modelBuilder.Entity<Service>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OriginalId).IsRequired();
                entity.Property(e => e.Item).IsRequired();
                entity.Property(e => e.Unit).IsRequired();
                entity.Property(e => e.Status).IsRequired().HasMaxLength(20).HasDefaultValue("Concluída");
                entity.Property(e => e.PriceFornecedor).HasPrecision(18, 2);
                entity.Property(e => e.PrecoMontagem).HasPrecision(18, 2);
                entity.Property(e => e.PrecoAdotado).HasPrecision(18, 2);
                entity.Property(e => e.MediaAdotada).HasMaxLength(500);
                entity.Property(e => e.MediaSaneada).HasPrecision(18, 2);
                entity.Property(e => e.MenorValor).HasPrecision(18, 2);
                entity.Property(e => e.MediaAritmetica).HasPrecision(18, 2);
                entity.Property(e => e.Mediana).HasPrecision(18, 2);
                entity.Property(e => e.Empresa1).HasPrecision(18, 2);
                entity.Property(e => e.Empresa2).HasPrecision(18, 2);
                entity.Property(e => e.Empresa3).HasPrecision(18, 2);
                entity.Property(e => e.Empresa4).HasPrecision(18, 2);
                entity.Property(e => e.Empresa5).HasPrecision(18, 2);
                entity.Property(e => e.Empresa6).HasPrecision(18, 2);
                entity.Property(e => e.PriceFornecedor).HasPrecision(18, 2);
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
                entity.HasOne(e => e.Sector)
                    .WithMany()
                    .HasForeignKey(e => e.SectorId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Attachment configuration
            modelBuilder.Entity<Attachment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OriginalFileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.StoredFileName).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Description).IsRequired().HasMaxLength(500);
                entity.Property(e => e.FilePath).IsRequired().HasMaxLength(500);
                entity.Property(e => e.FileExtension).IsRequired().HasMaxLength(50);
                entity.Property(e => e.EntityType).IsRequired().HasMaxLength(20);
                entity.Property(e => e.UploadedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.User)
                    .WithMany()
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}

