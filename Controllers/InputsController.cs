using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuotationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public QuotationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // GET: api/quotations
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? sort, [FromQuery] string? filter)
        {
            var query = _context.Quotations.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var words = search.ToLower()
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                foreach (var word in words)
                {
                    var w = word;
                    query = query.Where(q =>
                        q.Item.ToLower().Contains(w) ||
                        q.OriginalId.ToLower().Contains(w) ||
                        q.Unit.ToLower().Contains(w)
                    );
                }
            }

            query = sort switch
            {
                "recentes" => query.OrderByDescending(q => q.CreatedAt),
                "preço_menor" => query.OrderBy(q => q.PrecoAdotado),
                "preço_maior" => query.OrderByDescending(q => q.PrecoAdotado),
                _ => query.OrderByDescending(q => q.CreatedAt)
            };

            var quotations = await query.ToListAsync();
            return Ok(quotations);
        }

        // GET: api/quotations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var quotation = await _context.Quotations.FirstOrDefaultAsync(q => q.Id == id);
            if (quotation == null)
                return NotFound(new { message = "Cotação não encontrada" });

            return Ok(quotation);
        }

        // POST: api/quotations
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateQuotationRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var status = ValidateStatus(request.Status) ?? "Concluída";

            var quotation = new Quotation
            {
                UserId = userId,
                SectorId = request.SectorId,
                OriginalId = request.OriginalId ?? string.Empty,
                Item = request.Item ?? string.Empty,
                Unit = request.Unit ?? string.Empty,
                PriceFornecedor = request.PriceFornecedor,
                PrecoMontagem = request.PrecoMontagem,
                PrecoAdotado = request.PrecoAdotado,
                MediaAdotada = request.MediaAdotada,
                MediaSaneada = request.MediaSaneada,
                MenorValor = request.MenorValor,
                MediaAritmetica = request.MediaAritmetica,
                Mediana = request.Mediana,
                NomeEmpresa1 = request.NomeEmpresa1,
                Empresa1 = request.Empresa1,
                Supplier1Id = request.Supplier1Id,
                NomeEmpresa2 = request.NomeEmpresa2,
                Empresa2 = request.Empresa2,
                Supplier2Id = request.Supplier2Id,
                NomeEmpresa3 = request.NomeEmpresa3,
                Empresa3 = request.Empresa3,
                Supplier3Id = request.Supplier3Id,
                NomeEmpresa4 = request.NomeEmpresa4,
                Empresa4 = request.Empresa4,
                Supplier4Id = request.Supplier4Id,
                NomeEmpresa5 = request.NomeEmpresa5,
                Empresa5 = request.Empresa5,
                Supplier5Id = request.Supplier5Id,
                NomeEmpresa6 = request.NomeEmpresa6,
                Empresa6 = request.Empresa6,
                Supplier6Id = request.Supplier6Id,
                Justificativa = request.Justificativa,
                Status = status,
                CreatedAt = DateTime.UtcNow
            };

            _context.Quotations.Add(quotation);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = quotation.Id }, quotation);
        }

        // PUT: api/quotations/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateQuotationRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var quotation = await _context.Quotations
                .FirstOrDefaultAsync(q => q.Id == id && q.UserId == userId);

            if (quotation == null)
                return NotFound(new { message = "Cotação não encontrada" });

            quotation.SectorId = request.SectorId;
            quotation.OriginalId = request.OriginalId ?? string.Empty;
            quotation.Item = request.Item ?? string.Empty;
            quotation.Unit = request.Unit ?? string.Empty;
            quotation.PriceFornecedor = request.PriceFornecedor;
            quotation.PrecoMontagem = request.PrecoMontagem;
            quotation.PrecoAdotado = request.PrecoAdotado;
            quotation.MediaAdotada = request.MediaAdotada;
            quotation.MediaSaneada = request.MediaSaneada;
            quotation.MenorValor = request.MenorValor;
            quotation.MediaAritmetica = request.MediaAritmetica;
            quotation.Mediana = request.Mediana;
            quotation.NomeEmpresa1 = request.NomeEmpresa1;
            quotation.Empresa1 = request.Empresa1;
            quotation.Supplier1Id = request.Supplier1Id;
            quotation.NomeEmpresa2 = request.NomeEmpresa2;
            quotation.Empresa2 = request.Empresa2;
            quotation.Supplier2Id = request.Supplier2Id;
            quotation.NomeEmpresa3 = request.NomeEmpresa3;
            quotation.Empresa3 = request.Empresa3;
            quotation.Supplier3Id = request.Supplier3Id;
            quotation.NomeEmpresa4 = request.NomeEmpresa4;
            quotation.Empresa4 = request.Empresa4;
            quotation.Supplier4Id = request.Supplier4Id;
            quotation.NomeEmpresa5 = request.NomeEmpresa5;
            quotation.Empresa5 = request.Empresa5;
            quotation.Supplier5Id = request.Supplier5Id;
            quotation.NomeEmpresa6 = request.NomeEmpresa6;
            quotation.Empresa6 = request.Empresa6;
            quotation.Supplier6Id = request.Supplier6Id;
            quotation.Justificativa = request.Justificativa;
            // Apenas o dono pode alterar o status
            if (!string.IsNullOrEmpty(request.Status))
                quotation.Status = ValidateStatus(request.Status) ?? quotation.Status;
            quotation.UpdatedAt = DateTime.UtcNow;

            _context.Quotations.Update(quotation);
            await _context.SaveChangesAsync();

            return Ok(quotation);
        }

        // PATCH: api/quotations/{id}/status  — somente o criador pode alterar
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var novoStatus = ValidateStatus(request.Status);
            if (novoStatus == null)
                return BadRequest(new { message = "Status inválido. Use: Pendente, Cancelada ou Concluída." });

            var userId = GetUserId();
            var quotation = await _context.Quotations
                .FirstOrDefaultAsync(q => q.Id == id && q.UserId == userId);

            if (quotation == null)
                return NotFound(new { message = "Cotação não encontrada ou sem permissão para alterar o status." });

            quotation.Status = novoStatus;
            quotation.UpdatedAt = DateTime.UtcNow;

            _context.Quotations.Update(quotation);
            await _context.SaveChangesAsync();

            return Ok(quotation);
        }

        // DELETE: api/quotations/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            var quotation = await _context.Quotations
                .FirstOrDefaultAsync(q => q.Id == id && q.UserId == userId);

            if (quotation == null)
                return NotFound(new { message = "Cotação não encontrada" });

            _context.Quotations.Remove(quotation);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Cotação deletada com sucesso" });
        }

        private static string? ValidateStatus(string? status)
        {
            return status switch
            {
                "Pendente" => "Pendente",
                "Cancelada" => "Cancelada",
                "Concluída" => "Concluída",
                _ => null
            };
        }
    }

    public class CreateQuotationRequest
    {
        public int SectorId { get; set; }
        public string? OriginalId { get; set; }
        public string? Item { get; set; }
        public string? Unit { get; set; }
        public decimal PriceFornecedor { get; set; }
        public decimal PrecoMontagem { get; set; }
        public decimal PrecoAdotado { get; set; }
        public string? MediaAdotada { get; set; }
        public decimal? MediaSaneada { get; set; }
        public decimal? MenorValor { get; set; }
        public decimal? MediaAritmetica { get; set; }
        public decimal? Mediana { get; set; }
        public string? NomeEmpresa1 { get; set; }
        public decimal? Empresa1 { get; set; }
        public int? Supplier1Id { get; set; }
        public string? NomeEmpresa2 { get; set; }
        public decimal? Empresa2 { get; set; }
        public int? Supplier2Id { get; set; }
        public string? NomeEmpresa3 { get; set; }
        public decimal? Empresa3 { get; set; }
        public int? Supplier3Id { get; set; }
        public string? NomeEmpresa4 { get; set; }
        public decimal? Empresa4 { get; set; }
        public int? Supplier4Id { get; set; }
        public string? NomeEmpresa5 { get; set; }
        public decimal? Empresa5 { get; set; }
        public int? Supplier5Id { get; set; }
        public string? NomeEmpresa6 { get; set; }
        public decimal? Empresa6 { get; set; }
        public int? Supplier6Id { get; set; }
        public string? Justificativa { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateQuotationRequest : CreateQuotationRequest
    {
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
