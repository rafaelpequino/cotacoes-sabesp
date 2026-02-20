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
        public async Task<IActionResult> GetAll([FromQuery] string? search, [FromQuery] string? sort, [FromQuery] string? filter)
        {
            var userId = GetUserId();
            // Mostrar todas as cotações (compartilhadas entre usuários)
            var query = _context.Inputs.AsQueryable();

            // Aplicar filtro de texto
            if (!string.IsNullOrEmpty(search))
            {
                var searchLower = search.ToLower();
                query = query.Where(i => 
                    i.Item.ToLower().Contains(searchLower) ||
                    i.OriginalId.ToLower().Contains(searchLower) ||
                    i.Unit.ToLower().Contains(searchLower)
                );
            }

            // Aplicar ordenação
            query = sort switch
            {
                "recentes" => query.OrderByDescending(i => i.CreatedAt),
                "preço_menor" => query.OrderBy(i => i.PrecoAdotado),
                "preço_maior" => query.OrderByDescending(i => i.PrecoAdotado),
                _ => query.OrderByDescending(i => i.CreatedAt) // Relevância/padrão
            };

            var inputs = await query.ToListAsync();

            return Ok(inputs);
        }

        // GET: api/inputs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            // Permitir visualização de qualquer insumo (todos podem ver, mas só podem editar/deletar os seus)
            var input = await _context.Inputs
                .FirstOrDefaultAsync(i => i.Id == id);

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

            input.SectorId = request.SectorId;
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
            input.NomeEmpresa1 = request.NomeEmpresa1;
            input.Empresa1 = request.Empresa1;
            input.NomeEmpresa2 = request.NomeEmpresa2;
            input.Empresa2 = request.Empresa2;
            input.NomeEmpresa3 = request.NomeEmpresa3;
            input.Empresa3 = request.Empresa3;
            input.NomeEmpresa4 = request.NomeEmpresa4;
            input.Empresa4 = request.Empresa4;
            input.NomeEmpresa5 = request.NomeEmpresa5;
            input.Empresa5 = request.Empresa5;
            input.NomeEmpresa6 = request.NomeEmpresa6;
            input.Empresa6 = request.Empresa6;
            input.Justificativa = request.Justificativa;
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

    public class UpdateInputRequest : CreateInputRequest
    {
    }
}

