using System.ComponentModel.DataAnnotations;

namespace CotacoesEPC.Models
{
    public class AllowedRegistration
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(50)]
        public string RegistrationNumber { get; set; } = string.Empty;

        [Required]
        public bool IsUsed { get; set; } = false;

        public int? UsedByUserId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UsedAt { get; set; }

        // Navigation property
        public User? UsedByUser { get; set; }
    }
}

