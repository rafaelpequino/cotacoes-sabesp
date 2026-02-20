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
            var userId = GetUserId();
            // Mostrar todos os serviços (compartilhados entre usuários)
            var query = _context.Services.AsQueryable();

            // Aplicar filtro de texto
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(s => 
                    s.Item.ToLower().Contains(searchLower) ||
                    s.OriginalId.ToLower().Contains(searchLower) ||
                    s.Unit.ToLower().Contains(searchLower)
                );
            }

            // Aplicar ordenação
            query = sort switch
            {
                "recentes" => query.OrderByDescending(s => s.CreatedAt),
                "preço_menor" => query.OrderBy(s => s.PrecoAdotado),
                "preço_maior" => query.OrderByDescending(s => s.PrecoAdotado),
                _ => query.OrderByDescending(s => s.CreatedAt) // Relevância/padrão
            };

            var services = await query.ToListAsync();

            return Ok(services);
        }

        // GET: api/services/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            // Permitir visualização de qualquer serviço (todos podem ver, mas só podem editar/deletar os seus)
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == id);

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

            var service = new Service
            {
                UserId = userId,
                SectorId = request.SectorId,
                OriginalId = request.OriginalId,
                Item = request.Item,
                Unit = request.Unit,
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
            service.OriginalId = request.OriginalId;
            service.Item = request.Item;
            service.Unit = request.Unit;
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
    }

    public class CreateServiceRequest
    {
        public int SectorId { get; set; }
        public string OriginalId { get; set; } = string.Empty;
        public string Item { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal PriceFornecedor { get; set; }
        public decimal PrecoMontagem { get; set; }
        public decimal PrecoAdotado { get; set; }
        public decimal? MediaAdotada { get; set; }
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
    }

    public class UpdateServiceRequest : CreateServiceRequest
    {
    }
}

