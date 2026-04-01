using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CotacoesEPC.Models
{
    public class Supplier
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(200)]
        public string NomeFantasia { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string CNPJ { get; set; } = string.Empty;

        [Required]
        [StringLength(20)]
        public string Telefone { get; set; } = string.Empty;

        [Required]
        [StringLength(500)]
        public string Endereco { get; set; } = string.Empty;

        [Required]
        public DateTime DataCadastro { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        // Navigation properties
        public ICollection<Service> Services { get; set; } = new List<Service>();
        public ICollection<Input> Inputs { get; set; } = new List<Input>();
    }
}
