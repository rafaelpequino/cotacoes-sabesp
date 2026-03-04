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
            var query = _context.Inputs.AsQueryable();

            if (!string.IsNullOrEmpty(search))
            {
                var words = search.ToLower()
                    .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

                foreach (var word in words)
                {
                    var w = word;
                    query = query.Where(i =>
                        i.Item.ToLower().Contains(w) ||
                        i.OriginalId.ToLower().Contains(w) ||
                        i.Unit.ToLower().Contains(w)
                    );
                }
            }

            query = sort switch
            {
                "recentes" => query.OrderByDescending(i => i.CreatedAt),
                "preço_menor" => query.OrderBy(i => i.PrecoAdotado),
                "preço_maior" => query.OrderByDescending(i => i.PrecoAdotado),
                _ => query.OrderByDescending(i => i.CreatedAt)
            };

            var inputs = await query.ToListAsync();
            return Ok(inputs);
        }

        // GET: api/inputs/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var input = await _context.Inputs.FirstOrDefaultAsync(i => i.Id == id);
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
            var status = ValidateStatus(request.Status) ?? "Concluída";

            var input = new Input
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
            input.OriginalId = request.OriginalId ?? string.Empty;
            input.Item = request.Item ?? string.Empty;
            input.Unit = request.Unit ?? string.Empty;
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
            // Apenas o dono pode alterar o status
            if (!string.IsNullOrEmpty(request.Status))
                input.Status = ValidateStatus(request.Status) ?? input.Status;
            input.UpdatedAt = DateTime.UtcNow;

            _context.Inputs.Update(input);
            await _context.SaveChangesAsync();

            return Ok(input);
        }

        // PATCH: api/inputs/{id}/status  — somente o criador pode alterar
        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusRequest request)
        {
            var novoStatus = ValidateStatus(request.Status);
            if (novoStatus == null)
                return BadRequest(new { message = "Status inválido. Use: Pendente, Cancelada ou Concluída." });

            var userId = GetUserId();
            var input = await _context.Inputs
                .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

            if (input == null)
                return NotFound(new { message = "Insumo não encontrado ou sem permissão para alterar o status." });

            input.Status = novoStatus;
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

    public class CreateInputRequest
    {
        public int SectorId { get; set; }
        public string? OriginalId { get; set; }
        public string? Item { get; set; }
        public string? Unit { get; set; }
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
        public string? Status { get; set; }
    }

    public class UpdateInputRequest : CreateInputRequest
    {
    }

    public class UpdateStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
