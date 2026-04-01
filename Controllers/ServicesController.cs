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
    public class ServicesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ServicesController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // GET: api/services
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? sort, [FromQuery] string? filter)
        {
            var query = _context.Services.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var words = search.ToLower()
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                foreach (var word in words)
                {
                    var w = word;
                    query = query.Where(s =>
                        s.Item.ToLower().Contains(w) ||
                        s.OriginalId.ToLower().Contains(w) ||
                        s.Unit.ToLower().Contains(w)
                    );
                }
            }

            query = sort switch
            {
                "recentes" => query.OrderByDescending(s => s.CreatedAt),
                "preço_menor" => query.OrderBy(s => s.PrecoAdotado),
                "preço_maior" => query.OrderByDescending(s => s.PrecoAdotado),
                _ => query.OrderByDescending(s => s.CreatedAt)
            };

            var services = await query.ToListAsync();
            return Ok(services);
        }

        // GET: api/services/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var service = await _context.Services.FirstOrDefaultAsync(s => s.Id == id);
            if (service == null)
                return NotFound(new { message = "Serviço não encontrado" });

            return Ok(service);
        }

        // POST: api/services
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateServiceRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var status = ValidateStatus(request.Status) ?? "Concluída";

            var service = new Service
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
                NomeEmpresa2 = request.NomeEmpresa2,
                Empresa2 = request.Empresa2,
                NomeEmpresa3 = request.NomeEmpresa3,
                Empresa3 = request.Empresa3,
                NomeEmpresa4 = request.NomeEmpresa4,
                Empresa4 = request.Empresa4,
                NomeEmpresa5 = request.NomeEmpresa5,
                Empresa5 = request.Empresa5,
                NomeEmpresa6 = request.NomeEmpresa6,
                Empresa6 = request.Empresa6,
                Justificativa = request.Justificativa,
                Status = status,
                CreatedAt = DateTime.UtcNow
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = service.Id }, service);
        }

        // PUT: api/services/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateServiceRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (service == null)
                return NotFound(new { message = "Serviço não encontrado" });

            service.SectorId = request.SectorId;
            service.OriginalId = request.OriginalId ?? string.Empty;
            service.Item = request.Item ?? string.Empty;
            service.Unit = request.Unit ?? string.Empty;
            service.PriceFornecedor = request.PriceFornecedor;
            service.PrecoMontagem = request.PrecoMontagem;
            service.PrecoAdotado = request.PrecoAdotado;
            service.MediaAdotada = request.MediaAdotada;
            service.MediaSaneada = request.MediaSaneada;
            service.MenorValor = request.MenorValor;
            service.MediaAritmetica = request.MediaAritmetica;
            service.Mediana = request.Mediana;
            service.NomeEmpresa1 = request.NomeEmpresa1;
            service.Empresa1 = request.Empresa1;
            service.NomeEmpresa2 = request.NomeEmpresa2;
            service.Empresa2 = request.Empresa2;
            service.NomeEmpresa3 = request.NomeEmpresa3;
            service.Empresa3 = request.Empresa3;
            service.NomeEmpresa4 = request.NomeEmpresa4;
            service.Empresa4 = request.Empresa4;
            service.NomeEmpresa5 = request.NomeEmpresa5;
            service.Empresa5 = request.Empresa5;
            service.NomeEmpresa6 = request.NomeEmpresa6;
            service.Empresa6 = request.Empresa6;
            service.Justificativa = request.Justificativa;
            // Apenas o dono pode alterar o status
            if (!string.IsNullOrEmpty(request.Status))
                service.Status = ValidateStatus(request.Status) ?? service.Status;
            service.UpdatedAt = DateTime.UtcNow;

            _context.Services.Update(service);
            await _context.SaveChangesAsync();

            return Ok(service);
        }

        // PATCH: api/services/{id}/status  — somente o criador pode alterar
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var novoStatus = ValidateStatus(request.Status);
            if (novoStatus == null)
                return BadRequest(new { message = "Status inválido. Use: Pendente, Cancelada ou Concluída." });

            var userId = GetUserId();
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (service == null)
                return NotFound(new { message = "Serviço não encontrado ou sem permissão para alterar o status." });

            service.Status = novoStatus;
            service.UpdatedAt = DateTime.UtcNow;

            _context.Services.Update(service);
            await _context.SaveChangesAsync();

            return Ok(service);
        }

        // DELETE: api/services/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

            if (service == null)
                return NotFound(new { message = "Serviço não encontrado" });

            _context.Services.Remove(service);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Serviço deletado com sucesso" });
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

    public class CreateServiceRequest
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
        public string? NomeEmpresa2 { get; set; }
        public decimal? Empresa2 { get; set; }
        public string? NomeEmpresa3 { get; set; }
        public decimal? Empresa3 { get; set; }
        public string? NomeEmpresa4 { get; set; }
        public decimal? Empresa4 { get; set; }
        public string? NomeEmpresa5 { get; set; }
        public decimal? Empresa5 { get; set; }
        public string? NomeEmpresa6 { get; set; }
        public decimal? Empresa6 { get; set; }
        public string? Justificativa { get; set; }
        public string? Status { get; set; }
    }

    public class UpdateServiceRequest : CreateServiceRequest
    {
    }
}
