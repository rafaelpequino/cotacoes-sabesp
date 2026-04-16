using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CotacoesEPC.Models
{
    public class Attachment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(255)]
        public string OriginalFileName { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string StoredFileName { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Description { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string FilePath { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string FileExtension { get; set; } = string.Empty;

        public long FileSize { get; set; }

        [StringLength(200)]
        public string? CompanyName { get; set; } // Empresa vinculada ao anexo (opcional)

        [Required]
        [StringLength(20)]
        public string EntityType { get; set; } = string.Empty; // "Service" ou "Input"

        [Required]
        public int EntityId { get; set; } // ID do Service ou Input

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Required]
        public DateTime UploadedAt { get; set; } = DateTime.UtcNow;

        // Navigation property
        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }
}
