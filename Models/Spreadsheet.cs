using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CotacoesEPC.Models
{
    public class Spreadsheet
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Required]
        [StringLength(255)]
        public string Name { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Description { get; set; }

        [StringLength(500)]
        public string? FilePath { get; set; }

        [StringLength(50)]
        public string? FileType { get; set; }

        public long? FileSize { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public DateTime? SharedAt { get; set; }

        [Required]
        public bool IsShared { get; set; } = false;

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }
}

