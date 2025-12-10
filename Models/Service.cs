using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CotacoesEPC.Models
{
    public class Service
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        public string OriginalId { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Item { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        public string Unit { get; set; } = string.Empty;

        [Required]
        public decimal PriceFornecedor { get; set; }

        [Required]
        public decimal PrecoMontagem { get; set; }

        [Required]
        public decimal PrecoAdotado { get; set; }

        public decimal? MediaAdotada { get; set; }

        public decimal? MediaSaneada { get; set; }

        public decimal? MenorValor { get; set; }

        public decimal? MediaAritmetica { get; set; }

        public decimal? Mediana { get; set; }

        public decimal? Empresa1 { get; set; }

        public decimal? Empresa2 { get; set; }

        public decimal? Empresa3 { get; set; }

        public decimal? Empresa4 { get; set; }

        public decimal? Empresa5 { get; set; }

        public decimal? Empresa6 { get; set; }

        [StringLength(1000)]
        public string? Justificativa { get; set; }

        public int? TempoPassado { get; set; }

        [StringLength(50)]
        public string? MesAnterior { get; set; }

        public decimal? IndiceAnterior { get; set; }

        public decimal? IndiceAtual { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        [ForeignKey(nameof(UserId))]
        public User? User { get; set; }
    }
}

