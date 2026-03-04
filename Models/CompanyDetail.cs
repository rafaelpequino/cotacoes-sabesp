using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CotacoesEPC.Models
{
    /// <summary>
    /// Dados cadastrais de uma empresa em uma cotação específica (Serviço ou Insumo).
    /// Identificada por EntityType ("Service"/"Input") + EntityId + EmpresaIndex (1-6).
    /// </summary>
    public class CompanyDetail
    {
        [Key]
        public int Id { get; set; }

        /// <summary>"Service" ou "Input"</summary>
        [Required]
        [StringLength(20)]
        public string EntityType { get; set; } = string.Empty;

        /// <summary>ID do Serviço ou Insumo.</summary>
        [Required]
        public int EntityId { get; set; }

        /// <summary>Posição da empresa na cotação (1 a 6).</summary>
        [Required]
        public int EmpresaIndex { get; set; }

        [StringLength(18)]
        public string? CNPJ { get; set; }

        [StringLength(20)]
        public string? Telefone { get; set; }

        public DateTime? DataCotacao { get; set; }

        [StringLength(200)]
        public string? PessoaContatada { get; set; }

        [StringLength(500)]
        public string? Endereco { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation
        public ICollection<CompanyContactLog> ContactLogs { get; set; } = new List<CompanyContactLog>();
    }
}
