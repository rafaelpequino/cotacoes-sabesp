using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CotacoesEPC.Models
{
    /// <summary>
    /// Registro de um contato feito com a empresa dentro de uma cotação.
    /// </summary>
    public class CompanyContactLog
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(CompanyDetail))]
        public int CompanyDetailId { get; set; }

        [Required]
        public DateTime Data { get; set; }

        [Required]
        [StringLength(500)]
        public string Assunto { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Resposta { get; set; }

        [StringLength(500)]
        public string? ProximosPassos { get; set; }

        /// <summary>ID do usuário responsável pelo contato.</summary>
        [Required]
        [ForeignKey(nameof(Responsavel))]
        public int ResponsavelId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public CompanyDetail? CompanyDetail { get; set; }

        [ForeignKey(nameof(ResponsavelId))]
        public User? Responsavel { get; set; }
    }
}
