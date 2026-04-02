using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/company-details")]
    [Authorize]
    public class CompanyDetailsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public CompanyDetailsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // ──────────────────────────────────────────────────────────────────
        // GET: api/company-details?entityType=Service&entityId=5&empresaIndex=1
        // Retorna os dados cadastrais da empresa (ou null se ainda não existir)
        // ──────────────────────────────────────────────────────────────────
        [HttpGet]
        public async Task<IActionResult> Get(
            [FromQuery] string entityType,
            [FromQuery] int entityId,
            [FromQuery] int empresaIndex)
        {
            if (string.IsNullOrEmpty(entityType) || entityId <= 0 || empresaIndex < 1 || empresaIndex > 6)
                return BadRequest(new { message = "Parâmetros inválidos." });

            var detail = await _context.CompanyDetails
                .Include(d => d.ContactLogs)
                    .ThenInclude(l => l.Responsavel)
                .FirstOrDefaultAsync(d =>
                    d.EntityType == entityType &&
                    d.EntityId == entityId &&
                    d.EmpresaIndex == empresaIndex);

            if (detail == null)
                return Ok(null); // retorna null quando ainda não há dados

            return Ok(MapToDto(detail));
        }

        // ──────────────────────────────────────────────────────────────────
        // POST: api/company-details
        // Cria ou atualiza os dados cadastrais da empresa (upsert)
        // ──────────────────────────────────────────────────────────────────
        [HttpPost]
        public async Task<IActionResult> Upsert([FromBody] UpsertCompanyDetailRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!IsValidEntityType(request.EntityType))
                return BadRequest(new { message = "EntityType inválido. Use 'Quotation'." });

            var detail = await _context.CompanyDetails
                .FirstOrDefaultAsync(d =>
                    d.EntityType == request.EntityType &&
                    d.EntityId == request.EntityId &&
                    d.EmpresaIndex == request.EmpresaIndex);

            if (detail == null)
            {
                detail = new CompanyDetail
                {
                    EntityType = request.EntityType,
                    EntityId = request.EntityId,
                    EmpresaIndex = request.EmpresaIndex,
                    CreatedAt = DateTime.UtcNow
                };
                _context.CompanyDetails.Add(detail);
            }

            detail.CNPJ = request.CNPJ;
            detail.Telefone = request.Telefone;
            detail.DataCotacao = request.DataCotacao;
            detail.PessoaContatada = request.PessoaContatada;
            detail.Endereco = request.Endereco;
            detail.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // Recarregar com logs para devolver dto completo
            await _context.Entry(detail)
                .Collection(d => d.ContactLogs)
                .Query()
                .Include(l => l.Responsavel)
                .LoadAsync();

            return Ok(MapToDto(detail));
        }

        // ──────────────────────────────────────────────────────────────────
        // POST: api/company-details/{id}/logs
        // Adiciona um registro de contato ao histórico
        // ──────────────────────────────────────────────────────────────────
        [HttpPost("{id}/logs")]
        public async Task<IActionResult> AddLog(int id, [FromBody] AddContactLogRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var detail = await _context.CompanyDetails.FindAsync(id);
            if (detail == null)
                return NotFound(new { message = "Dados da empresa não encontrados." });

            var log = new CompanyContactLog
            {
                CompanyDetailId = id,
                Data = request.Data,
                Assunto = request.Assunto,
                Resposta = request.Resposta,
                ProximosPassos = request.ProximosPassos,
                ResponsavelId = GetUserId(),
                CreatedAt = DateTime.UtcNow
            };

            _context.CompanyContactLogs.Add(log);
            await _context.SaveChangesAsync();

            await _context.Entry(log).Reference(l => l.Responsavel).LoadAsync();

            return Ok(MapLogToDto(log));
        }

        // ──────────────────────────────────────────────────────────────────
        // PUT: api/company-details/logs/{logId}
        // Edita um registro de contato (somente o autor)
        // ──────────────────────────────────────────────────────────────────
        [HttpPut("logs/{logId}")]
        public async Task<IActionResult> UpdateLog(int logId, [FromBody] AddContactLogRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var log = await _context.CompanyContactLogs
                .FirstOrDefaultAsync(l => l.Id == logId && l.ResponsavelId == userId);

            if (log == null)
                return NotFound(new { message = "Registro não encontrado ou sem permissão para editar." });

            log.Data = request.Data;
            log.Assunto = request.Assunto;
            log.Resposta = request.Resposta;
            log.ProximosPassos = request.ProximosPassos;
            log.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await _context.Entry(log).Reference(l => l.Responsavel).LoadAsync();

            return Ok(MapLogToDto(log));
        }

        // ──────────────────────────────────────────────────────────────────
        // DELETE: api/company-details/logs/{logId}
        // Remove um registro de contato (somente o autor)
        // ──────────────────────────────────────────────────────────────────
        [HttpDelete("logs/{logId}")]
        public async Task<IActionResult> DeleteLog(int logId)
        {
            var userId = GetUserId();
            var log = await _context.CompanyContactLogs
                .FirstOrDefaultAsync(l => l.Id == logId && l.ResponsavelId == userId);

            if (log == null)
                return NotFound(new { message = "Registro não encontrado ou sem permissão para excluir." });

            _context.CompanyContactLogs.Remove(log);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Registro excluído com sucesso." });
        }

        // ──────────────────────────────────────────────────────────────────
        // Helpers
        // ──────────────────────────────────────────────────────────────────
        private static bool IsValidEntityType(string? entityType) =>
            entityType == "Quotation";

        private static object MapToDto(CompanyDetail d) => new
        {
            d.Id,
            d.EntityType,
            d.EntityId,
            d.EmpresaIndex,
            d.CNPJ,
            d.Telefone,
            dataCotacao = d.DataCotacao?.ToString("yyyy-MM-dd"),
            d.PessoaContatada,
            d.Endereco,
            d.CreatedAt,
            d.UpdatedAt,
            contactLogs = d.ContactLogs
                .OrderByDescending(l => l.Data)
                .Select(l => MapLogToDto(l))
                .ToList()
        };

        private static object MapLogToDto(CompanyContactLog l) => new
        {
            l.Id,
            l.CompanyDetailId,
            data = l.Data.ToString("yyyy-MM-dd"),
            l.Assunto,
            l.Resposta,
            l.ProximosPassos,
            l.ResponsavelId,
            responsavelNome = l.Responsavel?.Name ?? "",
            l.CreatedAt,
            l.UpdatedAt
        };
    }

    // ──────────────────────────────────────────────────────────────────
    // Request DTOs
    // ──────────────────────────────────────────────────────────────────
    public class UpsertCompanyDetailRequest
    {
        [Required]
        public string EntityType { get; set; } = string.Empty;

        [Required]
        public int EntityId { get; set; }

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
    }

    public class AddContactLogRequest
    {
        [Required]
        public DateTime Data { get; set; }

        [Required]
        [StringLength(500)]
        public string Assunto { get; set; } = string.Empty;

        [StringLength(1000)]
        public string? Resposta { get; set; }

        [StringLength(500)]
        public string? ProximosPassos { get; set; }
    }
}
