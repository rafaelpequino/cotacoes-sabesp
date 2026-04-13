using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Concurrent;
using System.Security.Claims;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class QuotationsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        // Debounce: chave = "{userId}_{quotationId}", valor = último timestamp de cópia
        private static readonly ConcurrentDictionary<string, DateTime> _lastCopyTime = new();
        private static readonly TimeSpan _debouncePeriod = TimeSpan.FromSeconds(30);

        public QuotationsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        /// <summary>
        /// Parse I0 format "Mês/YY" to DateTime for comparison
        /// Example: "Jan/25" -> 2025-01-01, "Dez/25" -> 2025-12-01
        /// </summary>
        private DateTime? ParseI0ToDateTime(string i0)
        {
            if (string.IsNullOrWhiteSpace(i0))
                return null;

            var parts = i0.Trim().Split('/');
            if (parts.Length != 2)
                return null;

            var monthName = parts[0].Trim();
            var yearStr = parts[1].Trim();

            if (!int.TryParse(yearStr, out var year))
                return null;

            // Adicionar 2000 se o ano tiver 2 dígitos (ex: 25 -> 2025)
            if (year < 100)
                year += 2000;

            var months = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase)
            {
                { "Jan", 1 }, { "Janeiro", 1 },
                { "Fev", 2 }, { "Fevereiro", 2 },
                { "Mar", 3 }, { "Março", 3 },
                { "Abr", 4 }, { "Abril", 4 },
                { "Mai", 5 }, { "Maio", 5 },
                { "Jun", 6 }, { "Junho", 6 },
                { "Jul", 7 }, { "Julho", 7 },
                { "Ago", 8 }, { "Agosto", 8 },
                { "Set", 9 }, { "Setembro", 9 },
                { "Out", 10 }, { "Outubro", 10 },
                { "Nov", 11 }, { "Novembro", 11 },
                { "Dez", 12 }, { "Dezembro", 12 }
            };

            if (!months.TryGetValue(monthName, out var month))
                return null;

            try
            {
                return new DateTime(year, month, 1);
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Check if I0 is within range (inclusive)
        /// Compares by constructing DateTime from mês/ano
        /// </summary>
        private bool IsI0InRange(string i0, int? startMonth, int? startYear, int? endMonth, int? endYear)
        {
            var i0Date = ParseI0ToDateTime(i0);
            if (!i0Date.HasValue)
                return false;

            // Se temos data de início
            if (startYear.HasValue && startMonth.HasValue)
            {
                try
                {
                    var startDate = new DateTime(startYear.Value, startMonth.Value, 1);
                    if (i0Date < startDate)
                        return false;
                }
                catch
                {
                    return false;
                }
            }
            else if (startYear.HasValue && !startMonth.HasValue)
            {
                if (i0Date.Value.Year < startYear.Value)
                    return false;
            }

            // Se temos data de fim
            if (endYear.HasValue && endMonth.HasValue)
            {
                try
                {
                    var endDate = new DateTime(endYear.Value, endMonth.Value, 1);
                    if (i0Date > endDate)
                        return false;
                }
                catch
                {
                    return false;
                }
            }
            else if (endYear.HasValue && !endMonth.HasValue)
            {
                if (i0Date.Value.Year > endYear.Value)
                    return false;
            }

            return true;
        }

        // GET: api/quotations
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] int? sectorId, [FromQuery] int? userId, [FromQuery] int? supplierId, [FromQuery] int? i0StartMonth, [FromQuery] int? i0StartYear, [FromQuery] int? i0EndMonth, [FromQuery] int? i0EndYear)
        {
            var query = _context.Quotations.AsQueryable();

            // Filtro por busca de texto
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

            // Filtro por setor
            if (sectorId.HasValue && sectorId.Value > 0)
            {
                query = query.Where(q => q.SectorId == sectorId.Value);
            }

            // Filtro por responsável (usuário)
            if (userId.HasValue && userId.Value > 0)
            {
                query = query.Where(q => q.UserId == userId.Value);
            }

            // Filtro por fornecedor
            if (supplierId.HasValue && supplierId.Value > 0)
            {
                var sid = supplierId.Value;
                query = query.Where(q =>
                    q.Supplier1Id == sid ||
                    q.Supplier2Id == sid ||
                    q.Supplier3Id == sid ||
                    q.Supplier4Id == sid ||
                    q.Supplier5Id == sid ||
                    q.Supplier6Id == sid
                );
            }

            // Executar query antes de filtrar I0 (pois I0 requer processamento em memória)
            var quotations = await query.ToListAsync();

            // Filtro por range de I0 (em memória)
            if (i0StartMonth.HasValue || i0StartYear.HasValue || i0EndMonth.HasValue || i0EndYear.HasValue)
            {
                quotations = quotations.Where(q => IsI0InRange(q.OriginalId, i0StartMonth, i0StartYear, i0EndMonth, i0EndYear)).ToList();
            }

            // Ordenação padrão por data de criação (descendente)
            quotations = quotations.OrderByDescending(q => q.CreatedAt).ToList();

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

        // POST: api/quotations/{id}/increment-copy
        [HttpPost("{id}/increment-copy")]
        public async Task<IActionResult> IncrementCopy(int id)
        {
            var userId = GetUserId();
            var key = $"{userId}_{id}";
            var now = DateTime.UtcNow;

            // Verificar debounce: mesmo usuário no mesmo item em menos de 30s não conta
            if (_lastCopyTime.TryGetValue(key, out var lastCopy) && now - lastCopy < _debouncePeriod)
            {
                var quotationNow = await _context.Quotations.FindAsync(id);
                if (quotationNow == null)
                    return NotFound(new { message = "Cotação não encontrada" });

                return Ok(new { copyCount = quotationNow.CopyCount, debounced = true });
            }

            var quotation = await _context.Quotations.FindAsync(id);
            if (quotation == null)
                return NotFound(new { message = "Cotação não encontrada" });

            quotation.CopyCount++;
            await _context.SaveChangesAsync();

            _lastCopyTime[key] = now;

            return Ok(new { copyCount = quotation.CopyCount, debounced = false });
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
