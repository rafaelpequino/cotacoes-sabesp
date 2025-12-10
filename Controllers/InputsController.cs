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
    public class InputsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public InputsController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // GET: api/inputs
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();
            var inputs = await _context.Inputs
                .Where(i => i.UserId == userId)
                .OrderByDescending(i => i.CreatedAt)
                .ToListAsync();

            return Ok(inputs);
        }

        // GET: api/inputs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();
            var input = await _context.Inputs
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (input == null)
                return NotFound(new { message = "Insumo não encontrado" });

            return Ok(input);
        }

        // POST: api/inputs
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateInputRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();

            var input = new Input
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

            _context.Inputs.Add(input);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetById), new { id = input.Id }, input);
        }

        // PUT: api/inputs/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateInputRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = GetUserId();
            var input = await _context.Inputs
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (input == null)
                return NotFound(new { message = "Insumo não encontrado" });

            input.OriginalId = request.OriginalId;
            input.Item = request.Item;
            input.Unit = request.Unit;
            input.PriceFornecedor = request.PriceFornecedor;
            input.PrecoMontagem = request.PrecoMontagem;
            input.PrecoAdotado = request.PrecoAdotado;
            input.MediaAdotada = request.MediaAdotada;
            input.MediaSaneada = request.MediaSaneada;
            input.MenorValor = request.MenorValor;
            input.MediaAritmetica = request.MediaAritmetica;
            input.Mediana = request.Mediana;
            input.Empresa1 = request.Empresa1;
            input.Empresa2 = request.Empresa2;
            input.Empresa3 = request.Empresa3;
            input.Empresa4 = request.Empresa4;
            input.Empresa5 = request.Empresa5;
            input.Empresa6 = request.Empresa6;
            input.Justificativa = request.Justificativa;
            input.TempoPassado = request.TempoPassado;
            input.MesAnterior = request.MesAnterior;
            input.IndiceAnterior = request.IndiceAnterior;
            input.IndiceAtual = request.IndiceAtual;
            input.UpdatedAt = DateTime.UtcNow;

            _context.Inputs.Update(input);
            await _context.SaveChangesAsync();

            return Ok(input);
        }

        // DELETE: api/inputs/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();
            var input = await _context.Inputs
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (input == null)
                return NotFound(new { message = "Insumo não encontrado" });

            _context.Inputs.Remove(input);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Insumo deletado com sucesso" });
        }
    }

    public class CreateInputRequest
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

    public class UpdateInputRequest : CreateInputRequest
    {
    }
}

