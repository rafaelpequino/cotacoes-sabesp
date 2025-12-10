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
        public DbSet<Service> Services { get; set; }
        public DbSet<Input> Inputs { get; set; }
        public DbSet<Spreadsheet> Spreadsheets { get; set; }
        public DbSet<AllowedRegistration> AllowedRegistrations { get; set; }

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

            // Service configuration
            modelBuilder.Entity<Service>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OriginalId).IsRequired();
                entity.Property(e => e.Item).IsRequired();
                entity.Property(e => e.Unit).IsRequired();
                entity.Property(e => e.PriceFornecedor).HasPrecision(18, 2);
                entity.Property(e => e.PrecoMontagem).HasPrecision(18, 2);
                entity.Property(e => e.PrecoAdotado).HasPrecision(18, 2);
                entity.Property(e => e.MediaAdotada).HasPrecision(18, 2);
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
                entity.Property(e => e.IndiceAnterior).HasPrecision(18, 2);
                entity.Property(e => e.IndiceAtual).HasPrecision(18, 2);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Services)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Input configuration
            modelBuilder.Entity<Input>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.OriginalId).IsRequired();
                entity.Property(e => e.Item).IsRequired();
                entity.Property(e => e.Unit).IsRequired();
                entity.Property(e => e.PriceFornecedor).HasPrecision(18, 2);
                entity.Property(e => e.PrecoMontagem).HasPrecision(18, 2);
                entity.Property(e => e.PrecoAdotado).HasPrecision(18, 2);
                entity.Property(e => e.MediaAdotada).HasPrecision(18, 2);
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
                entity.Property(e => e.IndiceAnterior).HasPrecision(18, 2);
                entity.Property(e => e.IndiceAtual).HasPrecision(18, 2);
                entity.Property(e => e.CreatedAt).HasDefaultValueSql("GETUTCDATE()");
                entity.HasOne(e => e.User)
                    .WithMany(u => u.Inputs)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
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
        }
    }
}

