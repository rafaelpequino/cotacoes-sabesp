using System.ComponentModel.DataAnnotations;

namespace CotacoesEPC.Models
{
    public class Sector
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public ICollection<Spreadsheet> Spreadsheets { get; set; } = new List<Spreadsheet>();
    }
}

