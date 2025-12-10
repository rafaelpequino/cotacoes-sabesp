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
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();
            var services = await _context.Services
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.CreatedAt)
                .ToListAsync();

            return Ok(services);
        }

        // GET: api/services/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            var service = await _context.Services
                .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

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
                Empresa1 = request.Empresa1,
                Empresa2 = request.Empresa2,
                Empresa3 = request.Empresa3,
                Empresa4 = request.Empresa4,
                Empresa5 = request.Empresa5,
                Empresa6 = request.Empresa6,
                Justificativa = request.Justificativa,
                TempoPassado = request.TempoPassado,
                MesAnterior = request.MesAnterior,
                IndiceAnterior = request.IndiceAnterior,
                IndiceAtual = request.IndiceAtual,
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
            service.Empresa1 = request.Empresa1;
            service.Empresa2 = request.Empresa2;
            service.Empresa3 = request.Empresa3;
            service.Empresa4 = request.Empresa4;
            service.Empresa5 = request.Empresa5;
            service.Empresa6 = request.Empresa6;
            service.Justificativa = request.Justificativa;
            service.TempoPassado = request.TempoPassado;
            service.MesAnterior = request.MesAnterior;
            service.IndiceAnterior = request.IndiceAnterior;
            service.IndiceAtual = request.IndiceAtual;
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
        public decimal? Empresa1 { get; set; }
        public decimal? Empresa2 { get; set; }
        public decimal? Empresa3 { get; set; }
        public decimal? Empresa4 { get; set; }
        public decimal? Empresa5 { get; set; }
        public decimal? Empresa6 { get; set; }
        public string? Justificativa { get; set; }
        public int? TempoPassado { get; set; }
        public string? MesAnterior { get; set; }
        public decimal? IndiceAnterior { get; set; }
        public decimal? IndiceAtual { get; set; }
    }

    public class UpdateServiceRequest : CreateServiceRequest
    {
    }
}

