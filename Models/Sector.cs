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

        [Required]
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Spreadsheet> Spreadsheets { get; set; } = new List<Spreadsheet>();
        public ICollection<Input> Inputs { get; set; } = new List<Input>();
        public ICollection<Service> Services { get; set; } = new List<Service>();
    }
}

