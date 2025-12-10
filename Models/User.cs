using System.ComponentModel.DataAnnotations;

namespace CotacoesEPC.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [StringLength(255)]
        public string PasswordHash { get; set; } = string.Empty;

        [StringLength(10)]
        public string? InitialLetter { get; set; }

        [Required]
        [StringLength(50)]
        public string Registration { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public ICollection<Service> Services { get; set; } = new List<Service>();
        public ICollection<Input> Inputs { get; set; } = new List<Input>();
        public ICollection<Spreadsheet> Spreadsheets { get; set; } = new List<Spreadsheet>();
    }
}

